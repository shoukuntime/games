"""Liar's Dice (大話骰/吹牛骰子) game engine."""

import random

class LiarsDiceGame:
    def __init__(self, players: list[str], settings: dict = None):
        self.players = players
        self.num_players = len(players)
        settings = settings or {}
        self.dice_count = {i: 5 for i in range(self.num_players)}  # dice per player
        self.dice = {}  # player_idx -> list of dice values
        self.alive = [True] * self.num_players
        self.current_player = 0
        self.current_bid = None  # (quantity, face_value)
        self.last_bidder = None
        self.phase = "rolling"  # rolling, bidding, reveal, game_over
        self.winner = None
        self.reveal_data = None  # set during reveal
        self._roll_all()

    def _roll_all(self):
        self.dice = {}
        for i in range(self.num_players):
            if self.alive[i]:
                self.dice[i] = [random.randint(1, 6) for _ in range(self.dice_count[i])]
        self.current_bid = None
        self.last_bidder = None
        self.phase = "bidding"
        self.reveal_data = None

    def _alive_players(self):
        return [i for i in range(self.num_players) if self.alive[i]]

    def _total_dice(self):
        return sum(self.dice_count[i] for i in range(self.num_players) if self.alive[i])

    def _next_alive(self, from_idx):
        idx = from_idx
        for _ in range(self.num_players):
            idx = (idx + 1) % self.num_players
            if self.alive[idx]:
                return idx
        return from_idx

    def _count_face(self, face):
        """Count all dice matching face + wilds (1s), across all alive players."""
        total = 0
        for i in self.dice:
            for d in self.dice[i]:
                if d == face or (d == 1 and face != 1):
                    total += 1
        return total

    def get_state(self, username: str):
        player_idx = self.players.index(username) if username in self.players else -1

        players_state = []
        for i in range(self.num_players):
            p = {
                "name": self.players[i],
                "dice_count": self.dice_count[i],
                "alive": self.alive[i],
            }
            # Only show own dice (or all dice during reveal)
            if i == player_idx:
                p["dice"] = self.dice.get(i, [])
            elif self.phase == "reveal" and self.reveal_data:
                p["dice"] = self.dice.get(i, [])
            else:
                p["dice"] = []
            players_state.append(p)

        return {
            "players": players_state,
            "my_index": player_idx,
            "current_player": self.current_player,
            "current_bid": self.current_bid,
            "last_bidder": self.last_bidder,
            "phase": self.phase,
            "total_dice": self._total_dice(),
            "winner": self.players[self.winner] if self.winner is not None else None,
            "reveal_data": self.reveal_data,
        }

    def handle_action(self, username: str, action: dict) -> list[dict]:
        player_idx = self.players.index(username)
        t = action.get("type")

        if self.phase == "game_over":
            return [{"type": "error", "message": "遊戲已結束", "_target": username}]

        if t == "bid":
            return self._bid(player_idx, action)
        elif t == "challenge":
            return self._challenge(player_idx)
        elif t == "next_round":
            return self._next_round()
        return []

    def _bid(self, player_idx: int, action: dict) -> list[dict]:
        if self.phase != "bidding":
            return [{"type": "error", "message": "現在不能喊注", "_target": self.players[player_idx]}]
        if player_idx != self.current_player:
            return [{"type": "error", "message": "還沒輪到你", "_target": self.players[player_idx]}]

        qty = action.get("quantity", 0)
        face = action.get("face", 0)

        if not (2 <= face <= 6) or qty < 1:
            return [{"type": "error", "message": "無效的喊注", "_target": self.players[player_idx]}]

        if qty > self._total_dice():
            return [{"type": "error", "message": "數量超過場上骰子總數", "_target": self.players[player_idx]}]

        # Validate bid is higher than current
        if self.current_bid:
            cur_qty, cur_face = self.current_bid
            if not (qty > cur_qty or (qty == cur_qty and face > cur_face)):
                return [{"type": "error", "message": "喊注必須更高", "_target": self.players[player_idx]}]

        self.current_bid = (qty, face)
        self.last_bidder = player_idx
        self.current_player = self._next_alive(player_idx)

        return [{"type": "game_event", "data": {
            "event": "bid",
            "player": self.players[player_idx],
            "quantity": qty,
            "face": face,
        }}]

    def _challenge(self, player_idx: int) -> list[dict]:
        if self.phase != "bidding":
            return [{"type": "error", "message": "現在不能質疑", "_target": self.players[player_idx]}]
        if player_idx != self.current_player:
            return [{"type": "error", "message": "還沒輪到你", "_target": self.players[player_idx]}]
        if self.current_bid is None:
            return [{"type": "error", "message": "還沒有人喊注", "_target": self.players[player_idx]}]

        qty, face = self.current_bid
        actual = self._count_face(face)
        bid_success = actual >= qty  # bidder was telling truth
        loser = player_idx if bid_success else self.last_bidder

        self.dice_count[loser] -= 1
        eliminated = self.dice_count[loser] <= 0
        if eliminated:
            self.alive[loser] = False

        alive_list = self._alive_players()

        self.phase = "reveal"
        self.reveal_data = {
            "challenger": self.players[player_idx],
            "bidder": self.players[self.last_bidder],
            "bid_qty": qty,
            "bid_face": face,
            "actual_count": actual,
            "bid_success": bid_success,
            "loser": self.players[loser],
            "loser_dice_left": self.dice_count[loser],
            "eliminated": eliminated,
        }

        events = [{"type": "game_event", "data": {
            "event": "challenge",
            **self.reveal_data,
        }}]

        # Check game over
        if len(alive_list) <= 1:
            self.winner = alive_list[0] if alive_list else None
            self.phase = "game_over"
            events.append({"type": "game_event", "data": {
                "event": "game_over",
                "winner": self.players[self.winner] if self.winner is not None else None,
            }})
        else:
            # Next round starts from the loser (if still alive), else next alive
            if self.alive[loser]:
                self.current_player = loser
            else:
                self.current_player = self._next_alive(loser)

        return events

    def _next_round(self) -> list[dict]:
        if self.phase == "game_over":
            return []
        self._roll_all()
        return [{"type": "game_event", "data": {"event": "new_round"}}]
