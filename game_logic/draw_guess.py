"""Draw & Guess game engine — LLM-powered multilingual judging."""

import random
import time
import httpx

from env_settings import get_settings

# Trilingual fallback words
FALLBACK_WORDS = [
    {"zh": "貓", "en": "Cat", "ja": "猫"}, {"zh": "狗", "en": "Dog", "ja": "犬"},
    {"zh": "大象", "en": "Elephant", "ja": "象"}, {"zh": "長頸鹿", "en": "Giraffe", "ja": "キリン"},
    {"zh": "企鵝", "en": "Penguin", "ja": "ペンギン"}, {"zh": "恐龍", "en": "Dinosaur", "ja": "恐竜"},
    {"zh": "蝴蝶", "en": "Butterfly", "ja": "蝶"}, {"zh": "鯊魚", "en": "Shark", "ja": "サメ"},
    {"zh": "海豚", "en": "Dolphin", "ja": "イルカ"}, {"zh": "獅子", "en": "Lion", "ja": "ライオン"},
    {"zh": "披薩", "en": "Pizza", "ja": "ピザ"}, {"zh": "漢堡", "en": "Hamburger", "ja": "ハンバーガー"},
    {"zh": "壽司", "en": "Sushi", "ja": "寿司"}, {"zh": "冰淇淋", "en": "Ice Cream", "ja": "アイスクリーム"},
    {"zh": "蛋糕", "en": "Cake", "ja": "ケーキ"}, {"zh": "珍珠奶茶", "en": "Bubble Tea", "ja": "タピオカミルクティー"},
    {"zh": "雨傘", "en": "Umbrella", "ja": "傘"}, {"zh": "腳踏車", "en": "Bicycle", "ja": "自転車"},
    {"zh": "飛機", "en": "Airplane", "ja": "飛行機"}, {"zh": "火箭", "en": "Rocket", "ja": "ロケット"},
    {"zh": "吉他", "en": "Guitar", "ja": "ギター"}, {"zh": "鑽石", "en": "Diamond", "ja": "ダイヤモンド"},
    {"zh": "城堡", "en": "Castle", "ja": "城"}, {"zh": "金字塔", "en": "Pyramid", "ja": "ピラミッド"},
    {"zh": "火山", "en": "Volcano", "ja": "火山"}, {"zh": "彩虹", "en": "Rainbow", "ja": "虹"},
    {"zh": "太陽", "en": "Sun", "ja": "太陽"}, {"zh": "月亮", "en": "Moon", "ja": "月"},
    {"zh": "機器人", "en": "Robot", "ja": "ロボット"}, {"zh": "超人", "en": "Superman", "ja": "スーパーマン"},
    {"zh": "忍者", "en": "Ninja", "ja": "忍者"}, {"zh": "海盜", "en": "Pirate", "ja": "海賊"},
    {"zh": "消防員", "en": "Firefighter", "ja": "消防士"}, {"zh": "太空人", "en": "Astronaut", "ja": "宇宙飛行士"},
    {"zh": "游泳", "en": "Swimming", "ja": "水泳"}, {"zh": "滑雪", "en": "Skiing", "ja": "スキー"},
    {"zh": "釣魚", "en": "Fishing", "ja": "釣り"}, {"zh": "跳舞", "en": "Dancing", "ja": "ダンス"},
    {"zh": "聖誕樹", "en": "Christmas Tree", "ja": "クリスマスツリー"}, {"zh": "雪人", "en": "Snowman", "ja": "雪だるま"},
]

PASS_THRESHOLD = 80
BASE_SCORE = 30
ROUND_TIME = 90


async def generate_words_from_llm(count: int = 3) -> list[dict]:
    """Generate trilingual word choices. Returns list of {zh, en, ja}."""
    settings = get_settings()
    if not settings.LLM_API_KEY or settings.LLM_API_KEY == "your-llm-api-key":
        return random.sample(FALLBACK_WORDS, min(count, len(FALLBACK_WORDS)))
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                settings.LLM_API_URL,
                headers={"Authorization": f"Bearer {settings.LLM_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [{"role": "user", "content": (
                        f"Generate {count} concrete, drawable nouns for a drawing guessing game.\n"
                        "For each word, provide translations in Chinese (Traditional), English, and Japanese.\n"
                        "Format (one per line): Chinese|English|Japanese\n"
                        "Example: 貓|Cat|猫\n"
                        f"Only output {count} lines, nothing else."
                    )}],
                    "max_tokens": 200,
                },
            )
            text = resp.json()["choices"][0]["message"]["content"].strip()
            words = []
            for line in text.strip().split("\n"):
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 3:
                    words.append({"zh": parts[0], "en": parts[1], "ja": parts[2]})
            if len(words) >= count:
                return words[:count]
    except Exception:
        pass
    return random.sample(FALLBACK_WORDS, min(count, len(FALLBACK_WORDS)))


async def judge_guess_with_llm(word: dict, guess: str) -> int:
    """Use LLM to score a guess 0-100. Returns score."""
    settings = get_settings()
    # Quick exact match check first
    guess_lower = guess.strip().lower()
    for lang in ["zh", "en", "ja"]:
        if guess_lower == word.get(lang, "").lower():
            return 100

    if not settings.LLM_API_KEY or settings.LLM_API_KEY == "your-llm-api-key":
        # Fallback: simple partial matching
        for lang in ["zh", "en", "ja"]:
            w = word.get(lang, "").lower()
            if w and (w in guess_lower or guess_lower in w):
                return 90
        return 0
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                settings.LLM_API_URL,
                headers={"Authorization": f"Bearer {settings.LLM_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [{"role": "user", "content": (
                        f"You are a judge for a drawing guessing game.\n"
                        f"The answer is: {word['zh']} / {word['en']} / {word['ja']}\n"
                        f"The player guessed: \"{guess}\"\n"
                        f"Score the guess from 0 to 100:\n"
                        f"- 100 = exact match or obvious synonym in any language\n"
                        f"- 80-99 = close enough (e.g. 'kitty' for 'cat')\n"
                        f"- 50-79 = related but not quite right\n"
                        f"- 0-49 = wrong\n"
                        f"Reply with ONLY a number, nothing else."
                    )}],
                    "max_tokens": 10,
                },
            )
            score_text = resp.json()["choices"][0]["message"]["content"].strip()
            return min(100, max(0, int("".join(c for c in score_text if c.isdigit()) or "0")))
    except Exception:
        # Fallback
        for lang in ["zh", "en", "ja"]:
            if guess_lower == word.get(lang, "").lower():
                return 100
        return 0


class DrawGuessGame:
    def __init__(self, players: list[str]):
        self.players = players
        self.num_players = len(players)
        self.scores = {p: 0 for p in players}
        self.current_drawer_idx = 0
        self.current_word = None  # {zh, en, ja}
        self.word_choices = []    # list of {zh, en, ja}
        self.round = 0
        self.max_rounds = len(players)
        self.phase = "waiting"
        self.guessed_correctly = set()
        self.strokes = []
        self.time_left = 0
        self.round_scores = {}
        self.round_start_time = 0
        self.first_correct_elapsed = None  # seconds elapsed when first correct

    def get_state(self, username: str):
        player_idx = self.players.index(username) if username in self.players else -1
        is_drawer = (player_idx == self.current_drawer_idx)

        word_display = None
        if self.phase == "drawing" and self.current_word:
            if is_drawer:
                word_display = f"{self.current_word['zh']} / {self.current_word['en']} / {self.current_word['ja']}"
            else:
                # Show underscores based on Chinese word length
                word_display = " ".join("＿" for _ in self.current_word["zh"])

        return {
            "players": [{"name": p, "score": self.scores[p]} for p in self.players],
            "current_drawer": self.players[self.current_drawer_idx],
            "my_index": player_idx,
            "is_drawer": is_drawer,
            "phase": self.phase,
            "round": self.round + 1,
            "max_rounds": self.max_rounds,
            "word": word_display,
            "word_choices": self.word_choices if is_drawer and self.phase == "choosing" else [],
            "strokes": self.strokes,
            "time_left": self.time_left,
            "guessed_correctly": list(self.guessed_correctly),
        }

    def handle_action(self, username: str, action: dict) -> list[dict]:
        action_type = action.get("type")
        if action_type == "request_words":
            return self._request_words(username)
        elif action_type == "choose_word":
            return self._choose_word(username, action.get("word_index", 0))
        elif action_type == "draw":
            return self._draw(username, action.get("stroke"))
        elif action_type == "clear_canvas":
            return self._clear_canvas(username)
        elif action_type == "next_round":
            return self._start_next_round()
        # "guess" is handled externally in main.py (needs async LLM)
        return []

    def _request_words(self, username: str) -> list[dict]:
        player_idx = self.players.index(username)
        if player_idx != self.current_drawer_idx:
            return []
        self.phase = "choosing"
        return [{"type": "game_event", "data": {"event": "generating_words"}}]

    def set_word_choices(self, words: list[dict]):
        self.word_choices = words
        self.phase = "choosing"

    def _choose_word(self, username: str, word_index: int) -> list[dict]:
        player_idx = self.players.index(username)
        if player_idx != self.current_drawer_idx or self.phase != "choosing":
            return []
        if word_index < 0 or word_index >= len(self.word_choices):
            return []
        self.current_word = self.word_choices[word_index]
        self.phase = "drawing"
        self.time_left = ROUND_TIME
        self.guessed_correctly = set()
        self.strokes = []
        self.round_scores = {}
        self.round_start_time = time.time()
        self.first_correct_elapsed = None
        return [{"type": "game_event", "data": {"event": "drawing_started", "drawer": username}}]

    def _draw(self, username: str, stroke: dict) -> list[dict]:
        if self.players.index(username) != self.current_drawer_idx:
            return []
        if stroke:
            self.strokes.append(stroke)
        return [{"type": "draw_stroke", "data": stroke, "_target": "all"}]

    def _clear_canvas(self, username: str) -> list[dict]:
        if self.players.index(username) != self.current_drawer_idx:
            return []
        self.strokes = []
        return [{"type": "clear_canvas"}]

    def process_guess_result(self, username: str, guess_text: str, llm_score: int) -> list[dict]:
        """Called by main.py after LLM scoring. Returns events."""
        if self.phase != "drawing" or username in self.guessed_correctly:
            return []

        drawer = self.players[self.current_drawer_idx]
        events = []

        if llm_score >= PASS_THRESHOLD:
            elapsed = time.time() - self.round_start_time
            self.guessed_correctly.add(username)

            if self.first_correct_elapsed is None:
                self.first_correct_elapsed = elapsed
                guesser_score = BASE_SCORE
            else:
                ratio = self.first_correct_elapsed / max(elapsed, 0.1)
                guesser_score = max(5, round(BASE_SCORE * ratio))

            self.scores[username] = self.scores.get(username, 0) + guesser_score
            self.round_scores[username] = guesser_score

            # Drawer bonus
            drawer_bonus = 10
            self.scores[drawer] = self.scores.get(drawer, 0) + drawer_bonus
            self.round_scores[drawer] = self.round_scores.get(drawer, 0) + drawer_bonus

            # Notify guesser (private)
            events.append({"type": "game_event", "data": {
                "event": "guess_result",
                "player": username, "text": guess_text,
                "llm_score": llm_score, "correct": True,
                "points": guesser_score,
            }, "_target": username})

            # Notify drawer (private)
            events.append({"type": "game_event", "data": {
                "event": "guess_result",
                "player": username, "text": guess_text,
                "llm_score": llm_score, "correct": True,
                "points": guesser_score,
            }, "_target": drawer})

            # Broadcast correct (no guess text shown)
            events.append({"type": "game_event", "data": {
                "event": "correct_guess",
                "player": username, "score": guesser_score,
            }})

            # Check if all guessed
            guessers = [p for i, p in enumerate(self.players) if i != self.current_drawer_idx]
            if len(self.guessed_correctly) >= len(guessers):
                events.extend(self._end_round())
        else:
            # Wrong — notify guesser + drawer only
            events.append({"type": "game_event", "data": {
                "event": "guess_result",
                "player": username, "text": guess_text,
                "llm_score": llm_score, "correct": False,
            }, "_target": username})
            events.append({"type": "game_event", "data": {
                "event": "guess_result",
                "player": username, "text": guess_text,
                "llm_score": llm_score, "correct": False,
            }, "_target": drawer})

        return events

    def tick(self) -> list[dict]:
        if self.phase != "drawing":
            return []
        self.time_left -= 1
        if self.time_left <= 0:
            return self._end_round()
        return [{"type": "timer", "data": {"time_left": self.time_left}}]

    def _end_round(self) -> list[dict]:
        self.phase = "round_end"
        word_str = f"{self.current_word['zh']} / {self.current_word['en']} / {self.current_word['ja']}" if self.current_word else ""
        return [{"type": "game_event", "data": {
            "event": "round_end",
            "word": word_str,
            "round_scores": self.round_scores,
        }}]

    def _start_next_round(self) -> list[dict]:
        self.round += 1
        if self.round >= self.max_rounds:
            self.phase = "game_over"
            ranking = sorted(self.scores.items(), key=lambda x: -x[1])
            return [{"type": "game_event", "data": {
                "event": "game_over",
                "ranking": [{"name": n, "score": s} for n, s in ranking],
            }}]
        self.current_drawer_idx = self.round % self.num_players
        self.phase = "waiting"
        self.current_word = None
        self.word_choices = []
        self.strokes = []
        self.guessed_correctly = set()
        return [{"type": "game_event", "data": {"event": "new_round", "round": self.round + 1}}]
