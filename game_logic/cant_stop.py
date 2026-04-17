"""Can't Stop game engine — dice-based push-your-luck strategy game."""

import random
from itertools import combinations

COLUMN_HEIGHTS = {
    2: 3, 3: 5, 4: 7, 5: 9, 6: 11,
    7: 13,
    8: 11, 9: 9, 10: 7, 11: 5, 12: 3,
}

WIN_COLUMNS = 3


class CantStopGame:
    def __init__(self, players: list[str]):
        self.players = players
        self.num_players = len(players)
        # permanent[player_idx][col] = steps from bottom (0-based)
        self.permanent = [{} for _ in range(self.num_players)]
        # temp markers for current turn: col -> step position
        self.temp = {}
        self.claimed = {}  # col -> player_idx (column completed)
        self.current_player = 0
        self.dice = []
        self.pairings = []
        self.valid_pairing_indices = []
        self.phase = "rolling"  # rolling, choosing, deciding, busted, game_over
        self.winner = None
        self.wins = [0] * self.num_players  # columns won per player

    def get_state(self, username: str):
        player_idx = self.players.index(username) if username in self.players else -1
        return {
            "players": [
                {
                    "name": self.players[i],
                    "columns_won": self.wins[i],
                    "positions": self.permanent[i],
                }
                for i in range(self.num_players)
            ],
            "claimed": {str(k): v for k, v in self.claimed.items()},
            "column_heights": COLUMN_HEIGHTS,
            "current_player": self.current_player,
            "current_player_name": self.players[self.current_player],
            "my_index": player_idx,
            "dice": self.dice,
            "pairings": self.pairings,
            "valid_pairing_indices": self.valid_pairing_indices,
            "temp": self.temp,
            "temp_columns": list(self.temp.keys()),
            "phase": self.phase,
            "winner": self.players[self.winner] if self.winner is not None else None,
        }

    def handle_action(self, username: str, action: dict) -> list[dict]:
        player_idx = self.players.index(username)
        if self.phase == "game_over":
            return [{"type": "error", "message": "遊戲已結束", "_target": username}]
        if player_idx != self.current_player:
            return [{"type": "error", "message": "還沒輪到你", "_target": username}]

        action_type = action.get("type")
        if action_type == "roll":
            return self._roll(player_idx)
        elif action_type == "choose_pair":
            return self._choose_pair(player_idx, action.get("index", 0))
        elif action_type == "stop":
            return self._stop(player_idx)
        return []

    def _roll(self, player_idx: int) -> list[dict]:
        if self.phase not in ("rolling", "deciding"):
            return [{"type": "error", "message": "現在不能擲骰子", "_target": self.players[player_idx]}]

        self.dice = [random.randint(1, 6) for _ in range(4)]
        self.pairings = self._get_pairings(self.dice)
        self.valid_pairing_indices = [
            i for i, p in enumerate(self.pairings)
            if self._is_valid_pairing(player_idx, p)
        ]

        if not self.valid_pairing_indices:
            self.phase = "busted"
            lost_progress = dict(self.temp)
            self.temp = {}
            events = [{"type": "game_event", "data": {
                "event": "busted",
                "player": self.players[player_idx],
                "dice": self.dice,
                "lost_progress": lost_progress,
            }}]
            self._next_player()
            return events

        self.phase = "choosing"
        return [{"type": "game_event", "data": {
            "event": "dice_rolled",
            "player": self.players[player_idx],
            "dice": self.dice,
            "pairings": self.pairings,
            "valid_indices": self.valid_pairing_indices,
        }}]

    def _get_pairings(self, dice: list[int]) -> list[list[list[int]]]:
        """Return all 3 ways to split 4 dice into 2 pairs, as [[d1,d2],[d3,d4]]."""
        a, b, c, d = dice
        return [
            [[a, b], [c, d]],
            [[a, c], [b, d]],
            [[a, d], [b, c]],
        ]

    def _is_valid_pairing(self, player_idx: int, pairing: list) -> bool:
        sums = [pair[0] + pair[1] for pair in pairing]
        can_any = False
        new_cols_needed = 0
        for s in sums:
            if self._can_advance(player_idx, s):
                can_any = True
                if s not in self.temp:
                    new_cols_needed += 1
        if not can_any:
            return False
        # Check temp marker limit
        current_temp_cols = set(self.temp.keys())
        needed_slots = 0
        for s in sums:
            if self._can_advance(player_idx, s) and s not in current_temp_cols:
                needed_slots += 1
                current_temp_cols.add(s)
        available = 3 - len(self.temp)
        # At least one sum must be advanceable within constraints
        return self._simulate_pairing(player_idx, sums)

    def _simulate_pairing(self, player_idx: int, sums: list[int]) -> bool:
        temp_cols = set(self.temp.keys())
        for s in sums:
            if s in self.claimed:
                continue
            if s in temp_cols:
                top = COLUMN_HEIGHTS[s] - 1
                if self.temp[s] < top:
                    return True
            else:
                if len(temp_cols) < 3:
                    base = self.permanent[player_idx].get(s, -1)
                    top = COLUMN_HEIGHTS[s] - 1
                    if base < top:
                        return True
                    # already at top via permanent
        # also check if existing temp can advance
        for s in sums:
            if s in self.temp and s not in self.claimed:
                if self.temp[s] < COLUMN_HEIGHTS[s] - 1:
                    return True
        return False

    def _can_advance(self, player_idx: int, col: int) -> bool:
        if col in self.claimed:
            return False
        top = COLUMN_HEIGHTS[col] - 1
        if col in self.temp:
            return self.temp[col] < top
        base = self.permanent[player_idx].get(col, -1)
        return base < top

    def _choose_pair(self, player_idx: int, pair_index: int) -> list[dict]:
        if self.phase != "choosing":
            return [{"type": "error", "message": "現在不能選擇配對", "_target": self.players[player_idx]}]
        if pair_index not in self.valid_pairing_indices:
            return [{"type": "error", "message": "無效的配對選擇", "_target": self.players[player_idx]}]

        pairing = self.pairings[pair_index]
        sums = [pair[0] + pair[1] for pair in pairing]
        advanced = []

        for s in sums:
            if s in self.claimed:
                continue
            if s in self.temp:
                if self.temp[s] < COLUMN_HEIGHTS[s] - 1:
                    self.temp[s] += 1
                    advanced.append(s)
            elif len(self.temp) < 3:
                base = self.permanent[player_idx].get(s, -1)
                if base < COLUMN_HEIGHTS[s] - 1:
                    self.temp[s] = base + 1
                    advanced.append(s)

        self.phase = "deciding"
        return [{"type": "game_event", "data": {
            "event": "pair_chosen",
            "player": self.players[player_idx],
            "sums": sums,
            "advanced": advanced,
            "temp": dict(self.temp),
        }}]

    def _stop(self, player_idx: int) -> list[dict]:
        if self.phase != "deciding":
            return [{"type": "error", "message": "現在不能停止", "_target": self.players[player_idx]}]

        # Lock in temp markers as permanent
        newly_claimed = []
        for col, pos in self.temp.items():
            self.permanent[player_idx][col] = pos
            if pos >= COLUMN_HEIGHTS[col] - 1:
                self.claimed[col] = player_idx
                newly_claimed.append(col)
                self.wins[player_idx] += 1
                # Remove other players' markers from this column
                for i in range(self.num_players):
                    self.permanent[i].pop(col, None)

        saved_progress = dict(self.temp)
        self.temp = {}

        events = [{"type": "game_event", "data": {
            "event": "player_stopped",
            "player": self.players[player_idx],
            "saved": saved_progress,
            "newly_claimed": newly_claimed,
        }}]

        # Check win
        if self.wins[player_idx] >= WIN_COLUMNS:
            self.phase = "game_over"
            self.winner = player_idx
            events.append({"type": "game_event", "data": {
                "event": "game_over",
                "winner": self.players[player_idx],
            }})
            return events

        self._next_player()
        return events

    def _next_player(self):
        self.temp = {}
        self.dice = []
        self.pairings = []
        self.valid_pairing_indices = []
        self.current_player = (self.current_player + 1) % self.num_players
        self.phase = "rolling"
