"""Blokus game engine — 20x20 board, 2-4 players, 21 polyomino pieces each."""

PIECES = {
    "I1": [(0, 0)],
    "I2": [(0, 0), (0, 1)],
    "I3": [(0, 0), (0, 1), (0, 2)],
    "V3": [(0, 0), (0, 1), (1, 0)],
    "I4": [(0, 0), (0, 1), (0, 2), (0, 3)],
    "O4": [(0, 0), (0, 1), (1, 0), (1, 1)],
    "T4": [(0, 0), (0, 1), (0, 2), (1, 1)],
    "S4": [(0, 0), (0, 1), (1, 1), (1, 2)],
    "L4": [(0, 0), (0, 1), (0, 2), (1, 0)],
    "F5": [(0, 1), (0, 2), (1, 0), (1, 1), (2, 1)],
    "I5": [(0, 0), (0, 1), (0, 2), (0, 3), (0, 4)],
    "L5": [(0, 0), (0, 1), (0, 2), (0, 3), (1, 0)],
    "N5": [(0, 0), (0, 1), (1, 1), (1, 2), (1, 3)],
    "P5": [(0, 0), (0, 1), (1, 0), (1, 1), (2, 0)],
    "T5": [(0, 0), (0, 1), (0, 2), (1, 1), (2, 1)],
    "U5": [(0, 0), (0, 2), (1, 0), (1, 1), (1, 2)],
    "V5": [(0, 0), (1, 0), (2, 0), (2, 1), (2, 2)],
    "W5": [(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)],
    "X5": [(0, 1), (1, 0), (1, 1), (1, 2), (2, 1)],
    "Y5": [(0, 0), (1, 0), (1, 1), (2, 0), (3, 0)],
    "Z5": [(0, 0), (0, 1), (1, 1), (2, 1), (2, 2)],
}

COLORS = ["#3b82f6", "#eab308", "#ef4444", "#22c55e"]
COLOR_NAMES = ["藍", "黃", "紅", "綠"]
CORNERS = [(0, 0), (0, 19), (19, 19), (19, 0)]
BOARD_SIZE = 20


def normalize(cells):
    min_r = min(r for r, c in cells)
    min_c = min(c for r, c in cells)
    return tuple(sorted((r - min_r, c - min_c) for r, c in cells))


def rotate_90(cells):
    return normalize([(c, -r) for r, c in cells])


def flip_h(cells):
    return normalize([(r, -c) for r, c in cells])


def get_all_orientations(cells):
    orientations = set()
    current = normalize(cells)
    for _ in range(4):
        orientations.add(current)
        orientations.add(flip_h(list(current)))
        current = rotate_90(list(current))
    return [list(o) for o in orientations]


# Pre-compute all orientations for each piece
PIECE_ORIENTATIONS = {}
for name, cells in PIECES.items():
    PIECE_ORIENTATIONS[name] = get_all_orientations(cells)


class BlokusGame:
    def __init__(self, players: list[str]):
        self.players = players
        self.num_players = len(players)
        self.board = [[0] * BOARD_SIZE for _ in range(BOARD_SIZE)]  # 0=empty, 1-4=player
        self.remaining = {i: list(PIECES.keys()) for i in range(self.num_players)}
        self.current_turn = 0
        self.first_move = [True] * self.num_players
        self.passed = [False] * self.num_players
        self.game_over = False
        self.scores = [0] * self.num_players

    def get_state(self, username: str):
        player_idx = self.players.index(username) if username in self.players else -1
        return {
            "board": self.board,
            "players": [
                {
                    "name": self.players[i],
                    "color": COLORS[i],
                    "color_name": COLOR_NAMES[i],
                    "remaining": self.remaining[i],
                    "passed": self.passed[i],
                    "score": self.scores[i],
                }
                for i in range(self.num_players)
            ],
            "current_turn": self.current_turn,
            "my_index": player_idx,
            "game_over": self.game_over,
            "pieces": {name: list(PIECES[name]) for name in PIECES},
            "piece_orientations": {
                name: [list(o) for o in PIECE_ORIENTATIONS[name]]
                for name in PIECES
            },
        }

    def handle_action(self, username: str, action: dict) -> list[dict]:
        player_idx = self.players.index(username)
        if self.game_over:
            return [{"type": "error", "message": "遊戲已結束", "_target": username}]
        if player_idx != self.current_turn:
            return [{"type": "error", "message": "還沒輪到你", "_target": username}]

        action_type = action.get("type")
        if action_type == "place_piece":
            return self._place_piece(player_idx, action)
        elif action_type == "pass":
            return self._pass_turn(player_idx)
        return []

    def _place_piece(self, player_idx: int, action: dict) -> list[dict]:
        piece_name = action.get("piece")
        cells = [tuple(c) for c in action.get("cells", [])]
        username = self.players[player_idx]

        if piece_name not in self.remaining[player_idx]:
            return [{"type": "error", "message": "你沒有這個棋子", "_target": username}]

        # Validate cells match a valid orientation
        normalized = normalize(cells)
        if list(normalized) not in [list(normalize(o)) for o in PIECE_ORIENTATIONS[piece_name]]:
            return [{"type": "error", "message": "棋子形狀不正確", "_target": username}]

        # Validate placement
        error = self._validate_placement(player_idx, cells)
        if error:
            return [{"type": "error", "message": error, "_target": username}]

        # Place the piece
        color = player_idx + 1
        for r, c in cells:
            self.board[r][c] = color
        self.remaining[player_idx].remove(piece_name)
        self.first_move[player_idx] = False

        # Calculate scores
        self._calc_scores()

        events = [{"type": "game_event", "data": {
            "event": "piece_placed",
            "player": username,
            "player_idx": player_idx,
            "piece": piece_name,
            "cells": [list(c) for c in cells],
        }}]

        self._next_turn()

        if self.game_over:
            events.append({"type": "game_event", "data": {
                "event": "game_over",
                "scores": [
                    {"name": self.players[i], "score": self.scores[i]}
                    for i in range(self.num_players)
                ],
            }})

        return events

    def _validate_placement(self, player_idx: int, cells: list[tuple]) -> str | None:
        color = player_idx + 1

        for r, c in cells:
            if r < 0 or r >= BOARD_SIZE or c < 0 or c >= BOARD_SIZE:
                return "超出棋盤範圍"
            if self.board[r][c] != 0:
                return "該位置已有棋子"

        # Check no orthogonal adjacency with same color
        for r, c in cells:
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
                    if self.board[nr][nc] == color and (nr, nc) not in cells:
                        return "不能與自己的棋子邊相鄰"

        if self.first_move[player_idx]:
            corner = CORNERS[player_idx]
            if corner not in cells:
                return f"第一步必須放在角落 ({corner[0]},{corner[1]})"
            return None

        # Check at least one diagonal adjacency with same color
        has_diagonal = False
        for r, c in cells:
            for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
                    if self.board[nr][nc] == color and (nr, nc) not in cells:
                        has_diagonal = True
                        break
            if has_diagonal:
                break

        if not has_diagonal:
            return "必須與自己的棋子角對角相鄰"
        return None

    def _pass_turn(self, player_idx: int) -> list[dict]:
        self.passed[player_idx] = True
        events = [{"type": "game_event", "data": {
            "event": "player_passed",
            "player": self.players[player_idx],
            "player_idx": player_idx,
        }}]
        self._next_turn()
        if self.game_over:
            events.append({"type": "game_event", "data": {
                "event": "game_over",
                "scores": [
                    {"name": self.players[i], "score": self.scores[i]}
                    for i in range(self.num_players)
                ],
            }})
        return events

    def _next_turn(self):
        if all(self.passed):
            self.game_over = True
            self._calc_scores()
            return
        for _ in range(self.num_players):
            self.current_turn = (self.current_turn + 1) % self.num_players
            if not self.passed[self.current_turn]:
                break

    def _calc_scores(self):
        for i in range(self.num_players):
            remaining_squares = sum(
                len(PIECES[p]) for p in self.remaining[i]
            )
            if remaining_squares == 0:
                self.scores[i] = 15
                if len(self.remaining[i]) == 0:
                    last_piece_size = 1  # all placed, check if last was I1
                    self.scores[i] += 5  # bonus for placing all
            else:
                self.scores[i] = -remaining_squares
