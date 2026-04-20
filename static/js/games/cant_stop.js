/* Can't Stop game client */
const COLUMN_HEIGHTS = {2:3,3:5,4:7,5:9,6:11,7:13,8:11,9:9,10:7,11:5,12:3};
const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#eab308', '#22c55e'];
let ws, state = null;

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
    } else if (msg.type === 'game_event') {
        handleEvent(msg.data);
    } else if (msg.type === 'error') {
        showMsg(msg.message, 'lose');
    }
}

function handleEvent(d) {
    if (d.event === 'busted') {
        showMsg(t('cs.busted', {name: d.player}), 'lose');
    } else if (d.event === 'player_stopped') {
        let msg = t('cs.stopped', {name: d.player});
        if (d.newly_claimed.length > 0) msg += t('cs.claimed', {cols: d.newly_claimed.join(', ')});
        showMsg(msg, 'hint-low');
    } else if (d.event === 'game_over') {
        showMsg(t('cs.winner', {name: d.winner}), 'win');
    }
}

function render() {
    if (!state) return;
    renderPlayers();
    renderBoard();
    renderDice();
    renderPairings();
    renderActions();
    renderTurnInfo();
}

function renderPlayers() {
    document.getElementById('csPlayers').innerHTML = state.players.map((p, i) => `
        <div class="player-info ${i === state.current_player ? 'active' : ''}"
             style="border-left: 4px solid ${PLAYER_COLORS[i]}">
            <strong>${p.name}${i === state.my_index ? ` (${t('lobby.you')||'你'})` : ''}</strong>
            <div>${t('cs.columns_won', {n: p.columns_won})}</div>
        </div>
    `).join('');
    // Mobile bar
    const mb = document.getElementById('csMobilePlayers');
    if (mb) mb.innerHTML = state.players.map((p, i) =>
        `<span class="mp-chip ${i===state.current_player?'active':''}" style="border-color:${i===state.current_player?PLAYER_COLORS[i]:'transparent'}">
            <span style="color:${PLAYER_COLORS[i]}">●</span> ${p.name} (${p.columns_won}/3)
        </span>`
    ).join('');
}

function renderBoard() {
    const board = document.getElementById('csBoard');
    let html = '<div class="cs-columns">';
    for (let col = 2; col <= 12; col++) {
        const h = COLUMN_HEIGHTS[col];
        const claimed = state.claimed[String(col)];
        html += `<div class="cs-column ${claimed !== undefined ? 'claimed' : ''}">`;
        html += `<div class="cs-col-num">${col}</div>`;

        for (let step = h - 1; step >= 0; step--) {
            let cellClass = 'cs-cell';
            let content = '';

            // Check permanent markers
            state.players.forEach((p, pi) => {
                if (p.positions[col] === step) {
                    content += `<span class="cs-marker" style="background:${PLAYER_COLORS[pi]}"></span>`;
                }
            });

            // Check temp markers
            if (state.temp[col] === step && state.current_player === state.my_index) {
                content += `<span class="cs-marker temp">⬆</span>`;
            } else if (state.temp[col] === step) {
                content += `<span class="cs-marker temp-other">⬆</span>`;
            }

            if (step === h - 1) cellClass += ' cs-top';
            if (claimed !== undefined) {
                content = `<span class="cs-marker" style="background:${PLAYER_COLORS[claimed]}">★</span>`;
            }

            html += `<div class="${cellClass}">${content}</div>`;
        }
        html += '</div>';
    }
    html += '</div>';
    board.innerHTML = html;
}

const DICE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];

function renderDice() {
    const area = document.getElementById('csDice');
    if (!state.dice || state.dice.length === 0) {
        area.innerHTML = '';
        return;
    }
    area.innerHTML = '<div class="dice-group">' +
        state.dice.map((d, i) => `<div class="die">${dieSVG(d, DICE_COLORS[i])}</div>`).join('') +
        '</div>';
}

function dieSVG(n, color) {
    const dotPositions = {
        1: [[24,24]],
        2: [[12,12],[36,36]],
        3: [[12,12],[24,24],[36,36]],
        4: [[12,12],[36,12],[12,36],[36,36]],
        5: [[12,12],[36,12],[24,24],[12,36],[36,36]],
        6: [[12,12],[36,12],[12,24],[36,24],[12,36],[36,36]],
    };
    const dots = (dotPositions[n] || []).map(([cx,cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="5" fill="#fff"/>`
    ).join('');
    return `<svg viewBox="0 0 48 48" width="48" height="48">
        <rect x="1" y="1" width="46" height="46" rx="8" fill="${color}"/>
        ${dots}
    </svg>`;
}

function dieface(n) {
    // Used in pairing buttons — return small inline SVG
    const color = '#64748b';
    const dotPositions = {
        1: [[12,12]],
        2: [[6,6],[18,18]],
        3: [[6,6],[12,12],[18,18]],
        4: [[6,6],[18,6],[6,18],[18,18]],
        5: [[6,6],[18,6],[12,12],[6,18],[18,18]],
        6: [[6,6],[18,6],[6,12],[18,12],[6,18],[18,18]],
    };
    const dots = (dotPositions[n] || []).map(([cx,cy]) =>
        `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#fff"/>`
    ).join('');
    return `<svg viewBox="0 0 24 24" width="28" height="28" style="vertical-align:middle">
        <rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="${color}"/>
        ${dots}
    </svg>`;
}

function renderPairings() {
    const el = document.getElementById('csPairings');
    if (state.phase !== 'choosing' || state.my_index !== state.current_player) {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';
    el.innerHTML = `<p><strong>${t('cs.choose_pair')}</strong></p>` +
        state.pairings.map((pair, i) => {
            const s1 = pair[0][0] + pair[0][1];
            const s2 = pair[1][0] + pair[1][1];
            const valid = state.valid_pairing_indices.includes(i);
            return `<button class="pair-btn ${valid ? '' : 'pair-disabled'}"
                        ${valid ? '' : 'disabled'}
                        onclick="choosePair(${i})">
                <span class="pair-group">
                    <span class="pair-dice">${dieface(pair[0][0])} ${dieface(pair[0][1])}</span>
                    <span class="pair-sum">${s1}</span>
                </span>
                <span class="pair-and">&</span>
                <span class="pair-group">
                    <span class="pair-dice">${dieface(pair[1][0])} ${dieface(pair[1][1])}</span>
                    <span class="pair-sum">${s2}</span>
                </span>
            </button>`;
        }).join('');
}

function renderActions() {
    const isMe = state.my_index === state.current_player;
    const rollBtn = document.getElementById('rollBtn');
    const stopBtn = document.getElementById('stopBtn');

    rollBtn.style.display = (isMe && (state.phase === 'rolling' || state.phase === 'deciding')) ? 'inline-flex' : 'none';
    stopBtn.style.display = (isMe && state.phase === 'deciding') ? 'inline-flex' : 'none';

    rollBtn.textContent = state.phase === 'deciding' ? t('cs.continue') : t('cs.roll');
    stopBtn.textContent = t('cs.stop');
}

function renderTurnInfo() {
    const el = document.getElementById('csTurnInfo');
    if (state.winner) {
        el.innerHTML = t('cs.winner', {name: state.winner});
    } else if (state.my_index === state.current_player) {
        const phases = {
            rolling: t('cs.your_turn'), choosing: t('cs.choosing'),
            deciding: t('cs.deciding'), busted: t('cs.busted_msg'),
        };
        el.innerHTML = `<strong style="color:${PLAYER_COLORS[state.my_index]}">${phases[state.phase] || ''}</strong>`;
    } else {
        el.innerHTML = t('cs.wait', {name: state.current_player_name});
    }
}

function rollDice() {
    ws.send(JSON.stringify({ type: 'roll' }));
}

function choosePair(index) {
    ws.send(JSON.stringify({ type: 'choose_pair', index }));
}

function stopTurn() {
    ws.send(JSON.stringify({ type: 'stop' }));
}

function showMsg(text, cls) {
    const el = document.getElementById('csMessage');
    el.textContent = text;
    el.className = `game-message ${cls || ''}`;
    setTimeout(() => { el.textContent = ''; el.className = 'game-message'; }, 4000);
}

connect();
