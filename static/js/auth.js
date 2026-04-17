function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg;
    el.style.display = 'block';
}
function hideError() { document.getElementById('errorMsg').style.display = 'none'; }

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); hideError();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) { showError(data.detail || t('err.login_fail')); return; }
            window.location.href = '/dashboard';
        } catch { showError(t('err.network')); }
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); hideError();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) { showError(t('err.password_mismatch')); return; }
        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) { showError(data.detail || t('err.register_fail')); return; }
            window.location.href = '/?registered=1';
        } catch { showError(t('err.network')); }
    });
}
