// ============ DEGEN FX SYSTEM ============
// Crypto slang, Jeff Panic, Rug Pull death, Hip-Hop Ad-Libs

// ---- SLANG POOLS ----
const DEGEN_SLANG = {
    enemyHit: ['REKT', 'NGMI', 'GG', '-100x', 'PAPER HANDS', 'COPE', 'RUGGED', 'DUMPED', 'FADED', 'DOWN ONLY'],
    critical: ['PUMP IT! 🚀', 'TO THE MOON 🚀', 'WAGMI', 'BULL RUN', '100x LONG', 'GREEN DILDO', 'SEND IT'],
    playerHit: ['MARGIN CALL', 'LIQUIDATED', 'STOP LOSS HIT', 'REKT', 'DOWN BAD', 'GUH', 'OUCH'],
    enemyDeath: ['DUMPED', 'SOLD THE BOTTOM', 'EXIT SCAM', 'DELISTED', 'RUG\'D'],
    highCombo: ['WHALE ALERT 🐋', 'DEGEN MODE', 'FULL SEND', 'APE IN', 'DIAMOND HANDS 💎', 'NO STOP LOSS'],
    panic: ['J\'AI PAS DE LIQUIDE!!', 'FUNDS NOT SAFU', 'BANK RUN', 'INSOLVABLE', 'APPEL DE MARGE!!']
};

const DEGEN_COLORS = {
    enemyHit: '#ff6b6b',
    critical: '#2ed573',
    playerHit: '#ff4757',
    enemyDeath: '#ffa502',
    highCombo: '#7c4dff',
    panic: '#ff0000'
};

// ---- STATE ----
let jeffPanicActive = false;
let jeffPanicCooldown = 0;
let rugPullActive = false;
let rugPullPhase = 0;
let rugPullTimer = 0;
let degenComboAdLibCd = 0;

// ---- 1. CRYPTO SLANG FLOATING TEXT ----

function degenSlang(pool) {
    const arr = DEGEN_SLANG[pool];
    return arr[Math.floor(Math.random() * arr.length)];
}

function spawnDegenText(x, y, pool, extraScale) {
    const text = degenSlang(pool);
    const scale = (extraScale || 1);
    addDmgNum({
        x: x + (Math.random() - 0.5) * 30,
        y: y - 15 - Math.random() * 10,
        n: text,
        life: 0.7,
        col: DEGEN_COLORS[pool],
        degen: true,
        scale: scale,
        rot: (Math.random() - 0.5) * 0.3  // slight random rotation
    });
}

// Called from game.js on enemy hit
function degenOnEnemyHit(x, y, isCrit) {
    if (isCrit) {
        // Always show crit slang
        spawnDegenText(x, y - 10, 'critical', 1.4);
        fxGreenCandle(x, y);
        // 30% chance of ad-lib on crit with high leverage
        if (P.leverage > 10 && Math.random() < 0.3) playSound('airhorn');
    } else if (Math.random() < 0.12) {
        // 12% chance on normal hit
        spawnDegenText(x, y, 'enemyHit', 1);
    }
}

// Called from game.js on player hit
function degenOnPlayerHit(x, y) {
    if (Math.random() < 0.35) {
        spawnDegenText(x, y - 20, 'playerHit', 1.2);
    }
}

// Called from game.js on enemy death
function degenOnEnemyDeath(x, y) {
    if (Math.random() < 0.08) {
        spawnDegenText(x, y, 'enemyDeath', 1);
    }
}

// Called from game.js on combo thresholds
function degenOnCombo(combo) {
    if (combo === 20 || combo === 50 || combo === 100) {
        spawnDegenText(P.x, P.y - 40, 'highCombo', 1.6);
        if (combo >= 50) playSound('airhorn');
        else playSound('bassDrop');
    }
}

// Green candle particle effect on crits
function fxGreenCandle(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            vx: (Math.random() - 0.5) * 30,
            vy: -120 - Math.random() * 80, // rise upward
            life: 0.6 + Math.random() * 0.3,
            col: i % 2 === 0 ? '#2ed573' : '#7bed9f',
            sz: 3 + Math.random() * 4,
            type: 'candle'
        });
    }
}

// ---- DEGEN TEXT RENDERER (enhanced dmgNums) ----
function renderDegenText(ctx, d) {
    if (!d.degen) return false; // not a degen text, use default renderer
    const t = d.life / 0.7;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2.5);
    const baseSize = 14 * (d.scale || 1);
    const pump = 1 + Math.sin((1 - t) * Math.PI * 3) * 0.15; // pumping scale
    const size = baseSize * pump;
    ctx.font = `900 ${size}px 'Exo 2'`;
    ctx.textAlign = 'center';
    ctx.translate(d.x, d.y);
    if (d.rot) ctx.rotate(d.rot * t); // rotation fades with time
    ctx.fillStyle = d.col;
    ctx.fillText(d.n, 0, 0);
    ctx.restore();
    return true;
}

// ---- 2. JEFF PANIC (LOW LIQUIDITY) ----

function updateJeffPanic(dt) {
    if (jeffPanicCooldown > 0) jeffPanicCooldown -= dt;

    const threshold = P.maxHp * 0.15;
    if (P.hp > 0 && P.hp <= threshold && !jeffPanicActive && jeffPanicCooldown <= 0) {
        jeffPanicActive = true;
        jeffPanicCooldown = 8; // don't re-trigger for 8s
        // Spawn panic text
        const panicText = degenSlang('panic');
        addDmgNum({
            x: P.x, y: P.y - 40, n: panicText,
            life: 1.2, col: '#ff0000', degen: true, scale: 1.8, rot: 0
        });
        playSound('jeffPanic');
        triggerShake(12, 0.5);
    }

    if (P.hp > threshold) jeffPanicActive = false;
}

function renderJeffPanic(ctx) {
    if (!jeffPanicActive || P.hp <= 0) return;

    const W = ctx.canvas.width, H = ctx.canvas.height;

    // CRT barrel distortion overlay (via vignette + scanlines)
    ctx.save();
    const pulse = 0.15 + Math.sin(G.totalTime * 8) * 0.1;
    ctx.globalAlpha = pulse;

    // Red/orange vignette — more intense than leverage
    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.1, W / 2, H / 2, W * 0.5);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.5, 'rgba(255, 0, 0, 0.2)');
    vignette.addColorStop(1, 'rgba(200, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Scanline glitch bands
    ctx.globalAlpha = 0.08;
    for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = y % 6 === 0 ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, y, W, 1);
    }

    // Random glitch bar
    if (Math.random() < 0.15) {
        const gy = Math.random() * H;
        const gh = 5 + Math.random() * 20;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, gy, W, gh);
    }

    // ⚠ LOW LIQUIDITY ⚠ bar
    ctx.globalAlpha = 0.5 + Math.sin(G.totalTime * 6) * 0.3;
    ctx.font = "bold 11px 'JetBrains Mono'";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(W / 2 - 120, 140, 240, 20);
    ctx.fillStyle = '#000';
    ctx.fillText('⚠ LOW LIQUIDITY ⚠', W / 2, 155);

    ctx.restore();
}

// Jeff sprite shake offset (called from render)
function getJeffShakeOffset() {
    if (!jeffPanicActive) return { x: 0, y: 0 };
    return {
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 4
    };
}

// ---- 3. RUG PULL DEATH SEQUENCE ----

function startRugPull(onComplete) {
    rugPullActive = true;
    rugPullPhase = 0;
    rugPullTimer = 0;

    // Create overlay
    const overlay = document.getElementById('rug-pull-overlay');
    overlay.classList.remove('h');
    overlay.innerHTML = '';

    // Phase timeline:
    // 0-0.2s: freeze
    // 0.2-1.0s: glitch (RGB split, shake, assets disappear)
    // 1.0-2.0s: crash terminal
    // 2.0s: reveal game over

    const timeline = [
        { at: 0, fn: () => { rugPullPhase = 1; } }, // freeze
        {
            at: 200, fn: () => {
                rugPullPhase = 2; // glitch
                overlay.classList.add('rug-glitch');
                playSound('bassDrop');
                triggerShake(20, 0.8);
            }
        },
        {
            at: 1000, fn: () => {
                rugPullPhase = 3; // terminal
                overlay.classList.remove('rug-glitch');
                overlay.classList.add('rug-terminal');
                overlay.innerHTML = buildCrashTerminal();
                playSound('introGlitch');
            }
        },
        {
            at: 2200, fn: () => {
                rugPullActive = false;
                rugPullPhase = 0;
                overlay.classList.add('h');
                overlay.classList.remove('rug-glitch', 'rug-terminal');
                overlay.innerHTML = '';
                onComplete();
            }
        }
    ];

    timeline.forEach(t => setTimeout(t.fn, t.at));
}

function buildCrashTerminal() {
    const lines = [
        '> CRITICAL ERROR',
        '> ERR_FUNDS_NOT_SAFU',
        '> 404: Portfolio Not Found',
        '> FATAL: rug_pull.exe has crashed',
        '> Liquidation cascade detected...',
        '> Assets: $0.00',
        '>',
        '> Press RETRY to cope'
    ];
    return `
    <div class="rug-terminal-inner">
      <div class="rug-terminal-header">⚠ SYSTEM FAILURE ⚠</div>
      <div class="rug-chart"></div>
      ${lines.map((l, i) => `<div class="rug-line" style="animation-delay:${i * 0.12}s">${l}</div>`).join('')}
    </div>
  `;
}

function renderRugPull(ctx) {
    if (!rugPullActive) return;
    const W = ctx.canvas.width, H = ctx.canvas.height;

    if (rugPullPhase === 2) {
        // RGB channel split glitch
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = 'screen';

        // Red channel offset
        ctx.fillStyle = 'rgba(255,0,0,0.15)';
        const ox = (Math.random() - 0.5) * 20;
        ctx.fillRect(ox, 0, W, H);

        // Cyan channel offset
        ctx.fillStyle = 'rgba(0,255,255,0.1)';
        ctx.fillRect(-ox, 0, W, H);

        // Random glitch blocks
        for (let i = 0; i < 8; i++) {
            const gx = Math.random() * W;
            const gy = Math.random() * H;
            const gw = 30 + Math.random() * 100;
            const gh = 3 + Math.random() * 15;
            ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,255'}, 0.3)`;
            ctx.fillRect(gx, gy, gw, gh);
        }

        // Flash
        if (Math.random() < 0.3) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, W, H);
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }
}

// ---- 4. HIP-HOP AD-LIBS ----

function degenAdLib(dt) {
    if (degenComboAdLibCd > 0) degenComboAdLibCd -= dt;
}

function triggerAdLib() {
    if (degenComboAdLibCd > 0) return;
    degenComboAdLibCd = 3; // 3s cooldown between ad-libs
    const sounds = ['airhorn', 'bassDrop', 'bruh'];
    playSound(sounds[Math.floor(Math.random() * sounds.length)]);
}

// ---- MASTER UPDATE ----
function updateDegenFX(dt) {
    updateJeffPanic(dt);
    degenAdLib(dt);
}

// ---- MASTER RENDER (screen-space, after HUD) ----
function renderDegenFX(ctx) {
    renderJeffPanic(ctx);
    renderRugPull(ctx);
}
