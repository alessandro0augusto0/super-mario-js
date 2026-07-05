// Elementos do DOM
const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const menu = document.querySelector('.menu');
const gameContainer = document.querySelector('.game-container');
const gameOver = document.querySelector('.game-over');
const scoreElement = document.querySelector('.score');
const finalScoreElement = document.querySelector('.final-score');
const livesElement = document.querySelector('.lives');
const jumpButton = document.querySelector('.jump-button');
const pauseButton = document.querySelector('.pause-button');

// Elementos de áudio
const themeAudio = document.getElementById('theme');
const jumpAudio = document.getElementById('jump');
const gameoverAudio = document.getElementById('gameover');
const scoreAudio = document.getElementById('score');
const damageAudio = document.getElementById('damage');

// Variáveis do jogo
let score = 0;
let lives = 3;
let gameSpeed = 2; 
let gapTime = 1.5; 
let isPaused = false;
let isGameOver = false;
let gameLoop;
let pipeTimeoutId;

// Iniciar o jogo
function startGame() {
    menu.style.display = 'none';
    gameContainer.style.display = 'block';
    resetGame();

    themeAudio.currentTime = 0;
    themeAudio.play().catch(e => console.log("Autoplay bloqueado:", e));
    
    startGameLoop(); 
    pipeCycle(); 
}

function pipeCycle() {
    if (isGameOver || isPaused) return;

    pipe.classList.remove('pipe-animation');
    void pipe.offsetWidth; 
    pipe.classList.add('pipe-animation');
    pipe.style.animationDuration = `${gameSpeed}s`;

    // Adiciona o listener que vai chamar a próxima etapa quando a animação ACABAR.
    pipe.addEventListener('animationend', onPipeCycleEnd, { once: true });
}

function onPipeCycleEnd() {
    if (isGameOver) return;
    
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    // CORREÇÃO DEFINITIVA DA PONTUAÇÃO
    // Se a animação terminou, o jogador pulou com sucesso. Dê os pontos.
    increaseScore();
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // Aumenta a dificuldade para o próximo ciclo
    gameSpeed *= 0.98; 
    gapTime *= 0.99;   
    if (gameSpeed < 0.8) gameSpeed = 0.8;
    if (gapTime < 0.8) gapTime = 0.8;

    // Agenda o próximo cano APÓS o tempo de espera (gap)
    pipeTimeoutId = setTimeout(pipeCycle, gapTime * 1000);
}


// Loop principal do jogo (AGORA SOMENTE PARA COLISÃO)
function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    
    gameLoop = setInterval(() => {
        if (isGameOver) {
            clearInterval(gameLoop);
            return;
        }
        if(isPaused) return;
        
        const pipePosition = pipe.offsetLeft;
        const marioPosition = parseFloat(window.getComputedStyle(mario).getPropertyValue('bottom'));
        
        // A única responsabilidade deste loop é verificar a colisão
        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 100) {
            handleCollision();
        }
        
        // LÓGICA DE PONTUAÇÃO REMOVIDA DAQUI

    }, 10);
}

// Manipular colisão
function handleCollision() {
    isGameOver = true;
    clearTimeout(pipeTimeoutId); 
    pipe.removeEventListener('animationend', onPipeCycleEnd);
    
    pipe.style.animationPlayState = 'paused';
    mario.style.animation = 'none';

    mario.src = 'assets/img/game-over.png';
    mario.style.width = '80px';
    mario.style.marginLeft = '50px';

    themeAudio.pause();
    jumpAudio.pause();
    
    lives--;
    updateLives();

    if (lives <= 0) {
        gameoverAudio.currentTime = 0;
        gameoverAudio.play();
        
        setTimeout(() => {
            finalScoreElement.textContent = `Pontuação: ${score.toString().padStart(6, '0')}`;
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

    mario.src = 'assets/img/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '70px';
    mario.style.animation = '';

    pipe.style.animationPlayState = 'running';
    
    themeAudio.play();
    startGameLoop();
    pipeCycle(); 
}

function resetGame() {
    isGameOver = false;
    isPaused = false;
    gameOver.style.display = 'none';

    if (pipeTimeoutId) clearTimeout(pipeTimeoutId);
    pipe.removeEventListener('animationend', onPipeCycleEnd);
    
    mario.src = 'assets/img/mario.gif';
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '70px';
    mario.style.animation = '';
    pipe.style.animationPlayState = 'running';
    
    score = 0;
    lives = 3;
    gameSpeed = 2;
    gapTime = 1.5;
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
    if (isGameOver && lives > 0) return;
    isPaused = !isPaused;
    
    if (isPaused) {
        pipe.style.animationPlayState = 'paused';
        clearTimeout(pipeTimeoutId); 
        themeAudio.pause();
        pauseButton.textContent = '▶';
    } else {
        pipe.style.animationPlayState = 'running';
        themeAudio.play();
        pauseButton.textContent = '⏸';
        pipe.addEventListener('animationend', onPipeCycleEnd, { once: true });
    }
}

function jump() {
    if (isPaused || isGameOver) return;
    
    if (!mario.classList.contains('jump')) {
        mario.classList.add('jump');
        jumpAudio.currentTime = 0;
        jumpAudio.play();
        
        setTimeout(() => {
            mario.classList.remove('jump');
        }, 800);
    }
}

function increaseScore() {
    if(isGameOver) return;
    score += 10;
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
    if (e.key === 'Escape') togglePause();
});

document.addEventListener('touchstart', jump);
jumpButton.addEventListener('click', jump);
pauseButton.addEventListener('click', togglePause);