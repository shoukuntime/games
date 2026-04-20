/* Global chat module — floating panel for all games */
let _chatWs = null;
let _chatUnread = 0;

function initChat(wsRef) {
    _chatWs = wsRef;
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    if (!input || !sendBtn) return;

    // Remove old listeners to prevent duplicates on reconnect
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    const newBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newBtn, sendBtn);

    function sendChat() {
        const inp = document.getElementById('chatInput');
        const text = inp?.value.trim();
        if (!text || !_chatWs || _chatWs.readyState !== WebSocket.OPEN) return;
        _chatWs.send(JSON.stringify({ type: 'chat', text }));
        inp.value = '';
    }
    newBtn.addEventListener('click', sendChat);
    newInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
}

function handleChatMessage(data) {
    addChatMsg(data.player, data.text, '');
    // Badge if panel closed
    const panel = document.getElementById('chatPanel');
    if (panel && !panel.classList.contains('open')) {
        _chatUnread++;
        const badge = document.getElementById('chatBadge');
        if (badge) { badge.textContent = _chatUnread; badge.style.display = 'flex'; }
    }
}

function addChatMsg(sender, text, cls) {
    const el = document.getElementById('chatMessages');
    if (!el) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${cls || ''}`;
    div.innerHTML = `<strong>${sender}</strong> ${text}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
}

function toggleChat() {
    const panel = document.getElementById('chatPanel');
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        _chatUnread = 0;
        const badge = document.getElementById('chatBadge');
        if (badge) badge.style.display = 'none';
        document.getElementById('chatInput')?.focus();
    }
}
