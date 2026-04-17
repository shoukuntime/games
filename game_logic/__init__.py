from game_logic.room_manager import room_manager, Room
from game_logic.blokus import BlokusGame
from game_logic.draw_guess import DrawGuessGame
from game_logic.cant_stop import CantStopGame

GAME_CLASSES = {
    "blokus": BlokusGame,
    "draw-guess": DrawGuessGame,
    "cant-stop": CantStopGame,
}

GAME_INFO = {
    "blokus": {"name": "Blokus", "min_players": 2, "max_players": 4},
    "draw-guess": {"name": "你畫我猜", "min_players": 2, "max_players": 8},
    "cant-stop": {"name": "Can't Stop", "min_players": 2, "max_players": 4},
}
