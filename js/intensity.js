// ============ SCREEN INTENSITY + PLAYER AURA + KILL STREAK ANNOUNCER ============
// Dynamic effects that scale with combo, leverage, and performance

// ---- PLAYER NEON TRAIL ----
const neonTrail = [];
const MAX_TRAIL = 25;
let trailTimer = 0;

function updateNeonTrail(dt) {
    trailTimer += dt;
    // Spawn trail nodes based on movement speed or combo
    const interval = G.combo >= 30 ? 0.02 : G.combo >= 10 ? 0.03 : 0.04;
    if (trailTimer >= interval) {
        trailTimer = 0;
        neonTrail.push({
            x: P.x, y: P.y,
            life: 1.0,
            maxLife: 0.3 + Math.min(G.combo * 0.005, 0.4),
            angle: P.angle
        });
        if (neonTrail.length > MAX_TRAIL) neonTrail.shift();
    }

    for (let i = neonTrail.length - 1; i >= 0; i--) {
        neonTrail[i].life -= dt / neonTrail[i].maxLife;
        if (neonTrail[i].life <= 0) { neonTrail[i] = neonTrail[neonTrail.length - 1]; neonTrail.pop(); }
    }
}

function renderNeonTrail(ctx) {
    if (neonTrail.length < 2) return;

    const pal = STAGE_PALETTES[0];
    const intensity = Math.min(1, G.combo / 30 + (P.leverage - 1) / 20);
    if (intensity < 0.1) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw glowing trail
    for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        for (let i = 0; i < neonTrail.length; i++) {
            const t = neonTrail[i];
            if (i === 0) ctx.moveTo(t.x, t.y);
            else ctx.lineTo(t.x, t.y);
        }

        if (pass === 0) {
            // Outer glow
            ctx.strokeStyle = pal.accent;
            ctx.lineWidth = (6 + intensity * 8) * 0.6;
            ctx.globalAlpha = 0.15 * intensity;
        } else {
            // Inner core
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 + intensity * 2;
            ctx.globalAlpha = 0.3 * intensity;
        }
        ctx.stroke();
    }

    ctx.restore();
}

// ---- PLAYER AURA (high lvl / leverage glow ring) ----
function renderPlayerAura(ctx) {
    const intensity = Math.min(1, (P.leverage - 1) / 15 + G.combo / 60);
    if (intensity < 0.05) return;

    const pal = STAGE_PALETTES[0];
    const now = Date.now() * 0.003;
    const pulse = 0.7 + Math.sin(now) * 0.3;

    ctx.save();

    // Aura ring
    const radius = 20 + intensity * 15 + Math.sin(now * 2) * 3;
    const grad = ctx.createRadialGradient(P.x, P.y, radius * 0.3, P.x, P.y, radius);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.6, 'transparent');
    grad.addColorStop(0.85, pal.accent);
    grad.addColorStop(1, 'transparent');

    ctx.globalAlpha = 0.12 * intensity * pulse;
    ctx.fillStyle = grad;
    ctx.fillRect(P.x - radius, P.y - radius, radius * 2, radius * 2);

    // Orbiting particles at high intensity
    if (intensity > 0.4) {
        const particleCount = Math.floor(intensity * 4);
        for (let i = 0; i < particleCount; i++) {
            const a = now + (i / particleCount) * Math.PI * 2;
            const r = radius * (0.8 + Math.sin(now * 3 + i) * 0.2);
            const px = P.x + Math.cos(a) * r;
            const py = P.y + Math.sin(a) * r;

            ctx.globalAlpha = 0.4 * intensity;
            ctx.fillStyle = pal.accent;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

let _cachedW = 0, _cachedH = 0;
let _cachedBloom = null, _cachedDarkVig = null;

// ---- SCREEN INTENSITY (post-process overlay) ----
function renderScreenIntensity(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const comboIntensity = Math.min(1, G.combo / 50);
    const levIntensity = Math.min(1, (P.leverage - 1) / 20);
    const total = Math.min(1, comboIntensity * 0.6 + levIntensity * 0.4);

    if (total < 0.05) return;

    if (_cachedW !== W || _cachedH !== H || !_cachedBloom) {
        _cachedW = W; _cachedH = H;
        _cachedBloom = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
        _cachedBloom.addColorStop(0, '#ffffff');
        _cachedBloom.addColorStop(1, 'transparent');

        _cachedDarkVig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.55);
        _cachedDarkVig.addColorStop(0, 'transparent');
        _cachedDarkVig.addColorStop(1, 'rgba(0,0,0,1)');
    }

    ctx.save();

    // Chromatic aberration at edges (subtle color fringing)
    if (total > 0.3) {
        const abr = total * 2;
        ctx.globalAlpha = 0.04 * total;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(abr, 0, W, H);
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(-abr, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
    }

    // Bloom overlay (bright center glow)
    ctx.globalAlpha = 0.03 * total;
    ctx.fillStyle = _cachedBloom;
    ctx.fillRect(0, 0, W, H);

    // Edge vignette intensifies
    ctx.globalAlpha = 0.15 * total;
    ctx.fillStyle = _cachedDarkVig;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
}

// ---- KILL STREAK ANNOUNCER ----
const KILL_STREAKS = [
    { at: 10, text: 'KILLING SPREE', col: '#ffa502' },
    { at: 20, text: 'DOMINATING', col: '#ff6348' },
    { at: 30, text: 'MEGA KILL', col: '#ff4757' },
    { at: 50, text: 'UNSTOPPABLE', col: '#e84393' },
    { at: 75, text: 'GODLIKE', col: '#ffd700' },
    { at: 100, text: 'BEYOND GODLIKE', col: '#ffd700' },
];

let streakDisplay = null; // { text, col, timer, scale }

function checkKillStreak(combo) {
    for (let i = KILL_STREAKS.length - 1; i >= 0; i--) {
        if (combo === KILL_STREAKS[i].at) {
            streakDisplay = {
                text: KILL_STREAKS[i].text,
                col: KILL_STREAKS[i].col,
                timer: 2.0,
                scale: 2.5  // starts big, settles
            };
            triggerShake(8, 0.2);
            if (combo >= 50) playSound('airhorn');
            else if (combo >= 20) playSound('bassDrop');
            break;
        }
    }
}

function updateKillStreak(dt) {
    if (!streakDisplay) return;
    streakDisplay.timer -= dt;
    streakDisplay.scale = Math.max(1, streakDisplay.scale - dt * 3);
    if (streakDisplay.timer <= 0) streakDisplay = null;
}

function renderKillStreak(ctx) {
    if (!streakDisplay) return;

    const W = ctx.canvas.width;
    const s = streakDisplay;
    const alpha = Math.min(1, s.timer * 2);

    // Slide in from right
    const slideX = Math.max(0, (s.scale - 1) * 60);

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const x = W - 30 + slideX;
    const y = 90;

    // Glow behind text
    ctx.shadowColor = s.col;
    ctx.shadowBlur = 15;
    ctx.globalAlpha = alpha * 0.8;
    ctx.font = `900 20px 'Exo 2', sans-serif`;
    ctx.fillStyle = s.col;
    ctx.fillText(s.text, x, y);

    // Thin line underneath
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * 0.4;
    const tw = ctx.measureText(s.text).width;
    ctx.fillRect(x - tw, y + 24, tw, 1);

    ctx.restore();
}

// ---- COMBO FIRE PARTICLES (screen edges at high combo) ----
const comboParticles = [];

function updateComboParticles(dt) {
    if (G.combo >= 20 && Math.random() < 0.3) {
        const side = Math.random() < 0.5 ? 0 : 1; // left or right
        // W and H are now dynamic globals from backgrounds.js
        comboParticles.push({
            x: side === 0 ? -5 : W + 5,
            y: H * 0.5 + (Math.random() - 0.5) * H * 0.8,
            vx: side === 0 ? 40 + Math.random() * 30 : -40 - Math.random() * 30,
            vy: -80 - Math.random() * 60,
            life: 0.4 + Math.random() * 0.3,
            col: G.combo >= 50 ? '#ffd700' : G.combo >= 30 ? '#ff6348' : '#ffa502',
            sz: 2 + Math.random() * 3
        });
    }

    for (let i = comboParticles.length - 1; i >= 0; i--) {
        const p = comboParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) { comboParticles[i] = comboParticles[comboParticles.length - 1]; comboParticles.pop(); }
    }
}

function renderComboParticles(ctx) {
    if (comboParticles.length === 0) return;
    ctx.save();
    for (const p of comboParticles) {
        ctx.globalAlpha = Math.min(1, p.life * 3) * 0.6;
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// ---- PUBLIC API ----
function updateIntensity(dt) {
    updateNeonTrail(dt);
    updateKillStreak(dt);
    updateComboParticles(dt);
}

function renderIntensityWorld(ctx) {
    renderPlayerAura(ctx);
    renderNeonTrail(ctx);
}

function renderIntensityScreen(ctx) {
    renderScreenIntensity(ctx);
    renderKillStreak(ctx);
    renderComboParticles(ctx);
}

function resetIntensity() {
    neonTrail.length = 0;
    comboParticles.length = 0;
    streakDisplay = null;
    trailTimer = 0;
}
