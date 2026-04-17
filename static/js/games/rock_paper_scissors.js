let playerScore = 0;
let computerScore = 0;

const choices = ['scissors', 'rock', 'paper'];
const emoji = { scissors: '✌️', rock: '✊', paper: '🖐️' };
const names = { scissors: '剪刀', rock: '石頭', paper: '布' };

function play(playerPick) {
    const computerPick = choices[Math.floor(Math.random() * 3)];

    document.getElementById('playerChoice').textContent = emoji[playerPick];
    document.getElementById('computerChoice').textContent = emoji[computerPick];

    const result = document.getElementById('rpsResult');

    if (playerPick === computerPick) {
        result.textContent = '平手！';
        result.className = 'game-message draw';
    } else if (
        (playerPick === 'scissors' && computerPick === 'paper') ||
        (playerPick === 'rock' && computerPick === 'scissors') ||
        (playerPick === 'paper' && computerPick === 'rock')
    ) {
        playerScore++;
        result.textContent = `你贏了！${names[playerPick]} 勝 ${names[computerPick]}`;
        result.className = 'game-message win';
    } else {
        computerScore++;
        result.textContent = `你輸了！${names[computerPick]} 勝 ${names[playerPick]}`;
        result.className = 'game-message lose';
    }

    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('computerScore').textContent = '0';
    document.getElementById('playerChoice').textContent = '❓';
    document.getElementById('computerChoice').textContent = '❓';
    document.getElementById('rpsResult').textContent = '';
    document.getElementById('rpsResult').className = 'game-message';
}
