import random
import string
import asyncio
from fastapi import WebSocket


class Room:
    def __init__(self, room_id: str, game_type: str, host: str):
        self.room_id = room_id
        self.game_type = game_type
        self.host = host
        self.players: list[str] = [host]
        self.connections: dict[str, WebSocket] = {}
        self.game = None
        self.status = "waiting"  # waiting, playing, finished

    def get_lobby_state(self):
        from game_logic import GAME_INFO
        info = GAME_INFO[self.game_type]
        return {
            "room_id": self.room_id,
            "game_type": self.game_type,
            "game_name": info["name"],
            "host": self.host,
            "players": self.players,
            "min_players": info["min_players"],
            "max_players": info["max_players"],
            "status": self.status,
        }

    async def add_player(self, username: str, ws: WebSocket):
        if username not in self.players:
            # During a game, only allow existing players to reconnect
            if self.status == "playing":
                await ws.send_json({"type": "error", "message": "遊戲已開始，無法加入"})
                return False
            from game_logic import GAME_INFO
            info = GAME_INFO[self.game_type]
            if len(self.players) >= info["max_players"]:
                await ws.send_json({"type": "error", "message": "房間已滿"})
                return False
            self.players.append(username)
        self.connections[username] = ws
        if self.status == "playing":
            # Reconnecting during game — send current game state
            await self.broadcast_game_state()
        else:
            await self.broadcast({"type": "lobby_update", "data": self.get_lobby_state()})
        return True

    async def remove_player(self, username: str):
        self.connections.pop(username, None)
        # During a game, keep the player in the list (they may be transitioning pages)
        if self.status == "playing":
            return
        if username in self.players:
            self.players.remove(username)
        if username == self.host and self.players:
            self.host = self.players[0]
        if not self.players:
            room_manager.delete_room(self.room_id)
            return
        await self.broadcast({"type": "lobby_update", "data": self.get_lobby_state()})

    async def broadcast(self, message: dict, exclude: str = None):
        disconnected = []
        for username, ws in self.connections.items():
            if username == exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(username)
        for u in disconnected:
            self.connections.pop(u, None)

    async def send_to(self, username: str, message: dict):
        ws = self.connections.get(username)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.connections.pop(username, None)

    async def broadcast_game_state(self):
        if not self.game:
            return
        for username in self.players:
            state = self.game.get_state(username)
            await self.send_to(username, {"type": "game_state", "data": state})

    def start_game(self):
        from game_logic import GAME_CLASSES
        cls = GAME_CLASSES[self.game_type]
        self.game = cls(self.players)
        self.status = "playing"

    async def handle_action(self, username: str, action: dict):
        if not self.game:
            return
        events = self.game.handle_action(username, action)
        for event in events:
            target = event.pop("_target", "all")
            if target == "all":
                await self.broadcast(event)
            else:
                await self.send_to(target, event)
        await self.broadcast_game_state()


class RoomManager:
    def __init__(self):
        self.rooms: dict[str, Room] = {}

    def _generate_code(self) -> str:
        while True:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if code not in self.rooms:
                return code

    def create_room(self, game_type: str, host: str) -> Room:
        room_id = self._generate_code()
        room = Room(room_id, game_type, host)
        self.rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> Room | None:
        return self.rooms.get(room_id)

    def delete_room(self, room_id: str):
        self.rooms.pop(room_id, None)


room_manager = RoomManager()
