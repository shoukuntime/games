from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from env_settings import get_settings
from core.database import engine, Base
from api.v1.router import api_router
from api.deps import get_current_user
from models import User  # noqa: F401 — ensure model is registered

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

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


@app.get("/games/guess-number")
def guess_number_page(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/guess_number.html", {"request": request, "user": user})


@app.get("/games/rock-paper-scissors")
def rock_paper_scissors_page(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/rock_paper_scissors.html", {"request": request, "user": user})


@app.get("/games/memory-cards")
def memory_cards_page(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("games/memory_cards.html", {"request": request, "user": user})
