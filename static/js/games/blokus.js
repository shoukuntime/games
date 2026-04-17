/* Blokus game client — 4 colors, 2-4 players, drag to place */
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
let isDragging = false;
let dragGhost = null;

const COLORS = ['#3b82f6', '#eab308', '#ef4444', '#22c55e'];
const COLORS_LIGHT = ['#93bbfd', '#fde047', '#fca5a5', '#86efac'];
const COLOR_NAMES = ['藍', '黃', '紅', '綠'];
const PREVIEW_CELL = 20;

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
            lockedCells = null; lockedAnchor = null; selectedPiece = null;
            document.getElementById('confirmBar').style.display = 'none';
        } else if (d.event === 'game_over') {
            const scores = d.scores.sort((a, b) => b.score - a.score);
            showMessage(`🎉 遊戲結束！冠軍：${scores[0].name} (${scores[0].score}分)`, 'win');
        }
    }
}

// --- Helpers ---
function isMyTurn() { return state && state.is_my_turn && !state.game_over; }
function curColor() { return state ? state.current_color : 0; }

// --- Full client-side placement validation ---
function isValidPlacement(cells) {
    if (!state) return false;
    const ci = curColor();
    const bc = ci + 1; // board color value
    const cellSet = new Set(cells.map(([r,c]) => `${r},${c}`));

    for (const [r, c] of cells) {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return false;
        if (state.board[r][c] !== 0) return false;
    }
    // No edge adjacency with same color
    for (const [r, c] of cells) {
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<BOARD && nc>=0 && nc<BOARD) {
                if (state.board[nr][nc] === bc && !cellSet.has(`${nr},${nc}`)) return false;
            }
        }
    }
    // First move: must cover available corner
    if (state.first_move[ci]) {
        return cells.some(([r,c]) =>
            state.available_corners.some(([cr,cc]) => r===cr && c===cc));
    }
    // Diagonal adjacency with same color
    for (const [r, c] of cells) {
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<BOARD && nc>=0 && nc<BOARD) {
                if (state.board[nr][nc] === bc && !cellSet.has(`${nr},${nc}`)) return true;
            }
        }
    }
    return false;
}

// --- Render ---
function render() {
    if (!state) return;
    drawBoard();
    drawPlayers();
    drawPiecesPanel();
    drawPreviewArea();
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

    // Highlight available corners for first move
    if (isMyTurn() && state.first_move[curColor()]) {
        state.available_corners.forEach(([r, c]) => {
            ctx.fillStyle = COLORS[curColor()];
            ctx.globalAlpha = 0.2;
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = COLORS[curColor()];
            ctx.lineWidth = 2;
            ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.lineWidth = 1;
        });
    }

    if (!isMyTurn()) return;

    // Locked placement
    if (lockedCells) {
        drawCellsOnBoard(lockedCells, 0.65, true);
        return;
    }
    // Hover/drag preview — only show if valid
    if (previewCells.length > 0 && isValidPlacement(previewCells)) {
        drawCellsOnBoard(previewCells, 0.4, false);
    }
}

function drawCellsOnBoard(cells, alpha, border) {
    cells.forEach(([r, c]) => {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return;
        ctx.fillStyle = COLORS[curColor()];
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

function drawPlayers() {
    const panel = document.getElementById('playersPanel');
    panel.innerHTML = state.players.map((p, i) => {
        const colorDots = p.colors.map(c =>
            `<span class="color-dot${c === state.current_color ? ' active-dot' : ''}" style="background:${COLORS[c]}" title="${COLOR_NAMES[c]}"></span>`
        ).join('');
        const isCurrentPlayer = (i === state.current_player_idx);
        return `<div class="player-info ${isCurrentPlayer ? 'active' : ''}">
            <div class="player-header">${colorDots} <strong>${p.name}${i === state.my_index ? ' (你)' : ''}</strong></div>
            <div>${p.score} 分</div>
        </div>`;
    }).join('');
}

// --- Piece Panel: show current color's pieces ---
function drawPiecesPanel() {
    if (!isMyTurn()) {
        document.getElementById('piecesPanel').innerHTML = '';
        return;
    }
    const panel = document.getElementById('piecesPanel');
    const ci = curColor();
    const remaining = state.color_info[ci].remaining;
    const s = 10;
    panel.innerHTML = remaining.map(name => {
        const cells = state.pieces[name];
        const maxR = Math.max(...cells.map(c => c[0])) + 1;
        const maxC = Math.max(...cells.map(c => c[1])) + 1;
        return `<div class="piece-item ${selectedPiece === name ? 'selected' : ''}"
                     onclick="selectPiece('${name}')">
            <svg width="${maxC*s+2}" height="${maxR*s+2}" viewBox="0 0 ${maxC*s+2} ${maxR*s+2}">
                ${cells.map(([r, c]) =>
                    `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" fill="${COLORS[ci]}" stroke="#fff" stroke-width="0.5"/>`
                ).join('')}
            </svg>
        </div>`;
    }).join('');
}

// --- Preview Area ---
function drawPreviewArea() {
    const area = document.getElementById('previewArea');
    if (!selectedPiece || !isMyTurn()) {
        area.innerHTML = '<div class="preview-hint">選擇棋子</div>';
        return;
    }
    const svg = buildPieceSVG(selectedPiece, currentOrientation, PREVIEW_CELL, curColor());
    area.innerHTML = `<div class="preview-piece" id="previewPiece">${svg}</div>
        <div class="preview-drag-hint">↕ 拖曳至棋盤</div>`;
    const el = document.getElementById('previewPiece');
    el.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    el.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
}

function buildPieceSVG(name, oriIdx, cellSize, colorIdx) {
    const oris = state.piece_orientations[name];
    const ori = oris[oriIdx % oris.length];
    const maxR = Math.max(...ori.map(c => c[0])) + 1;
    const maxC = Math.max(...ori.map(c => c[1])) + 1;
    const s = cellSize;
    return `<svg width="${maxC*s+2}" height="${maxR*s+2}" viewBox="0 0 ${maxC*s+2} ${maxR*s+2}" class="preview-svg">
        ${ori.map(([r, c]) =>
            `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" rx="2"
                   fill="${COLORS[colorIdx]}" stroke="#fff" stroke-width="1.5"/>`
        ).join('')}
    </svg>`;
}

// --- Selection & Orientation ---
function selectPiece(name) {
    if (lockedCells) return;
    selectedPiece = name;
    currentOrientation = 0;
    previewCells = [];
    drawPiecesPanel();
    drawPreviewArea();
}

function rotatePiece() {
    if (!selectedPiece || !state) return;
    const oris = state.piece_orientations[selectedPiece];
    currentOrientation = (currentOrientation + 1) % oris.length;
    afterOrientationChange();
}

function flipPiece() {
    if (!selectedPiece || !state) return;
    const oris = state.piece_orientations[selectedPiece];
    currentOrientation = (currentOrientation + Math.floor(oris.length / 2)) % oris.length;
    afterOrientationChange();
}

function afterOrientationChange() {
    if (lockedCells && lockedAnchor) {
        const oris = state.piece_orientations[selectedPiece];
        const ori = oris[currentOrientation % oris.length];
        lockedCells = ori.map(([r, c]) => [r + lockedAnchor[0], c + lockedAnchor[1]]);
        // If new orientation is invalid, unlock
        if (!isValidPlacement(lockedCells)) {
            lockedCells = null; lockedAnchor = null;
            document.getElementById('confirmBar').style.display = 'none';
        }
    }
    drawPreviewArea();
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
    previewCells = ori.map(([r, c]) => [r + mouseCell[0], c + mouseCell[1]]);
}

// --- Drag ---
function startDrag(x, y) {
    if (!selectedPiece || !isMyTurn() || lockedCells) return;
    isDragging = true;
    canvas.classList.add('drop-target');
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';
    dragGhost.innerHTML = buildPieceSVG(selectedPiece, currentOrientation, 18, curColor());
    document.body.appendChild(dragGhost);
    positionGhost(x, y);
}

function positionGhost(x, y) {
    if (!dragGhost) return;
    dragGhost.style.left = x + 'px';
    dragGhost.style.top = y + 'px';
}

function endDrag(x, y) {
    isDragging = false;
    canvas.classList.remove('drop-target');
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    const rect = canvas.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const c = Math.floor((x - rect.left) / CELL);
        const r = Math.floor((y - rect.top) / CELL);
        mouseCell = [r, c];
        updateHoverPreview();
        if (previewCells.length > 0 && isValidPlacement(previewCells)) lockPlacement();
    }
    previewCells = [];
    drawBoard();
}

document.addEventListener('mousemove', e => {
    if (isDragging) {
        positionGhost(e.clientX, e.clientY);
        updateBoardFromPointer(e.clientX, e.clientY);
    } else if (!lockedCells && selectedPiece && isMyTurn()) {
        const rect = canvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            mouseCell = [Math.floor((e.clientY - rect.top) / CELL), Math.floor((e.clientX - rect.left) / CELL)];
            updateHoverPreview();
            drawBoard();
        }
    }
});
document.addEventListener('mouseup', e => { if (isDragging) endDrag(e.clientX, e.clientY); });
document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    positionGhost(t.clientX, t.clientY);
    updateBoardFromPointer(t.clientX, t.clientY);
}, { passive: false });
document.addEventListener('touchend', e => {
    if (!isDragging) return;
    endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});

function updateBoardFromPointer(x, y) {
    const rect = canvas.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        mouseCell = [Math.floor((y - rect.top) / CELL), Math.floor((x - rect.left) / CELL)];
        updateHoverPreview();
        drawBoard();
    } else { previewCells = []; drawBoard(); }
}

canvas.addEventListener('mouseleave', () => {
    if (lockedCells || isDragging) return;
    mouseCell = null; previewCells = []; drawBoard();
});

canvas.addEventListener('click', () => {
    if (lockedCells || isDragging) return;
    if (previewCells.length > 0 && isValidPlacement(previewCells)) lockPlacement();
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
    ws.send(JSON.stringify({ type: 'place_piece', piece: selectedPiece, cells: lockedCells }));
}

function cancelPlace() {
    lockedCells = null; lockedAnchor = null;
    document.getElementById('confirmBar').style.display = 'none';
    drawBoard();
}

function passTurn() {
    if (!isMyTurn()) return;
    ws.send(JSON.stringify({ type: 'pass' }));
}

function updateTurnInfo() {
    const el = document.getElementById('turnInfo');
    if (state.game_over) {
        el.textContent = '遊戲結束';
    } else {
        const ci = curColor();
        const cname = COLOR_NAMES[ci];
        const cdot = `<span class="color-dot" style="background:${COLORS[ci]}"></span>`;
        if (isMyTurn()) {
            el.innerHTML = `${cdot} <strong style="color:${COLORS[ci]}">輪到你的${cname}色！</strong> 選擇棋子放置`;
        } else {
            const pname = state.players[state.current_player_idx].name;
            el.innerHTML = `${cdot} 等待 <strong>${pname}</strong> 的${cname}色操作...`;
        }
    }
}

function showMessage(text, cls) {
    const el = document.getElementById('gameMessage');
    el.textContent = text;
    el.className = `game-message ${cls || ''}`;
}

document.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') rotatePiece();
    if (e.key === 'f' || e.key === 'F') flipPiece();
    if (e.key === 'Escape') cancelPlace();
});

connect();
