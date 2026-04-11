// ============ ULTIMATE ABILITY: HYPURR ATTACK ============
// Charge by killing enemies. Press R to unleash Hypurr the cat.

const ULT = {
    charge: 0,
    maxCharge: 80,       // kills needed
    active: false,
    timer: 0,
    phase: 0,            // 0=idle, 1=windup, 2=blast, 3=aftermath
    pulseTimer: 0,       // visual pulse when fully charged
    shockRadius: 0,
    shockMaxRadius: 600,
};

function chargeUltimate(amount) {
    if (ULT.active) return;
    ULT.charge = Math.min(ULT.maxCharge, ULT.charge + (amount || 1));
}

function isUltReady() { return ULT.charge >= ULT.maxCharge && !ULT.active; }

function activateUltimate() {
    if (!isUltReady()) return;
    ULT.active = true;
    ULT.charge = 0;
    ULT.phase = 1;
    ULT.timer = 0;
    ULT.shockRadius = 0;

    // Windup: slowmo + flash
    triggerSlowmo(0.05, 0.6);
    playSound('bassDrop');

    // Phase timeline
    setTimeout(() => {
        ULT.phase = 2; // BLAST
        triggerShake(25, 0.8);
        playSound('airhorn');
        playSound('bassDrop');

        // Damage all enemies on screen
        enemies.each(e => {
            if (!e.active || e.dying) return;
            const ds = Math.hypot(e.x - P.x, e.y - P.y);
            if (ds < ULT.shockMaxRadius) {
                const dmg = 999;
                e.hp -= dmg;
                G.totalDmgDealt += dmg;
                // Knockback away from player
                const nx = (e.x - P.x) / (ds || 1);
                const ny = (e.y - P.y) / (ds || 1);
                e.kbX += nx * 15;
                e.kbY += ny * 15;
                e.flash = 0.2;
                dmgNums.push({
                    x: e.x, y: e.y - e.sz, n: 'MEOW!',
                    life: 0.8, col: '#ff4757', degen: true, scale: 1.3, rot: (Math.random() - 0.5) * 0.4
                });
                if (e.hp <= 0) enemyDeath(e);
            }
        });
        if (G.boss && G.phase === 'boss') {
            const ds = Math.hypot(G.boss.x - P.x, G.boss.y - P.y);
            if (ds < ULT.shockMaxRadius) {
                const dmg = 999;
                G.totalDmgDealt += dmg;
                G.boss.hit(dmg);
            }
        }

        // Spawn massive particle explosion
        for (let i = 0; i < 60; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 150 + Math.random() * 350;
            particles.push({
                x: P.x, y: P.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 0.6 + Math.random() * 0.5,
                col: ['#ff4757', '#ffa502', '#2ed573', '#00d2d3', '#ffd700'][Math.floor(Math.random() * 5)],
                sz: 3 + Math.random() * 5
            });
        }

        // Cat paws rain
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: P.x + (Math.random() - 0.5) * 800,
                y: P.y + (Math.random() - 0.5) * 600,
                vx: (Math.random() - 0.5) * 50,
                vy: -200 - Math.random() * 200,
                life: 0.8 + Math.random() * 0.6,
                col: i % 2 === 0 ? '#ff9f43' : '#ff6b6b',
                sz: 10 + Math.random() * 8,
                vis: 'paw'
            });
        }

        // Big Hypurr text
        dmgNums.push({
            x: P.x, y: P.y - 50, n: '🐾 HYPURR ATTACK 🐾',
            life: 1.5, col: '#ff9f43', degen: true, scale: 2.2, rot: 0
        });

    }, 400); // after windup

    setTimeout(() => {
        ULT.phase = 3; // aftermath
    }, 1200);

    setTimeout(() => {
        ULT.active = false;
        ULT.phase = 0;
    }, 2000);
}

function updateUltimate(dt) {
    if (ULT.active && ULT.phase === 2) {
        ULT.shockRadius = Math.min(ULT.shockMaxRadius, ULT.shockRadius + 1500 * dt);
    }
    if (isUltReady()) {
        ULT.pulseTimer += dt;
    }
}

function renderUltimateEffect(ctx) {
    if (!ULT.active) return;

    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.save();

    if (ULT.phase === 1) {
        // Windup: white vignette pulling inward
        const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
        vig.addColorStop(0, 'rgba(255,255,255,0.3)');
        vig.addColorStop(1, 'transparent');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
    }

    if (ULT.phase === 2) {
        // Red/Orange Tint Flash
        ctx.globalAlpha = Math.max(0, 0.4 - ULT.shockRadius / ULT.shockMaxRadius * 0.4);
        ctx.fillStyle = '#ff9f43';
        ctx.fillRect(0, 0, W, H);

        // Huge Hypurr Emoji Background
        const scale = 1 + (ULT.shockRadius / ULT.shockMaxRadius) * 0.5;
        ctx.globalAlpha = Math.max(0, 0.3 - (ULT.shockRadius / ULT.shockMaxRadius) * 0.3);
        ctx.font = `${W * 0.6 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐱', W / 2, H / 2);
    }

    ctx.restore();
}

// Render shockwave ring in world-space
function renderUltimateWorld(ctx) {
    if (!ULT.active || ULT.phase !== 2 || ULT.shockRadius <= 0) return;

    ctx.save();
    ctx.globalAlpha = 0.6 * (1 - ULT.shockRadius / ULT.shockMaxRadius);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4 + (1 - ULT.shockRadius / ULT.shockMaxRadius) * 8;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(P.x, P.y, ULT.shockRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(P.x, P.y, ULT.shockRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
}

// HUD: Charge meter (bottom center)
function renderUltimateHUD(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const barW = 160, barH = 8;
    const bx = W / 2 - barW / 2, by = H - 35;
    const pct = ULT.charge / ULT.maxCharge;

    ctx.save();

    // Background
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx - 2, by - 2, barW + 4, barH + 4, 4);
    ctx.fill(); ctx.stroke();

    // Fill
    ctx.globalAlpha = 0.9;
    const ready = isUltReady();
    if (ready) {
        // Pulsing gold when charged
        const pulse = 0.7 + Math.sin(ULT.pulseTimer * 6) * 0.3;
        ctx.globalAlpha = pulse;
    }

    const grad = ctx.createLinearGradient(bx, 0, bx + barW * pct, 0);
    grad.addColorStop(0, ready ? '#ffd700' : '#ff6b6b');
    grad.addColorStop(1, ready ? '#ff9f43' : '#ff4757');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * pct, barH, 3);
    ctx.fill();

    // Label
    ctx.globalAlpha = 0.7;
    ctx.font = "bold 9px 'JetBrains Mono'";
    ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#ffd700' : '#888';
    ctx.fillText(ready ? '[ R ] 🐾 HYPURR ATTACK' : `ULTIMATE ${Math.floor(pct * 100)}%`, W / 2, by - 5);

    ctx.restore();
}

function resetUltimate() {
    ULT.charge = 0;
    ULT.active = false;
    ULT.phase = 0;
    ULT.timer = 0;
    ULT.shockRadius = 0;
    ULT.pulseTimer = 0;
}

// ============ MARKET EVENTS SYSTEM ============
// Random events that change gameplay for a short duration

const MARKET_EVENTS = [
    {
        id: 'bullRun',
        name: '📈 BULL RUN',
        desc: '2x Gold • 1.5x Speed',
        duration: 15,
        color: '#2ed573',
        onStart() { P.spd *= 1.5; },
        onEnd() { P.spd /= 1.5; },
        modGold: 2
    },
    {
        id: 'bearMarket',
        name: '📉 BEAR MARKET',
        desc: 'Enemies +50% Speed',
        duration: 12,
        color: '#ff4757',
        onStart() { },
        onEnd() { },
        modEnemySpd: 1.5
    },
    {
        id: 'flashCrash',
        name: '⚡ FLASH CRASH',
        desc: 'Random Explosions!',
        duration: 8,
        color: '#ffa502',
        onStart() {
            // Explode random enemies
            let count = 0;
            enemies.each(e => {
                if (!e.active || count >= 8) return;
                if (Math.random() < 0.4) {
                    e.hp = 0;
                    enemyDeath(e);
                    fxEnemyDeath(e.x, e.y, '#ffa502');
                    count++;
                }
            });
            triggerShake(15, 0.5);
            playSound('bassDrop');
        },
        onEnd() { }
    },
    {
        id: 'airdrop',
        name: '🪂 AIRDROP INCOMING',
        desc: 'Raining Gold & HP!',
        duration: 6,
        color: '#7c4dff',
        onStart() {
            // Spawn a bunch of pickups around the player
            for (let i = 0; i < 20; i++) {
                const p = pickups.get();
                if (p) {
                    p.x = P.x + (Math.random() - 0.5) * 500;
                    p.y = P.y + (Math.random() - 0.5) * 500;
                    p.type = Math.random() < 0.3 ? 'heart' : 'gold';
                    p.val = p.type === 'heart' ? 20 : 10 + Math.floor(Math.random() * 15);
                    p.mag = false;
                    p.active = true;
                }
            }
            playSound('airhorn');
        },
        onEnd() { }
    },
    {
        id: 'whaleEntry',
        name: '🐋 WHALE SPOTTED',
        desc: '3x Damage for 10s!',
        duration: 10,
        color: '#00d2d3',
        onStart() { P.dmgMult *= 3; },
        onEnd() { P.dmgMult /= 3; },
    }
];

const MKT = {
    active: null,       // current event object
    timer: 0,           // remaining duration
    cooldown: 45,       // seconds between events (starts at 45)
    bannerTimer: 0,     // for showing the event banner
};

function triggerMarketEvent() {
    if (MKT.active) return;
    const evt = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    MKT.active = { ...evt };
    MKT.timer = evt.duration;
    MKT.bannerTimer = 2.5;
    MKT.cooldown = 40 + Math.random() * 30; // 40-70s until next

    // Show notification
    const el = document.getElementById('market-event-banner');
    el.classList.remove('h');
    el.innerHTML = `
    <div class="mkt-name" style="color:${evt.color}">${evt.name}</div>
    <div class="mkt-desc">${evt.desc}</div>
  `;
    setTimeout(() => el.classList.add('h'), 2500);

    evt.onStart();
    playSound('missionSpawn');
}

function updateMarketEvents(dt) {
    if (MKT.active) {
        MKT.timer -= dt;
        MKT.bannerTimer -= dt;
        if (MKT.timer <= 0) {
            MKT.active.onEnd();
            MKT.active = null;
        }
    } else {
        MKT.cooldown -= dt;
        if (MKT.cooldown <= 0) {
            triggerMarketEvent();
        }
    }
}

function renderMarketEventHUD(ctx) {
    if (!MKT.active) return;
    const W = ctx.canvas.width;
    const evt = MKT.active;

    ctx.save();

    // Event timer bar (top of screen, below stage info)
    const barW = 200, barH = 6;
    const bx = W / 2 - barW / 2, by = 115;
    const pct = MKT.timer / evt.duration;

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 3);
    ctx.fill();

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = evt.color;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * pct, barH, 2);
    ctx.fill();

    // Event name
    ctx.globalAlpha = 0.7;
    ctx.font = "bold 10px 'JetBrains Mono'";
    ctx.textAlign = 'center';
    ctx.fillStyle = evt.color;
    ctx.fillText(`${evt.name} — ${Math.ceil(MKT.timer)}s`, W / 2, by - 4);

    ctx.restore();
}

// Tint overlay for active events
function renderMarketEventOverlay(ctx) {
    if (!MKT.active) return;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const evt = MKT.active;

    ctx.save();
    // Subtle colored vignette
    ctx.globalAlpha = 0.08;
    const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.1, W / 2, H / 2, W * 0.6);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, evt.color);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}

function getMarketGoldMult() {
    return (MKT.active && MKT.active.modGold) ? MKT.active.modGold : 1;
}

function getMarketEnemySpdMult() {
    return (MKT.active && MKT.active.modEnemySpd) ? MKT.active.modEnemySpd : 1;
}

function resetMarketEvents() {
    if (MKT.active && MKT.active.onEnd) MKT.active.onEnd();
    MKT.active = null;
    MKT.timer = 0;
    MKT.cooldown = 45;
    MKT.bannerTimer = 0;
}
