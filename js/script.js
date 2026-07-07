// Elementos do DOM
const mario = document.querySelector('.mario');
const obstacle = document.getElementById('obstacle');
const powerup = document.getElementById('powerup');
const menu = document.querySelector('.menu');
const pauseMenu = document.querySelector('.pause-menu');
const gameContainer = document.querySelector('.game-container');
const gameOver = document.querySelector('.game-over');
const scoreElement = document.querySelector('.score');
const finalScoreElement = document.querySelector('.final-score');
const highScoreElement = document.querySelector('.high-score');
const finalLevelElement = document.querySelector('.final-level');
const livesElement = document.querySelector('.lives');
const jumpButton = document.querySelector('.jump-button');
const pauseButton = document.querySelector('.pause-button');
const levelValueElement = document.querySelector('.level-value');
const comboTextElement = document.getElementById('combo-text');
const countdownDisplay = document.getElementById('countdown-display');

// Elementos de áudio
const themeAudio = document.getElementById('theme');
const jumpAudio = document.getElementById('jump');
const gameoverAudio = document.getElementById('gameover');
const scoreAudio = document.getElementById('score');
const damageAudio = document.getElementById('damage');

// Web Audio API para sons extras (Contagem e Powerup)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(frequency, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
}

// Variáveis do jogo
let score = 0;
let highScore = localStorage.getItem('marioHighScore') || 0;
let lives = 3;
let gameSpeed = 2; 
let gapTime = 1.5; 
let level = 1;
let comboCount = 0;
let isPaused = false;
let isGameOver = false;
let isCountingDown = false;
let gameLoop;
let obstacleTimeoutId;

// Contagem Regressiva
function startCountdown(callback) {
    isCountingDown = true;
    countdownDisplay.style.display = 'block';
    let count = 3;
    countdownDisplay.textContent = count;
    playBeep(440, 0.1);

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDisplay.textContent = count;
            playBeep(440, 0.1);
        } else if (count === 0) {
            countdownDisplay.textContent = 'GO!';
            playBeep(880, 0.3);
        } else {
            clearInterval(interval);
            countdownDisplay.style.display = 'none';
            isCountingDown = false;
            callback();
        }
    }, 1000);
}

// Iniciar o jogo
function startGame() {
    menu.style.display = 'none';
    gameContainer.style.display = 'block';
    resetGame();

    startCountdown(() => {
        themeAudio.currentTime = 0;
        themeAudio.play().catch(e => console.log("Autoplay bloqueado:", e));
        
        startGameLoop(); 
        obstacleCycle(); 
    });
}

function obstacleCycle() {
    if (isGameOver || isPaused || isCountingDown) return;

    obstacle.classList.remove('pipe-animation');
    void obstacle.offsetWidth; 
    obstacle.classList.add('pipe-animation');
    obstacle.style.animationDuration = `${gameSpeed}s`;

    // 70% Cano, 30% Goomba
    if (Math.random() > 0.7) {
        obstacle.src = 'assets/img/goomba.png';
        obstacle.style.width = '60px';
    } else {
        obstacle.src = 'assets/img/pipe.png';
        obstacle.style.width = '80px';
    }

    // Powerup chance: 40%
    if (Math.random() > 0.6) {
        powerup.style.display = 'block';
        powerup.classList.remove('powerup-animation');
        void powerup.offsetWidth;
        powerup.classList.add('powerup-animation');
        powerup.style.animationDuration = `${gameSpeed * 1.2}s`;
    }

    obstacle.addEventListener('animationend', onObstacleCycleEnd, { once: true });
}

function onObstacleCycleEnd() {
    if (isGameOver) return;
    
    // Combo system
    comboCount++;
    if (comboCount >= 3) {
        increaseScore(20);
        showComboMsg();
    } else {
        increaseScore(10);
    }

    // Aumentar dificuldade com limite justo
    gameSpeed *= 0.98; 
    gapTime *= 0.99;   
    if (gameSpeed < 1.0) gameSpeed = 1.0;
    if (gapTime < 1.0) gapTime = 1.0;

    level = Math.floor((2 - gameSpeed) * 10) + 1;
    if (levelValueElement) levelValueElement.textContent = level;

    obstacleTimeoutId = setTimeout(obstacleCycle, gapTime * 1000);
}

function showComboMsg() {
    comboTextElement.textContent = `COMBO x${comboCount}!`;
    comboTextElement.classList.add('combo-active');
    setTimeout(() => {
        comboTextElement.classList.remove('combo-active');
    }, 1000);
}

// Loop principal do jogo
function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    
    gameLoop = setInterval(() => {
        if (isGameOver || isPaused || isCountingDown) return;
        
        const obstaclePosition = obstacle.offsetLeft;
        const marioPosition = parseFloat(window.getComputedStyle(mario).getPropertyValue('bottom'));
        const powerupPosition = powerup.offsetLeft;
        const powerupDisplay = window.getComputedStyle(powerup).getPropertyValue('display');
        
        // Colisão com obstáculo
        if (obstaclePosition <= 120 && obstaclePosition > 0 && marioPosition < 100) {
            handleCollision();
        }

        // Colisão com powerup (Mário precisa pular)
        if (powerupDisplay !== 'none' && powerupPosition <= 120 && powerupPosition > 0 && marioPosition > 40) {
            powerup.style.display = 'none';
            score += 50;
            updateScore();
            lives++;
            if (lives > 5) lives = 5; // Máximo 5 vidas
            updateLives();
            playBeep(660, 0.1);
            setTimeout(() => playBeep(880, 0.2), 150);
            showComboMsg(); // Bonus feedback
        }

    }, 10);
}

// Manipular colisão
function handleCollision() {
    isGameOver = true;
    clearTimeout(obstacleTimeoutId); 
    obstacle.removeEventListener('animationend', onObstacleCycleEnd);
    
    obstacle.style.animationPlayState = 'paused';
    powerup.style.animationPlayState = 'paused';
    mario.style.animation = '';
    mario.classList.remove('jump');

    mario.classList.add('damage-blink');
    
    mario.src = 'assets/img/game-over.png';
    mario.style.width = '80px';
    mario.style.marginLeft = '50px';

    comboCount = 0; // Zera o combo

    themeAudio.pause();
    jumpAudio.pause();
    
    lives--;
    updateLives();

    if (lives <= 0) {
        gameoverAudio.currentTime = 0;
        gameoverAudio.play();
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('marioHighScore', highScore);
        }
        
        setTimeout(() => {
            finalScoreElement.textContent = score.toString().padStart(6, '0');
            if(highScoreElement) highScoreElement.textContent = highScore.toString().padStart(6, '0');
            if(finalLevelElement) finalLevelElement.textContent = level;
            gameOver.style.display = 'flex';
        }, 1500);
    } else {
        damageAudio.currentTime = 0;
        damageAudio.play();
        
        setTimeout(resetAfterCollision, 2000);
    }
}

// Resetar após colisão (quando ainda tem vidas)
function resetAfterCollision() {
    isGameOver = false;

    mario.classList.remove('damage-blink');
    mario.src = 'assets/img/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '70px';
    mario.style.animation = '';

    obstacle.style.animationPlayState = 'running';
    powerup.style.display = 'none';
    
    themeAudio.play();
    startGameLoop();
    
    // Se o obstáculo já estava perto de sair, melhor recomeçar o ciclo
    obstacleCycle(); 
}

function resetGame() {
    isGameOver = false;
    isPaused = false;
    isCountingDown = false;
    gameOver.style.display = 'none';
    pauseMenu.style.display = 'none';

    if (obstacleTimeoutId) clearTimeout(obstacleTimeoutId);
    obstacle.removeEventListener('animationend', onObstacleCycleEnd);
    
    mario.classList.remove('damage-blink');
    mario.src = 'assets/img/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '70px';
    mario.style.animation = '';
    
    obstacle.style.animationPlayState = 'running';
    powerup.style.animationPlayState = 'running';
    powerup.style.display = 'none';
    
    score = 0;
    lives = 3;
    gameSpeed = 2;
    gapTime = 1.5;
    level = 1;
    comboCount = 0;

    if (levelValueElement) levelValueElement.textContent = level;
    
    updateScore();
    updateLives();
    
    gameoverAudio.pause();
    gameoverAudio.currentTime = 0;
}

function restartGame() {
    resetGame();
    startGame();
}

function togglePause() {
    if (isGameOver || lives <= 0 || isCountingDown) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        obstacle.style.animationPlayState = 'paused';
        powerup.style.animationPlayState = 'paused';
        clearTimeout(obstacleTimeoutId); 
        themeAudio.pause();
        pauseMenu.style.display = 'flex';
    } else {
        pauseMenu.style.display = 'none';
        
        startCountdown(() => {
            obstacle.style.animationPlayState = 'running';
            powerup.style.animationPlayState = 'running';
            themeAudio.play();
            obstacle.addEventListener('animationend', onObstacleCycleEnd, { once: true });
        });
    }
}

function jump() {
    if (isPaused || isGameOver || isCountingDown) return;
    
    if (!mario.classList.contains('jump')) {
        mario.classList.add('jump');
        jumpAudio.currentTime = 0;
        jumpAudio.play();
        
        setTimeout(() => {
            mario.classList.remove('jump');
        }, 800);
    }
}

function increaseScore(amount) {
    if(isGameOver) return;
    score += amount;
    updateScore();
    scoreAudio.currentTime = 0;
    scoreAudio.play();
}

function updateScore() {
    scoreElement.textContent = score.toString().padStart(6, '0');
}

function updateLives() {
    livesElement.textContent = '❤️'.repeat(lives);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
    if (e.key === 'Enter' && menu.style.display !== 'none') startGame();
    if (e.key === 'Escape' && gameContainer.style.display !== 'none') togglePause();
});

document.addEventListener('touchstart', jump);
jumpButton.addEventListener('click', jump);
pauseButton.addEventListener('click', togglePause);