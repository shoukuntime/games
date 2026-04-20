/* Blokus game client */
const CELL = 28;
const BOARD = 20;
const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CELL * BOARD + 1;
canvas.height = CELL * BOARD + 1;

let ws, state = null;
let selectedPiece = null;
let selectedColor = null;
let rotation = 0;    // 0-3 (0°, 90°, 180°, 270° CW)
let flipH = false;
let flipV = false;
let previewCells = [];
let mouseCell = null;
let lockedCells = null;
let lockedAnchor = null;
let isDragging = false;
let dragGhost = null;

const COLORS = ['#3b82f6', '#eab308', '#ef4444', '#22c55e'];
const COLORS_LIGHT = ['#93bbfd', '#fde047', '#fca5a5', '#86efac'];
function colorName(i) { return t('blokus.color.' + i); }
const PREVIEW_CELL = 20;

// --- Transform: rotate + flip on client side ---
function transformPiece(baseCells, rot, fH, fV) {
    let cells = baseCells.map(([r, c]) => [r, c]);
    if (fH) cells = cells.map(([r, c]) => [r, -c]);
    if (fV) cells = cells.map(([r, c]) => [-r, c]);
    for (let i = 0; i < rot; i++) {
        cells = cells.map(([r, c]) => [c, -r]);
    }
    const minR = Math.min(...cells.map(([r]) => r));
    const minC = Math.min(...cells.map(([, c]) => c));
    return cells.map(([r, c]) => [r - minR, c - minC]);
}

function currentCells() {
    if (!selectedPiece || !state) return [];
    return transformPiece(state.pieces[selectedPiece], rotation, flipH, flipV);
}

function pieceOffset(cells) {
    if (!cells.length) return [0, 0];
    const maxR = Math.max(...cells.map(([r]) => r));
    const maxC = Math.max(...cells.map(([, c]) => c));
    return [Math.floor(maxR / 2), Math.floor(maxC / 2)];
}

// --- WebSocket ---
function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/${ROOM_ID}`);
    ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'chat') handleChatMessage(msg.data);
        else handleMessage(msg);
    };
    ws.onclose = () => setTimeout(connect, 2000);
    ws.onopen = () => initChat(ws);
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
            lockedCells = null; lockedAnchor = null; selectedPiece = null; selectedColor = null;
            document.getElementById('confirmBar').style.display = 'none';
        } else if (d.event === 'game_over') {
            const scores = d.scores.sort((a, b) => b.score - a.score);
            showMessage(t('blokus.champion', {name: scores[0].name, score: scores[0].score}), 'win');
        }
    }
}

// --- Validation (client-side, mirrors server rules) ---
function isValidPlacement(cells) {
    if (!state || selectedColor === null) return false;
    const bc = selectedColor + 1;
    const cellSet = new Set(cells.map(([r,c]) => `${r},${c}`));
    for (const [r, c] of cells) {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return false;
        if (state.board[r][c] !== 0) return false;
    }
    for (const [r, c] of cells) {
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<BOARD && nc>=0 && nc<BOARD)
                if (state.board[nr][nc] === bc && !cellSet.has(`${nr},${nc}`)) return false;
        }
    }
    if (state.first_move[selectedColor]) {
        return cells.some(([r,c]) =>
            state.available_corners.some(([cr,cc]) => r===cr && c===cc));
    }
    for (const [r, c] of cells) {
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0 && nr<BOARD && nc>=0 && nc<BOARD)
                if (state.board[nr][nc] === bc && !cellSet.has(`${nr},${nc}`)) return true;
        }
    }
    return false;
}

function isMyTurn() { return state && state.is_my_turn && !state.game_over; }
function curColor() { return state ? state.current_color : 0; }

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
    // Available corners highlight
    if (selectedColor !== null && state.first_move[selectedColor]) {
        state.available_corners.forEach(([r, c]) => {
            ctx.fillStyle = COLORS[selectedColor];
            ctx.globalAlpha = 0.2;
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = COLORS[selectedColor];
            ctx.lineWidth = 2;
            ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.lineWidth = 1;
        });
    }

    // Locked placement
    if (lockedCells) {
        drawCellsOnBoard(lockedCells, selectedColor, 0.65, true);
        return;
    }
    // Hover/drag preview
    if (previewCells.length > 0 && isValidPlacement(previewCells)) {
        drawCellsOnBoard(previewCells, selectedColor, 0.4, false);
    }
}

function drawCellsOnBoard(cells, colorIdx, alpha, border) {
    cells.forEach(([r, c]) => {
        if (r < 0 || r >= BOARD || c < 0 || c >= BOARD) return;
        ctx.fillStyle = COLORS[colorIdx] || COLORS[0];
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
    document.getElementById('playersPanel').innerHTML = state.players.map((p, i) => {
        const dots = p.colors.map(c =>
            `<span class="color-dot${c===state.current_color?' active-dot':''}" style="background:${COLORS[c]}"></span>`
        ).join('');
        return `<div class="player-info ${i===state.current_player_idx?'active':''}">
            <div class="player-header">${dots} <strong>${p.name}${i===state.my_index?` (${t('lobby.you')||'你'})`:''}</strong></div>
            <div>${p.score} ${t('blokus.score')}</div>
        </div>`;
    }).join('');
    // Mobile bar
    const mb = document.getElementById('blokusMobilePlayers');
    if (mb) mb.innerHTML = state.players.map((p, i) => {
        const dots = p.colors.map(c => `<span style="color:${COLORS[c]}">●</span>`).join('');
        return `<span class="mp-chip ${i===state.current_player_idx?'active':''}">${dots} ${p.name} ${p.score}</span>`;
    }).join('');
}

// --- Pieces Panel: always show player's colors ---
function drawPiecesPanel() {
    const panel = document.getElementById('piecesPanel');
    if (!state || state.my_index < 0) { panel.innerHTML = ''; return; }

    const s = 9;
    let html = '';
    for (const ci of state.my_colors) {
        const info = state.color_info[ci];
        const isCurrent = (ci === state.current_color);
        html += `<div class="color-section ${isCurrent ? 'current-color' : ''}">
            <div class="color-section-hdr">
                <span class="color-dot" style="background:${COLORS[ci]}"></span>
                <span>${colorName(ci)}</span>
                <span class="piece-count">${info.remaining.length}</span>
                ${isCurrent ? '<span class="now-badge">NOW</span>' : ''}
            </div>
            <div class="color-pieces">`;
        for (const name of info.remaining) {
            const cells = state.pieces[name];
            const maxR = Math.max(...cells.map(c => c[0])) + 1;
            const maxC = Math.max(...cells.map(c => c[1])) + 1;
            const isSel = selectedPiece === name && selectedColor === ci;
            html += `<div class="piece-item ${isSel ? 'selected' : ''}" onclick="selectPiece('${name}',${ci})">
                <svg width="${maxC*s+2}" height="${maxR*s+2}" viewBox="0 0 ${maxC*s+2} ${maxR*s+2}">
                    ${cells.map(([r, c]) =>
                        `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" fill="${COLORS[ci]}" stroke="#fff" stroke-width="0.5"/>`
                    ).join('')}
                </svg>
            </div>`;
        }
        html += '</div></div>';
    }
    panel.innerHTML = html;
}

// --- Preview Area ---
function drawPreviewArea() {
    const area = document.getElementById('previewArea');
    if (!selectedPiece || !state) {
        area.innerHTML = `<div class="preview-hint">${t('blokus.select')}</div>`;
        return;
    }
    const cells = currentCells();
    const svg = cellsToSVG(cells, PREVIEW_CELL, selectedColor);
    area.innerHTML = `<div class="preview-piece" id="previewPiece">${svg}</div>
        <div class="preview-drag-hint">${t('blokus.drag_hint')}</div>`;
    const el = document.getElementById('previewPiece');
    el.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    el.addEventListener('touchstart', e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
}

function cellsToSVG(cells, s, colorIdx) {
    const maxR = Math.max(...cells.map(([r]) => r)) + 1;
    const maxC = Math.max(...cells.map(([, c]) => c)) + 1;
    return `<svg width="${maxC*s+2}" height="${maxR*s+2}" viewBox="0 0 ${maxC*s+2} ${maxR*s+2}" class="preview-svg">
        ${cells.map(([r, c]) =>
            `<rect x="${c*s+1}" y="${r*s+1}" width="${s}" height="${s}" rx="2"
                   fill="${COLORS[colorIdx]}" stroke="#fff" stroke-width="1.5"/>`
        ).join('')}
    </svg>`;
}

// --- Selection & Orientation ---
function selectPiece(name, colorIdx) {
    if (lockedCells) return;
    selectedPiece = name;
    selectedColor = colorIdx;
    rotation = 0; flipH = false; flipV = false;
    previewCells = [];
    drawPiecesPanel();
    drawPreviewArea();
    drawBoard();
}

function rotatePiece() {
    if (!selectedPiece) return;
    rotation = (rotation + 1) % 4;
    afterOrientationChange();
}

function flipHorizontal() {
    if (!selectedPiece) return;
    flipH = !flipH;
    afterOrientationChange();
}

function flipVertical() {
    if (!selectedPiece) return;
    flipV = !flipV;
    afterOrientationChange();
}

function afterOrientationChange() {
    if (lockedCells && lockedAnchor) {
        const cells = currentCells();
        lockedCells = cells.map(([r, c]) => [r + lockedAnchor[0], c + lockedAnchor[1]]);
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
    const cells = currentCells();
    const [offR, offC] = pieceOffset(cells);
    previewCells = cells.map(([r, c]) => [r + mouseCell[0] - offR, c + mouseCell[1] - offC]);
}

// --- Board coord helper ---
function canvasCellFromPoint(x, y) {
    const rect = canvas.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const c = Math.floor((x - rect.left) * sx / CELL);
    const r = Math.floor((y - rect.top) * sy / CELL);
    if (r >= 0 && r < BOARD && c >= 0 && c < BOARD) return [r, c];
    return null;
}

// --- Drag ---
function startDrag(x, y) {
    if (!selectedPiece || lockedCells) return;
    isDragging = true;
    canvas.classList.add('drop-target');
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';
    dragGhost.innerHTML = cellsToSVG(currentCells(), 16, selectedColor);
    document.body.appendChild(dragGhost);
    positionGhost(x, y);
}

function positionGhost(x, y) {
    if (!dragGhost) return;
    const w = dragGhost.offsetWidth || 40;
    const h = dragGhost.offsetHeight || 40;
    dragGhost.style.left = (x - w / 2) + 'px';
    dragGhost.style.top = (y - h / 2) + 'px';
}

function endDrag(x, y) {
    isDragging = false;
    canvas.classList.remove('drop-target');
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    const cell = canvasCellFromPoint(x, y);
    if (cell) {
        mouseCell = cell;
        updateHoverPreview();
        if (previewCells.length > 0 && isValidPlacement(previewCells)) lockPlacement();
    }
    previewCells = [];
    drawBoard();
}

document.addEventListener('mousemove', e => {
    if (isDragging) {
        positionGhost(e.clientX, e.clientY);
        const cell = canvasCellFromPoint(e.clientX, e.clientY);
        if (cell) { mouseCell = cell; updateHoverPreview(); drawBoard(); }
        else { previewCells = []; drawBoard(); }
    } else if (!lockedCells && selectedPiece) {
        const cell = canvasCellFromPoint(e.clientX, e.clientY);
        if (cell) { mouseCell = cell; updateHoverPreview(); drawBoard(); }
    }
});
document.addEventListener('mouseup', e => { if (isDragging) endDrag(e.clientX, e.clientY); });
document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    positionGhost(t.clientX, t.clientY);
    const cell = canvasCellFromPoint(t.clientX, t.clientY);
    if (cell) { mouseCell = cell; updateHoverPreview(); drawBoard(); }
    else { previewCells = []; drawBoard(); }
}, { passive: false });
document.addEventListener('touchend', e => {
    if (!isDragging) return;
    endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});

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
    if (!selectedPiece || previewCells.length === 0) return;
    lockedCells = [...previewCells];
    if (mouseCell) {
        const cells = currentCells();
        const [offR, offC] = pieceOffset(cells);
        lockedAnchor = [mouseCell[0] - offR, mouseCell[1] - offC];
    } else {
        lockedAnchor = null;
    }
    document.getElementById('confirmBar').style.display = 'flex';
    drawBoard();
}

function confirmPlace() {
    if (!lockedCells || !selectedPiece || selectedColor === null) return;
    if (selectedColor !== curColor()) {
        showMessage(t('blokus.not_color', {color: colorName(selectedColor)}), 'lose');
        return;
    }
    if (!isMyTurn()) {
        showMessage(t('blokus.not_you'), 'lose');
        return;
    }
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

// --- UI ---
function updateTurnInfo() {
    const el = document.getElementById('turnInfo');
    if (!state) return;
    if (state.game_over) { el.textContent = t('blokus.game_over'); return; }
    const ci = curColor();
    const dot = `<span class="color-dot" style="background:${COLORS[ci]}"></span>`;
    if (isMyTurn()) {
        el.innerHTML = `${dot} <strong style="color:${COLORS[ci]}">${t('blokus.your_turn', {color: colorName(ci)})}</strong>`;
    } else {
        el.innerHTML = `${dot} ${t('blokus.wait_turn', {name: state.players[state.current_player_idx].name, color: colorName(ci)})}`;
    }
}

function showMessage(text, cls) {
    const el = document.getElementById('gameMessage');
    el.textContent = text;
    el.className = `game-message ${cls || ''}`;
    if (cls) setTimeout(() => { el.textContent = ''; el.className = 'game-message'; }, 3000);
}

document.addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') rotatePiece();
    if (e.key === 'f' || e.key === 'F') flipHorizontal();
    if (e.key === 'v' || e.key === 'V') flipVertical();
    if (e.key === 'Escape') cancelPlace();
});

connect();
