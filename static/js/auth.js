function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg;
    el.style.display = 'block';
}
function hideError() { document.getElementById('errorMsg').style.display = 'none'; }

// --- Remember me ---
const STORED_KEY = 'games_remembered';

function loadRemembered() {
    try {
        const data = JSON.parse(localStorage.getItem(STORED_KEY));
        if (data && data.username) {
            const u = document.getElementById('username');
            const p = document.getElementById('password');
            const r = document.getElementById('rememberMe');
            if (u) u.value = data.username;
            if (p) p.value = data.password || '';
            if (r) r.checked = true;
        }
    } catch {}
}

function saveRemembered(username, password) {
    localStorage.setItem(STORED_KEY, JSON.stringify({ username, password }));
}

function clearRemembered() {
    localStorage.removeItem(STORED_KEY);
}

// --- Login ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loadRemembered();
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); hideError();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('rememberMe')?.checked;
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) { showError(data.detail || t('err.login_fail')); return; }
            if (remember) { saveRemembered(username, password); }
            else { clearRemembered(); }
            window.location.href = '/dashboard';
        } catch { showError(t('err.network')); }
    });
}

// --- Register (auto-login after success) ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); hideError();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) { showError(t('err.password_mismatch')); return; }
        try {
            // Register
            const regRes = await fetch('/api/v1/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const regData = await regRes.json();
            if (!regRes.ok) { showError(regData.detail || t('err.register_fail')); return; }
            // Auto-login
            const loginRes = await fetch('/api/v1/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (loginRes.ok) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/';
            }
        } catch { showError(t('err.network')); }
    });
}
