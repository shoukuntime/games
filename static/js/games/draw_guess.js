/* Draw & Guess game client — LLM-judged multilingual */
let ws, state = null;
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/${ROOM_ID}`);
    ws.onmessage = e => handleMessage(JSON.parse(e.data));
    ws.onclose = () => setTimeout(connect, 2000);
}

function handleMessage(msg) {
    if (msg.type === 'game_state') { state = msg.data; renderState(); }
    else if (msg.type === 'draw_stroke' && msg.data) drawStroke(msg.data);
    else if (msg.type === 'clear_canvas') ctx.clearRect(0, 0, canvas.width, canvas.height);
    else if (msg.type === 'timer') updateTimer(msg.data.time_left);
    else if (msg.type === 'game_event') handleGameEvent(msg.data);
    else if (msg.type === 'error') addChat('⚠', msg.message, 'error');
}

function handleGameEvent(d) {
    if (d.event === 'guess_result') {
        // Private: only guesser + drawer see this
        const icon = d.correct ? '✅' : '❌';
        const scoreText = d.correct ? ` (+${d.points})` : '';
        const cls = d.correct ? 'correct' : 'wrong-guess';
        addChat(icon, `${d.player}: "${d.text}" — ${t('dg.llm_score')}: ${d.llm_score}/100${scoreText}`, cls);
    } else if (d.event === 'correct_guess') {
        addChat('🎉', t('dg.correct', {name: d.player, score: d.score}), 'correct');
    } else if (d.event === 'round_end') {
        addChat('📢', t('dg.answer_reveal', {word: d.word}), 'system');
    } else if (d.event === 'game_over') {
        const ranking = d.ranking.map((r, i) => `${i+1}. ${r.name}: ${r.score}`).join('\n');
        addChat('🏆', `${t('dg.game_over')}\n${ranking}`, 'system');
    } else if (d.event === 'drawing_started') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('chatMessages').innerHTML = '';
    }
}

function renderState() {
    if (!state) return;
    // Scoreboard
    document.getElementById('scoreBoard').innerHTML = state.players.map(p =>
        `<div class="score-row ${p.name===state.current_drawer?'drawer':''}">
            <span>${p.name===state.current_drawer?'🎨 ':''}${p.name}</span>
            <strong>${p.score}</strong>
        </div>`
    ).join('');
    document.getElementById('roundNum').textContent = state.round;
    document.getElementById('maxRounds').textContent = state.max_rounds;

    // Mobile bar
    const mb = document.getElementById('dgMobilePlayers');
    if (mb) mb.innerHTML = state.players.map(p =>
        `<span class="mp-chip ${p.name===state.current_drawer?'active':''}">
            ${p.name===state.current_drawer?'🎨 ':''}${p.name}: ${p.score}
        </span>`
    ).join('');

    const info = document.getElementById('phaseInfo');
    const wordDiv = document.getElementById('wordChoices');
    const tools = document.getElementById('drawTools');
    wordDiv.style.display = 'none';
    tools.style.display = 'none';

    if (state.phase === 'waiting') {
        if (state.is_drawer) {
            info.innerHTML = `<strong>${t('dg.you_draw')}</strong>`;
            wordDiv.style.display = 'block';
            wordDiv.innerHTML = `<button class="btn btn-primary" onclick="requestWords()">${t('dg.get_words')}</button>`;
        } else {
            info.innerHTML = t('dg.wait_choose', {name: state.current_drawer});
        }
    } else if (state.phase === 'choosing') {
        if (state.is_drawer && state.word_choices.length > 0) {
            info.innerHTML = `<strong>${t('dg.choose_word')}</strong>`;
            wordDiv.style.display = 'block';
            wordDiv.innerHTML = state.word_choices.map((w, i) =>
                `<button class="btn btn-primary word-btn" onclick="chooseWord(${i})">
                    <span class="word-main">${w.zh}</span>
                    <span class="word-sub">${w.en} / ${w.ja}</span>
                </button>`
            ).join('');
        } else if (state.is_drawer) {
            info.innerHTML = t('dg.generating');
        } else {
            info.innerHTML = t('dg.wait_choose', {name: state.current_drawer});
        }
    } else if (state.phase === 'drawing') {
        if (state.is_drawer) {
            info.innerHTML = `${t('dg.drawing')}<strong>${state.word}</strong>`;
            tools.style.display = 'flex';
        } else {
            const guessed = state.guessed_correctly.includes(USERNAME);
            info.innerHTML = guessed
                ? `✅ ${t('dg.you_guessed')}`
                : `${t('dg.drawing_other', {name: state.current_drawer})}${state.word}`;
        }
        updateTimer(state.time_left);
    } else if (state.phase === 'round_end') {
        info.innerHTML = `${t('dg.round_end')}<strong>${state.word || ''}</strong>`;
        wordDiv.style.display = 'block';
        wordDiv.innerHTML = `<button class="btn btn-primary" onclick="nextRound()">${t('dg.next_round')}</button>`;
    } else if (state.phase === 'game_over') {
        info.innerHTML = t('dg.game_over');
    }

    // Redraw strokes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.strokes) state.strokes.forEach(s => drawStroke(s));

    // Disable guess for drawer or if already guessed
    const guessInput = document.getElementById('guessInput');
    const guessed = state.guessed_correctly?.includes(USERNAME);
    guessInput.disabled = state.is_drawer || state.phase !== 'drawing' || guessed;
    if (guessed) guessInput.placeholder = '✅';
}

function updateTimer(timeLeft) {
    const fill = document.getElementById('timerFill');
    const pct = Math.max(0, (timeLeft / 90) * 100);
    fill.style.width = pct + '%';
    fill.style.background = pct < 20 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
}

// --- Drawing ---
function drawStroke(stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;
    ctx.strokeStyle = stroke.color || '#000';
    ctx.lineWidth = stroke.width || 4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
    for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
    ctx.stroke();
}

let currentStroke = null;

function getCanvasXY(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return [(clientX - rect.left) * (canvas.width / rect.width), (clientY - rect.top) * (canvas.height / rect.height)];
}

canvas.addEventListener('mousedown', e => { startDraw(e); });
canvas.addEventListener('mousemove', e => { continueDraw(e); });
canvas.addEventListener('mouseup', () => { endDraw(); });
canvas.addEventListener('mouseleave', () => { if (drawing) endDraw(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); continueDraw(e); }, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); endDraw(); }, { passive: false });

function startDraw(e) {
    if (!state || !state.is_drawer || state.phase !== 'drawing') return;
    drawing = true;
    const [x, y] = getCanvasXY(e);
    currentStroke = { color: document.getElementById('penColor').value, width: parseInt(document.getElementById('penSize').value), points: [[x, y]] };
}
function continueDraw(e) {
    if (!drawing || !currentStroke) return;
    const [x, y] = getCanvasXY(e);
    currentStroke.points.push([x, y]);
    const pts = currentStroke.points;
    ctx.strokeStyle = currentStroke.color; ctx.lineWidth = currentStroke.width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[pts.length-2][0], pts[pts.length-2][1]); ctx.lineTo(x, y); ctx.stroke();
}
function endDraw() {
    if (!drawing || !currentStroke) return;
    drawing = false;
    ws.send(JSON.stringify({ type: 'draw', stroke: currentStroke }));
    currentStroke = null;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ type: 'clear_canvas' }));
}

function requestWords() { ws.send(JSON.stringify({ type: 'request_words' })); }
function chooseWord(index) { ws.send(JSON.stringify({ type: 'choose_word', word_index: index })); }
function nextRound() { ws.send(JSON.stringify({ type: 'next_round' })); }

function sendGuess() {
    const input = document.getElementById('guessInput');
    const text = input.value.trim();
    if (!text) return;
    addChat('💬', `${USERNAME}: "${text}"`, 'my-guess');
    ws.send(JSON.stringify({ type: 'guess', text }));
    input.value = '';
}

document.getElementById('guessInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendGuess(); });

function addChat(icon, text, cls = '') {
    const el = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${cls}`;
    div.innerHTML = `<strong>${icon}</strong> ${text}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
}

connect();
