from game_logic.room_manager import room_manager, Room
from game_logic.blokus import BlokusGame
from game_logic.draw_guess import DrawGuessGame
from game_logic.cant_stop import CantStopGame
from game_logic.liars_dice import LiarsDiceGame

GAME_CLASSES = {
    "blokus": BlokusGame,
    "draw-guess": DrawGuessGame,
    "cant-stop": CantStopGame,
    "liars-dice": LiarsDiceGame,
}

GAME_INFO = {
    "blokus": {"name": "Blokus", "min_players": 2, "max_players": 4},
    "draw-guess": {"name": "你畫我猜", "min_players": 2, "max_players": 8},
    "cant-stop": {"name": "Can't Stop", "min_players": 2, "max_players": 4},
    "liars-dice": {"name": "吹牛骰子", "min_players": 2, "max_players": 6},
}
