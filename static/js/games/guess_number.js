let secretNumber = 0;
let attempts = 0;
let gameOver = false;

function init() {
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    gameOver = false;
    document.getElementById('attempts').textContent = '0';
    document.getElementById('message').textContent = '';
    document.getElementById('message').className = 'game-message';
    document.getElementById('history').innerHTML = '';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').disabled = false;
    document.getElementById('guessBtn').disabled = false;
    document.getElementById('guessInput').focus();
}

function makeGuess() {
    if (gameOver) return;
    const input = document.getElementById('guessInput');
    const guess = parseInt(input.value);
    if (isNaN(guess) || guess < 1 || guess > 100) return;

    attempts++;
    document.getElementById('attempts').textContent = attempts;
    const msg = document.getElementById('message');
    const history = document.getElementById('history');

    if (guess === secretNumber) {
        msg.textContent = `🎉 恭喜！答案就是 ${secretNumber}，你猜了 ${attempts} 次！`;
        msg.className = 'game-message win';
        history.innerHTML += `<span class="guess-tag correct">${guess} ✓</span>`;
        gameOver = true;
        input.disabled = true;
        document.getElementById('guessBtn').disabled = true;
    } else if (guess > secretNumber) {
        msg.textContent = '太大了！再小一點 ⬇️';
        msg.className = 'game-message hint-high';
        history.innerHTML += `<span class="guess-tag high">${guess} ↓</span>`;
    } else {
        msg.textContent = '太小了！再大一點 ⬆️';
        msg.className = 'game-message hint-low';
        history.innerHTML += `<span class="guess-tag low">${guess} ↑</span>`;
    }
    input.value = '';
    input.focus();
}

function resetGame() {
    init();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') makeGuess();
});

init();
