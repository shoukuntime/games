import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse

from env_settings import get_settings
from core.database import engine, Base
from core.security import decode_access_token
from api.v1.router import api_router
from api.deps import get_current_user
from game_logic import GAME_INFO
from game_logic.room_manager import room_manager
from game_logic.draw_guess import generate_words_from_llm, judge_guess_with_llm
from models import User  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
app.include_router(api_router)


# --- Page Routes ---

@app.get("/")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/register")
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


@app.get("/dashboard")
def dashboard_page(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})


@app.get("/rooms/{room_id}")
def room_page(request: Request, room_id: str, user=Depends(get_current_user)):
    room = room_manager.get_room(room_id)
    if not room:
        return RedirectResponse("/dashboard")
    return templates.TemplateResponse("lobby.html", {
        "request": request, "user": user, "room_id": room_id,
        "game_type": room.game_type, "game_info": GAME_INFO[room.game_type],
    })


@app.get("/games/blokus/{room_id}")
def blokus_page(request: Request, room_id: str, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/blokus.html", {
        "request": request, "user": user, "room_id": room_id,
    })


@app.get("/games/draw-guess/{room_id}")
def draw_guess_page(request: Request, room_id: str, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/draw_guess.html", {
        "request": request, "user": user, "room_id": room_id,
    })


@app.get("/games/cant-stop/{room_id}")
def cant_stop_page(request: Request, room_id: str, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/cant_stop.html", {
        "request": request, "user": user, "room_id": room_id,
    })


@app.get("/games/liars-dice/{room_id}")
def liars_dice_page(request: Request, room_id: str, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/liars_dice.html", {
        "request": request, "user": user, "room_id": room_id,
    })


# --- WebSocket ---

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=4001)
        return
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    username = payload.get("sub", "")

    room = room_manager.get_room(room_id)
    if not room:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    if not await room.add_player(username, websocket):
        await websocket.close()
        return

    timer_task = None

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "set_public":
                if username == room.host:
                    room.is_public = data.get("is_public", True)
                    await room.broadcast({"type": "lobby_update", "data": room.get_lobby_state()})
                continue

            if msg_type == "start_game":
                if username != room.host:
                    await room.send_to(username, {"type": "error", "message": "只有房主可以開始遊戲"})
                    continue
                info = GAME_INFO[room.game_type]
                if len(room.players) < info["min_players"]:
                    await room.send_to(username, {
                        "type": "error",
                        "message": f"至少需要 {info['min_players']} 位玩家",
                    })
                    continue
                room.start_game()
                game_url = f"/games/{room.game_type}/{room_id}"
                await room.broadcast({"type": "game_started", "url": game_url})
                await room.broadcast_game_state()

                if room.game_type == "draw-guess":
                    timer_task = asyncio.create_task(_draw_guess_timer(room))

            elif msg_type == "request_words":
                if room.game and room.game_type == "draw-guess":
                    words = await generate_words_from_llm(3)
                    room.game.set_word_choices(words)
                    await room.broadcast_game_state()

            elif msg_type == "guess" and room.game and room.game_type == "draw-guess":
                # Async LLM judging for draw-guess
                guess_text = data.get("text", "").strip()
                if guess_text and room.game.current_word and room.game.phase == "drawing":
                    llm_score = await judge_guess_with_llm(room.game.current_word, guess_text)
                    events = room.game.process_guess_result(username, guess_text, llm_score)
                    for event in events:
                        target = event.pop("_target", "all")
                        if target == "all":
                            await room.broadcast(event)
                        else:
                            await room.send_to(target, event)
                    await room.broadcast_game_state()

            else:
                if room.game:
                    events = room.game.handle_action(username, data)
                    for event in events:
                        target = event.pop("_target", "all")
                        if target == "all":
                            await room.broadcast(event)
                        else:
                            await room.send_to(target, event)
                    await room.broadcast_game_state()

    except WebSocketDisconnect:
        await room.remove_player(username)
        if timer_task:
            timer_task.cancel()


async def _draw_guess_timer(room):
    try:
        while room.status == "playing" and room.game:
            await asyncio.sleep(1)
            if room.game.phase == "drawing":
                events = room.game.tick()
                for event in events:
                    target = event.pop("_target", "all")
                    if target == "all":
                        await room.broadcast(event)
                    else:
                        await room.send_to(target, event)
                if room.game.phase == "round_end":
                    await room.broadcast_game_state()
    except asyncio.CancelledError:
        pass
