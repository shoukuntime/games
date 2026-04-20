"""Draw & Guess game engine — LLM-powered multilingual judging."""

import random
import time
import logging
import httpx

from env_settings import get_settings

logger = logging.getLogger(__name__)

# Trilingual fallback words (diverse: nouns, verbs, scenes, idioms, concepts)
FALLBACK_WORDS = [
    # Animals
    {"zh": "貓", "en": "Cat", "ja": "猫"}, {"zh": "長頸鹿", "en": "Giraffe", "ja": "キリン"},
    {"zh": "企鵝", "en": "Penguin", "ja": "ペンギン"}, {"zh": "蝴蝶", "en": "Butterfly", "ja": "蝶"},
    # Food
    {"zh": "壽司", "en": "Sushi", "ja": "寿司"}, {"zh": "珍珠奶茶", "en": "Bubble Tea", "ja": "タピオカミルクティー"},
    {"zh": "火鍋", "en": "Hot Pot", "ja": "火鍋"}, {"zh": "鯛魚燒", "en": "Taiyaki", "ja": "たい焼き"},
    # Objects
    {"zh": "城堡", "en": "Castle", "ja": "城"}, {"zh": "金字塔", "en": "Pyramid", "ja": "ピラミッド"},
    {"zh": "摩天輪", "en": "Ferris Wheel", "ja": "観覧車"}, {"zh": "紅綠燈", "en": "Traffic Light", "ja": "信号機"},
    # Actions / Scenes
    {"zh": "衝浪", "en": "Surfing", "ja": "サーフィン"}, {"zh": "求婚", "en": "Proposal", "ja": "プロポーズ"},
    {"zh": "打噴嚏", "en": "Sneeze", "ja": "くしゃみ"}, {"zh": "夢遊", "en": "Sleepwalk", "ja": "夢遊病"},
    {"zh": "追公車", "en": "Chasing a Bus", "ja": "バスを追いかける"},
    {"zh": "曬衣服", "en": "Hang Laundry", "ja": "洗濯物を干す"},
    # Complex / Abstract
    {"zh": "地心引力", "en": "Gravity", "ja": "重力"}, {"zh": "時差", "en": "Jet Lag", "ja": "時差ボケ"},
    {"zh": "塞車", "en": "Traffic Jam", "ja": "渋滞"}, {"zh": "失眠", "en": "Insomnia", "ja": "不眠症"},
    {"zh": "自拍", "en": "Selfie", "ja": "自撮り"}, {"zh": "直播", "en": "Live Stream", "ja": "ライブ配信"},
    # Idioms / Phrases
    {"zh": "對牛彈琴", "en": "Pearls Before Swine", "ja": "馬の耳に念仏"},
    {"zh": "井底之蛙", "en": "Frog in a Well", "ja": "井の中の蛙"},
    {"zh": "畫蛇添足", "en": "Gild the Lily", "ja": "蛇足"},
    {"zh": "掩耳盜鈴", "en": "Bury Head in Sand", "ja": "臭い物に蓋"},
    # Pop culture / Modern
    {"zh": "外送員", "en": "Delivery Driver", "ja": "配達員"},
    {"zh": "逃生室", "en": "Escape Room", "ja": "脱出ゲーム"},
    {"zh": "露營", "en": "Camping", "ja": "キャンプ"},
    {"zh": "跳蚤市場", "en": "Flea Market", "ja": "フリーマーケット"},
    {"zh": "密室殺人", "en": "Locked Room Murder", "ja": "密室殺人"},
    {"zh": "鬼屋", "en": "Haunted House", "ja": "お化け屋敷"},
    {"zh": "煙火大會", "en": "Fireworks Festival", "ja": "花火大会"},
    {"zh": "夾娃娃機", "en": "Claw Machine", "ja": "クレーンゲーム"},
    {"zh": "泡溫泉", "en": "Hot Spring Bath", "ja": "温泉に入る"},
    {"zh": "搶紅包", "en": "Red Envelope Rush", "ja": "お年玉争奪"},
]

# Used to tell LLM what NOT to generate
FALLBACK_ZH_SET = {w["zh"] for w in FALLBACK_WORDS}

# Track recently used words across rounds to avoid repeats
_recent_words: list[str] = []

PASS_THRESHOLD = 80
BASE_SCORE = 30
ROUND_TIME = 90


async def _llm_request(messages: list, max_tokens: int = 200) -> str | None:
    """Shared LLM API call. Returns response text or None on failure."""
    settings = get_settings()
    if not settings.LLM_API_KEY or settings.LLM_API_KEY == "your-llm-api-key":
        logger.info("LLM not configured (API key is default), using fallback")
        return None
    logger.info(f"LLM request: url={settings.LLM_API_URL}, model={settings.LLM_MODEL}")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                settings.LLM_API_URL,
                headers={"Authorization": f"Bearer {settings.LLM_API_KEY}", "Content-Type": "application/json"},
                json={"model": settings.LLM_MODEL, "messages": messages, "max_tokens": max_tokens},
            )
            if resp.status_code != 200:
                logger.error(f"LLM API error: {resp.status_code} — {resp.text[:300]}")
                return None
            data = resp.json()
            msg = data.get("choices", [{}])[0].get("message", {})
            # Some reasoning models put content in reasoning_content instead of content
            content = msg.get("content") or msg.get("reasoning_content") or ""
            if not content:
                logger.error(f"LLM returned empty content: {str(data)[:500]}")
                return None
            text = content.strip()
            # For reasoning models, the actual answer may be after the thinking
            # Try to extract the formatted lines from the end of the response
            lines = [l for l in text.split("\n") if "|" in l]
            if lines:
                text = "\n".join(lines)
            logger.info(f"LLM response: {text[:300]}")
            return text
    except Exception as e:
        logger.error(f"LLM request failed: {e}")
        return None


async def generate_words_from_llm(count: int = 3) -> list[dict]:
    """Generate trilingual word choices. Returns list of {zh, en, ja}."""
    global _recent_words
    # Build exclusion list
    exclude = list(FALLBACK_ZH_SET | set(_recent_words[-30:]))
    exclude_str = "、".join(exclude[:40])

    # Pick a random category emphasis for variety
    categories = [
        "動作或場景（如：追公車、泡溫泉、打噴嚏）",
        "成語或俗語（如：對牛彈琴、守株待兔）",
        "現代生活（如：直播、外送、自拍、塞車）",
        "職業或角色（如：魔術師、偵探、考古學家）",
        "情緒或狀態（如：失眠、緊張、戀愛、飢餓）",
        "節日或活動（如：煙火大會、萬聖節、畢業典禮）",
        "自然現象（如：龍捲風、極光、海市蜃樓）",
        "奇幻/虛構（如：獨角獸、時光機、魔法陣）",
    ]
    focus = random.choice(categories)

    text = await _llm_request([{"role": "user", "content": (
        f"你是「你畫我猜」遊戲的出題者。請生成 {count} 個有趣、可以用畫表達的詞彙。\n"
        f"本次主題方向偏重：{focus}\n"
        f"詞彙可以是：名詞、動詞、場景、成語、抽象概念、流行用語等，不限於簡單名詞。\n"
        f"難度要有變化（1 個簡單、1 個中等、1 個有挑戰性）。\n"
        f"請避免以下已出過的詞：{exclude_str}\n"
        f"每個詞提供繁體中文、英文、日文翻譯。\n"
        f"格式（每行一組）：繁體中文|English|日本語\n"
        f"範例：追公車|Chasing a Bus|バスを追いかける\n"
        f"只輸出 {count} 行，不要其他文字。"
    )}], max_tokens=1024)
    if text:
        words = []
        for line in text.strip().split("\n"):
            line = line.strip()
            if not line or "|" not in line:
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3 and parts[0] not in FALLBACK_ZH_SET:
                words.append({"zh": parts[0], "en": parts[1], "ja": parts[2]})
        if len(words) >= count:
            result = words[:count]
            _recent_words.extend(w["zh"] for w in result)
            if len(_recent_words) > 60:
                _recent_words = _recent_words[-60:]
            return result
        logger.warning(f"LLM returned {len(words)} valid words, expected {count}. Raw: {text}")
    return random.sample(FALLBACK_WORDS, min(count, len(FALLBACK_WORDS)))


async def judge_guess_with_llm(word: dict, guess: str) -> int:
    """Use LLM to score a guess 0-100. Returns score."""
    # Quick exact match check first
    guess_lower = guess.strip().lower()
    for lang in ["zh", "en", "ja"]:
        if guess_lower == word.get(lang, "").lower():
            return 100

    text = await _llm_request([{"role": "user", "content": (
        f"You are a judge for a drawing guessing game.\n"
        f"The answer is: {word['zh']} / {word['en']} / {word['ja']}\n"
        f"The player guessed: \"{guess}\"\n"
        f"Score the guess from 0 to 100:\n"
        f"- 100 = exact match or obvious synonym in any language\n"
        f"- 80-99 = close enough (e.g. 'kitty' for 'cat')\n"
        f"- 50-79 = related but not quite right\n"
        f"- 0-49 = wrong\n"
        f"Reply with ONLY a number, nothing else."
    )}], max_tokens=256)
    if text:
        digits = "".join(c for c in text if c.isdigit())
        if digits:
            return min(100, max(0, int(digits)))
    # Fallback: simple matching
    for lang in ["zh", "en", "ja"]:
        w = word.get(lang, "").lower()
        if w and (w in guess_lower or guess_lower in w):
            return 90
    return 0


class DrawGuessGame:
    def __init__(self, players: list[str], settings: dict = None):
        self.players = players
        self.num_players = len(players)
        settings = settings or {}
        self.scores = {p: 0 for p in players}
        self.current_drawer_idx = 0
        self.current_word = None  # {zh, en, ja}
        self.word_choices = []    # list of {zh, en, ja}
        self.round = 0
        custom_rounds = settings.get("max_rounds", 0)
        self.max_rounds = custom_rounds if custom_rounds > 0 else len(players)
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
