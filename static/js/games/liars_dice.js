/* Liar's Dice game client */
const PLAYER_COLORS = ['#3b82f6','#ef4444','#eab308','#22c55e','#8b5cf6','#f97316'];
const DICE_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6'];
let ws, state = null;
let bidQty = 1, bidFace = 2;

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
    if (msg.type === 'game_state') { state = msg.data; render(); }
    else if (msg.type === 'game_event') handleEvent(msg.data);
    else if (msg.type === 'error') showMsg(msg.message, 'lose');
}

function handleEvent(d) {
    if (d.event === 'bid') {
        showMsg(t('ld.bid_msg', {name: d.player, qty: d.quantity, face: d.face}), '');
    } else if (d.event === 'challenge') {
        // Render is triggered by game_state
    } else if (d.event === 'game_over') {
        showMsg(t('ld.winner', {name: d.winner}), 'win');
    } else if (d.event === 'new_round') {
        showMsg(t('ld.new_round'), '');
    }
}

// --- Dice SVG ---
function dieSVG(n, size, color) {
    const s = size || 44;
    const dotPos = {
        1:[[s/2,s/2]],
        2:[[s*.25,s*.25],[s*.75,s*.75]],
        3:[[s*.25,s*.25],[s/2,s/2],[s*.75,s*.75]],
        4:[[s*.25,s*.25],[s*.75,s*.25],[s*.25,s*.75],[s*.75,s*.75]],
        5:[[s*.25,s*.25],[s*.75,s*.25],[s/2,s/2],[s*.25,s*.75],[s*.75,s*.75]],
        6:[[s*.25,s*.25],[s*.75,s*.25],[s*.25,s/2],[s*.75,s/2],[s*.25,s*.75],[s*.75,s*.75]],
    };
    const r = s * 0.1;
    const dots = (dotPos[n]||[]).map(([cx,cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>`
    ).join('');
    const c = color || '#64748b';
    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
        <rect x="1" y="1" width="${s-2}" height="${s-2}" rx="${s*.16}" fill="${c}"/>
        ${dots}
    </svg>`;
}

function hiddenDieSVG(size) {
    const s = size || 36;
    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
        <rect x="1" y="1" width="${s-2}" height="${s-2}" rx="${s*.16}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
        <text x="${s/2}" y="${s/2+1}" text-anchor="middle" dominant-baseline="central" font-size="${s*.35}" fill="#94a3b8">?</text>
    </svg>`;
}

// --- Render ---
function render() {
    if (!state) return;
    renderPlayers();
    renderMyDice();
    renderBidDisplay();
    renderControls();
    renderReveal();
    renderTurnInfo();
}

function renderPlayers() {
    document.getElementById('ldPlayers').innerHTML = state.players.map((p, i) => {
        const active = i === state.current_player && state.phase === 'bidding';
        const dead = !p.alive;
        return `<div class="player-info ${active?'active':''} ${dead?'dead':''}" style="border-left:4px solid ${PLAYER_COLORS[i]}">
            <strong>${p.name}${i===state.my_index?` (${t('lobby.you')||'你'})`:''}</strong>
            <div class="ld-dice-icons">${p.alive ? Array(p.dice_count).fill(0).map(()=>dieSVG(0,18,'#94a3b8').replace(/<circle[^/]*\/>/g,'')).join('') : '💀'}</div>
        </div>`;
    }).join('');
    document.getElementById('ldTotal').innerHTML = `${t('ld.total_dice')}: <strong>${state.total_dice}</strong>`;
    // Mobile bar
    const mb = document.getElementById('ldMobilePlayers');
    if (mb) mb.innerHTML = state.players.map((p, i) =>
        `<span class="mp-chip ${i===state.current_player&&state.phase==='bidding'?'active':''} ${!p.alive?'dead':''}">
            <span style="color:${PLAYER_COLORS[i]}">●</span> ${p.name} ×${p.dice_count}
        </span>`
    ).join('');
}

function renderMyDice() {
    const me = state.players[state.my_index];
    if (!me || !me.dice.length) {
        document.getElementById('ldMyDice').innerHTML = me?.alive === false
            ? `<div class="ld-eliminated">${t('ld.eliminated')}</div>` : '';
        return;
    }
    const sorted = [...me.dice].sort((a,b) => a-b);
    document.getElementById('ldMyDice').innerHTML = sorted.map((d, i) =>
        `<div class="ld-die-wrap">${dieSVG(d, 52, DICE_COLORS[i % DICE_COLORS.length])}</div>`
    ).join('');
}

function renderBidDisplay() {
    const el = document.getElementById('ldBidDisplay');
    if (!state.current_bid) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const [qty, face] = state.current_bid;
    const bidder = state.players[state.last_bidder]?.name || '?';
    el.innerHTML = `<div class="ld-bid-card">
        <div class="ld-bid-label">${t('ld.current_bid')}</div>
        <div class="ld-bid-value">
            <span class="ld-bid-qty">${qty}</span>
            <span class="ld-bid-x">×</span>
            ${dieSVG(face, 36, '#4f46e5')}
        </div>
        <div class="ld-bid-by">${t('ld.bid_by', {name: bidder})}</div>
    </div>`;
}

function renderControls() {
    const el = document.getElementById('ldControls');
    const isMe = state.my_index === state.current_player;
    if (!isMe || state.phase !== 'bidding' || !state.players[state.my_index]?.alive) {
        el.style.display = 'none'; return;
    }
    el.style.display = 'block';

    // Set minimum bid
    if (state.current_bid) {
        const [cq, cf] = state.current_bid;
        if (bidQty < cq || (bidQty === cq && bidFace <= cf)) {
            if (cf < 6) { bidQty = cq; bidFace = cf + 1; }
            else { bidQty = cq + 1; bidFace = 2; }
        }
    } else {
        if (bidQty < 1) bidQty = 1;
    }
    document.getElementById('bidQty').textContent = bidQty;
    renderFacePicker();
    document.getElementById('challengeBtn').style.display = state.current_bid ? 'inline-flex' : 'none';
}

function renderFacePicker() {
    const el = document.getElementById('facePicker');
    let html = '';
    for (let f = 2; f <= 6; f++) {
        const sel = f === bidFace ? 'selected' : '';
        html += `<div class="ld-face-opt ${sel}" onclick="selectFace(${f})">${dieSVG(f, 32, f===bidFace?'#4f46e5':'#94a3b8')}</div>`;
    }
    el.innerHTML = html;
}

function renderReveal() {
    const el = document.getElementById('ldReveal');
    if (state.phase !== 'reveal' || !state.reveal_data) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    const r = state.reveal_data;
    const allDice = state.players.map((p, i) => {
        if (!p.dice.length) return '';
        return `<div class="ld-reveal-player">
            <strong style="color:${PLAYER_COLORS[i]}">${p.name}</strong>
            <div class="ld-dice-row">${p.dice.map((d,j) => {
                const highlight = (d === r.bid_face || (d === 1 && r.bid_face !== 1)) ? 'highlight' : '';
                return `<div class="ld-die-wrap ${highlight}">${dieSVG(d, 36, PLAYER_COLORS[i])}</div>`;
            }).join('')}</div>
        </div>`;
    }).join('');

    const resultClass = r.bid_success ? 'bid-success' : 'bid-fail';
    el.innerHTML = `<div class="ld-reveal-card">
        <div class="ld-reveal-header">${t('ld.reveal_title')}</div>
        ${allDice}
        <div class="ld-reveal-result ${resultClass}">
            ${r.bid_qty}×${dieSVG(r.bid_face, 24, '#4f46e5')} → ${t('ld.actual')}: <strong>${r.actual_count}</strong>
            ${r.bid_success ? `✅ ${t('ld.bid_true')}` : `❌ ${t('ld.bid_false')}`}
        </div>
        <div class="ld-reveal-loser">
            ${r.eliminated
                ? t('ld.player_eliminated', {name: r.loser})
                : t('ld.player_lost_die', {name: r.loser, left: r.loser_dice_left})}
        </div>
        ${state.phase !== 'game_over' ? `<button class="btn btn-primary" onclick="nextRound()">${t('ld.next_round')}</button>` : ''}
    </div>`;
}

function renderTurnInfo() {
    const el = document.getElementById('ldTurnInfo');
    if (state.phase === 'game_over') {
        el.innerHTML = t('ld.winner', {name: state.winner});
    } else if (state.phase === 'reveal') {
        el.innerHTML = t('ld.reveal_title');
    } else if (state.my_index === state.current_player) {
        el.innerHTML = `<strong style="color:${PLAYER_COLORS[state.my_index]}">${state.current_bid ? t('ld.your_turn_bid') : t('ld.your_turn_first')}</strong>`;
    } else {
        el.innerHTML = t('ld.wait_turn', {name: state.players[state.current_player]?.name});
    }
}

// --- Actions ---
function adjustQty(delta) {
    const newQty = bidQty + delta;
    if (newQty >= 1 && newQty <= state.total_dice) {
        bidQty = newQty;
        renderControls();
    }
}

function selectFace(f) {
    bidFace = f;
    renderControls();
}

function makeBid() {
    ws.send(JSON.stringify({ type: 'bid', quantity: bidQty, face: bidFace }));
}

function challenge() {
    ws.send(JSON.stringify({ type: 'challenge' }));
}

function nextRound() {
    ws.send(JSON.stringify({ type: 'next_round' }));
}

function showMsg(text, cls) {
    const el = document.getElementById('ldMessage');
    el.textContent = text;
    el.className = `game-message ${cls || ''}`;
    if (cls) setTimeout(() => { el.textContent = ''; el.className = 'game-message'; }, 4000);
}

connect();
