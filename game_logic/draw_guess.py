"""Draw & Guess game engine — one player draws, others guess the word."""

import asyncio
import random
import httpx

from env_settings import get_settings

FALLBACK_WORDS = [
    "貓", "狗", "大象", "長頸鹿", "企鵝", "海豚", "恐龍", "蝴蝶", "螃蟹", "鯊魚",
    "老鷹", "烏龜", "兔子", "熊貓", "獅子", "蛇", "章魚", "蜜蜂", "青蛙", "鱷魚",
    "披薩", "漢堡", "壽司", "拉麵", "冰淇淋", "蛋糕", "西瓜", "珍珠奶茶", "薯條", "巧克力",
    "雨傘", "腳踏車", "飛機", "火箭", "吉他", "鑽石", "望遠鏡", "機器人", "寶劍", "皇冠",
    "城堡", "金字塔", "燈塔", "摩天輪", "火山", "瀑布", "彩虹", "月亮", "太陽", "流星",
    "游泳", "跳舞", "釣魚", "滑雪", "衝浪", "攀岩", "打籃球", "騎馬", "射箭", "溜冰",
    "超人", "忍者", "海盜", "公主", "外星人", "巫師", "消防員", "太空人", "廚師", "偵探",
    "電視", "手機", "鬧鐘", "沙發", "冰箱", "微波爐", "洗衣機", "鋼琴", "小提琴", "鼓",
    "聖誕樹", "雪人", "南瓜燈", "氣球", "煙火", "帳篷", "降落傘", "潛水艇", "直升機", "帆船",
    "仙人掌", "向日葵", "蘑菇", "櫻花", "椰子樹", "竹子", "四葉草", "玫瑰", "鬱金香", "蓮花",
]


async def generate_words_from_llm(count: int = 3) -> list[str]:
    settings = get_settings()
    if not settings.LLM_API_KEY or settings.LLM_API_KEY == "your-llm-api-key":
        return random.sample(FALLBACK_WORDS, min(count, len(FALLBACK_WORDS)))
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                settings.LLM_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.LLM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": (
                                f"請生成 {count} 個適合「你畫我猜」遊戲的繁體中文詞語。"
                                "要求：具體、可以畫出來的名詞或動作，難度適中。"
                                "每個詞語用逗號分隔，只回覆詞語，不要其他文字。"
                            ),
                        }
                    ],
                    "max_tokens": 100,
                },
            )
            text = resp.json()["choices"][0]["message"]["content"].strip()
            words = [w.strip() for w in text.replace("、", ",").split(",") if w.strip()]
            if len(words) >= count:
                return words[:count]
    except Exception:
        pass
    return random.sample(FALLBACK_WORDS, min(count, len(FALLBACK_WORDS)))


class DrawGuessGame:
    def __init__(self, players: list[str]):
        self.players = players
        self.num_players = len(players)
        self.scores = {p: 0 for p in players}
        self.current_drawer_idx = 0
        self.current_word = None
        self.word_choices = []
        self.round = 0
        self.max_rounds = len(players)
        self.phase = "waiting"  # waiting, choosing, drawing, round_end, game_over
        self.guessed_correctly = set()
        self.strokes = []
        self.timer_task = None
        self.time_left = 0
        self.round_scores = {}

    def get_state(self, username: str):
        player_idx = self.players.index(username) if username in self.players else -1
        is_drawer = (player_idx == self.current_drawer_idx)
        word_display = None
        if self.phase == "drawing":
            if is_drawer:
                word_display = self.current_word
            else:
                word_display = " ".join("＿" if c != " " else " " for c in self.current_word)

        return {
            "players": [
                {"name": p, "score": self.scores[p]}
                for p in self.players
            ],
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
            return self._choose_word(username, action.get("word", ""))
        elif action_type == "draw":
            return self._draw(username, action.get("stroke"))
        elif action_type == "clear_canvas":
            return self._clear_canvas(username)
        elif action_type == "guess":
            return self._guess(username, action.get("text", ""))
        elif action_type == "next_round":
            return self._start_next_round()
        return []

    def _request_words(self, username: str) -> list[dict]:
        player_idx = self.players.index(username)
        if player_idx != self.current_drawer_idx:
            return []
        # Words will be generated async — handled by caller
        self.phase = "choosing"
        return [{"type": "game_event", "data": {"event": "generating_words"}}]

    def set_word_choices(self, words: list[str]):
        self.word_choices = words
        self.phase = "choosing"

    def _choose_word(self, username: str, word: str) -> list[dict]:
        player_idx = self.players.index(username)
        if player_idx != self.current_drawer_idx:
            return []
        if self.phase != "choosing":
            return []
        self.current_word = word
        self.phase = "drawing"
        self.time_left = 90
        self.guessed_correctly = set()
        self.strokes = []
        self.round_scores = {}
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

    def _guess(self, username: str, text: str) -> list[dict]:
        if self.phase != "drawing":
            return []
        if self.players.index(username) == self.current_drawer_idx:
            return []
        if username in self.guessed_correctly:
            return []

        text = text.strip()
        events = []

        if text.lower() == self.current_word.lower():
            self.guessed_correctly.add(username)
            # Score: earlier guessers get more points
            guess_order = len(self.guessed_correctly)
            guesser_score = max(10, 30 - (guess_order - 1) * 5)
            self.scores[username] = self.scores.get(username, 0) + guesser_score
            self.round_scores[username] = guesser_score
            # Drawer gets points too
            drawer = self.players[self.current_drawer_idx]
            drawer_bonus = 10
            self.scores[drawer] = self.scores.get(drawer, 0) + drawer_bonus
            self.round_scores[drawer] = self.round_scores.get(drawer, 0) + drawer_bonus

            events.append({"type": "game_event", "data": {
                "event": "correct_guess",
                "player": username,
                "score": guesser_score,
            }})

            # If all guessers got it, end round
            guessers = [p for i, p in enumerate(self.players) if i != self.current_drawer_idx]
            if len(self.guessed_correctly) >= len(guessers):
                events.extend(self._end_round())
        else:
            events.append({"type": "game_event", "data": {
                "event": "guess",
                "player": username,
                "text": text,
            }})

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
        events = [{"type": "game_event", "data": {
            "event": "round_end",
            "word": self.current_word,
            "round_scores": self.round_scores,
        }}]
        return events

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
