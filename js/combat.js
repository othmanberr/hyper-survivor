
function spawnEnemy(type, x, y, opts) {
  opts = opts || {};
  const stats = ENEMY_STATS[type];
  if (!stats) return;
  const diff = typeof getDifficulty === 'function' ? getDifficulty(G.wave) : { hpMult: 1, spdMult: 1 };
  const e = enemies.get();
  if (e) {
    e.x = x; e.y = y;
    e.hp = (opts.hp || stats.hp) * diff.hpMult; e.maxHp = e.hp;
    e.dmg = opts.dmg || stats.dmg; e.spd = stats.spd * diff.spdMult; e.sz = opts.sz || stats.sz; e.type = type;
    e.gold = opts.gold || stats.gold; e.xp = opts.xp || stats.xp; e.kbX = 0; e.kbY = 0; e.flash = 0;
    e.behaviorTimer = Math.random() * 2; e.behaviorState = 0;
    e.isSplit = opts.isSplit || false;
    e.isElite = opts.isElite || false;
    e.anim = 'walk'; e.animF = 0; e.animT = 0; e.faceX = 1; e.dying = false;
  }
}

function processNextLevelUp() {
  if (G.pendingLevelUps <= 0) return;
  G.pendingLevelUps--;
  G.prevPhase = G.phase;
  G.phase = 'levelup';
  const choices = generateLevelUpChoices(P, WEAPONS, 3);
  showLevelUpUI(choices, (choice) => {
    applyLevelUpChoice(choice, P, WEAPONS);
    if (G.pendingLevelUps > 0) {
      setTimeout(() => processNextLevelUp(), 150);
    } else {
      G.phase = G.prevPhase || 'wave';
      G.prevPhase = null;
      lastT = performance.now();
      requestAnimationFrame(loop);
    }
  });
}

function addXP(val) {
  P.xp += val;
  while (P.xp >= P.xpNext) {
    P.xp -= P.xpNext; P.level++;
    P.xpNext = Math.floor(50 * 1.4 ** P.level);
    P.maxHp += 10; P.hp = Math.min(P.maxHp, P.hp + 10);
    G.pendingLevelUps++;
    playSound('levelup');
    addDmgNum({ x: P.x, y: P.y - 40, n: 'LV' + P.level, life: 0.8, col: '#2ed573' });
  }
}

function enemyDeath(e) {
  if (e.dying) return; // already dying
  const ex = e.x, ey = e.y, etype = e.type, eSplit = e.isSplit;
  e.dying = true; setAnim(e, 'death'); G.kills++;
  if (typeof addCombo === 'function') addCombo();
  if (typeof checkMilestones === 'function') checkMilestones();
  if (typeof updateMissions === 'function') updateMissions(0);
  const bonusGold = G.combo >= 50 ? 5 : G.combo >= 20 ? 3 : G.combo >= 10 ? 1 : 0;
  const goldMult = typeof getMarketGoldMult === 'function' ? getMarketGoldMult() : 1;
  const goldVal = Math.round((e.gold + bonusGold) * goldMult);
  G.gold += goldVal; G.totalGoldEarned += goldVal;
  addXP(e.xp);
  if (typeof chargeUltimate === 'function') chargeUltimate(1);
  if (typeof jeffKillReaction === 'function') jeffKillReaction();
  if (typeof fxEnemyDeath === 'function') fxEnemyDeath(ex, ey, typeof ENEMY_COLORS !== 'undefined' ? ENEMY_COLORS[etype] : '#ff3333');
  playSound('enemyDeath');
  if (typeof degenOnEnemyDeath === 'function') degenOnEnemyDeath(ex, ey);

  if (Math.random() < 0.05) {
    const hpk = pickups.get();
    if (hpk) {
      hpk.active = true; hpk.x = ex + (Math.random() - 0.5) * 20; hpk.y = ey + (Math.random() - 0.5) * 20;
      hpk.type = 'heart'; hpk.val = 15; hpk.mag = false;
    }
  }

  if (etype === 5) {
    if (typeof fxExplosion === 'function') fxExplosion(ex, ey, 80);
    if (Math.hypot(P.x - ex, P.y - ey) < 80 && typeof hitPlayer === 'function') hitPlayer(20);
  }

  if (etype === 7 && !eSplit) {
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnEnemy(7, ex + Math.cos(a) * 20, ey + Math.sin(a) * 20, { isSplit: true, hp: 60, sz: 8 });
    }
  }
}

function spawnContinuous(dt) {
  G.spawnCd -= dt;
  if (G.spawnCd > 0) return;
  const maxEnemies = typeof MAX_ENEMIES !== 'undefined' ? MAX_ENEMIES : 150;
  if (enemies.count >= maxEnemies) return;

  const diff = typeof getDifficulty === 'function' ? getDifficulty(G.wave) : { spawnRate: 1, batchSize: 1, maxType: 0 };
  G.spawnCd = diff.spawnRate;

  const room = maxEnemies - enemies.count;
  const batch = Math.min(diff.batchSize, room);

  const bLeft = typeof BUILDING_LEFT !== 'undefined' ? BUILDING_LEFT : WORLD_W * 0.22;
  const bRight = typeof BUILDING_RIGHT !== 'undefined' ? BUILDING_RIGHT : WORLD_W * 0.78;
  const bTop = typeof BUILDING_TOP !== 'undefined' ? BUILDING_TOP : WORLD_H * 0.12;
  const bBottom = typeof BUILDING_BOTTOM !== 'undefined' ? BUILDING_BOTTOM : WORLD_H * 0.88;

  for (let i = 0; i < batch; i++) {
    const fromTop = Math.random() > 0.5;
    const x = bLeft + Math.random() * (bRight - bLeft);
    const y = fromTop ? -30 - Math.random() * 80 : WORLD_H + 30 + Math.random() * 80;
    const type = Math.min(diff.maxType, Math.floor(Math.random() * (diff.maxType + 1)));

    const isElite = G.wave >= 5 && Math.random() < 0.08;
    if (isElite) {
      const stats = ENEMY_STATS[type];
      spawnEnemy(type, x, y, { isElite: true, hp: stats.hp * 3, dmg: stats.dmg * 2, gold: stats.gold * 3, xp: stats.xp * 3, sz: stats.sz * 1.3 });
    } else {
      spawnEnemy(type, x, y);
    }
  }
}

let _shieldDrones = [];
function hasShieldAura(e) {
  if (e.type === 6) return false;
  for (let i = 0; i < _shieldDrones.length; i++) {
    const d = _shieldDrones[i];
    if ((d.x - e.x) ** 2 + (d.y - e.y) ** 2 < 10000) return true;
  }
  return false;
}

function updateEnemyBehavior(e, dt) {
  const dx = P.x - e.x, dy = P.y - e.y, ds = Math.hypot(dx, dy);
  const eSpdMult = typeof getMarketEnemySpdMult === 'function' ? getMarketEnemySpdMult() : 1;
  const edt = dt * eSpdMult;
  e.behaviorTimer -= edt;

  switch (e.type) {
    case 0:
      if (ds > 1) {
        const baseX = (dx / ds) * e.spd * 60 * edt;
        const baseY = (dy / ds) * e.spd * 60 * edt;
        const sin = Math.sin(e.behaviorTimer * 5) * 30 * dt;
        e.x += baseX + (-dy / ds) * sin;
        e.y += baseY + (dx / ds) * sin;
      }
      if (e.behaviorTimer <= 0 && e.anim === 'walk') {
        setAnim(e, 'attack');
        e.behaviorTimer = 3 + Math.random() * 2;
      }
      break;

    case 1:
      if (e.behaviorState === 0) {
        if (ds > 1) {
          e.x += (dx / ds) * e.spd * 90 * edt;
          e.y += (dy / ds) * e.spd * 90 * edt;
        }
        if (e.anim !== 'attack' && e.anim !== 'hit') setAnim(e, 'attack');
        if (e.behaviorTimer <= 0) { e.behaviorState = 1; e.behaviorTimer = 0.8; setAnim(e, 'walk'); }
      } else {
        if (e.behaviorTimer <= 0) { e.behaviorState = 0; e.behaviorTimer = 1.5; }
      }
      break;

    case 2:
      if (ds > 1) {
        e.x += (dx / ds) * e.spd * 40 * edt;
        e.y += (dy / ds) * e.spd * 40 * edt;
      }
      if (e.behaviorTimer <= 0) {
        e.behaviorTimer = 4 + Math.random() * 2;
        setAnim(e, 'attack');
        for (let i = 0; i < 2; i++) {
          const a = Math.random() * Math.PI * 2;
          spawnEnemy(0, e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30);
        }
      }
      break;

    case 3:
      if (ds > 1) {
        e.x += (dx / ds) * e.spd * 70 * edt;
        e.y += (dy / ds) * e.spd * 70 * edt;
      }
      if (e.behaviorTimer <= 0) {
        e.behaviorTimer = 2 + Math.random();
        setAnim(e, 'attack');
        const ta = Math.random() * Math.PI * 2;
        const td = 80 + Math.random() * 120;
        e.x = P.x + Math.cos(ta) * td;
        e.y = P.y + Math.sin(ta) * td;
        e.flash = 0.15;
      }
      break;

    case 4:
      {
        const idealDist = 300;
        if (ds > 1) {
          if (ds > idealDist + 30) {
            e.x += (dx / ds) * e.spd * 50 * edt;
            e.y += (dy / ds) * e.spd * 50 * edt;
          } else if (ds < idealDist - 30) {
            e.x -= (dx / ds) * e.spd * 40 * edt;
            e.y -= (dy / ds) * e.spd * 40 * edt;
          }
        }
        if (e.behaviorTimer <= 0) {
          e.behaviorTimer = 3;
          setAnim(e, 'attack');
          const a = Math.atan2(dy, dx);
          const p = projs.get();
          if (p) { p.x = e.x; p.y = e.y; p.vx = -Math.cos(a) * 300; p.vy = -Math.sin(a) * 300; p.dmg = e.dmg; p.pierce = 1; p.friendly = false; p.col = '#ff0000'; p.hits = new Set(); p.hitCnt = 0; p.active = true; }
        }
      }
      break;

    case 5:
      if (ds > 1) {
        e.x += (dx / ds) * e.spd * 80 * edt;
        e.y += (dy / ds) * e.spd * 80 * edt;
      }
      if (ds < 80 && e.anim === 'walk') setAnim(e, 'attack');
      if (ds < 40) {
        if (typeof fxExplosion === 'function') fxExplosion(e.x, e.y, 80);
        if (ds < 80 && typeof hitPlayer === 'function') hitPlayer(e.dmg);
        e.hp = 0;
        enemyDeath(e);
      }
      break;

    case 6:
      {
        let nearAlly = null, nad = 500;
        enemies.each(a => {
          if (a === e || a.type === 6 || a.dying) return;
          const ad = Math.hypot(a.x - e.x, a.y - e.y);
          if (ad < nad) { nad = ad; nearAlly = a; }
        });
        if (nearAlly && nad > 50) {
          const ax = nearAlly.x - e.x, ay = nearAlly.y - e.y;
          e.x += (ax / nad) * e.spd * 60 * edt;
          e.y += (ay / nad) * e.spd * 60 * edt;
        } else if (ds > 1) {
          e.x += (dx / ds) * e.spd * 40 * edt;
          e.y += (dy / ds) * e.spd * 40 * edt;
        }
        if (e.behaviorTimer <= 0 && e.anim === 'walk') {
          setAnim(e, 'attack');
          e.behaviorTimer = 4 + Math.random() * 2;
        }
      }
      break;

    case 7:
      if (ds > 1) {
        e.x += (dx / ds) * e.spd * 70 * edt;
        e.y += (dy / ds) * e.spd * 70 * edt;
      }
      if (e.behaviorTimer <= 0 && e.anim === 'walk') {
        setAnim(e, 'attack');
        e.behaviorTimer = 2.5 + Math.random() * 1.5;
      }
      break;

    default:
      if (ds > 1) { e.x += (dx / ds) * e.spd * 60 * edt; e.y += (dy / ds) * e.spd * 60 * edt; }
  }
}


window.spawnEnemy = spawnEnemy;
window.processNextLevelUp = processNextLevelUp;
window.addXP = addXP;
window.enemyDeath = enemyDeath;
window.spawnContinuous = spawnContinuous;
window.hasShieldAura = hasShieldAura;
window.updateEnemyBehavior = updateEnemyBehavior;


// Player Damage
function hitPlayer(dmg) {
  if (P.iframes > 0 || G.phase !== 'wave' && G.phase !== 'boss') return;

  const armorDmg = Math.max(1, dmg - P.armor);
  const shieldedDmg = typeof hasShieldAura === 'function' && typeof _shieldDrones !== 'undefined' ? armorDmg : armorDmg; // Simplification, player shield logic can be added if exists

  P.hp -= armorDmg; P.iframes = 0.5; P.flash = 0.1;
  G.combo = 0; G.comboDecay = 0;
  if (typeof playSound === 'function') playSound('hit');
  if (typeof triggerShake === 'function') triggerShake(5, 0.2);

  // Blood particles
  if (typeof particles !== 'undefined') {
    for (let i = 0; i < 15; i++) {
      const p = particles.get(); if (p) {
        p.x = P.x; p.y = P.y;
        p.vx = (Math.random() - 0.5) * 300; p.vy = (Math.random() - 0.5) * 300;
        p.life = 0.4 + Math.random() * 0.4; p.col = '#ff0055'; p.sz = 2 + Math.random() * 3;
        p.active = true;
      }
    }
  }

  if (P.hp <= 0 && typeof gameOver === 'function') { P.hp = 0; gameOver(); }
}

window.hitPlayer = hitPlayer;

// Boss
class Boss {
  constructor(data, wave) {
    this.data = data;
    this.x = W / 2; this.y = -150;
    this.targetY = 150;
    this.maxHp = data.hp * (1 + wave * 0.15); this.hp = this.maxHp;
    this.sz = data.sz || 45; this.col = data.col || '#ff5500';
    this.state = 'enter'; this.timer = 0;
    this.attackCd = 2; this.attackIdx = 0;
    this.flash = 0;
    this.clones = [];
    this.diving = false;
  }
  update(dt) {
    if (this.flash > 0) this.flash -= dt;
    this.timer += dt;
    if (this.state === 'enter') {
      this.y += 100 * dt;
      if (this.y >= this.targetY) { this.y = this.targetY; this.state = 'combat'; this.timer = 0; }
      return;
    }
    // Hovering movement
    this.x = W / 2 + Math.sin(this.timer * 0.5) * 250;
    this.y = this.targetY + Math.sin(this.timer * 1.2) * 30;

    if (this.diving) {
      if (typeof fxExplosion === 'function') fxExplosion(this.diveTarget.x, this.diveTarget.y, 80);
      if (Math.hypot(P.x - this.diveTarget.x, P.y - this.diveTarget.y) < 80 && typeof hitPlayer === 'function') hitPlayer(30);
      this.diving = false;
      if (typeof triggerShake === 'function') triggerShake(10, 0.2);
    }

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
    if (typeof triggerShake === 'function') triggerShake(3, 0.06);
    return this.hp <= 0;
  }
  draw(ctx) {
    for (const c of this.clones) { if (!isOnScreen(c.x, c.y, 100)) continue; ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = 0.4; const spr = typeof BOSS_SPRITES !== 'undefined' ? BOSS_SPRITES[G.bossKey] : null; if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2); ctx.restore(); }
    if (this.diving) { ctx.save(); ctx.translate(this.diveTarget.x, this.diveTarget.y); ctx.fillStyle = 'rgba(255,0,0,0.2)'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.translate(this.x, this.y);
    const spr = typeof BOSS_SPRITES !== 'undefined' ? BOSS_SPRITES[G.bossKey] : null; if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    if (this.flash > 0 && spr) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }
}

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
  if (typeof playSound === 'function') playSound('bossDeath');
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

window.Boss = Boss;
window.getBossForWave = getBossForWave;
window.startBossIntro = startBossIntro;
window.updateBossIntro = updateBossIntro;
window.startBoss = startBoss;
