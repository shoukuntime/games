"""Blokus game engine — 20x20 board, always 4 colors, 2-4 players."""

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


PIECE_ORIENTATIONS = {}
for name, cells in PIECES.items():
    PIECE_ORIENTATIONS[name] = get_all_orientations(cells)


class BlokusGame:
    def __init__(self, players: list[str]):
        self.players = players
        self.num_players = len(players)

        # Always 4 colors, assign to players
        if self.num_players == 2:
            self.color_owner = [0, 1, 0, 1]  # P0: blue+red, P1: yellow+green
        elif self.num_players == 3:
            self.color_owner = [0, 1, 2, 0]  # rotate: P0→P1→P2→P0
        else:
            self.color_owner = [0, 1, 2, 3]

        self.board = [[0] * BOARD_SIZE for _ in range(BOARD_SIZE)]
        self.remaining = {c: list(PIECES.keys()) for c in range(4)}
        self.current_color = 0  # 0-3
        self.first_move = [True, True, True, True]
        self.passed = [False, False, False, False]
        self.used_corners: set[int] = set()  # corner indices that have been claimed
        self.game_over = False

    def _player_colors(self, player_idx: int) -> list[int]:
        return [c for c in range(4) if self.color_owner[c] == player_idx]

    def _calc_scores(self) -> list[int]:
        scores = [0] * self.num_players
        for c in range(4):
            remaining_sq = sum(len(PIECES[p]) for p in self.remaining[c])
            owner = self.color_owner[c]
            if remaining_sq == 0:
                scores[owner] += 15 + (5 if not self.remaining[c] else 0)
            else:
                scores[owner] -= remaining_sq
        return scores

    def _available_corners(self) -> list[list[int]]:
        return [list(CORNERS[i]) for i in range(4) if i not in self.used_corners]

    def get_state(self, username: str):
        player_idx = self.players.index(username) if username in self.players else -1
        my_colors = self._player_colors(player_idx) if player_idx >= 0 else []
        current_player_idx = self.color_owner[self.current_color]
        scores = self._calc_scores()

        return {
            "board": self.board,
            "color_owner": self.color_owner,
            "color_info": [
                {
                    "color": COLORS[c],
                    "name": COLOR_NAMES[c],
                    "remaining": self.remaining[c],
                    "passed": self.passed[c],
                    "owner": self.color_owner[c],
                    "first_move": self.first_move[c],
                }
                for c in range(4)
            ],
            "players": [
                {
                    "name": self.players[i],
                    "score": scores[i],
                    "colors": self._player_colors(i),
                }
                for i in range(self.num_players)
            ],
            "current_color": self.current_color,
            "current_player_idx": current_player_idx,
            "my_index": player_idx,
            "my_colors": my_colors,
            "is_my_turn": current_player_idx == player_idx,
            "game_over": self.game_over,
            "available_corners": self._available_corners(),
            "used_corners": list(self.used_corners),
            "first_move": self.first_move,
            "pieces": {name: list(PIECES[name]) for name in PIECES},
            "piece_orientations": {
                name: [list(o) for o in PIECE_ORIENTATIONS[name]]
                for name in PIECES
            },
        }

    def handle_action(self, username: str, action: dict) -> list[dict]:
        player_idx = self.players.index(username)
        current_player_idx = self.color_owner[self.current_color]
        if self.game_over:
            return [{"type": "error", "message": "遊戲已結束", "_target": username}]
        if player_idx != current_player_idx:
            return [{"type": "error", "message": "還沒輪到你", "_target": username}]

        t = action.get("type")
        if t == "place_piece":
            return self._place_piece(action)
        elif t == "pass":
            return self._pass_turn()
        return []

    def _place_piece(self, action: dict) -> list[dict]:
        color_idx = self.current_color
        piece_name = action.get("piece")
        cells = [tuple(c) for c in action.get("cells", [])]
        owner_name = self.players[self.color_owner[color_idx]]

        if piece_name not in self.remaining[color_idx]:
            return [{"type": "error", "message": "該顏色沒有這個棋子", "_target": owner_name}]

        normalized = normalize(cells)
        if list(normalized) not in [list(normalize(o)) for o in PIECE_ORIENTATIONS[piece_name]]:
            return [{"type": "error", "message": "棋子形狀不正確", "_target": owner_name}]

        error = self._validate_placement(color_idx, cells)
        if error:
            return [{"type": "error", "message": error, "_target": owner_name}]

        # Place
        board_color = color_idx + 1
        for r, c in cells:
            self.board[r][c] = board_color

        # Track corner usage on first move
        if self.first_move[color_idx]:
            for i, corner in enumerate(CORNERS):
                if corner in cells and i not in self.used_corners:
                    self.used_corners.add(i)
                    break
            self.first_move[color_idx] = False

        self.remaining[color_idx].remove(piece_name)

        events = [{"type": "game_event", "data": {
            "event": "piece_placed",
            "player": owner_name,
            "color_idx": color_idx,
            "piece": piece_name,
            "cells": [list(c) for c in cells],
        }}]

        self._next_turn()

        if self.game_over:
            scores = self._calc_scores()
            events.append({"type": "game_event", "data": {
                "event": "game_over",
                "scores": [
                    {"name": self.players[i], "score": scores[i]}
                    for i in range(self.num_players)
                ],
            }})

        return events

    def _validate_placement(self, color_idx: int, cells: list[tuple]) -> str | None:
        board_color = color_idx + 1

        for r, c in cells:
            if r < 0 or r >= BOARD_SIZE or c < 0 or c >= BOARD_SIZE:
                return "超出棋盤範圍"
            if self.board[r][c] != 0:
                return "該位置已有棋子"

        cell_set = set(cells)
        for r, c in cells:
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
                    if self.board[nr][nc] == board_color and (nr, nc) not in cell_set:
                        return "不能與同色棋子邊相鄰"

        if self.first_move[color_idx]:
            available = [CORNERS[i] for i in range(4) if i not in self.used_corners]
            if not any(c in available for c in cells):
                return "第一步必須放在可用的角落"
            return None

        for r, c in cells:
            for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
                    if self.board[nr][nc] == board_color and (nr, nc) not in cell_set:
                        return None

        return "必須與同色棋子角對角相鄰"

    def _pass_turn(self) -> list[dict]:
        color_idx = self.current_color
        self.passed[color_idx] = True
        owner_name = self.players[self.color_owner[color_idx]]
        events = [{"type": "game_event", "data": {
            "event": "player_passed",
            "player": owner_name,
            "color_idx": color_idx,
            "color_name": COLOR_NAMES[color_idx],
        }}]
        self._next_turn()
        if self.game_over:
            scores = self._calc_scores()
            events.append({"type": "game_event", "data": {
                "event": "game_over",
                "scores": [
                    {"name": self.players[i], "score": scores[i]}
                    for i in range(self.num_players)
                ],
            }})
        return events

    def _next_turn(self):
        if all(self.passed):
            self.game_over = True
            return
        for _ in range(4):
            self.current_color = (self.current_color + 1) % 4
            if not self.passed[self.current_color]:
                break
