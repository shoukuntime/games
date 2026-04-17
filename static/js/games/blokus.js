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
let lockedCells = null;
let lockedAnchor = null;

// Drag state
let isDragging = false;
let dragGhost = null;

const COLORS = ['#3b82f6', '#eab308', '#ef4444', '#22c55e'];
const COLORS_LIGHT = ['#93bbfd', '#fde047', '#fca5a5', '#86efac'];
const PREVIEW_CELL = 22;

// --- WebSocket ---
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
        if (d.event === 'piece_placed') {
            lockedCells = null;
            lockedAnchor = null;
            selectedPiece = null;
            document.getElementById('confirmBar').style.display = 'none';
        } else if (d.event === 'game_over') {
            const scores = d.scores.sort((a, b) => b.score - a.score);
            showMessage(`🎉 遊戲結束！冠軍：${scores[0].name} (${scores[0].score}分)`, 'win');
        }
    }
}

// --- Render ---
function render() {
    if (!state) return;
    drawBoard();
    drawPlayers();
    drawPiecesPanel();
    drawPreview();
    updateTurnInfo();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < BOARD; r++) {
        for (let c = 0; c < BOARD; c++) {
            const v = state.board[r][c];
            ctx.fillStyle = v > 0 ? COLORS[v - 1] : '#f8fafc';
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
        }
    }
    // Starting corners
    const corners = [[0,0],[0,19],[19,19],[19,0]];
    corners.forEach((co, i) => {
        if (i < state.players.length) {
            ctx.fillStyle = COLORS_LIGHT[i];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(co[1] * CELL, co[0] * CELL, CELL, CELL);
            ctx.globalAlpha = 1;
        }
    });

    if (!isMyTurn()) return;

    // Locked placement (confirm/cancel)
    if (lockedCells) {
        drawCellsOnBoard(lockedCells, 0.6, true);
        return;
    }
    // Drag/hover preview
    if (previewCells.length > 0) {
        drawCellsOnBoard(previewCells, 0.35, false);
    }
}

function drawCellsOnBoard(cells, alpha, border) {
    const valid = validateCells(cells);
    cells.forEach(([r, c]) => {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return;
        ctx.fillStyle = valid ? COLORS[state.my_index] : '#f87171';
        ctx.globalAlpha = alpha;
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        ctx.globalAlpha = 1;
        if (border) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.lineWidth = 1;
        }
    });
}

function validateCells(cells) {
    for (const [r, c] of cells) {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return false;
        if (state.board[r][c] !== 0) return false;
    }
    return true;
}

function drawPlayers() {
    document.getElementById('playersPanel').innerHTML = state.players.map((p, i) => `
        <div class="player-info ${i === state.current_turn ? 'active' : ''}" style="border-left: 4px solid ${COLORS[i]}">
            <strong>${p.name}${i === state.my_index ? ' (你)' : ''}</strong>
            <div>剩餘 ${p.remaining.length} 塊 | ${p.score} 分</div>
            ${p.passed ? '<div class="text-muted">已跳過</div>' : ''}
        </div>
    `).join('');
}

// --- Piece Panel ---
function drawPiecesPanel() {
    if (state.my_index < 0) return;
    const panel = document.getElementById('piecesPanel');
    const remaining = state.players[state.my_index].remaining;
    const s = 10;
    panel.innerHTML = remaining.map(name => {
        const cells = state.pieces[name];
        const maxR = Math.max(...cells.map(c => c[0])) + 1;
        const maxC = Math.max(...cells.map(c => c[1])) + 1;
        return `<div class="piece-item ${selectedPiece === name ? 'selected' : ''}"
                     onclick="selectPiece('${name}')">
            <svg width="${maxC * s + 2}" height="${maxR * s + 2}" viewBox="0 0 ${maxC * s + 2} ${maxR * s + 2}">
                ${cells.map(([r, c]) =>
                    `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" fill="${COLORS[state.my_index]}" stroke="#fff" stroke-width="0.5"/>`
                ).join('')}
            </svg>
        </div>`;
    }).join('');
}

// --- Selected Piece Preview ---
function drawPreview() {
    const area = document.getElementById('previewArea');
    if (!selectedPiece || !state || state.my_index < 0) {
        area.innerHTML = '<div class="preview-hint">選擇棋子</div>';
        return;
    }
    const svg = buildPieceSVG(selectedPiece, currentOrientation, PREVIEW_CELL);
    area.innerHTML = `<div class="preview-piece" id="previewPiece">${svg}</div>
        <div class="preview-drag-hint">拖曳至棋盤放置</div>`;

    // Attach drag events on the preview piece
    const el = document.getElementById('previewPiece');
    el.addEventListener('mousedown', onPreviewMouseDown);
    el.addEventListener('touchstart', onPreviewTouchStart, { passive: false });
}

function buildPieceSVG(name, oriIdx, cellSize) {
    const oris = state.piece_orientations[name];
    const ori = oris[oriIdx % oris.length];
    const maxR = Math.max(...ori.map(c => c[0])) + 1;
    const maxC = Math.max(...ori.map(c => c[1])) + 1;
    const s = cellSize;
    return `<svg width="${maxC * s + 2}" height="${maxR * s + 2}" viewBox="0 0 ${maxC * s + 2} ${maxR * s + 2}" class="preview-svg">
        ${ori.map(([r, c]) =>
            `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" rx="2"
                   fill="${COLORS[state.my_index]}" stroke="#fff" stroke-width="1.5"/>`
        ).join('')}
    </svg>`;
}

// --- Piece Selection ---
function selectPiece(name) {
    if (lockedCells) return;
    selectedPiece = name;
    currentOrientation = 0;
    previewCells = [];
    drawPiecesPanel();
    drawPreview();
}

function rotatePiece() {
    if (!selectedPiece || !state) return;
    const oris = state.piece_orientations[selectedPiece];
    currentOrientation = (currentOrientation + 1) % oris.length;
    applyOrientationChange();
}

function flipPiece() {
    if (!selectedPiece || !state) return;
    const oris = state.piece_orientations[selectedPiece];
    currentOrientation = (currentOrientation + Math.floor(oris.length / 2)) % oris.length;
    applyOrientationChange();
}

function applyOrientationChange() {
    if (lockedCells && lockedAnchor) {
        const oris = state.piece_orientations[selectedPiece];
        const ori = oris[currentOrientation % oris.length];
        lockedCells = ori.map(([r, c]) => [r + lockedAnchor[0], c + lockedAnchor[1]]);
    }
    drawPreview();
    updateHoverPreview();
    drawBoard();
}

function updateHoverPreview() {
    if (!selectedPiece || !mouseCell || !state || lockedCells) {
        if (!lockedCells) previewCells = [];
        return;
    }
    const oris = state.piece_orientations[selectedPiece];
    const ori = oris[currentOrientation % oris.length];
    const [mr, mc] = mouseCell;
    previewCells = ori.map(([r, c]) => [r + mr, c + mc]);
}

function isMyTurn() {
    return state && state.my_index === state.current_turn && !state.game_over;
}

// --- Drag from preview ---
function onPreviewMouseDown(e) {
    if (!selectedPiece || !isMyTurn() || lockedCells) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
}

function onPreviewTouchStart(e) {
    if (!selectedPiece || !isMyTurn() || lockedCells) return;
    e.preventDefault();
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
}

function startDrag(x, y) {
    isDragging = true;
    canvas.classList.add('drop-target');
    // Create ghost
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';
    dragGhost.innerHTML = buildPieceSVG(selectedPiece, currentOrientation, 20);
    document.body.appendChild(dragGhost);
    positionGhost(x, y);
}

function positionGhost(x, y) {
    if (!dragGhost) return;
    const ghostRect = dragGhost.getBoundingClientRect();
    dragGhost.style.left = (x - ghostRect.width / 2) + 'px';
    dragGhost.style.top = (y - ghostRect.height / 2) + 'px';
}

function endDrag(x, y) {
    isDragging = false;
    canvas.classList.remove('drop-target');
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    // Check if dropped on board
    const rect = canvas.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const c = Math.floor((x - rect.left) / CELL);
        const r = Math.floor((y - rect.top) / CELL);
        mouseCell = [r, c];
        updateHoverPreview();
        if (previewCells.length > 0 && validateCells(previewCells)) {
            lockPlacement();
        }
    }
    previewCells = [];
    drawBoard();
}

// Global mouse/touch events for drag
document.addEventListener('mousemove', e => {
    if (isDragging) {
        positionGhost(e.clientX, e.clientY);
        updateBoardFromPointer(e.clientX, e.clientY);
    } else if (!lockedCells && selectedPiece) {
        // Normal hover preview on board
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX, y = e.clientY;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            const c = Math.floor((x - rect.left) / CELL);
            const r = Math.floor((y - rect.top) / CELL);
            mouseCell = [r, c];
            updateHoverPreview();
            drawBoard();
        }
    }
});

document.addEventListener('mouseup', e => {
    if (isDragging) endDrag(e.clientX, e.clientY);
});

document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    positionGhost(t.clientX, t.clientY);
    updateBoardFromPointer(t.clientX, t.clientY);
}, { passive: false });

document.addEventListener('touchend', e => {
    if (!isDragging) return;
    const t = e.changedTouches[0];
    endDrag(t.clientX, t.clientY);
});

function updateBoardFromPointer(x, y) {
    const rect = canvas.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const c = Math.floor((x - rect.left) / CELL);
        const r = Math.floor((y - rect.top) / CELL);
        mouseCell = [r, c];
        updateHoverPreview();
        drawBoard();
    } else {
        previewCells = [];
        drawBoard();
    }
}

// Board click (alternative to drag)
canvas.addEventListener('mouseleave', () => {
    if (lockedCells || isDragging) return;
    mouseCell = null;
    previewCells = [];
    drawBoard();
});

canvas.addEventListener('click', () => {
    if (lockedCells || isDragging) return;
    if (previewCells.length > 0 && validateCells(previewCells)) {
        lockPlacement();
    }
});

// --- Lock / Confirm / Cancel ---
function lockPlacement() {
    if (!isMyTurn() || !selectedPiece || previewCells.length === 0) return;
    lockedCells = [...previewCells];
    lockedAnchor = mouseCell ? [...mouseCell] : null;
    document.getElementById('confirmBar').style.display = 'flex';
    drawBoard();
}

function confirmPlace() {
    if (!lockedCells || !selectedPiece) return;
    ws.send(JSON.stringify({
        type: 'place_piece',
        piece: selectedPiece,
        cells: lockedCells,
    }));
}

function cancelPlace() {
    lockedCells = null;
    lockedAnchor = null;
    document.getElementById('confirmBar').style.display = 'none';
    drawBoard();
}

function passTurn() {
    if (!isMyTurn()) return;
    ws.send(JSON.stringify({ type: 'pass' }));
}

// --- UI Helpers ---
function updateTurnInfo() {
    const el = document.getElementById('turnInfo');
    if (state.game_over) {
        el.textContent = '遊戲結束';
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

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') rotatePiece();
    if (e.key === 'f' || e.key === 'F') flipPiece();
    if (e.key === 'Escape') cancelPlace();
});

connect();
