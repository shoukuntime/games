from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.deps import get_current_user
from models.user import User
from game_logic import GAME_INFO
from game_logic.room_manager import room_manager

router = APIRouter(prefix="/rooms", tags=["rooms"])


class CreateRoomRequest(BaseModel):
    game_type: str


class JoinRoomRequest(BaseModel):
    room_id: str


@router.post("/create")
def create_room(data: CreateRoomRequest, user: User = Depends(get_current_user)):
    if data.game_type not in GAME_INFO:
        raise HTTPException(status_code=400, detail="未知的遊戲類型")
    room = room_manager.create_room(data.game_type, user.username)
    return {"room_id": room.room_id, "game_type": data.game_type}


@router.get("/{room_id}")
def get_room_info(room_id: str, user: User = Depends(get_current_user)):
    room = room_manager.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="房間不存在")
    return room.get_lobby_state()
