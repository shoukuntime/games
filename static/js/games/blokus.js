/* Blokus game client */
const CELL = 28;
const BOARD = 20;
const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CELL * BOARD + 1;
canvas.height = CELL * BOARD + 1;

let ws, state = null;
let selectedPiece = null;
let currentOrientation = 0;
let previewCells = [];
let mouseCell = null;

const COLORS = ['#3b82f6', '#eab308', '#ef4444', '#22c55e'];
const COLORS_LIGHT = ['#93bbfd', '#fde047', '#fca5a5', '#86efac'];

function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/${ROOM_ID}`);
    ws.onmessage = e => handleMessage(JSON.parse(e.data));
    ws.onclose = () => setTimeout(connect, 2000);
}

function handleMessage(msg) {
    if (msg.type === 'game_state') {
        state = msg.data;
        render();
    } else if (msg.type === 'error') {
        showMessage(msg.message, 'lose');
    } else if (msg.type === 'game_event') {
        const d = msg.data;
        if (d.event === 'game_over') {
            const scores = d.scores.sort((a, b) => b.score - a.score);
            showMessage(`🎉 遊戲結束！冠軍：${scores[0].name} (${scores[0].score}分)`, 'win');
        }
    }
}

function render() {
    if (!state) return;
    drawBoard();
    drawPlayers();
    drawPieces();
    updateTurnInfo();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    for (let r = 0; r < BOARD; r++) {
        for (let c = 0; c < BOARD; c++) {
            const v = state.board[r][c];
            ctx.fillStyle = v > 0 ? COLORS[v - 1] : '#f8fafc';
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
        }
    }
    // Draw corners
    const corners = [[0,0],[0,19],[19,19],[19,0]];
    corners.forEach((co, i) => {
        if (i < state.players.length) {
            ctx.fillStyle = COLORS_LIGHT[i];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(co[1] * CELL, co[0] * CELL, CELL, CELL);
            ctx.globalAlpha = 1;
        }
    });
    // Draw preview
    if (previewCells.length > 0 && isMyTurn()) {
        const valid = validatePreview();
        previewCells.forEach(([r, c]) => {
            if (r >= 0 && r < BOARD && c >= 0 && c < BOARD) {
                ctx.fillStyle = valid ? COLORS[state.my_index] : '#f87171';
                ctx.globalAlpha = 0.4;
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
                ctx.globalAlpha = 1;
            }
        });
    }
}

function validatePreview() {
    for (const [r, c] of previewCells) {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return false;
        if (state.board[r][c] !== 0) return false;
    }
    return true;
}

function drawPlayers() {
    const panel = document.getElementById('playersPanel');
    panel.innerHTML = state.players.map((p, i) => `
        <div class="player-info ${i === state.current_turn ? 'active' : ''}" style="border-left: 4px solid ${COLORS[i]}">
            <strong>${p.name}${i === state.my_index ? ' (你)' : ''}</strong>
            <div>剩餘 ${p.remaining.length} 塊 | 分數 ${p.score}</div>
            ${p.passed ? '<div class="text-muted">已跳過</div>' : ''}
        </div>
    `).join('');
}

function drawPieces() {
    if (state.my_index < 0) return;
    const panel = document.getElementById('piecesPanel');
    const remaining = state.players[state.my_index].remaining;
    panel.innerHTML = remaining.map(name => {
        const cells = state.pieces[name];
        const maxR = Math.max(...cells.map(c => c[0])) + 1;
        const maxC = Math.max(...cells.map(c => c[1])) + 1;
        const s = 12;
        return `<div class="piece-item ${selectedPiece === name ? 'selected' : ''}"
                     onclick="selectPiece('${name}')" title="${name}">
            <svg width="${maxC * s + 2}" height="${maxR * s + 2}" viewBox="0 0 ${maxC * s + 2} ${maxR * s + 2}">
                ${cells.map(([r, c]) =>
                    `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" fill="${COLORS[state.my_index]}" stroke="#fff" stroke-width="1"/>`
                ).join('')}
            </svg>
            <span class="piece-name">${name}</span>
        </div>`;
    }).join('');
}

function selectPiece(name) {
    selectedPiece = name;
    currentOrientation = 0;
    updatePreview();
    drawPieces();
}

function rotatePiece() {
    if (!selectedPiece || !state) return;
    const oris = state.piece_orientations[selectedPiece];
    currentOrientation = (currentOrientation + 1) % oris.length;
    updatePreview();
    drawBoard();
}

function flipPiece() {
    if (!selectedPiece || !state) return;
    const oris = state.piece_orientations[selectedPiece];
    // Jump to a different orientation group
    currentOrientation = (currentOrientation + Math.floor(oris.length / 2)) % oris.length;
    updatePreview();
    drawBoard();
}

function updatePreview() {
    if (!selectedPiece || !mouseCell || !state) {
        previewCells = [];
        return;
    }
    const oris = state.piece_orientations[selectedPiece];
    const ori = oris[currentOrientation];
    const [mr, mc] = mouseCell;
    previewCells = ori.map(([r, c]) => [r + mr, c + mc]);
}

function isMyTurn() {
    return state && state.my_index === state.current_turn && !state.game_over;
}

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / CELL);
    const r = Math.floor((e.clientY - rect.top) / CELL);
    if (r >= 0 && r < BOARD && c >= 0 && c < BOARD) {
        mouseCell = [r, c];
        updatePreview();
        drawBoard();
    }
});

canvas.addEventListener('mouseleave', () => {
    mouseCell = null;
    previewCells = [];
    drawBoard();
});

canvas.addEventListener('click', () => {
    if (!isMyTurn() || !selectedPiece || previewCells.length === 0) return;
    ws.send(JSON.stringify({
        type: 'place_piece',
        piece: selectedPiece,
        cells: previewCells,
    }));
});

function passTurn() {
    if (!isMyTurn()) return;
    ws.send(JSON.stringify({ type: 'pass' }));
}

function updateTurnInfo() {
    const el = document.getElementById('turnInfo');
    if (state.game_over) {
        el.textContent = '遊戲結束';
        el.className = 'turn-info';
    } else {
        const p = state.players[state.current_turn];
        el.innerHTML = isMyTurn()
            ? `<strong style="color:${COLORS[state.my_index]}">輪到你了！</strong> 選擇棋子放置`
            : `等待 <strong>${p.name}</strong> 操作...`;
    }
}

function showMessage(text, cls) {
    const el = document.getElementById('gameMessage');
    el.textContent = text;
    el.className = `game-message ${cls || ''}`;
}

connect();
