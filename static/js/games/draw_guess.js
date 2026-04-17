/* Draw & Guess game client */
let ws, state = null;
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let lastX = 0, lastY = 0;

function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/${ROOM_ID}`);
    ws.onmessage = e => handleMessage(JSON.parse(e.data));
    ws.onclose = () => setTimeout(connect, 2000);
}

function handleMessage(msg) {
    if (msg.type === 'game_state') {
        state = msg.data;
        renderState();
    } else if (msg.type === 'draw_stroke' && msg.data) {
        drawStroke(msg.data);
    } else if (msg.type === 'clear_canvas') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (msg.type === 'timer') {
        updateTimer(msg.data.time_left);
    } else if (msg.type === 'game_event') {
        handleGameEvent(msg.data);
    } else if (msg.type === 'error') {
        addChat('系統', msg.message, 'error');
    }
}

function handleGameEvent(d) {
    if (d.event === 'correct_guess') {
        addChat('✅', `${d.player} 猜對了！(+${d.score}分)`, 'correct');
    } else if (d.event === 'guess') {
        addChat(d.player, d.text);
    } else if (d.event === 'round_end') {
        addChat('📢', `答案是：${d.word}`, 'system');
    } else if (d.event === 'game_over') {
        const ranking = d.ranking.map((r, i) => `${i + 1}. ${r.name}: ${r.score}分`).join('\n');
        addChat('🏆', `遊戲結束！\n${ranking}`, 'system');
    } else if (d.event === 'drawing_started') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function renderState() {
    if (!state) return;
    // Score board
    document.getElementById('scoreBoard').innerHTML = state.players.map(p =>
        `<div class="score-row ${p.name === state.current_drawer ? 'drawer' : ''}">
            <span>${p.name === state.current_drawer ? '🎨 ' : ''}${p.name}</span>
            <strong>${p.score}</strong>
        </div>`
    ).join('');

    document.getElementById('roundNum').textContent = state.round;
    document.getElementById('maxRounds').textContent = state.max_rounds;

    const info = document.getElementById('phaseInfo');
    const wordDiv = document.getElementById('wordChoices');
    const tools = document.getElementById('drawTools');

    wordDiv.style.display = 'none';
    tools.style.display = 'none';

    if (state.phase === 'waiting') {
        if (state.is_drawer) {
            info.innerHTML = '<strong>你是畫家！</strong> 點擊下方按鈕取得題目';
            wordDiv.style.display = 'block';
            wordDiv.innerHTML = '<button class="btn btn-primary" onclick="requestWords()">🎲 取得題目</button>';
        } else {
            info.innerHTML = `等待 <strong>${state.current_drawer}</strong> 選擇題目...`;
        }
    } else if (state.phase === 'choosing') {
        if (state.is_drawer && state.word_choices.length > 0) {
            info.innerHTML = '<strong>選擇一個題目：</strong>';
            wordDiv.style.display = 'block';
            wordDiv.innerHTML = state.word_choices.map(w =>
                `<button class="btn btn-primary word-btn" onclick="chooseWord('${w}')">${w}</button>`
            ).join('');
        } else if (state.is_drawer) {
            info.innerHTML = '正在生成題目...';
        } else {
            info.innerHTML = `等待 <strong>${state.current_drawer}</strong> 選擇題目...`;
        }
    } else if (state.phase === 'drawing') {
        if (state.is_drawer) {
            info.innerHTML = `你正在畫：<strong>${state.word}</strong>`;
            tools.style.display = 'flex';
        } else {
            info.innerHTML = `<strong>${state.current_drawer}</strong> 正在畫圖 — 提示：${state.word}`;
        }
        updateTimer(state.time_left);
    } else if (state.phase === 'round_end') {
        info.innerHTML = `回合結束！答案是：<strong>${state.word || ''}</strong>`;
        if (state.is_drawer || true) {
            wordDiv.style.display = 'block';
            wordDiv.innerHTML = '<button class="btn btn-primary" onclick="nextRound()">下一回合</button>';
        }
    } else if (state.phase === 'game_over') {
        info.innerHTML = '🏆 遊戲結束！';
    }

    // Redraw all strokes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.strokes) {
        state.strokes.forEach(s => drawStroke(s));
    }

    // Disable guess input for drawer
    document.getElementById('guessInput').disabled = state.is_drawer || state.phase !== 'drawing';
}

function updateTimer(timeLeft) {
    const fill = document.getElementById('timerFill');
    const pct = Math.max(0, (timeLeft / 90) * 100);
    fill.style.width = pct + '%';
    fill.style.background = pct < 20 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
}

// Drawing
function drawStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color || '#000';
    ctx.lineWidth = stroke.width || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
    for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
    }
    ctx.stroke();
}

let currentStroke = null;

canvas.addEventListener('mousedown', e => {
    if (!state || !state.is_drawer || state.phase !== 'drawing') return;
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    currentStroke = {
        color: document.getElementById('penColor').value,
        width: parseInt(document.getElementById('penSize').value),
        points: [[x, y]],
    };
});

canvas.addEventListener('mousemove', e => {
    if (!drawing || !currentStroke) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    currentStroke.points.push([x, y]);

    // Draw locally
    const pts = currentStroke.points;
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1]);
    ctx.lineTo(x, y);
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => {
    if (!drawing || !currentStroke) return;
    drawing = false;
    ws.send(JSON.stringify({ type: 'draw', stroke: currentStroke }));
    currentStroke = null;
});

canvas.addEventListener('mouseleave', () => {
    if (drawing && currentStroke) {
        ws.send(JSON.stringify({ type: 'draw', stroke: currentStroke }));
        currentStroke = null;
    }
    drawing = false;
});

// Touch support
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (!state || !state.is_drawer || state.phase !== 'drawing') return;
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    const y = (t.clientY - rect.top) * (canvas.height / rect.height);
    currentStroke = {
        color: document.getElementById('penColor').value,
        width: parseInt(document.getElementById('penSize').value),
        points: [[x, y]],
    };
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!drawing || !currentStroke) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    const y = (t.clientY - rect.top) * (canvas.height / rect.height);
    currentStroke.points.push([x, y]);
    const pts = currentStroke.points;
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1]);
    ctx.lineTo(x, y);
    ctx.stroke();
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!drawing || !currentStroke) return;
    drawing = false;
    ws.send(JSON.stringify({ type: 'draw', stroke: currentStroke }));
    currentStroke = null;
}, { passive: false });

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ type: 'clear_canvas' }));
}

function requestWords() {
    ws.send(JSON.stringify({ type: 'request_words' }));
}

function chooseWord(word) {
    ws.send(JSON.stringify({ type: 'choose_word', word }));
}

function nextRound() {
    ws.send(JSON.stringify({ type: 'next_round' }));
}

function sendGuess() {
    const input = document.getElementById('guessInput');
    const text = input.value.trim();
    if (!text) return;
    ws.send(JSON.stringify({ type: 'guess', text }));
    input.value = '';
}

document.getElementById('guessInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendGuess();
});

function addChat(sender, text, cls = '') {
    const el = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${cls}`;
    div.innerHTML = `<strong>${sender}</strong> ${text}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
}

connect();
