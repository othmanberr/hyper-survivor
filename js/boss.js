// ============ BOSS CLASS ============
class Boss {
    constructor(data, wave) {
        this.data = data; this.x = P.x; this.y = P.y - 200;
        this.hp = data.hp * (1 + wave * 0.05); this.maxHp = this.hp;
        this.sz = data.sz; this.spd = data.spd;
        this.attackCd = 2; this.attackIdx = 0; this.flash = 0;
        this.clones = []; this.diving = false; this.diveTarget = { x: 0, y: 0 };
        this.faceAngle = Math.PI / 2; // default facing south
    }
    update(dt) {
        if (!this.diving) {
            const dx = P.x - this.x, dy = P.y - this.y, ds = Math.hypot(dx, dy);
            if (ds > 100) { this.x += (dx / ds) * this.spd * 50 * dt; this.y += (dy / ds) * this.spd * 50 * dt; }
            if (ds > 10) this.faceAngle = Math.atan2(dy, dx);
            this.x = Math.max(60, Math.min(WORLD_W - 60, this.x)); this.y = Math.max(60, Math.min(WORLD_H - 60, this.y));
        } else {
            const dx = this.diveTarget.x - this.x, dy = this.diveTarget.y - this.y;
            this.x += dx * 5 * dt; this.y += dy * 5 * dt;
            if (Math.hypot(dx, dy) < 50) { this.diving = false; if (Math.hypot(P.x - this.x, P.y - this.y) < 80) hitPlayer(35); }
        }
        if (this.flash > 0) this.flash -= dt;
        this.attackCd -= dt;
        if (this.attackCd <= 0) {
            const atk = this.data.attacks[this.attackIdx % this.data.attacks.length];
            this.attack(atk); this.attackIdx++;
            this.attackCd = 1.8 + Math.random() * 1.2;
        }
    }
    attack(atk) {
        const bx = this.x, by = this.y;
        if (atk === 'pulse') for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const p = projs.get(); if (p) { p.x = bx; p.y = by; p.vx = Math.cos(a) * 250; p.vy = Math.sin(a) * 250; p.dmg = 15; p.pierce = 1; p.friendly = false; p.col = '#ffd700'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } }
        if (atk === 'mines') for (let i = 0; i < 4; i++) { const h = hazards.get(); if (h) { h.type = 'mine'; h.x = bx + (Math.random() - 0.5) * 300; h.y = by + (Math.random() - 0.5) * 200; h.life = 8; h.tick = 0; h.active = true; } }
        if (atk === 'firetrail') { const h = hazards.get(); if (h) { h.type = 'fire'; h.x = bx; h.y = by; h.life = 6; h.active = true; } }
        if (atk === 'spray') for (let i = 0; i < 18; i++) setTimeout(() => { const a = Math.random() * Math.PI * 2; const p = projs.get(); if (p) { p.x = bx; p.y = by; p.vx = Math.cos(a) * 180; p.vy = Math.sin(a) * 180; p.dmg = 10; p.pierce = 1; p.friendly = false; p.col = '#00ff00'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } }, i * 40);
        if (atk === 'gravity') enemies.each(e => { const dx = P.x - e.x, dy = P.y - e.y, ds = Math.hypot(dx, dy); if (ds > 10) { e.x += dx / ds * 60; e.y += dy / ds * 60; } });
        if (atk === 'meteors') for (let i = 0; i < 8; i++) setTimeout(() => { const h = hazards.get(); if (h) { h.type = 'meteor'; h.x = P.x + (Math.random() - 0.5) * W; h.y = P.y - H / 2 - 50; h.life = 5; h.active = true; } }, i * 120);
        if (atk === 'teleport' || atk === 'codeline') { const ox = this.x, oy = this.y; this.x = P.x + (Math.random() - 0.5) * 200; this.y = Math.max(80, Math.min(WORLD_H - 80, P.y + (Math.random() - 0.5) * 150)); for (let i = 0; i < 12; i++) { const t = i / 12; const p = projs.get(); if (p) { p.x = ox + (this.x - ox) * t; p.y = oy + (this.y - oy) * t; p.vx = 0; p.vy = 0; p.dmg = 12; p.pierce = 1; p.friendly = false; p.col = '#00ffaa'; p.hits = new Set(); p.hitCnt = 0; p.active = true; setTimeout(() => p.active = false, 400); } } }
        if (atk === 'freeze') { G.freezeTime = 2; document.getElementById('freeze-overlay').style.opacity = '1'; setTimeout(() => document.getElementById('freeze-overlay').style.opacity = '0', 2000); }
        if (atk === 'drain') for (let i = 0; i < 20; i++) setTimeout(() => { const a = Math.atan2(P.y - by, P.x - bx) + (Math.random() - 0.5) * 0.3; const p = projs.get(); if (p) { p.x = bx; p.y = by; p.vx = Math.cos(a) * 320; p.vy = Math.sin(a) * 320; p.dmg = 12; p.pierce = 1; p.friendly = false; p.col = '#aa0000'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } }, i * 60);
        if (atk === 'dive') { this.diving = true; this.diveTarget = { x: P.x, y: P.y }; }
        if (atk === 'arrowrain') for (let i = 0; i < 30; i++) setTimeout(() => { const p = projs.get(); if (p) { p.x = P.x + (Math.random() - 0.5) * W; p.y = P.y - H / 2 - 20; p.vx = 0; p.vy = 350; p.dmg = 15; p.pierce = 1; p.friendly = false; p.col = '#ff3333'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } }, i * 35);
        if (atk === 'godcandle') for (let i = 0; i < 5; i++) setTimeout(() => { const h = hazards.get(); if (h) { h.type = 'godcandle'; h.x = P.x + (i - 2) * 200; h.y = 0; h.life = 1.8; h.active = true; } }, i * 200);
        if (atk === 'laserbeam') for (let w = 0; w < 3; w++) setTimeout(() => { const a = Math.atan2(P.y - by, P.x - bx) + (w - 1) * 0.2; for (let j = 0; j < 10; j++) { const p = projs.get(); if (p) { p.x = bx; p.y = by; p.vx = Math.cos(a) * (300 + j * 40); p.vy = Math.sin(a) * (300 + j * 40); p.dmg = 18; p.pierce = 1; p.friendly = false; p.col = '#00ff00'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } } }, w * 150);
        if (atk === 'clones') { this.clones = []; for (let i = 0; i < 3; i++) this.clones.push({ x: bx + (Math.random() - 0.5) * 400, y: by + (Math.random() - 0.5) * 200 }); }
        if (atk === 'bullethell') for (let w = 0; w < 3; w++) setTimeout(() => { for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + w * 0.2; const p = projs.get(); if (p) { p.x = bx; p.y = by; p.vx = Math.cos(a) * 200; p.vy = Math.sin(a) * 200; p.dmg = 12; p.pierce = 1; p.friendly = false; p.col = '#ff88ff'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } } }, w * 300);
        if (atk === 'walls') { const h = hazards.get(); if (h) { h.type = 'wall'; h.x = P.x; h.y = P.y; h.life = 5; h.data = { horizontal: Math.random() > 0.5 }; h.active = true; } }
        if (atk === 'homingforms') for (let i = 0; i < 5; i++) { const h = hazards.get(); if (h) { h.type = 'homingform'; h.x = P.x + (Math.random() - 0.5) * W; h.y = P.y + (Math.random() - 0.5) * H; h.life = 15; h.active = true; } }
        if (atk === 'rotating4') for (let i = 0; i < 4; i++) { const h = hazards.get(); if (h) { h.type = 'laser'; h.x = bx; h.y = by; h.life = 8; h.tick = 0; h.data = { baseAngle: i * Math.PI / 2, speed: 0.5 }; h.active = true; } }
        if (atk === 'dragonfire') for (let i = 0; i < 30; i++) setTimeout(() => { const a = Math.atan2(P.y - by, P.x - bx) + (Math.random() - 0.5) * 0.5; const p = projs.get(); if (p) { p.x = bx; p.y = by; p.vx = Math.cos(a) * 350; p.vy = Math.sin(a) * 350; p.dmg = 20; p.pierce = 1; p.friendly = false; p.col = '#ffd700'; p.hits = new Set(); p.hitCnt = 0; p.active = true; } }, i * 25);
        if (atk === 'summon') for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2; const diff = getDifficulty(G.wave); spawnEnemy(Math.min(diff.maxType, 1 + Math.floor(Math.random() * 3)), bx + Math.cos(a) * 180, by + Math.sin(a) * 180); }
    }
    hit(d) {
        this.hp -= d; this.flash = 0.08;
        addDmgNum({ x: this.x, y: this.y - this.sz, n: Math.round(d), life: 0.4, col: '#ffd700' });
        triggerShake(3, 0.06);
        return this.hp <= 0;
    }
    draw(ctx) {
        const drawSz = this.sz * 2.5; // render size for pixel art boss
        const half = drawSz / 2;

        // Draw clones
        for (const c of this.clones) {
            if (!isOnScreen(c.x, c.y, 100)) continue;
            ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = 0.4;
            const cSpr = getBossSprite(G.bossKey, this.faceAngle);
            if (cSpr && cSpr.complete) { ctx.imageSmoothingEnabled = false; ctx.drawImage(cSpr, -half, -half, drawSz, drawSz); ctx.imageSmoothingEnabled = true; }
            ctx.restore();
        }

        // Dive target indicator
        if (this.diving) { ctx.save(); ctx.translate(this.diveTarget.x, this.diveTarget.y); ctx.fillStyle = 'rgba(255,0,0,0.2)'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }

        // Main boss
        ctx.save(); ctx.translate(this.x, this.y);
        const spr = getBossSprite(G.bossKey, this.faceAngle);

        // Glow effect
        const glowCol = BOSS_GLOW && BOSS_GLOW[G.bossKey];
        if (glowCol) {
            ctx.shadowColor = glowCol;
            ctx.shadowBlur = 15;
        }

        if (spr && spr.complete) { ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, -half, -half, drawSz, drawSz); ctx.imageSmoothingEnabled = true; }
        ctx.shadowBlur = 0;

        if (this.flash > 0 && spr && spr.complete) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.7;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(spr, -half, -half, drawSz, drawSz);
            ctx.imageSmoothingEnabled = true;
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();
    }
}

// ============ BOSS INTRO CINEMATIC ============
function getBossForWave(wave) {
    const idx = Math.floor((wave / WAVES_PER_STAGE) - 1) % BOSS_ORDER.length;
    return BOSS_ORDER[idx];
}

function startBossIntro() {
    G.phase = 'bossIntro';
    G.bossIntroTime = 3.0;
    enemies.clear(); projs.clear(); hazards.clear(); pickups.clear();

    G.bossKey = getBossForWave(G.wave);
    const bossData = BOSSES[G.bossKey];

    const introEl = document.getElementById('boss-intro');
    introEl.classList.remove('h');
    const stageLabel = G.mode === 'adventure' ? `STAGE ${Math.floor(G.wave / WAVES_PER_STAGE)} BOSS` : `WAVE ${G.wave} BOSS`;
    // UX 8: Boss threat level preview
    const bossHpScaled = Math.round(bossData.hp * (1 + G.wave * 0.15));
    const threatLevel = bossHpScaled > 3000 ? 'EXTREME' : bossHpScaled > 1500 ? 'HIGH' : bossHpScaled > 800 ? 'MEDIUM' : 'LOW';
    const threatCol = threatLevel === 'EXTREME' ? '#ff0000' : threatLevel === 'HIGH' ? '#ff6b6b' : threatLevel === 'MEDIUM' ? '#ffa502' : '#55efc4';
    introEl.innerHTML = `
    <div class="boss-intro-warning">WARNING</div>
    <div class="boss-intro-name">${bossData.name}</div>
    <div class="boss-intro-sub">${bossData.sub}</div>
    <div class="boss-intro-stage">${stageLabel}</div>
    <div class="boss-intro-threat" style="color:${threatCol}">THREAT: ${threatLevel} · HP ${bossHpScaled}</div>
  `;
    playSound('bossDeath');
}

function updateBossIntro(dt) {
    G.bossIntroTime -= dt;
    if (G.bossIntroTime <= 0) {
        document.getElementById('boss-intro').classList.add('h');
        startBoss();
    }
}

function startBoss() {
    G.phase = 'boss';
    const bossData = BOSSES[G.bossKey];
    G.boss = new Boss(bossData, G.wave);
    document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
    document.getElementById('boss-intro').classList.add('h');
    document.getElementById('boss-bar').classList.remove('h');
    document.getElementById('boss-bar-name').textContent = bossData.name;
    document.getElementById('boss-bar-sub').textContent = bossData.sub;
    enemies.clear(); projs.clear(); hazards.clear();
    lastT = performance.now();
}

// ============ CINEMATIC ============
let cinematicPlayed = false;

function playCinematic(onComplete) {
    if (cinematicPlayed) { onComplete(); return; }
    cinematicPlayed = true;

    const overlay = document.getElementById('cinematic-overlay');
    const video = document.getElementById('cinematic-video');

    // Progressive slowdown config (villain laughing at end lasts longer)
    const VIDEO_DURATION = 5.2;
    const SLOWDOWN_START = 3.8;
    const BASE_RATE = 0.6;
    const MIN_RATE = 0.15;

    let finished = false;
    function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimeout);
        try { video.pause(); } catch (e) { }
        overlay.classList.add('h');
        document.removeEventListener('keydown', onKey);
        overlay.removeEventListener('click', skipClick);
        video.removeEventListener('ended', finish);
        video.removeEventListener('error', finish);
        video.removeEventListener('timeupdate', onTimeUpdate);
        onComplete();
    }

    function onKey(e) {
        if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
            e.preventDefault();
            finish();
        }
    }
    function skipClick() { finish(); }

    function onTimeUpdate() {
        if (finished) return;
        const t = video.currentTime;
        if (t >= SLOWDOWN_START) {
            const progress = (t - SLOWDOWN_START) / (VIDEO_DURATION - SLOWDOWN_START);
            const clamped = Math.min(1, Math.max(0, progress));
            const ease = clamped * clamped; // ease-in for dramatic slowdown
            const rate = BASE_RATE - (BASE_RATE - MIN_RATE) * ease;
            video.playbackRate = Math.max(MIN_RATE, rate);
        }
    }

    // Safety: 30s timeout (longer due to end slowdown)
    const safetyTimeout = setTimeout(finish, 30000);

    overlay.classList.remove('h');
    video.currentTime = 0;
    video.playbackRate = BASE_RATE;
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    video.addEventListener('timeupdate', onTimeUpdate);

    // Delay skip listeners so START button click doesn't immediately skip
    setTimeout(() => {
        if (finished) return;
        document.addEventListener('keydown', onKey);
        overlay.addEventListener('click', skipClick);
    }, 500);

    try {
        const p = video.play();
        if (p && p.catch) p.catch(() => { finish(); });
    } catch (e) { finish(); }
}
