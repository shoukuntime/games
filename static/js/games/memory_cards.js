const symbols = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🫐', '🥝'];
let cards = [];
let flippedCards = [];
let matchCount = 0;
let flipCount = 0;
let locked = false;
let timerInterval = null;
let seconds = 0;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startTimer() {
    if (timerInterval) return;
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        document.getElementById('timer').textContent = `${m}:${s}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function createBoard() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    cards = shuffle([...symbols, ...symbols]);
    matchCount = 0;
    flipCount = 0;
    flippedCards = [];
    locked = false;
    stopTimer();
    seconds = 0;
    document.getElementById('flipCount').textContent = '0';
    document.getElementById('matchCount').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('memoryResult').textContent = '';
    document.getElementById('memoryResult').className = 'game-message';

    cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (locked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;

    if (flipCount === 0 && !timerInterval) startTimer();

    card.classList.add('flipped');
    card.textContent = card.dataset.symbol;
    flippedCards.push(card);
    flipCount++;
    document.getElementById('flipCount').textContent = flipCount;

    if (flippedCards.length === 2) {
        locked = true;
        const [a, b] = flippedCards;
        if (a.dataset.symbol === b.dataset.symbol) {
            a.classList.add('matched');
            b.classList.add('matched');
            matchCount++;
            document.getElementById('matchCount').textContent = matchCount;
            flippedCards = [];
            locked = false;
            if (matchCount === 8) {
                stopTimer();
                const msg = document.getElementById('memoryResult');
                msg.textContent = `🎉 全部配對完成！共翻了 ${flipCount} 次，耗時 ${document.getElementById('timer').textContent}`;
                msg.className = 'game-message win';
            }
        } else {
            setTimeout(() => {
                a.classList.remove('flipped');
                b.classList.remove('flipped');
                a.textContent = '';
                b.textContent = '';
                flippedCards = [];
                locked = false;
            }, 800);
        }
    }
}

function resetGame() {
    createBoard();
}

createBoard();
