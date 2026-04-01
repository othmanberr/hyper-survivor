const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- CHARGEMENT DES ASSETS GRAPHIQUES ---
const bgImage = new Image();
bgImage.src = 'assets/backgroundstage1.png';

// IDLE (Attente) - 4 frames
const totalIdleFrames = 4;
const playerIdleImages = [];
for (let i = 1; i <= totalIdleFrames; i++) {
    const img = new Image();
    img.src = `assets/idle/idle${i}.png`; 
    playerIdleImages.push(img);
}

// WALK (Marche) - 10 frames
const totalWalkFrames = 10; 
const playerWalkImages = [];
for (let i = 1; i <= totalWalkFrames; i++) {
    const img = new Image();
    img.src = `assets/walk/walk${i}.png`; 
    playerWalkImages.push(img);
}

// KICK (Coup de pied au sol) - 5 frames
const totalGroundKickFrames = 5; 
const playerGroundKickImages = [];
for (let i = 1; i <= totalGroundKickFrames; i++) {
    const img = new Image();
    img.src = `assets/kick/kick${i}.png`; 
    playerGroundKickImages.push(img);
}

// PUNCH (Coup de poing) - 3 frames
const totalPunchFrames = 3; 
const playerPunchImages = [];
for (let i = 1; i <= totalPunchFrames; i++) {
    const img = new Image();
    img.src = `assets/punch/punch${i}.png`; 
    playerPunchImages.push(img);
}

// JUMP KICK (Coup de pied sauté) - 3 frames
const totalJumpKickFrames = 3; 
const playerJumpKickImages = [];
for (let i = 1; i <= totalJumpKickFrames; i++) {
    const img = new Image();
    // Attention : dossier "jump-kick" mais fichier "jumpkick" (sans tiret)
    img.src = `assets/jump-kick/jumpkick${i}.png`; 
    playerJumpKickImages.push(img);
}
// ----------------------------------------------------------------------

// --- GESTION DE L'ANIMATION ET DES ÉTATS ---
let gameFrame = 0;
const idleWalkStagger = 8; // Vitesse lente pour la marche
const attackStagger = 15;  // Vitesse très lente pour bien voir les coups
// ------------------------------

// --- CONFIGURATION DU MONDE ---
const gravity = 0.8;
const groundY = 500;

let timeSinceLastPunch = 0;
const punchCooldown = 15;

let timeSinceLastKick = 0; 
const groundKickCooldown = 30;

const GAME_STATE = {
    MENU: 'MENU',
    RUNNING: 'RUNNING',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY'
};
let gameState = GAME_STATE.RUNNING;

// --- LE JOUEUR ---
const player = {
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    speed: 5,
    dy: 0,
    jumpPower: -15,
    isGrounded: false,
    hp: 3,
    isHit: false,
    hitTimer: 0,
    state: 'idle', 
    facing: 'right' 
};
const MAX_HP = 3;

// --- SCORE ET ENNEMIS ---
let score = 0;
let initialEnemyCount = 0;
const enemies = [];
const enemySpeed = 1;

function Enemy(x, y, width, height, color, hp) {
    this.x = x;
    this.y = y - height;
    this.width = width;
    this.height = height;
    this.color = color;
    this.hp = hp;
    this.speed = enemySpeed;
}

function initializeEnemies() {
    enemies.push(new Enemy(600, groundY, 40, 50, 'green', 1));
    enemies.push(new Enemy(900, groundY, 40, 50, 'green', 1));
    enemies.push(new Enemy(1200, groundY, 40, 50, 'green', 1));
    initialEnemyCount = enemies.length; 
}

function resetGame() {
    player.hp = MAX_HP;
    player.x = 100;
    player.y = 100;
    score = 0;
    enemies.length = 0;
    initializeEnemies();
    gameState = GAME_STATE.RUNNING;
}

initializeEnemies();

// --- CLAVIER ---
const keys = { right: false, left: false, up: false, punch: false, groundKick: false, restart: false }; 

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyK') keys.groundKick = true; 
    if (e.code === 'KeyJ') keys.punch = true;      
    if (e.code === 'KeyR') keys.restart = true; 
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'Space' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyK') keys.groundKick = false;
    if (e.code === 'KeyJ') keys.punch = false;
    if (e.code === 'KeyR') keys.restart = false; 
});

function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}

// --- UPDATE ---
function update() {
    if (gameState !== GAME_STATE.RUNNING) {
        if (keys.restart) resetGame();
        return;
    }
    
    timeSinceLastKick++;
    timeSinceLastPunch++;

    // JOUEUR ET CHANGEMENT D'ÉTAT
    player.state = 'idle';

    if (keys.right) { 
        player.x += player.speed; 
        player.facing = 'right'; 
        player.state = 'walk'; 
    }
    if (keys.left) { 
        player.x -= player.speed; 
        player.facing = 'left'; 
        player.state = 'walk'; 
    }
    
    // PRIORITÉ D'ATTAQUE 
    
    if (keys.groundKick && !player.isGrounded) { 
        player.state = 'jumpKick';
    } 
    else if (keys.groundKick && player.isGrounded && timeSinceLastKick > groundKickCooldown) { 
        player.state = 'groundKick';
    } 
    else if (keys.punch && timeSinceLastPunch > punchCooldown) {
        player.state = 'punch'; 
    }
    
    // [Logique du joueur: gravité, limites]
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    if (keys.up && player.isGrounded) {
        player.dy = player.jumpPower;
        player.isGrounded = false;
    }
    player.dy += gravity;
    player.y += player.dy;
    
    // GESTION DU SOL (CORRIGÉE ICI)
    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.dy = 0; // <--- C'est la correction importante !
        player.isGrounded = true;
        if (player.state === 'jumpKick') {
             player.state = 'idle';
        }
    } else {
        player.isGrounded = false;
    }
    
    if (player.isHit) {
        player.hitTimer++;
        if (player.hitTimer >= 60) {
            player.isHit = false;
            player.hitTimer = 0;
        }
    }

    // --- LOGIQUE DE COLLISION MULTI-ATTAQUES vs ENNEMIS ---
    if (player.state === 'punch' || player.state === 'groundKick' || player.state === 'jumpKick') {
        
        let hitboxWidth;
        let hitboxHeight;
        let damage = 1;

        if (player.state === 'punch') {
            hitboxWidth = 20; 
            hitboxHeight = 20;
            damage = 1;
            timeSinceLastPunch = 0;
        } else if (player.state === 'groundKick') {
            hitboxWidth = 35; 
            hitboxHeight = player.height;
            damage = 2; 
            timeSinceLastKick = 0;
        } else if (player.state === 'jumpKick') {
            hitboxWidth = 40; 
            hitboxHeight = 30;
            damage = 1;
        }
        
        const hitboxX = player.facing === 'right' 
            ? player.x + player.width 
            : player.x - hitboxWidth; 
            
        const hitboxY = player.state === 'jumpKick' 
            ? player.y + player.height / 2 
            : player.y;

        const attackHitbox = {
            x: hitboxX, 
            y: hitboxY,
            width: hitboxWidth, 
            height: hitboxHeight
        };

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (checkCollision(attackHitbox, enemy)) {
                enemy.hp -= damage; 

                if (enemy.hp <= 0) {
                    enemies.splice(j, 1);
                    score++;
                }
            }
        }
    }

    // [Logique des ENNEMIS]
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x -= enemy.speed; 
        if (checkCollision(player, enemy) && !player.isHit) {
            player.hp--; 
            player.isHit = true;
            player.hitTimer = 0; 
        }
        if (enemy.x + enemy.width < 0) enemies.splice(i, 1); 
    }

    if (player.hp <= 0) gameState = GAME_STATE.GAME_OVER;
    if (score >= initialEnemyCount && initialEnemyCount > 0) gameState = GAME_STATE.VICTORY;
}

// --- DRAW (PARTIE GRAPHIQUE) ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. DESSINER LE BACKGROUND
    if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. LOGIQUE DE SÉLECTION D'ASSET
    let currentAssetArray;
    let totalFrames;
    let currentStagger;
    
    switch (player.state) {
        case 'punch':
            currentAssetArray = playerPunchImages;
            totalFrames = totalPunchFrames;
            currentStagger = attackStagger; 
            break;
        case 'jumpKick':
            currentAssetArray = playerJumpKickImages;
            totalFrames = totalJumpKickFrames;
            currentStagger = attackStagger; 
            break;
        case 'groundKick':
            currentAssetArray = playerGroundKickImages;
            totalFrames = totalGroundKickFrames;
            currentStagger = attackStagger; 
            break;
        case 'walk':
            currentAssetArray = playerWalkImages; 
            totalFrames = totalWalkFrames; 
            currentStagger = idleWalkStagger; 
            break;
        case 'idle':
        default:
            currentAssetArray = playerIdleImages;
            totalFrames = totalIdleFrames;
            currentStagger = idleWalkStagger; 
            break;
    }

    // Calcul de la frame
    const frameIndex = Math.floor(gameFrame / currentStagger) % totalFrames;
    const currentImage = currentAssetArray[frameIndex];

    if (currentImage && currentImage.complete && (!player.isHit || player.hitTimer % 6 < 3)) {
        
        // LOGIQUE DE FLIP 
        if (player.facing === 'left') {
            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height / 2); 
            ctx.scale(-1, 1); 
            ctx.drawImage(
                currentImage, 
                0, 0, currentImage.width, currentImage.height, 
                -player.width / 2, -player.height / 2, 
                player.width, player.height 
            );
            ctx.restore();
            
        } else {
            ctx.drawImage(
                currentImage, 
                0, 0, currentImage.width, currentImage.height, 
                player.x, player.y,     
                player.width, player.height 
            );
        }
        
    } else if (!currentImage || !currentImage.complete) {
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // 3. ENNEMIS
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '24px monospace';
    ctx.fillText(`HP: ${player.hp} / ${MAX_HP}`, 20, 40);
    ctx.fillText(`SCORE: ${score}`, 600, 40);
    ctx.fillText(`Action: J=Punch | K=Kick`, 20, 70); 

    if (gameState === GAME_STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
    if (gameState === GAME_STATE.VICTORY) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'gold';
        ctx.textAlign = 'center';
        ctx.fillText('VICTOIRE !', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
    gameFrame++;
}

gameLoop();