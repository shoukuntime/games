/* i18n — language support: zh-TW, en, ja */
const I18N = {
    "zh-TW": {
        // Nav
        "nav.logout": "登出",
        // Auth
        "login.title": "Games Platform",
        "login.subtitle": "登入您的帳號開始遊戲",
        "login.username": "帳號",
        "login.username_ph": "請輸入帳號",
        "login.password": "密碼",
        "login.password_ph": "請輸入密碼",
        "login.remember": "記住帳號密碼",
        "login.submit": "登入",
        "login.no_account": "還沒有帳號？",
        "login.register_link": "立即註冊",
        "register.title": "建立帳號",
        "register.subtitle": "註冊後即可開始遊玩各種小遊戲",
        "register.username_ph": "至少 3 個字元",
        "register.password_ph": "至少 6 個字元",
        "register.confirm": "確認密碼",
        "register.confirm_ph": "再次輸入密碼",
        "register.submit": "註冊",
        "register.has_account": "已有帳號？",
        "register.login_link": "返回登入",
        "err.network": "網路錯誤，請稍後再試",
        "err.login_fail": "登入失敗",
        "err.register_fail": "註冊失敗",
        "err.password_mismatch": "兩次輸入的密碼不一致",
        // Dashboard
        "dash.title": "遊戲大廳",
        "dash.subtitle": "選擇一款遊戲，邀請朋友一起挑戰！",
        "dash.join_ph": "輸入房間代碼",
        "dash.join_btn": "加入房間",
        "dash.join_err": "房間不存在，請確認代碼",
        "dash.public_rooms": "🌐 公開房間",
        "dash.refresh": "↻ 重新整理",
        "dash.no_rooms": "目前沒有公開房間",
        "dash.loading": "載入中...",
        "dash.load_fail": "載入失敗",
        "dash.join": "加入",
        "modal.create": "建立",
        "modal.cancel": "取消",
        "modal.public": "公開房間",
        "modal.public_hint": "其他玩家可在大廳看到並加入",
        "modal.title_prefix": "建立",
        "modal.title_suffix": "房間",
        // Games
        "game.blokus": "Blokus",
        "game.blokus.desc": "在 20×20 棋盤上放置多形方塊，角對角連接搶佔領地！",
        "game.blokus.tag": "策略",
        "game.draw_guess": "你畫我猜",
        "game.draw_guess.desc": "一人畫圖其他人猜，LLM 出題讓每局都是全新挑戰！",
        "game.draw_guess.tag": "創意",
        "game.cant_stop": "Can't Stop",
        "game.cant_stop.desc": "擲骰攻頂的冒險之旅，貪心就會前功盡棄！",
        "game.cant_stop.tag": "骰子策略",
        "game.liars_dice": "吹牛骰子",
        "game.liars_dice.desc": "猜測全場骰子，大膽喊注或質疑對手！",
        "game.liars_dice.tag": "心理戰",
        "game.players": "人",
        // Liar's Dice
        "ld.players": "玩家",
        "ld.your_dice": "你的骰子",
        "ld.total_dice": "場上骰子",
        "ld.quantity": "數量",
        "ld.face_value": "點數",
        "ld.bid": "喊注",
        "ld.challenge": "開！質疑",
        "ld.current_bid": "目前喊注",
        "ld.bid_by": "{name} 喊的",
        "ld.bid_msg": "{name} 喊了 {qty} 個 {face} 點",
        "ld.your_turn_first": "你先喊注！",
        "ld.your_turn_bid": "加碼或質疑！",
        "ld.wait_turn": "等待 {name} 操作...",
        "ld.reveal_title": "開骰！",
        "ld.actual": "實際",
        "ld.bid_true": "喊注成功！質疑者輸",
        "ld.bid_false": "喊注失敗！喊注者輸",
        "ld.player_lost_die": "{name} 失去一顆骰子（剩 {left} 顆）",
        "ld.player_eliminated": "{name} 被淘汰！",
        "ld.next_round": "下一輪",
        "ld.new_round": "新一輪開始！",
        "ld.winner": "🎉 {name} 獲勝！",
        "ld.eliminated": "已被淘汰",
        // Lobby
        "lobby.room_code": "房間代碼：",
        "lobby.copy": "複製",
        "lobby.copied": "已複製！",
        "lobby.public_hint": "其他玩家可在大廳看到並加入",
        "lobby.private_hint": "僅持有代碼的人可加入",
        "lobby.private_label": "私人房間",
        "lobby.you": "你",
        "lobby.players": "位玩家",
        "lobby.min": "至少",
        "lobby.start": "開始遊戲",
        "lobby.wait": "等待房主開始遊戲...",
        "lobby.leave": "離開房間",
        "lobby.back": "← 返回遊戲大廳",
        // Blokus
        "blokus.players": "玩家",
        "blokus.your_pieces": "你的棋子",
        "blokus.select": "選擇棋子",
        "blokus.drag_hint": "拖曳至棋盤",
        "blokus.remaining": "塊",
        "blokus.score": "分",
        "blokus.passed": "已跳過",
        "blokus.your_turn": "輪到你的{color}色！",
        "blokus.wait_turn": "等待 {name} 的{color}色...",
        "blokus.game_over": "遊戲結束",
        "blokus.champion": "🎉 遊戲結束！冠軍：{name} ({score}分)",
        "blokus.not_color": "還沒輪到{color}色",
        "blokus.not_you": "還沒輪到你",
        "blokus.color.0": "藍", "blokus.color.1": "黃", "blokus.color.2": "紅", "blokus.color.3": "綠",
        // Draw & Guess
        "dg.scoreboard": "計分板",
        "dg.round": "回合",
        "dg.chat": "聊天 / 猜題",
        "dg.guess_ph": "輸入猜測...",
        "dg.send": "送出",
        "dg.you_draw": "你是畫家！",
        "dg.get_words": "🎲 取得題目",
        "dg.choose_word": "選擇一個題目：",
        "dg.generating": "正在生成題目...",
        "dg.wait_choose": "等待 {name} 選擇題目...",
        "dg.drawing": "你正在畫：",
        "dg.drawing_other": "{name} 正在畫圖 — 提示：",
        "dg.round_end": "回合結束！答案是：",
        "dg.next_round": "下一回合",
        "dg.game_over": "🏆 遊戲結束！",
        "dg.correct": "{name} 猜對了！(+{score}分)",
        "dg.answer_reveal": "📢 答案是：{word}",
        // Can't Stop
        "cs.players": "玩家",
        "cs.columns_won": "攻佔 {n} / 3 欄",
        "cs.roll": "🎲 擲骰子",
        "cs.continue": "🎲 繼續擲",
        "cs.stop": "✋ 停止",
        "cs.choose_pair": "選擇配對方式：",
        "cs.your_turn": "輪到你了！擲骰子吧",
        "cs.choosing": "選擇配對方式",
        "cs.deciding": "繼續擲還是停止？",
        "cs.busted_msg": "💥 爆了！進度全失",
        "cs.busted": "💥 {name} 爆了！失去所有本回合進度",
        "cs.stopped": "✋ {name} 選擇停止",
        "cs.claimed": "，攻佔欄位 {cols}！",
        "cs.winner": "🎉 {name} 獲勝！",
        "cs.wait": "等待 {name} 操作...",
    },

    "en": {
        "nav.logout": "Logout",
        "login.title": "Games Platform",
        "login.subtitle": "Sign in to start playing",
        "login.username": "Username",
        "login.username_ph": "Enter username",
        "login.password": "Password",
        "login.password_ph": "Enter password",
        "login.remember": "Remember me",
        "login.submit": "Sign In",
        "login.no_account": "Don't have an account?",
        "login.register_link": "Register now",
        "register.title": "Create Account",
        "register.subtitle": "Register to play various mini-games",
        "register.username_ph": "At least 3 characters",
        "register.password_ph": "At least 6 characters",
        "register.confirm": "Confirm Password",
        "register.confirm_ph": "Re-enter password",
        "register.submit": "Register",
        "register.has_account": "Already have an account?",
        "register.login_link": "Sign in",
        "err.network": "Network error, please try again",
        "err.login_fail": "Login failed",
        "err.register_fail": "Registration failed",
        "err.password_mismatch": "Passwords do not match",
        "dash.title": "Game Lobby",
        "dash.subtitle": "Pick a game and invite friends to play!",
        "dash.join_ph": "Enter room code",
        "dash.join_btn": "Join Room",
        "dash.join_err": "Room not found",
        "dash.public_rooms": "🌐 Public Rooms",
        "dash.refresh": "↻ Refresh",
        "dash.no_rooms": "No public rooms available",
        "dash.loading": "Loading...",
        "dash.load_fail": "Failed to load",
        "dash.join": "Join",
        "modal.create": "Create",
        "modal.cancel": "Cancel",
        "modal.public": "Public Room",
        "modal.public_hint": "Other players can see and join from the lobby",
        "modal.title_prefix": "Create",
        "modal.title_suffix": "Room",
        "game.blokus": "Blokus",
        "game.blokus.desc": "Place polyomino pieces on a 20×20 board — connect diagonally to claim territory!",
        "game.blokus.tag": "Strategy",
        "game.draw_guess": "Draw & Guess",
        "game.draw_guess.desc": "One draws, others guess — LLM-generated topics for fresh rounds!",
        "game.draw_guess.tag": "Creative",
        "game.cant_stop": "Can't Stop",
        "game.cant_stop.desc": "A dice-climbing adventure — push your luck or lose it all!",
        "game.cant_stop.tag": "Dice Strategy",
        "game.liars_dice": "Liar's Dice",
        "game.liars_dice.desc": "Guess the dice on the table — bluff big or call the bluff!",
        "game.liars_dice.tag": "Bluffing",
        "game.players": "players",
        "ld.players": "Players",
        "ld.your_dice": "Your Dice",
        "ld.total_dice": "Total Dice",
        "ld.quantity": "Quantity",
        "ld.face_value": "Face",
        "ld.bid": "Bid",
        "ld.challenge": "Challenge!",
        "ld.current_bid": "Current Bid",
        "ld.bid_by": "by {name}",
        "ld.bid_msg": "{name} bid {qty}× {face}s",
        "ld.your_turn_first": "You bid first!",
        "ld.your_turn_bid": "Raise or challenge!",
        "ld.wait_turn": "Waiting for {name}...",
        "ld.reveal_title": "Reveal!",
        "ld.actual": "Actual",
        "ld.bid_true": "Bid was true! Challenger loses",
        "ld.bid_false": "Bid was false! Bidder loses",
        "ld.player_lost_die": "{name} lost a die ({left} left)",
        "ld.player_eliminated": "{name} eliminated!",
        "ld.next_round": "Next Round",
        "ld.new_round": "New round!",
        "ld.winner": "🎉 {name} wins!",
        "ld.eliminated": "Eliminated",
        "lobby.room_code": "Room Code: ",
        "lobby.copy": "Copy",
        "lobby.copied": "Copied!",
        "lobby.public_hint": "Anyone can see and join from the lobby",
        "lobby.private_hint": "Only people with the code can join",
        "lobby.private_label": "Private Room",
        "lobby.you": "You",
        "lobby.players": "players",
        "lobby.min": "min",
        "lobby.start": "Start Game",
        "lobby.wait": "Waiting for host to start...",
        "lobby.leave": "Leave Room",
        "lobby.back": "← Back to Lobby",
        "blokus.players": "Players",
        "blokus.your_pieces": "Your Pieces",
        "blokus.select": "Select a piece",
        "blokus.drag_hint": "Drag to board",
        "blokus.remaining": "pcs",
        "blokus.score": "pts",
        "blokus.passed": "Passed",
        "blokus.your_turn": "Your turn — {color}!",
        "blokus.wait_turn": "Waiting for {name}'s {color}...",
        "blokus.game_over": "Game Over",
        "blokus.champion": "🎉 Game Over! Winner: {name} ({score}pts)",
        "blokus.not_color": "Not {color}'s turn yet",
        "blokus.not_you": "Not your turn",
        "blokus.color.0": "Blue", "blokus.color.1": "Yellow", "blokus.color.2": "Red", "blokus.color.3": "Green",
        "dg.scoreboard": "Scoreboard",
        "dg.round": "Round",
        "dg.chat": "Chat / Guess",
        "dg.guess_ph": "Type your guess...",
        "dg.send": "Send",
        "dg.you_draw": "You are the artist!",
        "dg.get_words": "🎲 Get Words",
        "dg.choose_word": "Choose a word:",
        "dg.generating": "Generating words...",
        "dg.wait_choose": "Waiting for {name} to choose...",
        "dg.drawing": "You are drawing: ",
        "dg.drawing_other": "{name} is drawing — Hint: ",
        "dg.round_end": "Round over! The answer was: ",
        "dg.next_round": "Next Round",
        "dg.game_over": "🏆 Game Over!",
        "dg.correct": "{name} guessed it! (+{score}pts)",
        "dg.answer_reveal": "📢 Answer: {word}",
        "cs.players": "Players",
        "cs.columns_won": "Claimed {n} / 3 cols",
        "cs.roll": "🎲 Roll Dice",
        "cs.continue": "🎲 Roll Again",
        "cs.stop": "✋ Stop",
        "cs.choose_pair": "Choose a pairing:",
        "cs.your_turn": "Your turn! Roll the dice",
        "cs.choosing": "Choose a pairing",
        "cs.deciding": "Continue or stop?",
        "cs.busted_msg": "💥 Busted! All progress lost",
        "cs.busted": "💥 {name} busted! Lost all progress this turn",
        "cs.stopped": "✋ {name} stopped",
        "cs.claimed": ", claimed column {cols}!",
        "cs.winner": "🎉 {name} wins!",
        "cs.wait": "Waiting for {name}...",
    },

    "ja": {
        "nav.logout": "ログアウト",
        "login.title": "Games Platform",
        "login.subtitle": "サインインしてゲームを始めよう",
        "login.username": "ユーザー名",
        "login.username_ph": "ユーザー名を入力",
        "login.password": "パスワード",
        "login.password_ph": "パスワードを入力",
        "login.remember": "ログイン情報を保存",
        "login.submit": "ログイン",
        "login.no_account": "アカウントをお持ちでない方",
        "login.register_link": "新規登録",
        "register.title": "アカウント作成",
        "register.subtitle": "登録してミニゲームをプレイしよう",
        "register.username_ph": "3文字以上",
        "register.password_ph": "6文字以上",
        "register.confirm": "パスワード確認",
        "register.confirm_ph": "もう一度入力",
        "register.submit": "登録",
        "register.has_account": "アカウントをお持ちの方",
        "register.login_link": "ログインへ",
        "err.network": "ネットワークエラー、後でお試しください",
        "err.login_fail": "ログイン失敗",
        "err.register_fail": "登録失敗",
        "err.password_mismatch": "パスワードが一致しません",
        "dash.title": "ゲームロビー",
        "dash.subtitle": "ゲームを選んで、友達と一緒にプレイしよう！",
        "dash.join_ph": "ルームコードを入力",
        "dash.join_btn": "参加",
        "dash.join_err": "ルームが見つかりません",
        "dash.public_rooms": "🌐 公開ルーム",
        "dash.refresh": "↻ 更新",
        "dash.no_rooms": "公開ルームはありません",
        "dash.loading": "読み込み中...",
        "dash.load_fail": "読み込み失敗",
        "dash.join": "参加",
        "modal.create": "作成",
        "modal.cancel": "キャンセル",
        "modal.public": "公開ルーム",
        "modal.public_hint": "他のプレイヤーがロビーから参加できます",
        "modal.title_prefix": "",
        "modal.title_suffix": "ルームを作成",
        "game.blokus": "Blokus",
        "game.blokus.desc": "20×20のボードにポリオミノを配置、角で繋げて陣地を広げよう！",
        "game.blokus.tag": "戦略",
        "game.draw_guess": "お絵描きクイズ",
        "game.draw_guess.desc": "一人が描いて他の人が当てる、LLMが出すお題で毎回新鮮！",
        "game.draw_guess.tag": "クリエイティブ",
        "game.cant_stop": "Can't Stop",
        "game.cant_stop.desc": "サイコロで山を登る冒険、欲張ると全て失う！",
        "game.cant_stop.tag": "ダイス戦略",
        "game.liars_dice": "ライアーズダイス",
        "game.liars_dice.desc": "場のサイコロを予想、大胆に宣言するか嘘を見破れ！",
        "game.liars_dice.tag": "心理戦",
        "game.players": "人",
        "ld.players": "プレイヤー",
        "ld.your_dice": "あなたのサイコロ",
        "ld.total_dice": "場のサイコロ",
        "ld.quantity": "個数",
        "ld.face_value": "出目",
        "ld.bid": "宣言",
        "ld.challenge": "チャレンジ！",
        "ld.current_bid": "現在の宣言",
        "ld.bid_by": "{name}の宣言",
        "ld.bid_msg": "{name}が{qty}個の{face}を宣言",
        "ld.your_turn_first": "最初の宣言をしよう！",
        "ld.your_turn_bid": "上乗せかチャレンジ！",
        "ld.wait_turn": "{name}を待っています...",
        "ld.reveal_title": "オープン！",
        "ld.actual": "実際",
        "ld.bid_true": "宣言成功！チャレンジャーの負け",
        "ld.bid_false": "宣言失敗！宣言者の負け",
        "ld.player_lost_die": "{name}がサイコロを1つ失った（残り{left}個）",
        "ld.player_eliminated": "{name}が脱落！",
        "ld.next_round": "次のラウンド",
        "ld.new_round": "新ラウンド開始！",
        "ld.winner": "🎉 {name}の勝利！",
        "ld.eliminated": "脱落",
        "lobby.room_code": "ルームコード：",
        "lobby.copy": "コピー",
        "lobby.copied": "コピー済！",
        "lobby.public_hint": "ロビーから誰でも参加可能",
        "lobby.private_hint": "コードを知っている人のみ参加可能",
        "lobby.private_label": "プライベートルーム",
        "lobby.you": "あなた",
        "lobby.players": "人",
        "lobby.min": "最低",
        "lobby.start": "ゲーム開始",
        "lobby.wait": "ホストの開始を待っています...",
        "lobby.leave": "退出",
        "lobby.back": "← ロビーに戻る",
        "blokus.players": "プレイヤー",
        "blokus.your_pieces": "あなたのピース",
        "blokus.select": "ピースを選択",
        "blokus.drag_hint": "ボードへドラッグ",
        "blokus.remaining": "個",
        "blokus.score": "点",
        "blokus.passed": "パス済",
        "blokus.your_turn": "あなたの番 — {color}！",
        "blokus.wait_turn": "{name}の{color}を待っています...",
        "blokus.game_over": "ゲーム終了",
        "blokus.champion": "🎉 ゲーム終了！優勝：{name} ({score}点)",
        "blokus.not_color": "まだ{color}の番ではありません",
        "blokus.not_you": "まだあなたの番ではありません",
        "blokus.color.0": "青", "blokus.color.1": "黄", "blokus.color.2": "赤", "blokus.color.3": "緑",
        "dg.scoreboard": "スコア",
        "dg.round": "ラウンド",
        "dg.chat": "チャット / 回答",
        "dg.guess_ph": "答えを入力...",
        "dg.send": "送信",
        "dg.you_draw": "あなたが描く番です！",
        "dg.get_words": "🎲 お題を取得",
        "dg.choose_word": "お題を選んでください：",
        "dg.generating": "お題を生成中...",
        "dg.wait_choose": "{name}がお題を選んでいます...",
        "dg.drawing": "描いているお題：",
        "dg.drawing_other": "{name}が描いています — ヒント：",
        "dg.round_end": "ラウンド終了！答えは：",
        "dg.next_round": "次のラウンド",
        "dg.game_over": "🏆 ゲーム終了！",
        "dg.correct": "{name}が正解！(+{score}点)",
        "dg.answer_reveal": "📢 答え：{word}",
        "cs.players": "プレイヤー",
        "cs.columns_won": "制覇 {n} / 3 列",
        "cs.roll": "🎲 サイコロを振る",
        "cs.continue": "🎲 もう一度",
        "cs.stop": "✋ ストップ",
        "cs.choose_pair": "ペアを選んでください：",
        "cs.your_turn": "あなたの番！サイコロを振ろう",
        "cs.choosing": "ペアを選択",
        "cs.deciding": "続ける？やめる？",
        "cs.busted_msg": "💥 バースト！進捗全失",
        "cs.busted": "💥 {name}がバースト！今回の進捗を全て失った",
        "cs.stopped": "✋ {name}がストップ",
        "cs.claimed": "、列{cols}を制覇！",
        "cs.winner": "🎉 {name}の勝利！",
        "cs.wait": "{name}を待っています...",
    },
};

const LANG_LABELS = { "zh-TW": "中文", "en": "English", "ja": "日本語" };
let currentLang = localStorage.getItem("lang") || "zh-TW";

function t(key, params) {
    let text = (I18N[currentLang] && I18N[currentLang][key]) || (I18N["zh-TW"][key]) || key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
    }
    return text;
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    applyI18n();
    // Update selector display
    const sel = document.getElementById('langLabel');
    if (sel) sel.textContent = LANG_LABELS[lang];
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
}

// --- Game Help / Tutorial ---
const HELP = {
    "zh-TW": {
        blokus: `<h2>🟦 Blokus 遊戲教學</h2>
<h3>🎯 目標</h3><p>在 20×20 棋盤上盡可能多放置自己的棋子。</p>
<h3>👥 人數</h3><p>2 人（各控 2 色）、3 人、或 4 人（各控 1 色）。</p>
<h3>🧩 棋子</h3><p>每色 21 塊不同形狀的多形方塊（1~5 格）。</p>
<h3>📏 規則</h3>
<ul>
<li><b>第一步</b>：棋子必須放在棋盤任一可用角落。</li>
<li><b>之後每步</b>：新棋子必須與自己的同色棋子<b>角對角</b>相鄰。</li>
<li>同色棋子之間<b>不可邊相鄰</b>（不同色則不限）。</li>
<li>無法放置時可選擇跳過。</li>
</ul>
<h3>🏆 計分</h3>
<ul>
<li>每個未放置的方格 = -1 分</li>
<li>全部放完 = +15 分（額外加分）</li>
</ul>
<h3>🎮 操作</h3>
<ul>
<li>點選棋子 → 預覽區顯示 → 拖曳至棋盤或點擊放置</li>
<li>↻ 旋轉 / ⇕ 左右翻轉 / ⇔ 上下翻轉</li>
<li>快捷鍵：R 旋轉 / F 左右翻 / V 上下翻 / Esc 取消</li>
</ul>`,
        "draw-guess": `<h2>🎨 你畫我猜 遊戲教學</h2>
<h3>🎯 目標</h3><p>畫家畫出題目，其他人猜出答案得分。</p>
<h3>👥 人數</h3><p>2-8 人。</p>
<h3>📏 規則</h3>
<ul>
<li>每輪由一位玩家擔任<b>畫家</b>，從 3 個題目中選 1 個。</li>
<li>畫家在畫布上畫圖，<b>不可寫字</b>。</li>
<li>其他玩家在聊天區輸入猜測，猜對即得分。</li>
<li>每輪限時 90 秒。</li>
<li>越早猜對分數越高（最高 30 分）。</li>
<li>畫家每有人猜對也得 10 分。</li>
<li>所有人輪流畫完即結束，最高分者獲勝。</li>
</ul>
<h3>🎮 操作</h3>
<ul>
<li>畫家：選色、調筆寬、在畫布上繪圖、🗑 清除</li>
<li>猜題者：在聊天區輸入答案，按 Enter 送出</li>
</ul>`,
        "cant-stop": `<h2>🎲 Can't Stop 遊戲教學</h2>
<h3>🎯 目標</h3><p>率先攻佔 3 個欄位頂端獲勝。</p>
<h3>👥 人數</h3><p>2-4 人。</p>
<h3>📏 規則</h3>
<ul>
<li>棋盤有 11 個欄位（2~12），每欄高度不同（7 最高 13 格）。</li>
<li>擲 4 顆骰子，分成 2 組配對，每組相加得到欄位號碼。</li>
<li>每回合最多使用 <b>3 個臨時標記</b>。</li>
<li>選好配對後，可選擇：
  <ul>
  <li>🎲 <b>繼續擲</b>：冒險推進，但若配對無法前進則<b>爆炸</b>💥，失去本回合所有進度。</li>
  <li>✋ <b>停止</b>：鎖定本回合進度。</li>
  </ul>
</li>
<li>標記到達欄位頂端 = 攻佔該欄位。</li>
<li>已被攻佔的欄位不可再使用。</li>
</ul>`,
        "liars-dice": `<h2>🎭 吹牛骰子 遊戲教學</h2>
<h3>🎯 目標</h3><p>透過喊注與質疑淘汰對手，成為最後存活者。</p>
<h3>👥 人數</h3><p>2-6 人，每人 5 顆骰子。</p>
<h3>📏 規則</h3>
<ul>
<li>每輪開始，所有人搖骰子，<b>只能看自己的</b>。</li>
<li><b>1 點是百搭</b>，算作任何點數。</li>
<li>輪流喊注「全場至少有 X 個 Y 點」（Y 為 2~6）。</li>
<li>下一位必須<b>加碼</b>（數量更多，或同數量但點數更大）或<b>質疑</b>。</li>
<li>質疑時開骰，統計全場 Y 點 + 1 點的總數：
  <ul>
  <li>≥ 喊注數量 → 質疑者輸，扣 1 顆骰子</li>
  <li>＜ 喊注數量 → 喊注者輸，扣 1 顆骰子</li>
  </ul>
</li>
<li>骰子歸零的玩家被淘汰。</li>
</ul>
<h3>💡 策略</h3>
<ul>
<li>觀察自己的骰子推算全場數量</li>
<li>大膽喊注可逼對手質疑或犯錯</li>
<li>注意場上剩餘骰子總數</li>
</ul>`,
    },
    "en": {
        blokus: `<h2>🟦 Blokus — How to Play</h2>
<h3>🎯 Goal</h3><p>Place as many of your pieces on the 20×20 board as possible.</p>
<h3>👥 Players</h3><p>2 (each controls 2 colors), 3, or 4 players.</p>
<h3>🧩 Pieces</h3><p>21 unique polyomino shapes per color (1-5 squares each).</p>
<h3>📏 Rules</h3>
<ul>
<li><b>First move</b>: Must cover any available corner.</li>
<li><b>After that</b>: New pieces must touch your own color <b>diagonally</b> (corner-to-corner).</li>
<li>Same-color pieces must <b>never</b> touch edge-to-edge.</li>
<li>Pass if you can't place any piece.</li>
</ul>
<h3>🏆 Scoring</h3>
<ul><li>-1 point per remaining square</li><li>+15 bonus for placing all pieces</li></ul>
<h3>🎮 Controls</h3>
<ul><li>Select piece → drag to board or click to place</li><li>R rotate / F flip H / V flip V / Esc cancel</li></ul>`,
        "draw-guess": `<h2>🎨 Draw & Guess — How to Play</h2>
<h3>🎯 Goal</h3><p>The artist draws, others guess the word for points.</p>
<h3>👥 Players</h3><p>2-8 players.</p>
<h3>📏 Rules</h3>
<ul>
<li>Each round, one player is the <b>artist</b> and picks a word from 3 choices.</li>
<li>The artist draws on canvas — <b>no writing allowed</b>.</li>
<li>Others type guesses in chat. Correct = points.</li>
<li>90 seconds per round. Earlier guesses = more points (up to 30).</li>
<li>Artist gets 10 points per correct guesser.</li>
<li>Highest score after all rounds wins.</li>
</ul>`,
        "cant-stop": `<h2>🎲 Can't Stop — How to Play</h2>
<h3>🎯 Goal</h3><p>Be the first to claim 3 columns.</p>
<h3>👥 Players</h3><p>2-4 players.</p>
<h3>📏 Rules</h3>
<ul>
<li>Board has 11 columns (2-12), each with different heights (7 is tallest at 13).</li>
<li>Roll 4 dice, split into 2 pairs — each sum = a column number.</li>
<li>Max <b>3 temporary markers</b> per turn.</li>
<li>After each roll, choose:
  <ul>
  <li>🎲 <b>Continue</b>: Roll again, but if no valid pair → <b>Bust!</b> 💥 Lose all progress this turn.</li>
  <li>✋ <b>Stop</b>: Lock in your progress.</li>
  </ul>
</li>
<li>Reach the top of a column = claim it. Claimed columns are closed.</li>
</ul>`,
        "liars-dice": `<h2>🎭 Liar's Dice — How to Play</h2>
<h3>🎯 Goal</h3><p>Be the last player standing by bluffing and challenging.</p>
<h3>👥 Players</h3><p>2-6 players, 5 dice each.</p>
<h3>📏 Rules</h3>
<ul>
<li>All players roll dice — you can only see <b>your own</b>.</li>
<li><b>1s are wild</b> — they count as any face value.</li>
<li>Take turns bidding "at least X dice showing Y" (Y = 2-6).</li>
<li>Next player must <b>raise</b> (higher quantity, or same quantity + higher face) or <b>challenge</b>.</li>
<li>On challenge, reveal all dice and count Y's + 1s:
  <ul>
  <li>≥ bid → Challenger loses a die</li>
  <li>< bid → Bidder loses a die</li>
  </ul>
</li>
<li>Player with 0 dice is eliminated. Last one standing wins!</li>
</ul>
<h3>💡 Strategy</h3>
<ul><li>Use your dice to estimate the total</li><li>Bold bids force tough decisions</li><li>Watch the total dice count</li></ul>`,
    },
    "ja": {
        blokus: `<h2>🟦 Blokus — 遊び方</h2>
<h3>🎯 目的</h3><p>20×20のボードにできるだけ多くのピースを配置する。</p>
<h3>👥 人数</h3><p>2人（各2色）、3人、または4人。</p>
<h3>🧩 ピース</h3><p>各色21種のポリオミノ（1〜5マス）。</p>
<h3>📏 ルール</h3>
<ul>
<li><b>最初の一手</b>：空いている角に配置。</li>
<li><b>以降</b>：同色のピースと<b>角で接する</b>必要あり。</li>
<li>同色のピース同士は<b>辺で接してはいけない</b>。</li>
<li>置けない場合はパス。</li>
</ul>
<h3>🏆 スコア</h3><ul><li>残りマス1つにつき-1点</li><li>全部置けたら+15点</li></ul>
<h3>🎮 操作</h3><ul><li>ピース選択→ドラッグで配置</li><li>R回転 / F左右反転 / V上下反転 / Escキャンセル</li></ul>`,
        "draw-guess": `<h2>🎨 お絵描きクイズ — 遊び方</h2>
<h3>🎯 目的</h3><p>描く人が絵を描き、他の人が当ててポイント獲得。</p>
<h3>👥 人数</h3><p>2〜8人。</p>
<h3>📏 ルール</h3>
<ul>
<li>毎ラウンド1人が<b>描く役</b>、3つのお題から1つ選択。</li>
<li>キャンバスに絵を描く（<b>文字禁止</b>）。</li>
<li>他の人はチャットで回答。正解でポイント獲得。</li>
<li>各ラウンド90秒。早く当てるほど高得点（最大30点）。</li>
<li>全員が描いた後、最高得点者の勝利。</li>
</ul>`,
        "cant-stop": `<h2>🎲 Can't Stop — 遊び方</h2>
<h3>🎯 目的</h3><p>3つの列を最初に制覇した人の勝利。</p>
<h3>👥 人数</h3><p>2〜4人。</p>
<h3>📏 ルール</h3>
<ul>
<li>ボードに11列（2〜12）。各列の高さは異なる（7が最長13マス）。</li>
<li>4つのサイコロを振り、2組に分ける。各組の合計＝列番号。</li>
<li>1ターン最大<b>3つの仮マーカー</b>。</li>
<li>振った後の選択：
  <ul>
  <li>🎲 <b>続ける</b>：再度振るが、有効なペアがなければ<b>バースト</b>💥（進捗全失）</li>
  <li>✋ <b>ストップ</b>：進捗を確定</li>
  </ul>
</li>
<li>列の頂上に到達＝制覇。制覇された列は使用不可。</li>
</ul>`,
        "liars-dice": `<h2>🎭 ライアーズダイス — 遊び方</h2>
<h3>🎯 目的</h3><p>ブラフとチャレンジで相手を脱落させ、最後に残る。</p>
<h3>👥 人数</h3><p>2〜6人、各5個のサイコロ。</p>
<h3>📏 ルール</h3>
<ul>
<li>全員がサイコロを振り、<b>自分のだけ</b>確認。</li>
<li><b>1はワイルド</b>（どの出目としてもカウント）。</li>
<li>順番に「場に最低X個のYがある」と宣言（Y＝2〜6）。</li>
<li>次の人は<b>上乗せ</b>か<b>チャレンジ</b>。</li>
<li>チャレンジ時、全サイコロ公開：
  <ul>
  <li>≧宣言→チャレンジャーがサイコロ1個失う</li>
  <li>＜宣言→宣言者がサイコロ1個失う</li>
  </ul>
</li>
<li>サイコロ0個で脱落。最後の1人が勝利！</li>
</ul>
<h3>💡 戦略</h3><ul><li>自分のサイコロから全体を推測</li><li>大胆な宣言で相手を追い込む</li></ul>`,
    },
};

function showHelp(gameType) {
    const content = (HELP[currentLang] && HELP[currentLang][gameType]) || HELP["zh-TW"][gameType] || '';
    if (!content) return;
    let overlay = document.getElementById('helpOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'helpOverlay';
        overlay.className = 'help-overlay';
        overlay.addEventListener('click', e => { if (e.target === overlay) closeHelp(); });
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="help-card">
        <button class="help-close" onclick="closeHelp()">✕</button>
        <div class="help-body">${content}</div>
    </div>`;
    overlay.style.display = 'flex';
}

function closeHelp() {
    const overlay = document.getElementById('helpOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Auto-apply on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    applyI18n();
    const sel = document.getElementById('langLabel');
    if (sel) sel.textContent = LANG_LABELS[currentLang];
});
