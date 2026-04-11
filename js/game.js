// ============ CORE GAME FILE ============
console.log("GAME.JS LOADED");
// Note: Global state (G, P, WEAPONS, etc.), utilities, UI, Input, Combat, and Shop
// are now managed in their respective modules and loaded via index.html.parate <script> tags

console.log("GAME.JS LINE 6 REACHED");

// ============ PAUSE SYSTEM ============
function renderPauseOverlay() {
  const wps = typeof WAVES_PER_STAGE !== 'undefined' ? WAVES_PER_STAGE : 10;
  const stageNum = Math.floor((Math.max(1, G.wave) - 1) / wps) + 1;
  const waveInStage = ((Math.max(1, G.wave) - 1) % wps) + 1;
  const hpRatio = P.maxHp > 0 ? P.hp / P.maxHp : 1;
  const runStatus = hpRatio <= 0.3 ? 'CRITICAL' : hpRatio <= 0.68 ? 'PRESSURED' : 'STABLE';
  const phaseLabel = G.phase === 'boss' ? 'BOSS LIVE' : G.phase === 'milestone' ? 'MILESTONE' : 'WAVE LIVE';
  const pauseKicker = document.getElementById('pause-kicker');
  const pauseSub = document.getElementById('pause-sub');
  const pauseBrief = document.getElementById('pause-brief');
  if (pauseKicker) pauseKicker.textContent = G.mode === 'arcade' ? 'ARCADE RUN PAUSED' : 'ADVENTURE RUN PAUSED';
  if (pauseSub) {
    pauseSub.textContent = G.mode === 'arcade'
      ? `WAVE ${G.wave}/100 · ${phaseLabel} · ${formatTime(G.totalTime)}`
      : `STAGE ${stageNum} — ${waveInStage}/${wps} · ${phaseLabel} · ${formatTime(G.totalTime)}`;
  }
  if (pauseBrief) {
    const directive = hpRatio <= 0.3
      ? 'Find breathing room before re-engaging.'
      : G.phase === 'boss'
        ? 'Read the tell, keep the lane clean, then commit.'
        : G.combo >= 12
          ? 'You have tempo. Push the wave while the combo is alive.'
          : 'Reset cleanly, then rebuild pressure with the next pickup cluster.';
    pauseBrief.innerHTML = `
      <div class="pause-brief-kicker">TACTICAL READ</div>
      <div class="pause-brief-status">${runStatus}</div>
      <div class="pause-brief-copy">${directive}</div>
      <div class="pause-brief-meta">
        <span>HP ${Math.ceil(P.hp)}/${P.maxHp}</span>
        <span>${G.kills} kills</span>
        <span>${P.leverage}x lev</span>
      </div>
    `;
  }
  const pw = document.getElementById('pause-weapons');
  pw.innerHTML = P.weapons.map(w => {
    const def = WEAPONS[w.id];
    const lvlTag = typeof renderWeaponLevelInline === 'function' ? renderWeaponLevelInline(w.level) : `Lv${w.level}`;
    return `<div class="pause-wep"><div class="pause-wep-icon">${def.icon}</div><div class="pause-wep-lvl">${lvlTag}</div><div class="pause-wep-info">${def.name}</div></div>`;
  }).join('');

  const avgDPS = G.totalTime > 0 ? Math.round(G.totalDmgDealt / G.totalTime) : 0;
  const ps = document.getElementById('pause-stats');
  ps.innerHTML = `
    <div class="pause-stat"><div class="pause-stat-val">${G.wave}</div><div class="pause-stat-lbl">Wave</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${G.kills}</div><div class="pause-stat-lbl">Kills</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${formatTime(G.totalTime)}</div><div class="pause-stat-lbl">Time</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${Math.ceil(P.hp)}/${P.maxHp}</div><div class="pause-stat-lbl">HP</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${G.gold}</div><div class="pause-stat-lbl">Gold</div></div>
    <div class="pause-stat"><div class="pause-stat-val">LV ${P.level}</div><div class="pause-stat-lbl">Level</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${G.maxCombo}x</div><div class="pause-stat-lbl">Best Combo</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${avgDPS}</div><div class="pause-stat-lbl">DPS</div></div>
    <div class="pause-stat"><div class="pause-stat-val">${P.leverage}x</div><div class="pause-stat-lbl">Leverage</div></div>
  `;

  const skillBar = document.getElementById('pause-skill-bar');
  if (skillBar) {
    skillBar.innerHTML = typeof getPlayerSkillCardsHTML === 'function' ? getPlayerSkillCardsHTML(P) : '';
  }

  const mapBtn = document.getElementById('btn-stagemap');
  if (mapBtn) mapBtn.style.display = G.mode === 'adventure' ? '' : 'none';
}

function togglePause() {
  if (G.phase !== 'wave' && G.phase !== 'paused' && G.phase !== 'boss' && G.phase !== 'milestone') return;
  if (G.phase === 'paused') {
    resumeGame();
  } else {
    G.prevPhase = G.phase;
    G.phase = 'paused';
    renderPauseOverlay();
    document.getElementById('pause-menu').classList.remove('h');
  }
}

function pauseGame() {
  G.prevPhase = G.phase;
  G.phase = 'paused';
  renderPauseOverlay();
  document.getElementById('pause-menu').classList.remove('h');
}

function resumeGame() {
  G.phase = G.prevPhase || 'wave';
  G.prevPhase = null;
  document.getElementById('pause-menu').classList.add('h');
  lastT = performance.now();
  requestAnimationFrame(loop);
}

const cv = document.getElementById('cv'), ctx = cv.getContext('2d');

// ============ FULLSCREEN CANVAS RESIZE ============
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
// Cached DOM refs for HUD (avoid getElementById every frame)
const DOM = {
  hpb: document.getElementById('hpb'),
  hpt: document.getElementById('hpt'),
  lvl: document.getElementById('lvl'),
  stageInfo: document.getElementById('stage-info'),
  waveInfo: document.getElementById('wave-info'),
  waveTimer: document.getElementById('wave-timer'),
  hpState: document.getElementById('hud-hp-state'),
  xpMeta: document.getElementById('xp-meta'),
  hudModeKicker: document.getElementById('hud-mode-kicker'),
  hudKillCornerVal: document.getElementById('hud-kill-corner-val'),
  hudFlowState: document.getElementById('hud-flow-state'),
  hudShell: document.getElementById('hud-shell'),
  gold: document.getElementById('gold'),
  bossBar: document.getElementById('boss-bar'),
  bossBarName: document.getElementById('boss-bar-name'),
  bossBarSub: document.getElementById('boss-bar-sub'),
  bossBarContainer: document.querySelector('.boss-bar-container'),
  bossBarFill: document.getElementById('boss-bar-fill'),
  bossBarHp: document.getElementById('boss-bar-hp'),
  xpb: document.getElementById('xpb'),
};
let lastT = 0;

function bossHudColor(color, alpha) {
  if (typeof particleColorWithAlpha === 'function') return particleColorWithAlpha(color, alpha);
  return color;
}

function getBossHudProfile(bossKey) {
  const boss = (typeof BOSSES !== 'undefined' && BOSSES[bossKey]) || {};
  const visual = (typeof BOSS_VISUALS !== 'undefined' && BOSS_VISUALS[bossKey]) || {};
  return {
    accent: visual.accent || boss.col || '#ff7755',
    secondary: visual.secondary || '#ffffff',
    tag: visual.tag || boss.sub || 'BOSS'
  };
}

function updateBossHudState(boss) {
  if (!boss || !DOM.bossBarFill || !DOM.bossBarHp) return;
  const profile = getBossHudProfile(G.bossKey);
  const accent = profile.accent;
  const secondary = profile.secondary;
  const intentLabel = boss.intent ? boss.intent.label : 'TRACKING';
  const phaseLabel = boss.phase2 ? 'PHASE 2' : 'PHASE 1';
  DOM.bossBarFill.style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
  DOM.bossBarHp.textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${Math.ceil(boss.maxHp)}`;
  DOM.bossBarFill.style.background = `linear-gradient(90deg, ${bossHudColor(accent, 0.62)}, ${accent}, ${secondary})`;
  DOM.bossBarFill.style.boxShadow = `0 0 16px ${bossHudColor(accent, 0.48)}, inset 0 0 12px ${bossHudColor('#ffffff', 0.16)}`;
  if (DOM.bossBarContainer) {
    DOM.bossBarContainer.style.borderColor = bossHudColor(accent, boss.shieldHp > 0 ? 0.7 : 0.42);
    DOM.bossBarContainer.style.boxShadow = boss.shieldHp > 0
      ? `0 0 18px ${bossHudColor(secondary, 0.24)}, inset 0 0 20px ${bossHudColor(accent, 0.14)}`
      : `0 0 12px ${bossHudColor(accent, 0.18)}`;
  }
  if (DOM.bossBarName) {
    DOM.bossBarName.textContent = boss.data.name;
    DOM.bossBarName.style.color = accent;
    DOM.bossBarName.style.textShadow = `0 0 14px ${bossHudColor(accent, 0.35)}`;
  }
  if (DOM.bossBarSub) {
    DOM.bossBarSub.textContent = `${String(boss.data.sub || profile.tag).toUpperCase()} · ${phaseLabel} · ${intentLabel}`;
    DOM.bossBarSub.style.color = bossHudColor(secondary, 0.9);
    DOM.bossBarSub.style.textShadow = `0 0 10px ${bossHudColor(accent, 0.14)}`;
  }
  if (DOM.bossBar) {
    DOM.bossBar.style.filter = boss.phase2 ? 'saturate(1.15)' : 'none';
  }
}

// Lerp display values for smooth HUD bars
let _hpDisplay = 100, _xpDisplay = 0;

// ============ COMBO SYSTEM ============
function addCombo() {
  G.combo++;
  G.comboTimer = 2;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  degenOnCombo(G.combo);
  checkKillStreak(G.combo);
}

function updateCombo(dt) {
  if (G.comboTimer > 0) {
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) G.combo = 0;
  }
}

const WEAPON_FEEL_STATE = Object.create(null);

function getWeaponVisualConfig(vis) {
  return typeof getBulletConfig === 'function' ? getBulletConfig(vis) : null;
}

function getWeaponKickback(vis) {
  const cfg = getWeaponVisualConfig(vis);
  const recoil = cfg && cfg.recoil;
  if (recoil && Number.isFinite(recoil.kickback)) return recoil.kickback;
  if (recoil && Number.isFinite(recoil.shake)) return Math.max(4.5, Math.min(12, 5 + recoil.shake * 1.2));
  return 6;
}

function getPlayerKnockbackMult() {
  return Math.max(0.2, P.kbMult || 1);
}

function getWeaponBurnSpec(def, levStats) {
  if (!def || !def.burnDmg || !def.burnDuration) return { dps: 0, duration: 0 };
  const scale = (P.dmgMult || 1) * ((levStats && levStats.dmgMult) || 1);
  return {
    dps: def.burnDmg * scale,
    duration: def.burnDuration
  };
}

const FRIENDLY_WEAPON_HAZARD_TYPES = new Set(['friendlyBeam', 'friendlyPuddle', 'friendlyTrailFire', 'fallingHammer']);

function isFriendlyWeaponHazard(h) {
  if (!h) return false;
  if (h.data && h.data.friendly === true) return true;
  return FRIENDLY_WEAPON_HAZARD_TYPES.has(h.type);
}

function detonateFriendlyProjectile(p, dmgMult) {
  if (!p || !p.active || !p._explodeArea) {
    if (p) p.active = false;
    return;
  }
  const area = p._explodeArea;
  const mult = dmgMult == null ? 1 : dmgMult;
  if (typeof fxExplosion === 'function') fxExplosion(p.x, p.y, area);
  if (typeof triggerShake === 'function') triggerShake(Math.min(7, 3 + area * 0.03), 0.12);
  hash.qry(p.x, p.y, area).forEach(e => {
    if (e.dying) return;
    const dist = Math.hypot(e.x - p.x, e.y - p.y);
    if (dist > area + e.sz) return;
    const splash = p.dmg * mult * Math.max(0.45, 1 - dist / Math.max(1, area) * 0.4);
    e.hp -= splash; G.totalDmgDealt += splash; e.flash = 0.08;
    if (!e.dying) setAnim(e, 'hit');
    if (typeof applyEnemyKnockback === 'function') applyEnemyKnockback(e, p.x, p.y, Math.max(1.2, (p._hitKb || 1.8) * 0.8));
    if (p._burnDmg > 0 && typeof applyEnemyBurn === 'function') applyEnemyBurn(e, p._burnDmg * 0.7, p._burnDuration || 0);
    if (e.hp <= 0) enemyDeath(e);
  });
  if (G.boss && G.phase === 'boss') {
    const dist = Math.hypot(G.boss.x - p.x, G.boss.y - p.y);
    if (dist < area + G.boss.sz) {
      const splash = p.dmg * mult * Math.max(0.5, 1 - dist / Math.max(1, area) * 0.35);
      G.totalDmgDealt += splash;
      G.boss.hit(splash);
      if (p._burnDmg > 0 && typeof applyBossBurn === 'function') applyBossBurn(G.boss, p._burnDmg * 0.7, p._burnDuration || 0);
    }
  }
  p.active = false;
}

function triggerWeaponImpactFeel(vis, opts) {
  const cfg = getWeaponVisualConfig(vis);
  const feel = cfg && cfg.feel;
  if (!feel || typeof G === 'undefined') return;

  const now = Number.isFinite(G.totalTime) ? G.totalTime : 0;
  const stampKey = `${opts && opts.boss ? 'boss' : 'hit'}:${vis || 'fallback'}`;
  const cooldown = feel.impactCooldown || 0.08;
  const last = WEAPON_FEEL_STATE[stampKey];
  if (Number.isFinite(last) && now >= last && now - last < cooldown) return;
  WEAPON_FEEL_STATE[stampKey] = now;

  const killMult = opts && opts.killed ? (feel.killShakeMult || 1.2) : 1;
  const bossMult = opts && opts.boss ? 1.08 : 1;
  const critMult = opts && opts.crit ? 1.12 : 1;
  const shakeAmt = (feel.impactShake || 0) * killMult * bossMult * critMult;
  const shakeDur = feel.impactShakeDuration || 0.05;
  if (shakeAmt > 0 && typeof triggerShake === 'function') triggerShake(shakeAmt, shakeDur);

  if (!(opts && opts.crit) && feel.impactSlowmoScale && feel.impactSlowmoScale < 0.999 && typeof triggerSlowmo === 'function') {
    triggerSlowmo(feel.impactSlowmoScale, feel.impactSlowmoDuration || 0.03);
  }

  const accent = cfg.impactColor || cfg.glowColor || '#ffffff';
  const glow = cfg.glowColor || accent;
  const life = Math.max(0.09, shakeDur + (opts && opts.killed ? 0.05 : 0.025));
  const strength = Math.max(
    0.4,
    Math.min(
      1.5,
      0.45
        + shakeAmt * 0.2
        + (opts && opts.killed ? 0.16 : 0)
        + (opts && opts.boss ? 0.14 : 0)
        + (opts && opts.crit ? 0.08 : 0)
    )
  );
  const nextPulse = {
    accent,
    glow,
    life,
    maxLife: life,
    strength,
    boss: !!(opts && opts.boss),
    killed: !!(opts && opts.killed),
    crit: !!(opts && opts.crit),
  };
  if (G._weaponImpactPulse && G._weaponImpactPulse.life > 0) {
    const replaceColor = nextPulse.strength >= G._weaponImpactPulse.strength;
    if (replaceColor) {
      G._weaponImpactPulse.accent = nextPulse.accent;
      G._weaponImpactPulse.glow = nextPulse.glow;
    }
    G._weaponImpactPulse.life = Math.max(G._weaponImpactPulse.life, nextPulse.life);
    G._weaponImpactPulse.maxLife = Math.max(G._weaponImpactPulse.maxLife, nextPulse.maxLife);
    G._weaponImpactPulse.strength = Math.max(G._weaponImpactPulse.strength, nextPulse.strength);
    G._weaponImpactPulse.boss = G._weaponImpactPulse.boss || nextPulse.boss;
    G._weaponImpactPulse.killed = G._weaponImpactPulse.killed || nextPulse.killed;
    G._weaponImpactPulse.crit = G._weaponImpactPulse.crit || nextPulse.crit;
  } else {
    G._weaponImpactPulse = nextPulse;
  }
}

// ============ CORE FUNCTIONS ============

// ============ DAMAGE FLASH ============
function triggerDamageFlash(dmg, hp, maxHp) {
  const el = document.getElementById('damage-flash');
  if (!el) return;
  el.classList.remove('active', 'critical', 'low-hp');
  void el.offsetWidth; // force reflow to restart animation
  const hpPct = hp / maxHp;
  if (hpPct <= 0) {
    el.classList.add('critical');
  } else if (dmg > maxHp * 0.25) {
    el.classList.add('critical');
  } else {
    el.classList.add('active');
  }
  // Low HP persistent pulse
  if (hpPct > 0 && hpPct <= 0.3) {
    setTimeout(() => {
      el.classList.remove('active', 'critical');
      el.classList.add('low-hp');
    }, 400);
  }
}

function clearDamageFlash() {
  const el = document.getElementById('damage-flash');
  if (el) el.classList.remove('active', 'critical', 'low-hp');
}

// ENEMY_STATS is now auto-derived from ENEMY_DEFS in sprites.js





// ============ MILESTONES ============
const MILESTONES = [100, 250, 500, 1000, 2000];
function checkMilestones() {
  for (const m of MILESTONES) {
    if (G.kills >= m && G.lastMilestone < m) {
      G.lastMilestone = m;
      showMilestone(`${m} KILLS!`);
      playSound('levelup');
      break;
    }
  }
}

function showMilestone(text, opts) {
  opts = opts || {};
  const el = document.getElementById('milestone-banner');
  if (!el) return;
  const subText = opts.subText || '';
  const accent = opts.accent || '#ffd700';
  const subColor = opts.subColor || '#9bdcff';
  const duration = opts.duration || 1500;
  if (el._hideTimer) clearTimeout(el._hideTimer);
  el.classList.remove('h');
  el.innerHTML = `
    <div class="milestone-text" style="filter:drop-shadow(0 0 18px ${accent}55)">${text}</div>
    ${subText ? `<div style="font-family:'JetBrains Mono';font-size:13px;color:${subColor};letter-spacing:2px;margin-top:6px;animation:milestonePop 1.1s cubic-bezier(0.34,1.56,0.64,1) 0.08s forwards;opacity:0">${subText}</div>` : ''}
  `;
  el._hideTimer = setTimeout(() => el.classList.add('h'), duration);
}

function getWaveTransitionPalette() {
  const pal = typeof getCombatFxPalette === 'function' ? getCombatFxPalette() : null;
  return {
    accent: pal && pal.accent ? pal.accent : '#00cec9',
    secondary: pal && pal.secondary ? pal.secondary : '#9bdcff',
    reward: '#ffd166',
    danger: '#ff6b6b'
  };
}

function buildWaveIntroMeta(wave) {
  const palette = getWaveTransitionPalette();
  const diff = getDifficulty(wave);
  const stageNum = Math.floor((wave - 1) / WAVES_PER_STAGE) + 1;
  const stageWave = ((wave - 1) % WAVES_PER_STAGE) + 1;
  const maxName = ((typeof ENEMY_NAMES !== 'undefined' ? ENEMY_NAMES[diff.maxType] : null) || 'Unknown').toUpperCase();
  const bossSoon = G.mode === 'adventure' && stageWave === WAVES_PER_STAGE;
  const earlyArcade = G.mode === 'arcade' && wave <= 3;
  const kicker = bossSoon
    ? 'FINAL PUSH BEFORE THE BOSS'
    : earlyArcade
      ? 'MARKET OPEN'
      : wave === 1
        ? 'OPENING PRINT'
        : 'RESET · SCOOP · RELOAD';

  return {
    title: G.mode === 'adventure' ? `STAGE ${stageNum} — WAVE ${stageWave}` : `WAVE ${wave}/100`,
    kicker,
    subLabel: bossSoon ? `BOSS NEXT · THREAT MIX: ${maxName}` : `THREAT MIX: ${maxName}`,
    difficulty: Math.min(1, G.mode === 'adventure' ? (wave + stageWave * 0.65) / 16 : wave / 20),
    accent: bossSoon ? palette.danger : palette.accent,
    reward: palette.reward,
    subColor: palette.secondary,
    countdownLabel: bossSoon ? 'LOCK IN' : 'ENGAGE'
  };
}

function emitWaveTransitionFx(kind, opts) {
  opts = opts || {};
  if (typeof spawnParticles !== 'function') return;

  const palette = getWaveTransitionPalette();
  const x = Number.isFinite(opts.x) ? opts.x : P.x;
  const y = Number.isFinite(opts.y) ? opts.y : P.y;
  const accent = opts.accent || (kind === 'clear' ? palette.reward : palette.accent);
  const secondary = opts.secondary || palette.secondary;
  const burst = kind === 'clear' ? 14 : 10;

  spawnParticles(x, y, burst, {
    speed: kind === 'clear' ? 130 : 95,
    speedVar: kind === 'clear' ? 55 : 40,
    life: kind === 'clear' ? 0.34 : 0.24,
    size: kind === 'clear' ? 3.2 : 2.8,
    sizeEnd: 0,
    colors: [accent, secondary, '#ffffff'],
    friction: 0.89,
    gravity: -20,
    shape: kind === 'clear' ? 'spark' : 'circle',
  });

  spawnParticles(x, y, 1, {
    speed: 0,
    life: kind === 'clear' ? 0.2 : 0.16,
    size: kind === 'clear' ? 18 : 14,
    sizeEnd: kind === 'clear' ? 42 : 28,
    color: particleColorWithAlpha(accent, kind === 'clear' ? 0.28 : 0.22),
    shape: 'ring',
    thickness: kind === 'clear' ? 2.6 : 2,
  });

  if (kind === 'clear') {
    spawnParticles(x, y, 5, {
      speed: 88,
      speedVar: 28,
      life: 0.18,
      size: 1,
      sizeEnd: 1,
      colors: [accent, secondary],
      length: 22,
      lengthEnd: 4,
      thickness: 2,
      shape: 'line',
    });
  }

  if (typeof triggerShake === 'function') triggerShake(kind === 'clear' ? 4.2 : 2.8, kind === 'clear' ? 0.12 : 0.08);
  G._screenFlash = {
    kind: kind === 'clear' ? 'flash_warm' : 'flash_default',
    alpha: kind === 'clear' ? 0.085 : 0.05,
    life: kind === 'clear' ? 0.11 : 0.08,
    maxLife: kind === 'clear' ? 0.11 : 0.08,
  };
}

// ============ MAP BUILDING ZONES ============
// Buildings on all edges — enemies and player can't go there
const BUILDING_LEFT = Math.round(WORLD_W * 0.22);
const BUILDING_RIGHT = Math.round(WORLD_W * 0.78);
const BUILDING_TOP = Math.round(WORLD_H * 0.15);
const BUILDING_BOTTOM = Math.round(WORLD_H * 0.85);
const WAVE_BREATHER_DURATION = 3.0;
const WAVE_BREATHER_SPAWN_GRACE = 0.35;
const WAVE_BREATHER_PICKUP_SPEED = 960;
const HEART_MAGNET_RANGE = 110;
const HEART_MAGNET_PULL = 240;
const HEART_MAGNET_COLLECT_DIST = 18;

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq <= 0.001) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  const sx = ax + abx * t;
  const sy = ay + aby * t;
  return Math.hypot(px - sx, py - sy);
}

function pickSpawnTypeFromMix(mix, batchRecent) {
  if (!Array.isArray(mix) || !mix.length) return 0;
  const recent = Array.isArray(G._recentSpawnTypes) ? G._recentSpawnTypes : [];
  let weighted = mix.map(entry => {
    let weight = Math.max(0.01, entry.weight || 1);
    if (batchRecent.includes(entry.type) && mix.length > 1) weight *= 0.18;
    if (recent[recent.length - 1] === entry.type && mix.length > 1) weight *= 0.42;
    if (recent[recent.length - 2] === entry.type && mix.length > 2) weight *= 0.72;
    return { type: entry.type, weight };
  }).filter(entry => entry.weight > 0.01);

  if (!weighted.length) weighted = mix.map(entry => ({ type: entry.type, weight: entry.weight || 1 }));

  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  let picked = weighted[weighted.length - 1].type;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) {
      picked = entry.type;
      break;
    }
  }

  recent.push(picked);
  if (recent.length > 6) recent.shift();
  G._recentSpawnTypes = recent;
  return picked;
}

function getEliteSpawnChance(wave) {
  if (wave >= 10) return 0.08;
  if (wave >= 8) return 0.06;
  if (wave >= 6) return 0.04;
  if (wave >= 4) return 0.02;
  return 0;
}

// ============ CONTINUOUS ENEMY SPAWNING ============
function spawnContinuous(dt) {
  // DEBUG: spawne un de chaque type en cercle autour du joueur au premier tick
  if (typeof DEBUG_ALL_ENEMIES !== 'undefined' && DEBUG_ALL_ENEMIES && !G._debugSpawnedAll) {
    G._debugSpawnedAll = true;
    const cnt = ENEMY_DEFS.length;
    for (let t = 0; t < cnt; t++) {
      const a = (t / cnt) * Math.PI * 2 - Math.PI / 2;
      spawnEnemy(t, P.x + Math.cos(a) * 300, P.y + Math.sin(a) * 300);
    }
    G.spawnCd = 3.0; // pause de 3s avant le spawn continu
    return;
  }

  G.spawnCd -= dt;
  if (G.spawnCd > 0) return;
  if (enemies.count >= MAX_ENEMIES) return; // prevent unbounded growth

  const diff = getDifficulty(G.wave);
  G.spawnCd = diff.spawnRate;
  const mix = typeof getWaveSpawnMix === 'function' ? getWaveSpawnMix(G.wave, diff.maxType) : null;

  const room = MAX_ENEMIES - enemies.count;
  const batch = Math.min(diff.batchSize, room);
  const batchRecent = [];
  for (let i = 0; i < batch; i++) {
    // Spawn from TOP or BOTTOM roads only
    const fromTop = Math.random() > 0.5;
    const x = BUILDING_LEFT + Math.random() * (BUILDING_RIGHT - BUILDING_LEFT);
    const y = fromTop ? -30 - Math.random() * 80 : WORLD_H + 30 + Math.random() * 80;
    const type = mix && mix.length
      ? pickSpawnTypeFromMix(mix, batchRecent)
      : Math.min(diff.maxType, Math.floor(Math.random() * (diff.maxType + 1)));
    batchRecent.push(type);

    // Elite enemy chance — from wave 5+, 8% chance
    const eliteChance = getEliteSpawnChance(G.wave);
    const isElite = eliteChance > 0 && Math.random() < eliteChance;
    if (isElite) {
      spawnEnemy(type, x, y, { isElite: true, hp: ENEMY_STATS[type].hp * 3, dmg: ENEMY_STATS[type].dmg * 2, gold: ENEMY_STATS[type].gold * 3, xp: ENEMY_STATS[type].xp * 3, sz: ENEMY_STATS[type].sz * 1.3 });
    } else {
      spawnEnemy(type, x, y);
    }
  }
}

function clearInterWaveThreats() {
  projs.each(p => {
    if (!p.friendly) p.active = false;
  });
  hazards.each(h => {
    if (!isFriendlyWeaponHazard(h)) h.active = false;
  });
  enemies.each(e => {
    if (typeof clearEnemyTelegraph === 'function') clearEnemyTelegraph(e);
  });
}

function getPickupSoundType(type) {
  if (type === 'gold') return 'pickupGold';
  if (type === 'xp') return 'pickupXp';
  if (type === 'heart') return 'pickupHeart';
  return 'pickup';
}

function resolvePickupCollect(pk) {
  pk.active = false;
  fxPickup(pk.x, pk.y, pk.type, { amount: pk.val, magnetic: !!pk.mag });
  playSound(getPickupSoundType(pk.type));
  if (pk.type === 'gold') {
    G.gold += pk.val;
    G.totalGoldEarned += pk.val;
    if (typeof addDmgNum === 'function') addDmgNum({ x: pk.x, y: pk.y - 10, n: '+' + pk.val + 'G', life: 0.48, col: '#ffd54f' });
  } else if (pk.type === 'xp') {
    addXP(pk.val);
    if (typeof addDmgNum === 'function') addDmgNum({ x: pk.x, y: pk.y - 10, n: 'XP+' + pk.val, life: 0.5, col: '#55efc4' });
  } else if (pk.type === 'heart') {
    P.hp = Math.min(P.maxHp, P.hp + pk.val);
    addDmgNum({ x: pk.x, y: pk.y - 10, n: '+' + pk.val, life: 0.6, col: '#55efc4' });
  }
}

function updatePickups(dt, forceMagnet) {
  pickups.each(pk => {
    if (!Number.isFinite(pk._bobSeed)) pk._bobSeed = Math.random() * Math.PI * 2;
    if (!Number.isFinite(pk._spawnT)) pk._spawnT = 0;
    if (!Number.isFinite(pk._trailCd)) pk._trailCd = 0;
    if (!Number.isFinite(pk._spin)) pk._spin = (Math.random() - 0.5) * 0.35;
    pk._spawnT += dt;
    if (pk._trailCd > 0) pk._trailCd -= dt;

    const dx = P.x - pk.x, dy = P.y - pk.y;
    const ds = Math.hypot(dx, dy) || 0.0001;

    if (pk.type === 'heart') {
      if (P.hp >= P.maxHp) {
        pk.mag = false;
        return;
      }
      if (ds < HEART_MAGNET_RANGE) pk.mag = true;
      if (pk.mag) {
        const proximity = 1 - Math.min(1, ds / HEART_MAGNET_RANGE);
        const pull = HEART_MAGNET_PULL * (0.7 + proximity * 0.35);
        pk.x += dx / ds * pull * dt;
        pk.y += dy / ds * pull * dt;
        if (pk._trailCd <= 0 && typeof spawnParticles === 'function') {
          pk._trailCd = 0.05;
          spawnParticles(pk.x - dx / ds * 5, pk.y - dy / ds * 5, 1, {
            speed: 12,
            speedVar: 6,
            life: 0.18,
            size: 2.2,
            sizeEnd: 0,
            colors: ['#55efc4', '#d6fff4'],
            friction: 0.92,
            gravity: -20,
            shape: 'circle',
          });
        }
        if (ds < HEART_MAGNET_COLLECT_DIST) resolvePickupCollect(pk);
      }
      return;
    }

    if (forceMagnet || ds < P.magnetRange) pk.mag = true;
    if (pk.mag) {
      // Smooth magnet: accelerate as pickup gets closer (feels satisfying)
      const proximity = 1 - Math.min(1, ds / Math.max(P.magnetRange, 80));
      const basePull = forceMagnet ? WAVE_BREATHER_PICKUP_SPEED : 350;
      const pull = basePull + proximity * proximity * 600; // exponential acceleration
      pk.x += dx / ds * pull * dt;
      pk.y += dy / ds * pull * dt;
      if (pk._trailCd <= 0 && typeof spawnParticles === 'function') {
        pk._trailCd = 0.06;
        const trailColors = pk.type === 'gold'
          ? ['#ffd54f', '#fff2a3']
          : pk.type === 'xp'
            ? ['#55efc4', '#00f5d4']
            : ['#ffffff', '#d6fff4'];
        spawnParticles(pk.x - dx / ds * 5, pk.y - dy / ds * 5, 1, {
          speed: 14,
          speedVar: 8,
          life: 0.16,
          size: 2,
          sizeEnd: 0,
          colors: trailColors,
          friction: 0.92,
          gravity: -18,
          shape: pk.type === 'gold' ? 'square' : 'circle',
        });
      }
      if (ds < 22) resolvePickupCollect(pk);
    }
  });
}

// ============ SHIELD DRONE AURA ============
// Handled in combat.js

// ============ ENEMY BEHAVIORS ============
// Handled in combat.js




// ============ CINEMATIC ============
let cinematicPlayed = false;

function playCinematic(onComplete) {
  if (window.MediaDirector && typeof MediaDirector.playOpeningSequence === 'function') {
    MediaDirector.playOpeningSequence({
      alreadyPlayed: cinematicPlayed,
      onComplete: () => {
        cinematicPlayed = true;
        onComplete();
      }
    });
    return;
  }
  if (cinematicPlayed) { onComplete(); return; }
  cinematicPlayed = true;
  onComplete();
}

// ============ GAME FLOW ============
function startGame(mode) {
  console.log("START GAME CALLED WITH MODE:", mode);
  G.mode = mode || 'arcade';
  // In arcade mode, use the selected map as the stage
  if (G.mode === 'arcade' && typeof G.arcadeMap !== 'undefined') {
    G.stage = G.arcadeMap || 0;
  } else {
    G.stage = 0;
  }
  initAudio();
  if (window.MediaDirector && typeof MediaDirector.syncAudioSettings === 'function') MediaDirector.syncAudioSettings();
  // Clean up previous game UI effects
  document.getElementById('gm').classList.remove('dramatic');
  document.getElementById('vm').classList.remove('spectacular');
  document.querySelectorAll('.confetti-particle').forEach(e => e.remove());
  clearDamageFlash();
  G.wave = 0; G.gold = 30; G.kills = 0; G.phase = 'wave'; G.prevPhase = null;
  G.boss = null; G.bossKey = null; G.freezeTime = 0; G.totalTime = 0; G.combo = 0; G.comboTimer = 0; G.maxCombo = 0; G.spawnCd = 0;
  G.waveIntroTime = 0; G.waveIntroTotal = 0; G.pendingLevelUps = 0; G._screenFlash = null; G._weaponImpactPulse = null; G._waveIntroMeta = null;
  G._debugSpawnedAll = false;
  G._recentSpawnTypes = [];
  // Reset tracking stats
  G.totalDmgDealt = 0; G.totalDmgTaken = 0; G.totalGoldEarned = 0; G.bossesKilled = 0;
  G.dpsHistory = []; G.dpsAccum = 0; G.dpsTimer = 0; G.currentDPS = 0; G.lastMilestone = 0;
  G.maxStageReached = 0;
  P.x = WORLD_W / 2; P.y = WORLD_H / 2; P.hp = 100; P.maxHp = 100; P.spd = 200; P.armor = 0; P.crit = 5; P.kbMult = 1; P.dodge = 0;
  // Apply character stats for arcade mode
  if (G.mode === 'arcade' && typeof applyCharacterStats === 'function') {
    applyCharacterStats(P);
  }
  if (typeof DEBUG_ALL_ENEMIES !== 'undefined' && DEBUG_ALL_ENEMIES) { P.hp = P.maxHp = 9999; }
  P.xp = 0; P.level = 1; P.xpNext = typeof getXpThreshold === 'function' ? getXpThreshold(P.level) : 50; P.weapons = [{ id: 'pistol', level: 1, cd: 0 }];
  P._turrets = []; P._swingAngle = 0; P._orbitalDetachCd = 0;
  P.iframes = 0; P.dmgMult = 1; P.cdMult = (G.mode === 'arcade' && typeof getSelectedCharacter === 'function') ? getSelectedCharacter().stats.cdMult : 1; P.magnetRange = 100;
  P.leverage = 1; P.leverageIdx = 0; P.dashCd = 0; P.dashTimer = 0; P.dashing = false; P.animTimer = 0;
  P.vx = 0; P.vy = 0; P.kbX = 0; P.kbY = 0;
  P._hitPulse = 0; P._hitPulseMax = 0; P._hitSeverity = 0; P._hitDirX = 0; P._hitDirY = -1;
  CAM.x = P.x - W / 2; CAM.y = P.y - H / 2;
  enemies.clear(); projs.clear(); pickups.clear(); hazards.clear(); dmgNums.length = 0; particles.length = 0;
  godCandles.length = 0; afterimages.length = 0; _hpDisplay = 100; _xpDisplay = 0;

  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('boss-intro').classList.add('h');
  document.getElementById('milestone-banner').classList.add('h');
  resetMissions();
  resetUltimate();
  resetMarketEvents();
  resetIntensity();
  resetCharacterAnim();
  hideLevelUpUI();
  playCinematic(() => {
    if (G.mode === 'adventure') {
      showStageMap(() => {
        playNarrative(NARRATIVE_TEXTS.prologue, 'left', () => {
          startNextWave();
          lastT = performance.now();
          requestAnimationFrame(loop);
        });
      });
    } else {
      startNextWave();
      lastT = performance.now();
      requestAnimationFrame(loop);
    }
  });
}

function startNextWave() {
  G.wave++;

  // Adventure: update stage and play stage intro when entering a new stage
  if (G.mode === 'adventure') {
    const newStage = Math.floor((G.wave - 1) / WAVES_PER_STAGE);
    if (newStage !== G.stage) {
      G.stage = newStage;
      if (G.stage > G.maxStageReached) G.maxStageReached = G.stage;
      // Play stage intro cinematic, then resume normal wave start
      playStageIntro(G.stage, () => {
        _doStartWave();
        lastT = performance.now();
        requestAnimationFrame(loop);
      });
      return;
    }
  }

  // Check for pending stage intro (after boss shop)
  if (G.mode === 'adventure' && G._pendingStageIntro !== undefined) {
    const si = G._pendingStageIntro;
    delete G._pendingStageIntro;
    if (si !== G.stage) {
      G.stage = si;
      playStageIntro(G.stage, () => {
        _doStartWave();
        lastT = performance.now();
        requestAnimationFrame(loop);
      });
      return;
    }
  }

  _doStartWave();
}

function _doStartWave() {
  G.waveMaxTime = WAVE_DURATION(G.wave);
  G.waveTime = G.waveMaxTime;
  G.spawnCd = WAVE_BREATHER_SPAWN_GRACE;
  clearInterWaveThreats();
  G._waveIntroMeta = buildWaveIntroMeta(G.wave);
  if (window.MediaDirector && typeof MediaDirector.beginWave === 'function') MediaDirector.beginWave();
  else if (typeof startMusic === 'function') startMusic();

  // Show wave intro banner
  G.phase = 'waveIntro';
  G.waveIntroTime = WAVE_BREATHER_DURATION;
  G.waveIntroTotal = WAVE_BREATHER_DURATION;
  document.getElementById('boss-bar').classList.add('h');
}

function nextWaveAfterBoss() {
  console.log('[BOSS] nextWaveAfterBoss called, mode:', G.mode, 'wave:', G.wave);
  const goldReward = 40 + G.wave * 10;
  const stageNum = Math.floor((G.wave - 1) / WAVES_PER_STAGE) + 1;
  G.gold += goldReward;
  G.totalGoldEarned += goldReward;
  G.bossesKilled++;
  triggerShake(15, 0.5);
  triggerSlowmo(0.15, 0.8);
  fxBossDeath(G.boss.x, G.boss.y);
  const bossMedia = typeof getBossMediaProfile === 'function' ? getBossMediaProfile(G.bossKey) : null;
  if (window.MediaDirector && typeof MediaDirector.handleBossDefeat === 'function') MediaDirector.handleBossDefeat(G.bossKey);
  else playSound('bossDeath');

  showWaveClearBanner({
    title: 'BOSS DEFEATED',
    subText: G.mode === 'adventure'
      ? `STAGE ${stageNum} SECURED · +${goldReward}G`
      : `WAVE ${G.wave} BOSS DOWN · +${goldReward}G`,
    detailText: bossMedia && bossMedia.deathLine ? bossMedia.deathLine : '',
    accent: '#ffd166',
    subColor: '#fff1b3',
    duration: 2200
  });

  // Adventure: check victory (wave 50 = last boss) and advance stage
  if (G.mode === 'adventure') {
    const nextStage = Math.floor(G.wave / WAVES_PER_STAGE);
    if (G.wave >= 10 * WAVES_PER_STAGE) {
      G.phase = 'transition';
      setTimeout(() => victory(), 1500);
      return;
    }
    G.phase = 'transition';
    setTimeout(() => {
      // Show stage map between stages, then continue
      showStageMap(() => {
        G._pendingStageIntro = nextStage;
        startNextWave();
        lastT = performance.now();
        requestAnimationFrame(loop);
      });
    }, 1500);
    return;
  }

  G.phase = 'transition';
  setTimeout(() => { startNextWave(); lastT = performance.now(); requestAnimationFrame(loop); }, 1500);
}

function showWaveClearBanner(opts) {
  opts = opts || {};
  const gc = document.getElementById('gc');
  if (!gc) return;
  const banner = document.createElement('div');
  banner.className = 'stage-clear-banner';
  const stageNum = Math.floor(G.wave / WAVES_PER_STAGE);
  const title = opts.title || 'BOSS DEFEATED';
  const subText = opts.subText || (G.mode === 'adventure' ? `STAGE ${stageNum} COMPLETE` : `WAVE ${G.wave} COMPLETE`);
  const detailText = opts.detailText || '';
  const accent = opts.accent || '#ffd166';
  const subColor = opts.subColor || '#ffeaa7';
  const duration = opts.duration || 1800;
  banner.innerHTML = `
    <div class="stage-clear-text" style="color:${accent};text-shadow:0 0 22px ${accent}55">${title}</div>
    <div class="stage-clear-sub" style="color:${subColor};letter-spacing:3px">${subText}</div>
    ${detailText ? `<div class="stage-clear-detail">${detailText}</div>` : ''}
  `;
  gc.appendChild(banner);
  setTimeout(() => banner.remove(), duration);
}

// ============ MAIN LOOP ============

function loop(t) {
  if (G.phase === 'paused' || G.phase === 'levelup') return;
  if (G.phase !== 'wave' && G.phase !== 'boss' && G.phase !== 'bossIntro' && G.phase !== 'waveIntro') return;

  let rawDt = Math.min((t - lastT) / 1000, 0.1); lastT = t;

  updateSlowmo(rawDt);
  const dt = rawDt * getTimeScale();

  G.totalTime += rawDt;
  updateShake(rawDt);
  if (G.stage === 0) updateRain();
  updateCombo(dt);
  updateGodCandles(dt);
  updateAfterimages(dt);
  updateMissions(dt);
  updateDegenFX(dt);
  updateUltimate(dt);
  updateMarketEvents(dt);
  updateIntensity(dt);
  updateCharacterAnim(dt, inp);
  if (G._dangerShakeCd > 0) G._dangerShakeCd -= rawDt;
  if (G._screenFlash) {
    G._screenFlash.life -= rawDt;
    if (G._screenFlash.life <= 0) G._screenFlash = null;
  }
  if (G._weaponImpactPulse) {
    G._weaponImpactPulse.life -= rawDt;
    if (G._weaponImpactPulse.life <= 0) G._weaponImpactPulse = null;
  }

  // Leverage input
  if (inp.levUp && P.leverageIdx < LEVERAGE_STEPS.length - 1) { P.leverageIdx++; P.leverage = LEVERAGE_STEPS[P.leverageIdx]; inp.levUp = 0; }
  if (inp.levDown && P.leverageIdx > 0) { P.leverageIdx--; P.leverage = LEVERAGE_STEPS[P.leverageIdx]; inp.levDown = 0; }

  if (G.freezeTime > 0) { G.freezeTime -= dt; render(); updateHUD(); requestAnimationFrame(loop); return; }

  // ---- WAVE INTRO PHASE ----
  if (G.phase === 'waveIntro') {
    G.waveIntroTime -= dt;
    updatePickups(dt, true);
    for (let i = dmgNums.length - 1; i >= 0; i--) {
      dmgNums[i].life -= dt;
      dmgNums[i].y -= 35 * dt;
      if (dmgNums[i].life <= 0) { dmgNums[i] = dmgNums[dmgNums.length - 1]; dmgNums.pop(); }
    }
    updateParticles(dt * 0.85);
    if (G.waveIntroTime <= 0) {
      const introMeta = G._waveIntroMeta || buildWaveIntroMeta(G.wave);
      G.phase = 'wave';
      P.iframes = Math.max(P.iframes || 0, 0.22);
      emitWaveTransitionFx('start', { accent: introMeta.accent, secondary: introMeta.reward, x: P.x, y: P.y });
      playSound('waveStart');
      G._waveIntroMeta = null;
    }
    render(); updateHUD(); requestAnimationFrame(loop); return;
  }

  // ---- BOSS INTRO PHASE ----
  if (G.phase === 'bossIntro') {
    updateBossIntro(dt);
    render(); updateHUD(); requestAnimationFrame(loop); return;
  }

  // ---- WAVE PHASE ----
  if (G.phase === 'wave') {
    G.waveTime -= dt;
    spawnContinuous(dt);
    if (G.waveTime <= 0) {
      const palette = getWaveTransitionPalette();
      const stageNum = Math.floor((G.wave - 1) / WAVES_PER_STAGE) + 1;
      const stageWave = ((G.wave - 1) % WAVES_PER_STAGE) + 1;

      // Wave ended — mode-specific transitions
      if (G.mode === 'arcade') {
        // Arcade: 100 waves, no bosses, victory at 100
        if (G.wave >= 100) {
          victory();
        } else {
          emitWaveTransitionFx('clear', { accent: palette.reward, secondary: palette.accent });
          showMilestone('WAVE CLEAR', {
            subText: `WAVE ${G.wave} LOCKED · NEXT ${G.wave + 1}`,
            accent: palette.reward,
            subColor: palette.secondary,
            duration: 1050
          });
          playSound('waveClear');
          startNextWave();
        }
      } else {
        // Adventure: boss every 5 waves (end of stage)
        if (G.wave % WAVES_PER_STAGE === 0) {
          emitWaveTransitionFx('clear', { accent: palette.danger, secondary: palette.reward });
          showMilestone('BOSS INBOUND', {
            subText: `STAGE ${stageNum} CLEARED · BRACE FOR IMPACT`,
            accent: palette.danger,
            subColor: palette.reward,
            duration: 1150
          });
          playSound('waveClear');
          startBossIntro();
        } else {
          emitWaveTransitionFx('clear', { accent: palette.reward, secondary: palette.accent });
          showMilestone('WAVE CLEAR', {
            subText: `STAGE ${stageNum} · NEXT WAVE ${stageWave + 1}`,
            accent: palette.reward,
            subColor: palette.secondary,
            duration: 1050
          });
          playSound('waveClear');
          startNextWave();
        }
      }
      render(); updateHUD(); requestAnimationFrame(loop); return;
    }
  }

  // ---- BOSS PHASE ----
  if (G.phase === 'boss' && G.boss) {
    G.boss.update(dt);
    updateBossHudState(G.boss);
    if (G.boss.hp <= 0) {
      nextWaveAfterBoss();
      render();
      ctx.save(); ctx.fillStyle = '#fdcb6e'; ctx.font = "900 28px 'Exo 2'";
      ctx.textAlign = 'center'; ctx.shadowColor = '#fdcb6e'; ctx.shadowBlur = 20;
      ctx.fillText('BOSS DEFEATED', W / 2, H / 2); ctx.restore();
      return;
    }
  }

  // ---- PLAYER MOVEMENT & AIMING ----
  if (isPlayingIntro) { render(); updateHUD(); requestAnimationFrame(loop); return; }
  P.animTimer += dt;
  let dx = inp.r - inp.l, dy = inp.d - inp.u;

  // Mouse movement — move toward cursor when held
  if (_mouseDown && !dx && !dy) {
    const mdx = _mouseWorldX - P.x, mdy = _mouseWorldY - P.y;
    const md = Math.hypot(mdx, mdy);
    if (md > 15) { // dead zone to avoid jitter when close
      dx = mdx / md;
      dy = mdy / md;
    }
  }

  let len = 0;
  if (dx || dy) { len = Math.hypot(dx, dy); dx /= len; dy /= len; }

  // Use cached nearest enemy from enemy update loop (no extra O(n) search)
  let _nearest = _frameNearest, _nd = Math.sqrt(_frameNearestDistSq);

  // Determine target angle — instant lock-on to nearest enemy
  let targetAngle = P.angle;
  if (_nearest) {
    targetAngle = Math.atan2(_nearest.y - P.y, _nearest.x - P.x);
  } else if (dx || dy) {
    targetAngle = Math.atan2(dy, dx);
  }

  // Comfort pass: keep aim responsive, but never snap instantly when nearest target changes.
  let angleDiff = targetAngle - P.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  const aimTurnSpeed = _nearest ? 8.8 : 6.4;
  const aimStep = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), aimTurnSpeed * dt);
  P.angle += aimStep;

  // Dash
  if (P.dashCd > 0) P.dashCd -= dt;
  if (inp.dash && P.dashCd <= 0 && !P.dashing && (dx || dy)) {
    P.dashing = true;
    P.dashTimer = 0.15;
    P.dashCd = 1.0;
    P.dashDir = { x: dx, y: dy };
    P.iframes = 0.2;
    inp.dash = 0;

    // Set explicit high velocity for the dash
    const dashSpd = P.spd * 4;
    P.vx = P.dashDir.x * dashSpd;
    P.vy = P.dashDir.y * dashSpd;
  }

  if (P.dashing) {
    P.dashTimer -= dt;
    // Maintain dash velocity
    const dashSpd = P.spd * 4;
    P.vx = P.dashDir.x * dashSpd;
    P.vy = P.dashDir.y * dashSpd;

    // Afterimage
    if (typeof JEFF_ANIM !== 'undefined' && JEFF_ANIM.currentFrame) {
      fxDashAfterimage(P.x, P.y, P.angle, { ...JEFF_ANIM.currentFrame });
    }
    if (P.dashTimer <= 0) P.dashing = false;
  } else {
    // ---- PHYSICS-BASED MOVEMENT ----
    const accel = 1500; // units per second squared
    const friction = 8;   // multiplier for velocity decay

    // Apply acceleration based on input
    P.vx += dx * accel * dt;
    P.vy += dy * accel * dt;

    // Apply friction
    P.vx -= P.vx * friction * dt;
    P.vy -= P.vy * friction * dt;

    // Cap velocity to max speed
    // Apply ice slow debuff
    if (P._iceSlow > 0) P._iceSlow -= dt;
    const slowMult = (P._iceSlow > 0) ? 0.45 : 1;
    const maxSpeed = P.spd * slowMult;
    const currentSpeed = Math.hypot(P.vx, P.vy);
    if (currentSpeed > maxSpeed) {
      P.vx = (P.vx / currentSpeed) * maxSpeed;
      P.vy = (P.vy / currentSpeed) * maxSpeed;
    }
  }

  // Apply velocity to position
  P.x += P.vx * dt;
  P.y += P.vy * dt;
  if (P.kbX || P.kbY) {
    P.x += P.kbX * dt;
    P.y += P.kbY * dt;
    const kbDecay = Math.max(0, 1 - dt * 10);
    P.kbX *= kbDecay;
    P.kbY *= kbDecay;
  }

  // Clamp to playable area (between buildings)
  if (P.x < BUILDING_LEFT + P.sz) { P.x = BUILDING_LEFT + P.sz; P.vx *= -0.5; }
  else if (P.x > BUILDING_RIGHT - P.sz) { P.x = BUILDING_RIGHT - P.sz; P.vx *= -0.5; }

  if (P.y < BUILDING_TOP + P.sz) { P.y = BUILDING_TOP + P.sz; P.vy *= -0.5; }
  else if (P.y > BUILDING_BOTTOM - P.sz) { P.y = BUILDING_BOTTOM - P.sz; P.vy *= -0.5; }

  if (P.iframes > 0) P.iframes -= dt; if (P.flash > 0) P.flash -= dt; if (P._hitPulse > 0) P._hitPulse -= dt; if (P._hitSeverity > 0) P._hitSeverity -= dt * 2.4;

  // Update camera
  updateCamera(dt);

  // Hitstop — brief time slowdown, not a hard freeze
  const hitstopScale = (typeof isHitstopActive === 'function' && isHitstopActive()) ? 0.05 : 1;

  // ---- ENEMY UPDATE (2-pass: hash build → physics) ----
  // Pass 1: Build spatial hash + cache shield drones + update animations
  hash.clear();
  _shieldDrones.length = 0;
  const eDt = dt * hitstopScale; // enemy dt (slowed during hitstop)
  enemies.each(e => {
    // _shieldDrones no longer used (old Shield Drone enemy removed)
    if (!e.spawning) updateEnemyAnim(e, eDt);
    if (!e.dying && !e.spawning) hash.add(e);
  });

  // Pass 2: Behavior → Separation → Friction → Speedcap → Integrate → Clamp → Collision
  _frameNearest = null; _frameNearestDistSq = Infinity;
  enemies.each(e => {
    if (e.dying) return;
    if (e.spawning) {
      e.spawnTimer -= dt;
      e.vx = 0;
      e.vy = 0;
      if (e.spawnTimer <= 0) {
        e.spawning = false;
        e.spawnTimer = 0;
        e.spawnReveal = 0.28;
        e._alertTimer = 0.18 + Math.random() * 0.14;
        e._attitude = 'alert';
        e._attitudeTimer = e._alertTimer;
        e._attitudePower = 0.74;
        e.behaviorTimer = Math.max(e.behaviorTimer, e._alertTimer + 0.18);
        e.drawX = e.x - (e._spawnDirX || 0) * 18;
        e.drawY = e.y - (e._spawnDirY || 1) * 18;
      }
      return;
    }

    if (typeof updateEnemyStatusEffects === 'function' && updateEnemyStatusEffects(e, eDt)) return;

    // Behavior applies forces to e.vx/e.vy
    updateEnemyBehavior(e, eDt);

    // Enemy-to-enemy separation
    applyEnemySeparation(e, eDt);

    // Friction + speed cap
    const move = ENEMY_MOVE[e.type] || ENEMY_MOVE[0];
    e.vx -= e.vx * move.friction * eDt;
    e.vy -= e.vy * move.friction * eDt;
    const maxSpd = e.spd * move.maxSpd;
    const curSpd = Math.hypot(e.vx, e.vy);
    if (curSpd > maxSpd) {
      const scale = maxSpd / curSpd;
      e.vx *= scale;
      e.vy *= scale;
    }

    // Velocity smoothing — low-pass filter to prevent jerky direction changes
    if (!Number.isFinite(e._smoothVX)) { e._smoothVX = e.vx; e._smoothVY = e.vy; }
    const vSmooth = Math.min(1, eDt * 12);
    e._smoothVX += (e.vx - e._smoothVX) * vSmooth;
    e._smoothVY += (e.vy - e._smoothVY) * vSmooth;

    // Integrate smoothed velocity → position
    e.x += e._smoothVX * eDt;
    e.y += e._smoothVY * eDt;

    // Face direction from smoothed velocity (threshold prevents jitter)
    if (Math.abs(e._smoothVX) > 8) e.faceX = e._smoothVX > 0 ? 1 : -1;

    // Soft wall clamping — push back gently instead of hard stop
    const minX = BUILDING_LEFT + 10;
    const maxX = BUILDING_RIGHT - 10;
    const minY = BUILDING_TOP + 10;
    const maxY = BUILDING_BOTTOM - 10;
    const wallPush = 600 * eDt; // gentle push-back force
    if (e.x < minX) {
      e.vx += wallPush;
      e.x = Math.max(minX - 4, e.x); // tiny overshoot allowed
    } else if (e.x > maxX) {
      e.vx -= wallPush;
      e.x = Math.min(maxX + 4, e.x);
    }
    if (e.y < minY) {
      e.vy += wallPush;
      e.y = Math.max(minY - 4, e.y);
    } else if (e.y > maxY) {
      e.vy -= wallPush;
      e.y = Math.min(maxY + 4, e.y);
    }

    // drawX/drawY smoothing is done in updateEnemyVisualRuntime (utils.js)

    if (e.flash > 0) e.flash -= dt;
    const dsSq = (P.x - e.x) ** 2 + (P.y - e.y) ** 2;
    if (dsSq < _frameNearestDistSq) { _frameNearestDistSq = dsSq; _frameNearest = e; }
    const ds = Math.sqrt(dsSq);
    if (P.iframes <= 0 && ds < e.sz + P.sz) hitPlayer(e.dmg, e.x, e.y, 240);
  });

  // Rebuild hash with final positions for weapon queries
  hash.clear();
  enemies.each(e => { if (!e.dying && !e.spawning) hash.add(e); });
  // Check boss for nearest
  if (G.boss && G.phase === 'boss') {
    const bd = (G.boss.x - P.x) ** 2 + (G.boss.y - P.y) ** 2;
    if (bd < _frameNearestDistSq) { _frameNearestDistSq = bd; _frameNearest = G.boss; }
  }

  // ---- WEAPONS ----
  const levStats = getLeverageStats(P.leverage);
  const projSize = levStats.sizeMult;
  P._swingAngle += dt * 5; // continuous swing rotation
  if (P._orbitalDetachCd > 0) P._orbitalDetachCd -= dt;

  // Use cached nearest enemy (no extra O(n) search)
  let _wNearest = _frameNearest, _wnd = Math.sqrt(_frameNearestDistSq);

  for (let weaponIndex = 0; weaponIndex < P.weapons.length; weaponIndex++) {
    const w = P.weapons[weaponIndex];
    w.cd -= dt;
    if (w.cd > 0) continue;

    const baseDef = WEAPONS[w.id];
    if (!baseDef) continue;
    const def = typeof getWeaponRuntimeStats === 'function' ? getWeaponRuntimeStats(w.id, w.level) : baseDef;
    const bCfg = getWeaponVisualConfig(def.vis);

    const isCrit = Math.random() * 100 < P.crit;
    const dmg = def.dmg * P.dmgMult * levStats.dmgMult * (isCrit ? 2 : 1);
    const burnSpec = getWeaponBurnSpec(def, levStats);
    const baseHitKb = (def.hitKb || (
      def.type === 'bounce' ? 5 :
        def.type === 'nova' ? 2.6 :
          def.type === 'homing' ? 2.4 :
            def.type === 'proj' ? Math.max(1.4, Math.min(4.2, def.dmg / 18)) :
              0
    )) * getPlayerKnockbackMult();
    w.cd = def.cd * P.cdMult;
    // Get muzzle offset so bullets come from the weapon on the arc mounting
    const muzzle = getWeaponMuzzleOffsetByIndex(weaponIndex, P.weapons.length);
    const mx = P.x + muzzle.x, my = P.y + muzzle.y;

    // Aim from muzzle position directly at nearest enemy for perfect accuracy
    let ang = _wNearest ? Math.atan2(_wNearest.y - my, _wNearest.x - mx) : P.angle;

    // Trigger shoot animation
    if (weaponIndex === 0) jeffShootReaction(getWeaponKickback(def.vis));

    // Helper: hit enemy with damage
    const _hitEnemy = (e, d, kb) => {
      const ds = Math.hypot(e.x - P.x, e.y - P.y) || 1;
      if (e.dying) return; // skip dying enemies
      e.hp -= d; G.totalDmgDealt += d; e.flash = 0.08;
      if (!e.dying) setAnim(e, 'hit');
      if (kb && typeof applyEnemyKnockback === 'function') applyEnemyKnockback(e, P.x, P.y, kb);
      if (burnSpec.dps > 0 && typeof applyEnemyBurn === 'function') applyEnemyBurn(e, burnSpec.dps, burnSpec.duration);
      degenOnEnemyHit(e.x, e.y - e.sz, isCrit);
      if (isCrit) { fxCritical(e.x, e.y); fxGodCandle(e.x, e.y, d); playSound('critical'); triggerSlowmo(0.3, 0.08); }
      const killed = e.hp <= 0;
      if (killed) { enemyDeath(e); if (def.lifesteal) P.hp = Math.min(P.maxHp, P.hp + def.lifesteal); }
      triggerWeaponImpactFeel(def.vis, { killed, crit: isCrit });
    };

    // ---- PROJECTILE ----
    if (def.type === 'proj') {
      const cnt = def.cnt || 1;
      const spread = def.spread || 0.15;
      playSound(bCfg && bCfg.sound || 'shoot');
      if (typeof fireMuzzleFlash === 'function') fireMuzzleFlash(def.vis, mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4, ang);
      else fxMuzzleFlash(mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4, ang);
      if (typeof fireRecoil === 'function') fireRecoil(def.vis);
      for (let i = 0; i < cnt; i++) {
        const a = ang + (i - (cnt - 1) / 2) * spread;
        const p = projs.get(); if (p) {
          p.x = mx; p.y = my; p.vx = Math.cos(a) * def.spd; p.vy = Math.sin(a) * def.spd;
          p.dmg = dmg; p.pierce = def.pierce || 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#00f5ff';
          p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize;
          p._homing = false; p._bounces = 0;
          p._trail = (def.vis === 'bolt');
          p._explodeArea = 0; p._hitKb = baseHitKb; p._burnDmg = burnSpec.dps; p._burnDuration = burnSpec.duration; p._ttl = def.lifeTime || 0; p.vis = def.vis; p._ang = a;
        }
      }
    }

    // ---- HOMING ----
    else if (def.type === 'homing') {
      playSound(bCfg && bCfg.sound || 'shoot');
      if (typeof fireMuzzleFlash === 'function') fireMuzzleFlash(def.vis, mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4, ang);
      if (typeof fireRecoil === 'function') fireRecoil(def.vis);
      const p = projs.get(); if (p) { p.x = mx; p.y = my; p.vx = Math.cos(ang) * def.spd; p.vy = Math.sin(ang) * def.spd; p.dmg = dmg; p.pierce = def.pierce || 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#00ddff'; p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize; p._homing = true; p._homingStr = def.homingStr || 5; p._bounces = 0; p._trail = false; p._explodeArea = 0; p._hitKb = baseHitKb; p._burnDmg = burnSpec.dps; p._burnDuration = burnSpec.duration; p._ttl = def.lifeTime || 0; p.vis = def.vis; p._ang = ang; }
    }

    // ---- NOVA (360 burst) ----
    else if (def.type === 'nova') {
      playSound(bCfg && bCfg.sound || 'shotgun');
      const cnt = def.cnt || 20;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2;
        const p = projs.get(); if (p) { p.x = mx; p.y = my; p.vx = Math.cos(a) * def.spd; p.vy = Math.sin(a) * def.spd; p.dmg = dmg; p.pierce = def.pierce || 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#ff4444'; p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize; p._homing = false; p._bounces = 0; p._trail = false; p._explodeArea = 0; p._hitKb = baseHitKb; p._burnDmg = burnSpec.dps; p._burnDuration = burnSpec.duration; p._ttl = def.lifeTime || 0; p.vis = def.vis; p._ang = a; }
      }
      if (typeof fireRecoil === 'function') fireRecoil(def.vis);
      else triggerShake(3, 0.1);
    }

    // ---- BOUNCE ----
    else if (def.type === 'bounce') {
      playSound(bCfg && bCfg.sound || 'rocket');
      if (typeof fireRecoil === 'function') fireRecoil(def.vis);
      const cnt = def.cnt || 1;
      const spread = cnt > 1 ? 0.16 : 0;
      for (let i = 0; i < cnt; i++) {
        const a = ang + (i - (cnt - 1) / 2) * spread;
        const p = projs.get(); if (p) {
          p.x = mx; p.y = my; p.vx = Math.cos(a) * def.spd; p.vy = Math.sin(a) * def.spd;
          p.dmg = dmg; p.pierce = 999; p.friendly = true;
          p.col = isCrit ? '#ffd700' : '#ff8800'; p.hits = new Set(); p.hitCnt = 0; p.active = true;
          p._size = projSize * (def.scale || 1); p._homing = false;
          p._bounces = def.bounces || 3;
          p._trail = true; // Always trail on bounce weapons (like Axe)
          p._explodeArea = def.explodeArea || 0; p._hitKb = baseHitKb; p._burnDmg = burnSpec.dps; p._burnDuration = burnSpec.duration; p._ttl = def.lifeTime || 0;
          p.vis = def.vis; p._ang = a;
        }
      }
    }

    // ---- BEAM (God Candle evo) ----
    else if (def.type === 'beam') {
      playSound('laser');
      const cnt = def.cnt || 3;
      for (let i = 0; i < cnt; i++) {
        const h = hazards.get(); if (h) {
          h.type = 'friendlyBeam'; h.x = P.x + (i - (cnt - 1) / 2) * 160;
          h.y = P.y; h.life = def.duration || 3; h.tick = 0;
          h.data = { dmg: dmg, width: def.beamWidth || 50, friendly: true }; h.active = true;
        }
      }
      triggerShake(6, 0.2);
    }

    // ---- MELEE (Ban Hammer) ----
    else if (def.type === 'melee') {
      playSound('katana');
      fxKatanaSwing(P.x, P.y, ang);
      const slashCount = def.slashCount || 1;
      const slashArc = def.slashArc || Math.PI * 0.5;
      for (let slashIndex = 0; slashIndex < slashCount; slashIndex++) {
        const slashAng = ang + (slashIndex - (slashCount - 1) / 2) * 0.22;
        const slashDmg = dmg * (slashIndex === 0 ? 1 : 0.72);
        hash.qry(P.x, P.y, def.area).forEach(e => {
          const ea = Math.atan2(e.y - P.y, e.x - P.x);
          let diff = ea - slashAng; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < slashArc) _hitEnemy(e, slashDmg, 4.2);
        });
        if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - P.x, G.boss.y - P.y) < def.area) {
          G.totalDmgDealt += slashDmg;
          G.boss.hit(slashDmg);
          triggerWeaponImpactFeel(def.vis, { boss: true, crit: isCrit });
        }
      }
    }

    // ---- FALLING (SEC Lawsuit evo) ----
    else if (def.type === 'falling') {
      playSound('rocket');
      const cnt = def.cnt || 4;
      for (let i = 0; i < cnt; i++) {
        setTimeout(() => {
          const h = hazards.get(); if (h) {
            h.type = 'fallingHammer';
            h.x = P.x + (Math.random() - 0.5) * W * 0.8;
            h.y = CAM.y - 60; h.life = 3; h.tick = 0;
            h.data = { dmg: dmg, area: def.area || 90, targetY: P.y + (Math.random() - 0.5) * 200, fallSpeed: def.fallSpeed || 500, hit: false, friendly: true };
            h.active = true;
          }
        }, i * 150);
      }
    }

    // ---- AURA (Gas Fee) ----
    else if (def.type === 'aura') {
      // Continuous damage — no projectile
      const area = def.area;
      hash.qry(P.x, P.y, area).forEach(e => {
        e.hp -= dmg * dt; G.totalDmgDealt += dmg * dt; e.flash = 0.04;
        if (def.slow) e.behaviorTimer += dt * def.slow; // slow enemies
        if (e.hp <= 0) enemyDeath(e);
      });
      if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - P.x, G.boss.y - P.y) < area) {
        G.totalDmgDealt += dmg * dt; G.boss.hit(dmg * dt);
      }
      w._auraRadius = area; // store for rendering
    }

    // ---- PUDDLE (Liquidity Pool) ----
    else if (def.type === 'puddle') {
      const h = hazards.get(); if (h) {
        const deployDistance = def.deployDistance || 170;
        const deploySpread = def.deploySpread || 60;
        const perpX = -Math.sin(ang);
        const perpY = Math.cos(ang);
        const scatter = (Math.random() - 0.5) * deploySpread;
        h.type = 'friendlyPuddle';
        h.x = P.x + Math.cos(ang) * deployDistance + perpX * scatter;
        h.y = P.y + Math.sin(ang) * deployDistance + perpY * scatter;
        h.life = def.duration || 5; h.tick = 0;
        h.data = { dmg: dmg, area: def.area || 90, magnet: def.magnet || 0, burnDmg: burnSpec.dps, burnDuration: burnSpec.duration, friendly: true };
        h.active = true;
      }
      playSound('hit');
    }

    // ---- GRENADE ----
    else if (def.type === 'grenade') {
      playSound(bCfg && bCfg.sound || 'rocket');
      if (typeof fireMuzzleFlash === 'function') fireMuzzleFlash(def.vis, mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4, ang);
      if (typeof fireRecoil === 'function') fireRecoil(def.vis);
      const cnt = def.cnt || 1;
      const spread = cnt > 1 ? 0.14 : 0;
      const lobLift = Math.min(220, (def.gravity || 760) * 0.22);
      for (let i = 0; i < cnt; i++) {
        const a = ang + (i - (cnt - 1) / 2) * spread;
        const p = projs.get(); if (p) {
          p.x = mx; p.y = my;
          p.vx = Math.cos(a) * def.spd;
          p.vy = Math.sin(a) * def.spd - lobLift;
          p.dmg = dmg; p.pierce = 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#9be15d';
          p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize * 1.05;
          p._homing = false; p._bounces = 0; p._trail = true;
          p._explodeArea = def.explodeArea || 90; p._explodeOnExpire = true; p._gravity = def.gravity || 760;
          p._hitKb = baseHitKb; p._burnDmg = burnSpec.dps; p._burnDuration = burnSpec.duration; p._ttl = def.lifeTime || 0.8;
          p.vis = def.vis; p._ang = a;
        }
      }
    }

    // ---- ORBITAL (Support Drones) ----
    else if (def.type === 'orbital') {
      const orbSpd = def.orbitSpeed || 2;
      const orbRad = def.orbitRadius || 60;
      const cnt = def.cnt || 2;
      const hitInterval = def.hitInterval || 0.5;
      P._orbitalAngles = P._orbitalAngles || {};
      if (!P._orbitalAngles[w.id]) P._orbitalAngles[w.id] = 0;
      P._orbitalAngles[w.id] += orbSpd * dt;
      w._orbCnt = cnt;
      w._orbRadius = orbRad;
      w._orbBaseAngle = P._orbitalAngles[w.id];
      w._orbColor = (bCfg && bCfg.glowColor) || '#00d2d3';

      for (let i = 0; i < cnt; i++) {
        const offsetAng = P._orbitalAngles[w.id] + (i / cnt) * Math.PI * 2;
        const px = P.x + Math.cos(offsetAng) * orbRad;
        const py = P.y + Math.sin(offsetAng) * orbRad;

        // Hit enemies
        hash.qry(px, py, 25).forEach(e => {
          if (!w.hits) w.hits = new WeakMap();
          const lastHit = w.hits.get(e) || 0;
          if (G.totalTime - lastHit > hitInterval) {
            _hitEnemy(e, dmg, 1);
            w.hits.set(e, G.totalTime);
          }
        });
        if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - px, G.boss.y - py) < G.boss.sz + 15) {
          if (!w.hits) w.hits = new WeakMap();
          const lastHit = w.hits.get(G.boss) || 0;
          if (G.totalTime - lastHit > hitInterval) {
            G.totalDmgDealt += dmg; G.boss.hit(dmg);
            w.hits.set(G.boss, G.totalTime);
          }
        }
      }
    }

    // ---- TURRET (Mining Rig) ----
    else if (def.type === 'turret') {
      const maxT = def.maxTurrets || 3;
      // Place a new turret
      P._turrets.push({ x: P.x, y: P.y, cd: 0, weaponId: w.id, range: def.range || 300, dmg: dmg, chains: def.chains || 0, chainRange: def.chainRange || 150 });
      if (P._turrets.length > maxT) P._turrets.shift();
      playSound('hit');
    }

    // ---- SWING (Yield Farmer) ----
    else if (def.type === 'swing') {
      // Continuous sweeping scythe
      const area = def.area || 110;
      const swAng = P._swingAngle * (def.swingSpeed || 3);
      // Hit enemies in a wide arc at current swing angle
      hash.qry(P.x, P.y, area).forEach(e => {
        const ea = Math.atan2(e.y - P.y, e.x - P.x);
        let diff = ea - swAng; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < Math.PI * 0.4) {
          _hitEnemy(e, dmg * dt, 2);
        }
      });
      if (G.boss && G.phase === 'boss') {
        const ea = Math.atan2(G.boss.y - P.y, G.boss.x - P.x);
        let diff = ea - swAng; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < Math.PI * 0.4 && Math.hypot(G.boss.x - P.x, G.boss.y - P.y) < area) {
          G.totalDmgDealt += dmg * dt; G.boss.hit(dmg * dt);
          triggerWeaponImpactFeel(def.vis, { boss: true, crit: isCrit });
        }
      }
      w._swingArea = area; w._swingSpeed = def.swingSpeed || 3;
    }
  }

  // ---- TURRET UPDATE ----
  for (const turret of P._turrets) {
    turret.cd -= dt; if (turret.cd > 0) continue;
    turret.cd = 0.4;
    // Find nearest enemy to turret via spatial hash
    let tNearest = null, tnd = turret.range;
    const _tCands = hash.qry(turret.x, turret.y, turret.range);
    for (let ti = 0; ti < _tCands.length; ti++) { const e = _tCands[ti]; const d = Math.hypot(e.x - turret.x, e.y - turret.y); if (d < tnd) { tnd = d; tNearest = e; } }
    if (G.boss && G.phase === 'boss') { const d = Math.hypot(G.boss.x - turret.x, G.boss.y - turret.y); if (d < tnd) { tnd = d; tNearest = G.boss; } }
    if (!tNearest) continue;
    const ta = Math.atan2(tNearest.y - turret.y, tNearest.x - turret.x);
    turret._angle = ta;

    if (turret.chains > 0) {
      // Chain lightning
      const hitSet = new Set();
      let cur = tNearest, chainDmg = turret.dmg;
      const chainPoints = [{ x: turret.x, y: turret.y }];
      for (let c = 0; c < turret.chains; c++) {
        if (!cur || hitSet.has(cur)) break;
        hitSet.add(cur);
        chainPoints.push({ x: cur.x, y: cur.y });
        if (cur === G.boss) { G.totalDmgDealt += chainDmg; G.boss.hit(chainDmg); }
        else {
          cur.hp -= chainDmg; G.totalDmgDealt += chainDmg; cur.flash = 0.08;
          if (!cur.dying) setAnim(cur, 'hit');
          if (typeof applyEnemyKnockback === 'function') applyEnemyKnockback(cur, turret.x, turret.y, 1.4 * getPlayerKnockbackMult());
          if (cur.hp <= 0) enemyDeath(cur);
        }
        chainDmg *= 0.8;
        // Find next target via spatial hash
        let nextE = null, nextD = turret.chainRange;
        const _cCands = hash.qry(cur.x, cur.y, turret.chainRange);
        for (let ci = 0; ci < _cCands.length; ci++) { const e = _cCands[ci]; if (hitSet.has(e)) continue; const d = Math.hypot(e.x - cur.x, e.y - cur.y); if (d < nextD) { nextD = d; nextE = e; } }
        cur = nextE;
      }
      turret._chainPoints = chainPoints;
      turret._chainFlash = 0.3;
      playSound('laser');
    } else {
      // Normal turret shot
      const p = projs.get(); if (p) {
        p.x = turret.x; p.y = turret.y; p.vx = Math.cos(ta) * 550; p.vy = Math.sin(ta) * 550;
        p.dmg = turret.dmg; p.pierce = 1; p.friendly = true; p.col = '#88ff88';
        p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = 1;
        p._homing = false; p._bounces = 0; p._trail = false; p._explodeArea = 0; p._hitKb = 1.5 * getPlayerKnockbackMult();
        p.vis = 'drone_laser'; p._ang = ta;
      }
      playSound('shoot');
    }
  }
  // Decay chain flash
  for (const turret of P._turrets) { if (turret._chainFlash > 0) turret._chainFlash -= dt; }

  // ---- PROJECTILES ----
  projs.each(p => {
    if (p._ttl > 0) {
      p._ttl -= dt;
      if (p._ttl <= 0) {
        if (p._explodeOnExpire && p._explodeArea > 0) detonateFriendlyProjectile(p, 1);
        else p.active = false;
        return;
      }
    }
    if (p._gravity) p.vy += p._gravity * dt;
    // Homing steering
    if (p._homing && p.friendly) {
      let hTarget = null, hd = Infinity;
      const _hCands = hash.qry(p.x, p.y, 300);
      for (let hi = 0; hi < _hCands.length; hi++) { const e = _hCands[hi]; const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2; if (d < hd) { hd = d; hTarget = e; } }
      if (G.boss && G.phase === 'boss') { const d = (G.boss.x - p.x) ** 2 + (G.boss.y - p.y) ** 2; if (d < hd) { hd = d; hTarget = G.boss; } }
      if (hTarget) {
        const ta = Math.atan2(hTarget.y - p.y, hTarget.x - p.x);
        const ca = Math.atan2(p.vy, p.vx);
        let diff = ta - ca; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = Math.sign(diff) * Math.min(Math.abs(diff), p._homingStr * dt);
        const newAng = ca + turn;
        const spd = Math.hypot(p.vx, p.vy);
        p.vx = Math.cos(newAng) * spd; p.vy = Math.sin(newAng) * spd;
      }
    }
    if (p._accel) {
      const ang = Math.atan2(p.vy, p.vx);
      const spd = Math.max(0, Math.hypot(p.vx, p.vy) + p._accel * dt);
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
    }

    const _px = p.x, _py = p.y; // store previous position
    p.x += p.vx * dt; p.y += p.vy * dt;

    // Sweep check: also check midpoint for fast projectiles to avoid tunneling
    p._prevX = _px; p._prevY = _py;
    p._midX = (_px + p.x) * 0.5; p._midY = (_py + p.y) * 0.5;
    if (typeof updateProjectileVisualState === 'function') updateProjectileVisualState(p, dt);

    // Bounce off world edges
    if (p._bounces > 0) {
      let bounced = false;
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); bounced = true; }
      if (p.x > WORLD_W) { p.x = WORLD_W; p.vx = -Math.abs(p.vx); bounced = true; }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); bounced = true; }
      if (p.y > WORLD_H) { p.y = WORLD_H; p.vy = -Math.abs(p.vy); bounced = true; }
      if (bounced) {
        p._bounces--;
        if (p._trail) {
          const h = hazards.get(); if (h) { h.type = 'friendlyTrailFire'; h.x = p.x; h.y = p.y; h.life = 2; h.tick = 0; h.data = { friendly: true }; h.active = true; }
        }
        if (p._bounces <= 0 && p._explodeArea > 0) {
          fxExplosion(p.x, p.y, p._explodeArea);
          triggerShake(5, 0.15);
          hash.qry(p.x, p.y, p._explodeArea).forEach(e => {
            e.hp -= p.dmg * 0.5; G.totalDmgDealt += p.dmg * 0.5; e.flash = 0.08;
            if (e.hp <= 0) enemyDeath(e);
          });
          p.active = false; return;
        }
        if (p._bounces <= 0) { p.active = false; return; }
        p.hits.clear(); // Reset hits on bounce
      }
      // Trail fire while moving
      if (p._trail && Math.random() < 0.3) {
        const h = hazards.get(); if (h) { h.type = 'friendlyTrailFire'; h.x = p.x; h.y = p.y; h.life = 1.5; h.tick = 0; h.data = { friendly: true }; h.active = true; }
      }
    } else {
      // OOB check for non-bouncing projectiles
      if (p.x < CAM.x - 150 || p.x > CAM.x + W + 150 || p.y < CAM.y - 150 || p.y > CAM.y + H + 150) { p.active = false; return; }
    }

    if (p.friendly) {
      // Query at current pos + midpoint for fast projectile sweep detection
      const _hitCandidates = new Set(hash.qry(p.x, p.y, 40));
      hash.qry(p._midX, p._midY, 40).forEach(e => _hitCandidates.add(e));
      _hitCandidates.forEach(e => {
        if (!p.active || p.hits.has(e) || e.dying) return;
        // Check closest distance along projectile path to enemy center
        const d1 = Math.hypot(e.x - p.x, e.y - p.y);
        const d2 = Math.hypot(e.x - p._midX, e.y - p._midY);
        const d3 = Math.hypot(e.x - p._prevX, e.y - p._prevY);
        const dist = Math.min(d1, d2, d3);
        if (dist > e.sz + 10) return;
        p.hits.add(e);
        const isCrit = p.col === '#ffd700';
        const shieldMult = hasShieldAura(e) ? 0.5 : 1;
        const finalDmg = p.dmg * shieldMult;
        e.hp -= finalDmg; G.totalDmgDealt += finalDmg; e.flash = 0.08;
        setAnim(e, 'hit');
        if (typeof applyEnemyKnockback === 'function') applyEnemyKnockback(e, p._prevX !== undefined ? p._prevX : p.x, p._prevY !== undefined ? p._prevY : p.y, p._hitKb || 1.8);
        if (p._burnDmg > 0 && typeof applyEnemyBurn === 'function') applyEnemyBurn(e, p._burnDmg, p._burnDuration || 0);
        addDmgNum({ x: e.x, y: e.y - e.sz, n: Math.round(finalDmg), life: 0.35, col: isCrit ? '#ffd700' : '#fff' });
        if (isCrit) { fxCritical(e.x, e.y); fxGodCandle(e.x, e.y, p.dmg); playSound('critical'); triggerSlowmo(0.3, 0.08); }
        else playSound('hit');
        // Per-weapon impact effect
        if (typeof fireBulletImpact === 'function') fireBulletImpact(p.vis, e.x, e.y, Math.atan2(p.vy, p.vx));
        const killed = e.hp <= 0;
        if (killed) enemyDeath(e);
        triggerWeaponImpactFeel(p.vis, { killed, crit: isCrit });

        if (p._explodeArea > 0) {
          detonateFriendlyProjectile(p, 0.7);
        }

        if (p.active && ++p.hitCnt >= p.pierce) p.active = false;
      });
      if (G.boss && G.phase === 'boss' && !p.hits.has(G.boss) && Math.hypot(G.boss.x - p.x, G.boss.y - p.y) < G.boss.sz + 10) {
        p.hits.add(G.boss);
        G.totalDmgDealt += p.dmg;
        G.boss.hit(p.dmg);
        if (p._burnDmg > 0 && typeof applyBossBurn === 'function') applyBossBurn(G.boss, p._burnDmg, p._burnDuration || 0);
        if (typeof fireBulletImpact === 'function') fireBulletImpact(p.vis, p.x, p.y, Math.atan2(p.vy, p.vx));
        triggerWeaponImpactFeel(p.vis, { boss: true, crit: p.col === '#ffd700' });
        if (p._explodeArea > 0) {
          detonateFriendlyProjectile(p, 0.7);
          return;
        }
        if (++p.hitCnt >= p.pierce) p.active = false;
      }
    } else {
      if (Math.hypot(P.x - p.x, P.y - p.y) < P.sz + 8) {
        hitPlayer(p.dmg, p.x, p.y, 210);
        // Ice projectile slows the player
        if (p._iceSlowDuration) {
          P._iceSlow = p._iceSlowDuration;
          if (typeof spawnParticles === 'function') {
            spawnParticles(P.x, P.y, 6, {
              speed: 40, speedVar: 20, life: 0.4, size: 3, sizeEnd: 0,
              colors: ['#88ccff', '#ffffff', '#aaddff'], friction: 0.9, shape: 'circle'
            });
          }
        }
        p.active = false;
      }
    }
  });

  // ---- HAZARDS ----
  hazards.each(h => {
    h.life -= dt; h.tick += dt; if (h.life <= 0) { h.active = false; return; }
    const dx = P.x - h.x, dy = P.y - h.y, ds = Math.hypot(dx, dy);
    const friendlyWeaponHazard = isFriendlyWeaponHazard(h);

    // === ENEMY HAZARDS ===
    if (!friendlyWeaponHazard && h.type === 'mine' && ds < 40 && h.tick > 0.5) { if (ds < 90) hitPlayer(30 * (1 - ds / 90), h.x, h.y, 320); h.active = false; fxExplosion(h.x, h.y, 60); }
    if (!friendlyWeaponHazard && h.type === 'bearTrap' && ds < 30 && h.tick > 0.3) { hitPlayer(15, h.x, h.y, 180); h.active = false; if (typeof fxExplosion === 'function') fxExplosion(h.x, h.y, 30); }
    if (!friendlyWeaponHazard && h.type === 'fire' && ds < 30) hitPlayer(10 * dt, h.x, h.y, 60);
    if (!friendlyWeaponHazard && h.type === 'sporeCloud') {
      const seed = h.data.seed || 0;
      h.x += Math.cos(seed + h.tick * 1.7) * 4 * dt;
      h.y += Math.sin(seed * 0.7 + h.tick * 1.3) * 3 * dt;
      const radius = h.data.radius || 42;
      if (ds < radius) hitPlayer((h.data.dmg || 7) * dt, h.x, h.y, 40);
    }
    if (!friendlyWeaponHazard && h.type === 'meteor') { h.y += 320 * dt; if (h.y > WORLD_H + 50) h.active = false; if (ds < 50) hitPlayer(25, h.x, h.y, 260); }
    if (!friendlyWeaponHazard && h.type === 'godcandle' && Math.abs(P.x - h.x) < 40) hitPlayer(45 * dt, h.x, P.y, 90);
    if (!friendlyWeaponHazard && h.type === 'wall') { const horiz = h.data.horizontal; if (horiz && Math.abs(P.y - h.y) < 20 && P.x > h.x - 200 && P.x < h.x + 200) P.y = h.y + (P.y > h.y ? 25 : -25); if (!horiz && Math.abs(P.x - h.x) < 20 && P.y > h.y - 150 && P.y < h.y + 150) P.x = h.x + (P.x > h.x ? 25 : -25); }
    if (!friendlyWeaponHazard && h.type === 'homingform') { const a = Math.atan2(P.y - h.y, P.x - h.x); h.x += Math.cos(a) * 45 * dt; h.y += Math.sin(a) * 45 * dt; if (ds < 30) { hitPlayer(18, h.x, h.y, 220); h.active = false; } }
    if (!friendlyWeaponHazard && h.type === 'laser') { const a = h.data.baseAngle + h.tick * h.data.speed; const lx = Math.cos(a), ly = Math.sin(a); const lt = ((P.x - h.x) * lx + (P.y - h.y) * ly); if (lt > 0) { const px = h.x + lx * lt, py = h.y + ly * lt; if (Math.hypot(P.x - px, P.y - py) < 30) hitPlayer(35 * dt, px, py, 120); } }
    if (!friendlyWeaponHazard && h.type === 'cultorb') {
      if (h.tick < (h.data.collapseAt || 0.9)) {
        const a = (h.data.angle || 0) + h.tick * (h.data.orbitSpeed || 1.7);
        h.x = h.data.centerX + Math.cos(a) * (h.data.orbitRadius || 120);
        h.y = h.data.centerY + Math.sin(a) * (h.data.orbitRadius || 120);
      } else {
        const cdx = P.x - h.x;
        const cdy = P.y - h.y;
        const cds = Math.hypot(cdx, cdy) || 1;
        h.x += (cdx / cds) * (h.data.speed || 240) * dt;
        h.y += (cdy / cds) * (h.data.speed || 240) * dt;
      }
      if (Math.hypot(P.x - h.x, P.y - h.y) < 22) {
        hitPlayer(h.data.dmg || 14, h.x, h.y, 240);
        h.active = false;
        if (typeof fxExplosion === 'function') fxExplosion(h.x, h.y, 34);
      }
    }
    if (!friendlyWeaponHazard && h.type === 'egg' && h.tick >= (h.data.hatchAt || 1.0) && !h.data.hatched) {
      h.data.hatched = true;
      if (typeof fxExplosion === 'function') fxExplosion(h.x, h.y, 42);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        spawnEnemyProjectile(h.x, h.y, a, 220, 12, h.data.color || '#ff7ad9', { size: 0.95 });
      }
      if (h.data.hatchAdds && typeof spawnEnemy === 'function') {
        spawnEnemy([0, 1, 6][Math.floor(Math.random() * 3)], h.x, h.y, { isSplit: true });
      }
      h.active = false;
    }
    if (!friendlyWeaponHazard && h.type === 'depeg') {
      const radius = h.data.radius || 74;
      if (ds < radius) {
        hitPlayer((h.data.dmg || 10) * dt, h.x, h.y, 60);
        P.vx *= Math.max(0.2, 1 - dt * 3.4);
        P.vy *= Math.max(0.2, 1 - dt * 3.4);
      }
      if (!h.data.popped && h.life < 0.26) {
        h.data.popped = true;
        if (ds < radius * 1.3) hitPlayer((h.data.dmg || 10) + 12, h.x, h.y, 280);
        if (typeof fxExplosion === 'function') fxExplosion(h.x, h.y, radius);
        h.active = false;
      }
    }
    if (!friendlyWeaponHazard && h.type === 'margincall' && !h.data.struck && h.life < 0.15) {
      h.data.struck = true;
      if (ds < (h.data.radius || 70)) hitPlayer(h.data.dmg || 24, h.x, h.y, 300);
      if (typeof fxExplosion === 'function') fxExplosion(h.x, h.y, h.data.radius || 70);
      h.active = false;
    }
    if (!friendlyWeaponHazard && h.type === 'chainsnare' && !h.data.snapped && h.tick >= (h.data.delay || 0.6)) {
      h.data.snapped = true;
      if (ds < (h.data.radius || 64)) hitPlayer(h.data.dmg || 22, h.x, h.y, 320);
      if (typeof triggerShake === 'function') triggerShake(4, 0.06);
      h.life = Math.min(h.life, 0.18);
    }
    if (!friendlyWeaponHazard && h.type === 'falsebeam') {
      const lx = Math.cos(h.data.angle || 0);
      const ly = Math.sin(h.data.angle || 0);
      const len = h.data.length || 800;
      const proj = ((P.x - h.x) * lx + (P.y - h.y) * ly);
      if (h.tick >= (h.data.warmup || 0.4) && proj > 0 && proj < len) {
        const bx = h.x + lx * proj;
        const by = h.y + ly * proj;
        if (Math.hypot(P.x - bx, P.y - by) < (h.data.width || 22)) hitPlayer((h.data.dmg || 30) * dt, bx, by, 120);
      }
    }
    if (!friendlyWeaponHazard && h.type === 'backdoorPortal') {
      h.data.shotCd -= dt;
      if (h.data.shotCd <= 0) {
        h.data.shotCd += h.data.interval || 0.65;
        const a = Math.atan2(P.y - h.y, P.x - h.x);
        spawnEnemyProjectileFan(h.x, h.y, a, 2, 0.18, 245, 12, h.data.color || '#6effcf', { size: 1.0 });
      }
    }
    if (!friendlyWeaponHazard && h.type === 'marketwall') {
      h.x += (h.data.vx || 0) * dt;
      h.y += (h.data.vy || 0) * dt;
      const hw = (h.data.w || 34) * 0.5;
      const hh = (h.data.h || 240) * 0.5;
      if (Math.abs(P.x - h.x) < hw + P.sz && Math.abs(P.y - h.y) < hh + P.sz) {
        hitPlayer(20 * dt, h.x, h.y, 100);
      }
    }

    // === FRIENDLY HAZARDS (player weapons) ===

    // Friendly Beam (God Candle evo)
    if (h.type === 'friendlyBeam') {
      const bw = h.data.width || 50;
      // Damage enemies in the vertical column
      enemies.each(e => {
        if (Math.abs(e.x - h.x) < bw) {
          e.hp -= h.data.dmg * dt * 0.5; G.totalDmgDealt += h.data.dmg * dt * 0.5; e.flash = 0.04;
          if (e.hp <= 0) enemyDeath(e);
        }
      });
      if (G.boss && G.phase === 'boss' && Math.abs(G.boss.x - h.x) < bw) {
        G.totalDmgDealt += h.data.dmg * dt * 0.5; G.boss.hit(h.data.dmg * dt * 0.5);
      }
    }

    // Friendly Puddle (Liquidity Pool)
    if (h.type === 'friendlyPuddle') {
      hash.qry(h.x, h.y, h.data.area).forEach(e => {
        e.hp -= h.data.dmg * dt * 0.3; G.totalDmgDealt += h.data.dmg * dt * 0.3; e.flash = 0.04;
        if (h.data.burnDmg > 0 && typeof applyEnemyBurn === 'function') applyEnemyBurn(e, h.data.burnDmg, h.data.burnDuration || 0);
        // Whirlpool magnet effect (applied as velocity force)
        if (h.data.magnet > 0) {
          const ed = Math.hypot(e.x - h.x, e.y - h.y) || 1;
          e.vx += (h.x - e.x) / ed * h.data.magnet * 2;
          e.vy += (h.y - e.y) / ed * h.data.magnet * 2;
        }
        if (e.hp <= 0) enemyDeath(e);
      });
      if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - h.x, G.boss.y - h.y) < h.data.area) {
        G.totalDmgDealt += h.data.dmg * dt * 0.3; G.boss.hit(h.data.dmg * dt * 0.3);
        if (h.data.burnDmg > 0 && typeof applyBossBurn === 'function') applyBossBurn(G.boss, h.data.burnDmg, h.data.burnDuration || 0);
      }
    }

    // Falling Hammer (SEC Lawsuit evo)
    if (h.type === 'fallingHammer') {
      h.y += h.data.fallSpeed * dt;
      if (!h.data.hit && h.y >= h.data.targetY) {
        h.data.hit = true;
        h.life = 0.5; // Linger briefly
        fxExplosion(h.x, h.data.targetY, h.data.area);
        triggerShake(6, 0.15);
        playSound('rocket');
        hash.qry(h.x, h.data.targetY, h.data.area).forEach(e => {
          e.hp -= h.data.dmg; G.totalDmgDealt += h.data.dmg; e.flash = 0.1;
          if (!e.dying) setAnim(e, 'hit');
          if (typeof applyEnemyKnockback === 'function') applyEnemyKnockback(e, h.x, h.data.targetY, 4.5 * getPlayerKnockbackMult());
          if (e.hp <= 0) enemyDeath(e);
        });
        if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - h.x, G.boss.y - h.data.targetY) < h.data.area) {
          G.totalDmgDealt += h.data.dmg; G.boss.hit(h.data.dmg);
        }
      }
    }
  });

  // ---- PICKUPS ----
  updatePickups(dt, false);

  // Damage numbers (only strings like level up / heal now)
  for (let i = dmgNums.length - 1; i >= 0; i--) { dmgNums[i].life -= dt; dmgNums[i].y -= 35 * dt; if (dmgNums[i].life <= 0) { dmgNums[i] = dmgNums[dmgNums.length - 1]; dmgNums.pop(); } }

  updateParticles(dt);

  G.dt = dt;
  render();
  updateHUD();

  // Level-ups resolve instantly without opening a modal.
  if (G.pendingLevelUps > 0) {
    processNextLevelUp();
    return;
  }

  requestAnimationFrame(loop);
}

// ============ RENDER ============
function combatAlphaColor(color, alpha) {
  if (typeof particleColorWithAlpha === 'function') return particleColorWithAlpha(color, alpha);
  return color;
}

function drawEnemyFrameBlend(ctx, current, next, blend) {
  if (!current) return;
  const x = -current.width / 2;
  const y = -current.height / 2;
  if (!next || next === current || blend <= 0.02) {
    ctx.drawImage(current, x, y);
    return;
  }
  ctx.save();
  ctx.globalAlpha *= 1 - blend;
  ctx.drawImage(current, x, y);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= blend;
  ctx.drawImage(next, -next.width / 2, -next.height / 2);
  ctx.restore();
}

function drawEnemyTelegraph(ctx, e) {
  const tele = e._telegraph;
  if (!tele) return;
  const data = tele.data || {};
  const progress = 1 - Math.max(0, tele.timer) / Math.max(0.001, tele.duration || 0.2);
  const pulse = 0.7 + Math.sin(G.totalTime * 18 + (e._motionSeed || 0)) * 0.3;
  const alpha = Math.min(0.92, 0.24 + progress * 0.56) * pulse;
  const color = data.color || (e._threatColor || '#ff7777');
  const accent = combatAlphaColor(color, alpha);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (tele.kind === 'dash') {
    ctx.translate(data.x !== undefined ? data.x : e.x, data.y !== undefined ? data.y : e.y);
    ctx.rotate(data.angle || 0);
    const len = data.length || 120;
    ctx.strokeStyle = accent;
    ctx.fillStyle = combatAlphaColor(color, alpha * 0.18);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(len, -6);
    ctx.lineTo(len, 6);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
  } else if (tele.kind === 'fan') {
    ctx.translate(data.x !== undefined ? data.x : e.x, data.y !== undefined ? data.y : e.y);
    ctx.rotate(data.angle || 0);
    const len = data.length || 110;
    const spread = data.spread || 0.3;
    ctx.strokeStyle = accent;
    ctx.fillStyle = combatAlphaColor(color, alpha * 0.14);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-spread * 0.5) * len, Math.sin(-spread * 0.5) * len);
    ctx.lineTo(Math.cos(spread * 0.5) * len, Math.sin(spread * 0.5) * len);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-spread * 0.5) * len, Math.sin(-spread * 0.5) * len);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(spread * 0.5) * len, Math.sin(spread * 0.5) * len);
    ctx.stroke();
  } else if (tele.kind === 'ring') {
    ctx.translate(data.x !== undefined ? data.x : e.x, data.y !== undefined ? data.y : e.y);
    const radius = data.radius || 42;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = combatAlphaColor(color, alpha * 0.1);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  } else if (tele.kind === 'target') {
    const tx = data.targetX !== undefined ? data.targetX : e.x;
    const ty = data.targetY !== undefined ? data.targetY : e.y;
    const radius = data.radius || 28;
    if (data.sourceX !== undefined && data.sourceY !== undefined) {
      ctx.strokeStyle = combatAlphaColor(color, alpha * 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(data.sourceX, data.sourceY);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    ctx.translate(tx, ty);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, 0);
    ctx.lineTo(radius * 0.7, 0);
    ctx.moveTo(0, -radius * 0.7);
    ctx.lineTo(0, radius * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemySpawnPortal(ctx, e) {
  const meta = typeof getEnemyThreatMeta === 'function' ? getEnemyThreatMeta(e) : { color: '#ff7777', accent: '#ffffff' };
  const teleDur = Math.max(0.001, (typeof ENEMY_SPAWN_TELEGRAPH !== 'undefined' ? ENEMY_SPAWN_TELEGRAPH : 0.28));
  const t = 1 - Math.max(0, Math.min(1, e.spawnTimer / teleDur));
  const pulse = 0.6 + Math.sin(G.totalTime * 16 + (e._motionSeed || 0)) * 0.2;
  const color = meta.color || '#ff7777';
  const accent = meta.accent || '#ffffff';
  const dirX = e._spawnDirX || 0;
  const dirY = e._spawnDirY || 1;
  const angle = Math.atan2(dirY, dirX || 0.0001);
  const ringR = e.sz + 8 + t * 9;
  ctx.save();
  ctx.fillStyle = combatAlphaColor(color, (0.08 + t * 0.18) * pulse);
  ctx.beginPath();
  ctx.ellipse(0, e.sz * 0.52, e.sz * (0.7 + t * 0.18), Math.max(5, e.sz * 0.3), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = combatAlphaColor(color, 0.28 + t * 0.42);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = combatAlphaColor(accent, 0.22 + t * 0.26);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, ringR * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(angle + Math.PI * 0.5);
  ctx.fillStyle = combatAlphaColor(color, (0.1 + t * 0.22) * pulse);
  ctx.fillRect(-3.5, -36 + (1 - t) * 9, 7, 48);
  ctx.strokeStyle = combatAlphaColor(accent, 0.16 + t * 0.34);
  ctx.lineWidth = 2;
  const crossLen = 7 + t * 7;
  ctx.beginPath();
  ctx.moveTo(-crossLen, 0);
  ctx.lineTo(crossLen, 0);
  ctx.moveTo(0, -crossLen);
  ctx.lineTo(0, crossLen);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyDeathReadout(ctx, e) {
  // Disabled — clean simple death, no burst ring
}

function drawEnemyReadabilityBase(ctx, e) {
  return;
}

function drawPlayerCombatFeedback(ctx) {
  if (P._hitPulse > 0.01) {
    const dirX = Number.isFinite(P._hitDirX) ? P._hitDirX : 0;
    const dirY = Number.isFinite(P._hitDirY) ? P._hitDirY : -1;
    const sourceAngle = Math.atan2(-dirY, -dirX);
    const pulseT = Math.max(0, Math.min(1, P._hitPulse / Math.max(0.01, P._hitPulseMax || 0.32)));
    const severity = Math.max(pulseT, Math.min(1, P._hitSeverity || 0));
    const wedgeLen = 24 + severity * 20;
    const wedgeHalf = 10 + severity * 8;

    ctx.save();
    ctx.translate(P.x, P.y);
    ctx.rotate(sourceAngle);
    ctx.globalCompositeOperation = 'lighter';
    const wedgeGrad = ctx.createLinearGradient(-wedgeLen - 20, 0, 8, 0);
    wedgeGrad.addColorStop(0, combatAlphaColor('#ff274f', 0));
    wedgeGrad.addColorStop(0.28, combatAlphaColor('#ff274f', 0.16 + severity * 0.12));
    wedgeGrad.addColorStop(0.72, combatAlphaColor('#ff9aa8', 0.34 + severity * 0.2));
    wedgeGrad.addColorStop(1, combatAlphaColor('#ffffff', 0.1 + severity * 0.12));
    ctx.fillStyle = wedgeGrad;
    ctx.beginPath();
    ctx.moveTo(-wedgeLen - 18, 0);
    ctx.lineTo(-14, -wedgeHalf);
    ctx.lineTo(8 + severity * 5, 0);
    ctx.lineTo(-14, wedgeHalf);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = combatAlphaColor('#ffffff', 0.16 + severity * 0.24);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-wedgeLen * 0.78, -wedgeHalf * 0.22);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-wedgeLen * 0.78, wedgeHalf * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  // Ice slow visual — blue tint aura around player
  if (P._iceSlow > 0) {
    ctx.save();
    ctx.translate(P.x, P.y);
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.7 + Math.sin(G.totalTime * 8) * 0.15;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, P.sz * 2.5);
    grad.addColorStop(0, `rgba(136,204,255,${0.18 * pulse})`);
    grad.addColorStop(0.5, `rgba(170,221,255,${0.08 * pulse})`);
    grad.addColorStop(1, 'rgba(136,204,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, P.sz * 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Frost ring
    ctx.strokeStyle = `rgba(200,230,255,${0.25 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, P.sz * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Spawn frost particles occasionally
    if (Math.random() < 0.15 && typeof spawnParticles === 'function') {
      const a = Math.random() * Math.PI * 2;
      spawnParticles(P.x + Math.cos(a) * P.sz, P.y + Math.sin(a) * P.sz, 1, {
        speed: 15, speedVar: 8, life: 0.3, size: 2, sizeEnd: 0,
        colors: ['#88ccff', '#ffffff'], friction: 0.92, gravity: -30, shape: 'circle'
      });
    }
  }
}

function render() {
  ctx.save();
  ctx.translate(shake.x, shake.y);

  // Background (screen-space tiled)
  drawBGTiled(ctx, G.stage || 0, CAM.x, CAM.y);

  // Playable area border (screen-space)
  drawPlayAreaBorder(ctx, G.stage || 0, CAM.x, CAM.y);

  // Atmospheric overlays (screen-space) — rain only on stage 0
  if (G.stage === 0) drawRain(ctx);

  // === WORLD-SPACE RENDERING ===
  ctx.save();
  ctx.translate(-CAM.x, -CAM.y);

  // Hazards
  hazards.each(h => {
    if (!isOnScreen(h.x, h.y, 500)) return;
    ctx.save(); ctx.translate(h.x, h.y);
    if (h.type === 'mine') {
      const armed = h.tick > 0.5;
      const mp = armed ? 0.6 + Math.sin(h.tick * 12) * 0.3 : 0.3;
      // Danger glow
      if (armed) {
        const mineGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        mineGlow.addColorStop(0, `rgba(255,50,50,${0.2 * mp})`);
        mineGlow.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = mineGlow;
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
      }
      // Body
      const mineGrad = ctx.createRadialGradient(-4, -4, 0, 0, 0, 18);
      mineGrad.addColorStop(0, armed ? '#ff5555' : '#aa3333');
      mineGrad.addColorStop(1, armed ? '#881111' : '#441111');
      ctx.fillStyle = mineGrad;
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
      // Spikes
      ctx.strokeStyle = armed ? '#ff6666' : '#993333';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const sa = (i / 6) * Math.PI * 2 + h.tick * 0.5;
        ctx.beginPath(); ctx.moveTo(Math.cos(sa) * 14, Math.sin(sa) * 14);
        ctx.lineTo(Math.cos(sa) * 22, Math.sin(sa) * 22); ctx.stroke();
      }
      // Dollar sign
      ctx.fillStyle = `rgba(255,255,100,${mp})`;
      ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 1);
    }
    if (h.type === 'fire' || h.type === 'friendlyTrailFire') {
      const isFriendlyTrail = h.type === 'friendlyTrailFire';
      const rad = h.data && h.data.radius ? h.data.radius : (isFriendlyTrail ? 20 : 28);
      const alpha = Math.min(isFriendlyTrail ? 0.32 : 0.6, h.life / 2);
      const hCol = h.data && h.data.color ? h.data.color : (isFriendlyTrail ? '#ffaa5a' : '#ff6400');
      const cr = parseInt(hCol.slice(1, 3), 16) || 255;
      const cg = parseInt(hCol.slice(3, 5), 16) || 100;
      const cb = parseInt(hCol.slice(5, 7), 16) || 0;
      // Try sprite first
      if (window._fireHazardSprite && window._fireHazardSprite.complete && window._fireHazardSprite.naturalWidth > 0) {
        const spSz = rad * 2.4;
        const pulse = 1 + Math.sin((h.tick || 0) * 4) * 0.06;
        // Glow underneath
        const fireGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 1.3);
        fireGrad.addColorStop(0, `rgba(255,180,60,${alpha * 0.5})`);
        fireGrad.addColorStop(1, `rgba(${cr >> 1},0,0,0)`);
        ctx.fillStyle = fireGrad;
        ctx.beginPath(); ctx.arc(0, 0, rad * 1.3, 0, Math.PI * 2); ctx.fill();
        // Sprite
        ctx.globalAlpha = alpha;
        ctx.drawImage(window._fireHazardSprite, -spSz * 0.5 * pulse, -spSz * 0.5 * pulse, spSz * pulse, spSz * pulse);
        ctx.globalAlpha = 1;
      } else {
        // Fallback: canvas-drawn fire
        const fireGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 1.3);
        fireGrad.addColorStop(0, `rgba(255,220,120,${alpha * 0.8})`);
        fireGrad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${alpha * 0.6})`);
        fireGrad.addColorStop(0.8, `rgba(${cr >> 1},${cg >> 2},0,${alpha * 0.3})`);
        fireGrad.addColorStop(1, `rgba(${cr >> 2},0,0,0)`);
        ctx.fillStyle = fireGrad;
        ctx.beginPath(); ctx.arc(0, 0, rad * 1.3, 0, Math.PI * 2); ctx.fill();
        // Flame tongues
        ctx.globalCompositeOperation = 'lighter';
        const tt = h.tick || 0;
        for (let i = 0; i < 5; i++) {
          const fa = tt * 3.5 + i * 1.26;
          const fx = Math.cos(fa) * rad * 0.5;
          const fy = Math.sin(fa) * rad * 0.4 - Math.abs(Math.sin(fa * 2)) * rad * 0.3;
          const fs = rad * (0.25 + Math.sin(fa * 1.7) * 0.1);
          ctx.fillStyle = `rgba(255,${160 + Math.floor(Math.sin(fa) * 60)},0,${alpha * 0.5})`;
          ctx.beginPath(); ctx.arc(fx, fy, fs, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    if (h.type === 'sporeCloud') {
      const radius = h.data.radius || 42;
      const tt = h.tick || 0;
      const lifeAlpha = Math.min(1, tt * 2) * Math.max(0, 1 - tt / (h.dur || 4.5));
      // Dark toxic mist — multiple soft layers
      ctx.globalCompositeOperation = 'source-over';
      // Outer fog ring — very soft, dark
      const fogGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
      fogGrad.addColorStop(0, `rgba(20,35,10,${0.35 * lifeAlpha})`);
      fogGrad.addColorStop(0.5, `rgba(30,50,15,${0.2 * lifeAlpha})`);
      fogGrad.addColorStop(1, 'rgba(20,35,10,0)');
      ctx.fillStyle = fogGrad;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
      // Drifting inner wisps — subtle dark green smoke
      for (let i = 0; i < 5; i++) {
        const a = tt * (0.4 + i * 0.15) + i * 1.257;
        const ox = Math.cos(a) * radius * 0.3;
        const oy = Math.sin(a * 0.8) * radius * 0.25;
        const wr = radius * (0.18 + Math.sin(a * 0.7 + i) * 0.06);
        const wGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, wr);
        wGrad.addColorStop(0, `rgba(50,80,20,${0.25 * lifeAlpha})`);
        wGrad.addColorStop(1, 'rgba(40,60,15,0)');
        ctx.fillStyle = wGrad;
        ctx.beginPath(); ctx.arc(ox, oy, wr, 0, Math.PI * 2); ctx.fill();
      }
      // Tiny floating spore particles
      ctx.globalAlpha = 0.4 * lifeAlpha;
      for (let i = 0; i < 8; i++) {
        const pa = tt * (0.6 + i * 0.2) + i * 0.785;
        const pr = radius * (0.15 + Math.sin(pa * 0.5 + i * 2) * 0.35);
        const px = Math.cos(pa) * pr;
        const py = Math.sin(pa * 1.3) * pr - Math.sin(tt * 1.5 + i) * 3;
        const ps = 1 + Math.sin(pa) * 0.5;
        ctx.fillStyle = `rgba(90,130,40,${0.5 + Math.sin(pa * 2) * 0.2})`;
        ctx.beginPath(); ctx.arc(px, py, ps, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (h.type === 'meteor') { ctx.fillStyle = '#ff3333'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill(); }
    if (h.type === 'godcandle') { ctx.fillStyle = `rgba(0,255,0,${0.3 + Math.sin(h.tick * 15) * 0.15})`; ctx.fillRect(-35, -WORLD_H, 70, WORLD_H * 2); }
    if (h.type === 'wall') { ctx.fillStyle = 'rgba(255,50,50,0.5)'; const w = h.data.horizontal ? 400 : 30, ht = h.data.horizontal ? 30 : 300; ctx.fillRect(-w / 2, -ht / 2, w, ht); }
    if (h.type === 'homingform') { ctx.fillStyle = '#777'; ctx.fillRect(-15, -20, 30, 28); ctx.fillStyle = '#ff0'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('SEC', 0, 0); }
    if (h.type === 'laser') {
      const a = h.data.baseAngle + h.tick * h.data.speed;
      const lx = Math.cos(a) * 700, ly = Math.sin(a) * 700;
      // Outer glow beam
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,100,50,${0.15 + Math.sin(h.tick * 15) * 0.05})`;
      ctx.lineWidth = 38;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
      // Mid beam
      ctx.strokeStyle = `rgba(255,200,80,${0.4 + Math.sin(h.tick * 20) * 0.15})`;
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
      // Core beam (bright white)
      ctx.strokeStyle = `rgba(255,255,220,${0.7 + Math.sin(h.tick * 25) * 0.2})`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      // Source orb
      const orbGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
      orbGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
      orbGrad.addColorStop(0.5, 'rgba(255,200,80,0.6)');
      orbGrad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    }
    if (h.type === 'cultorb') {
      ctx.fillStyle = `rgba(137,255,59,${0.28 + Math.sin(h.tick * 9) * 0.08})`;
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d8ff8a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(10, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.stroke();
    }
    if (h.type === 'egg') {
      ctx.fillStyle = `rgba(255,122,217,${0.35 + Math.sin(h.tick * 8) * 0.1})`;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 21, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd2f1'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 21, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (h.type === 'depeg') {
      const radius = h.data.radius || 74;
      const dCol = h.data.color || '#67d7ff';
      const dr = parseInt(dCol.slice(1, 3), 16) || 103;
      const dg = parseInt(dCol.slice(3, 5), 16) || 215;
      const db = parseInt(dCol.slice(5, 7), 16) || 255;
      const pulse = 0.6 + Math.sin(h.tick * 8) * 0.2;
      // Warning fill with gradient
      const depegGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      depegGrad.addColorStop(0, `rgba(${dr},${dg},${db},${0.2 * pulse})`);
      depegGrad.addColorStop(0.6, `rgba(${dr},${dg},${db},${0.12 * pulse})`);
      depegGrad.addColorStop(1, `rgba(${dr},${dg},${db},${0.04 * pulse})`);
      ctx.fillStyle = depegGrad;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
      // Pulsing ring
      ctx.strokeStyle = `rgba(${dr},${dg},${db},${0.6 * pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Inner warning ring
      ctx.strokeStyle = `rgba(255,255,255,${0.25 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2); ctx.stroke();
      // Warning cross
      ctx.strokeStyle = `rgba(${dr},${dg},${db},${0.3 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-radius * 0.4, -radius * 0.4); ctx.lineTo(radius * 0.4, radius * 0.4);
      ctx.moveTo(radius * 0.4, -radius * 0.4); ctx.lineTo(-radius * 0.4, radius * 0.4); ctx.stroke();
    }
    if (h.type === 'margincall') {
      const radius = h.data.radius || 70;
      const mCol = h.data.color || '#d8a3ff';
      const mr = parseInt(mCol.slice(1, 3), 16) || 216;
      const mg = parseInt(mCol.slice(3, 5), 16) || 163;
      const mb = parseInt(mCol.slice(5, 7), 16) || 255;
      const urgency = Math.max(0, 1 - h.life / 1.2); // gets more intense as it's about to pop
      const pulse = 0.5 + urgency * 0.5 + Math.sin(h.tick * (12 + urgency * 20)) * 0.15;
      // Fill with increasing opacity
      const mcGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      mcGrad.addColorStop(0, `rgba(${mr},${mg},${mb},${0.25 * pulse})`);
      mcGrad.addColorStop(0.7, `rgba(${mr},${mg},${mb},${0.1 * pulse})`);
      mcGrad.addColorStop(1, `rgba(${mr},${mg},${mb},0)`);
      ctx.fillStyle = mcGrad;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
      // Ring
      ctx.strokeStyle = `rgba(${mr},${mg},${mb},${0.6 * pulse})`;
      ctx.lineWidth = 2 + urgency * 3;
      ctx.beginPath(); ctx.arc(0, 0, radius * (1 - urgency * 0.15), 0, Math.PI * 2); ctx.stroke();
      // Crosshair
      ctx.strokeStyle = `rgba(255,255,255,${0.3 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.6, -radius * 0.6); ctx.lineTo(radius * 0.6, radius * 0.6);
      ctx.moveTo(radius * 0.6, -radius * 0.6); ctx.lineTo(-radius * 0.6, radius * 0.6);
      ctx.stroke();
    }
    if (h.type === 'chainsnare') {
      const radius = h.data.radius || 64;
      ctx.strokeStyle = h.data.snapped ? 'rgba(220,250,255,0.8)' : 'rgba(159,231,255,0.45)';
      ctx.lineWidth = h.data.snapped ? 4 : 2;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-radius, -radius); ctx.lineTo(radius, radius); ctx.moveTo(-radius, radius); ctx.lineTo(radius, -radius); ctx.stroke();
    }
    if (h.type === 'falsebeam') {
      const len = h.data.length || 800;
      const bw = h.data.width || 22;
      const active = h.tick >= (h.data.warmup || 0.4);
      ctx.rotate(h.data.angle || 0);
      if (active) {
        // Full beam — layered glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,120,50,0.2)`;
        ctx.lineWidth = bw * 2.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.strokeStyle = `rgba(255,200,120,0.5)`;
        ctx.lineWidth = bw;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,230,0.8)`;
        ctx.lineWidth = bw * 0.35;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Warning line — dashed
        const warn = h.tick / (h.data.warmup || 0.4);
        ctx.strokeStyle = `rgba(255,207,154,${0.2 + warn * 0.3})`;
        ctx.lineWidth = 2 + warn * 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.setLineDash([]);
        // Target circle
        ctx.fillStyle = `rgba(255,207,154,${0.1 + warn * 0.2})`;
        ctx.beginPath(); ctx.arc(len, 0, 20 + warn * 10, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (h.type === 'backdoorPortal') {
      const pp = 0.5 + Math.sin(h.tick * 8) * 0.2;
      // Swirling portal effect
      const portalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
      portalGrad.addColorStop(0, `rgba(0,60,40,${0.7 * pp})`);
      portalGrad.addColorStop(0.5, `rgba(40,180,140,${0.3 * pp})`);
      portalGrad.addColorStop(1, `rgba(110,255,207,0)`);
      ctx.fillStyle = portalGrad;
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
      // Rotating ring arcs
      ctx.strokeStyle = `rgba(110,255,207,${0.6 * pp})`;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const startA = h.tick * (2 + i * 0.7) + i * 2.1;
        ctx.beginPath(); ctx.arc(0, 0, 22 - i * 5, startA, startA + 1.5); ctx.stroke();
      }
      // Center bright dot
      ctx.fillStyle = `rgba(200,255,230,${0.7 * pp})`;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (h.type === 'marketwall') {
      const w = h.data.w || 34;
      const ht = h.data.h || 240;
      const mCol = h.data.color || '#ffd84d';
      const pulse = 0.7 + Math.sin((h.tick || 0) * 10) * 0.2;
      // Energy glow around wall
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = mCol;
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(255,220,100,${0.15 * pulse})`;
      ctx.fillRect(-w / 2 - 8, -ht / 2 - 8, w + 16, ht + 16);
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      // Wall body with gradient
      const wallGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      wallGrad.addColorStop(0, `rgba(255,180,40,${0.5 * pulse})`);
      wallGrad.addColorStop(0.5, `rgba(255,240,140,${0.7 * pulse})`);
      wallGrad.addColorStop(1, `rgba(255,180,40,${0.5 * pulse})`);
      ctx.fillStyle = wallGrad;
      ctx.fillRect(-w / 2, -ht / 2, w, ht);
      // Edge lines
      ctx.strokeStyle = mCol;
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -ht / 2, w, ht);
      // Energy crackling
      ctx.strokeStyle = `rgba(255,255,255,${0.4 * pulse})`;
      ctx.lineWidth = 1;
      for (let y = -ht / 2; y < ht / 2; y += 24) {
        const jx = Math.sin(y * 0.1 + (h.tick || 0) * 8) * w * 0.3;
        ctx.beginPath();
        ctx.moveTo(-w / 2, y);
        ctx.lineTo(jx, y + 12);
        ctx.lineTo(w / 2, y + 24);
        ctx.stroke();
      }
    }
    if (h.type === 'bearTrap') {
      ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,136,0,${0.2 + Math.sin(h.tick * 4) * 0.1})`;
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      // Teeth pattern
      for (let i = 0; i < 6; i++) { const ta = (i / 6) * Math.PI * 2; ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(Math.cos(ta) * 12, Math.sin(ta) * 12, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    // Friendly Beam (God Candle)
    if (h.type === 'friendlyBeam') {
      const bw = h.data.width || 50;
      const alpha = Math.min(1, h.life) * (0.4 + Math.sin(h.tick * 12) * 0.15);
      ctx.fillStyle = `rgba(0,255,80,${alpha})`;
      ctx.fillRect(-bw / 2, -WORLD_H, bw, WORLD_H * 2);
      // Inner bright core
      ctx.fillStyle = `rgba(200,255,200,${alpha * 0.6})`;
      ctx.fillRect(-bw / 6, -WORLD_H, bw / 3, WORLD_H * 2);
    }
    // Friendly Puddle
    if (h.type === 'friendlyPuddle') {
      const area = h.data.area || 90;
      const alpha = Math.min(1, h.life * 0.5) * 0.35;
      ctx.fillStyle = h.data.magnet ? `rgba(140,0,255,${alpha})` : `rgba(0,150,255,${alpha})`;
      ctx.beginPath(); ctx.arc(0, 0, area, 0, Math.PI * 2); ctx.fill();
      // Ripple effect
      const ripple = (h.tick * 40) % area;
      ctx.strokeStyle = h.data.magnet ? `rgba(180,100,255,${0.3 * (1 - ripple / area)})` : `rgba(100,200,255,${0.3 * (1 - ripple / area)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, ripple, 0, Math.PI * 2); ctx.stroke();
    }
    // Falling Hammer
    if (h.type === 'fallingHammer' && !h.data.hit) {
      // Shadow on ground
      ctx.save(); ctx.translate(0, h.data.targetY - h.y);
      const shadowSize = Math.max(10, 40 - Math.abs(h.data.targetY - h.y) * 0.1);
      ctx.fillStyle = 'rgba(255,200,0,0.2)';
      ctx.beginPath(); ctx.ellipse(0, 0, shadowSize, shadowSize * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Hammer
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-15, -20, 30, 25);
      ctx.fillStyle = '#8B4513'; ctx.fillRect(-4, 5, 8, 20);
    }
    ctx.restore();
  });

  // ---- WEAPON VISUALS (world-space) ----
  // Aura rings
  for (const w of P.weapons) {
    const def = WEAPONS[w.id]; if (!def) continue;
    if (def.type === 'aura' && w._auraRadius) {
      ctx.save(); ctx.translate(P.x, P.y);
      const edgeColor = def.slow ? '180,80,255' : '0,255,140';
      const pulse = 0.5 + Math.sin(G.totalTime * 3.4) * 0.5;
      ctx.setLineDash([10, 14]);
      ctx.strokeStyle = `rgba(${edgeColor},${0.14 + pulse * 0.08})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, w._auraRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(${edgeColor},${0.08 + pulse * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, w._auraRadius - 12, 0, Math.PI * 2);
      ctx.stroke();
      const rippleR = Math.max(12, (G.totalTime * 42) % w._auraRadius);
      ctx.strokeStyle = `rgba(${edgeColor},${0.09 * (1 - rippleR / w._auraRadius)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Orbitals
    if (def.type === 'orbital' && w._orbCnt) {
      const baseAng = w._orbBaseAngle || 0;
      const orbColor = w._orbColor || '#00d2d3';
      ctx.save();
      ctx.translate(P.x, P.y);
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = bulletColorWithAlpha(orbColor, 0.12);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, w._orbRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < w._orbCnt; i++) {
        const a = baseAng + (i / w._orbCnt) * Math.PI * 2;
        const ox = P.x + Math.cos(a) * w._orbRadius;
        const oy = P.y + Math.sin(a) * w._orbRadius;
        if (!isOnScreen(ox, oy, 20)) continue;
        const pulse = 0.6 + Math.sin(G.totalTime * 10 + i * 1.7) * 0.25;
        ctx.save(); ctx.translate(ox, oy);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 11);
        glow.addColorStop(0, bulletColorWithAlpha('#ffffff', 0.85));
        glow.addColorStop(0.35, bulletColorWithAlpha(orbColor, 0.28 + pulse * 0.08));
        glow.addColorStop(1, bulletColorWithAlpha(orbColor, 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = orbColor;
        ctx.beginPath(); ctx.arc(0, 0, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // Swing arc
    if (def.type === 'swing' && w._swingArea) {
      const swAng = P._swingAngle * (w._swingSpeed || 3);
      ctx.save(); ctx.translate(P.x, P.y);
      ctx.strokeStyle = def.lifesteal ? 'rgba(255,0,80,0.4)' : 'rgba(200,200,200,0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, w._swingArea, swAng - 0.4 * Math.PI, swAng + 0.4 * Math.PI);
      ctx.stroke();
      // Scythe tip
      const tipX = Math.cos(swAng) * w._swingArea;
      const tipY = Math.sin(swAng) * w._swingArea;
      ctx.fillStyle = def.lifesteal ? '#ff0050' : '#ddd';
      ctx.beginPath(); ctx.arc(tipX, tipY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Turrets
  for (const turret of P._turrets) {
    if (!isOnScreen(turret.x, turret.y, 40)) continue;
    ctx.save(); ctx.translate(turret.x, turret.y);
    // Base
    ctx.fillStyle = '#555'; ctx.fillRect(-12, -12, 24, 24);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.strokeRect(-12, -12, 24, 24);
    // Barrel
    const ba = turret._angle || 0;
    ctx.strokeStyle = turret.chains > 0 ? '#44aaff' : '#88ff88';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ba) * 20, Math.sin(ba) * 20); ctx.stroke();
    // Chain lightning lines
    if (turret._chainFlash > 0 && turret._chainPoints) {
      ctx.restore(); ctx.save();
      ctx.strokeStyle = `rgba(100,180,255,${turret._chainFlash / 0.3})`; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < turret._chainPoints.length; i++) {
        const cp = turret._chainPoints[i];
        if (i === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  let _heartSprite = null;
  let _goldPickupSprite = null;
  let _xpPickupSprite = null;
  function getHeartSprite() {
    if (_heartSprite) return _heartSprite;
    const c = document.createElement('canvas');
    c.width = 40; c.height = 40;
    const cx = c.getContext('2d');
    cx.translate(20, 20);

    function hPath() {
      cx.beginPath();
      cx.moveTo(0, 6);
      cx.bezierCurveTo(-3, 2, -12, -2, -12, -7);
      cx.bezierCurveTo(-12, -13, -7, -16, 0, -11);
      cx.bezierCurveTo(7, -16, 12, -13, 12, -7);
      cx.bezierCurveTo(12, -2, 3, 2, 0, 6);
    }

    hPath();
    cx.fillStyle = '#8b0000';
    cx.fill();

    cx.save();
    cx.scale(0.9, 0.9);
    const hg = cx.createRadialGradient(-2, -8, 1, 0, -4, 14);
    hg.addColorStop(0, '#ff6b81');
    hg.addColorStop(0.4, '#ff4757');
    hg.addColorStop(0.8, '#c0392b');
    hg.addColorStop(1, '#8b0000');
    hPath();
    cx.fillStyle = hg;
    cx.fill();
    cx.restore();

    cx.fillStyle = 'rgba(255, 200, 200, 0.45)';
    cx.beginPath();
    cx.ellipse(-4, -10, 4, 2.5, -0.5, 0, Math.PI * 2);
    cx.fill();

    cx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    cx.beginPath();
    cx.arc(-5, -11, 1.2, 0, Math.PI * 2);
    cx.fill();

    _heartSprite = c;
    return c;
  }

  function getGoldPickupSprite() {
    if (_goldPickupSprite) return _goldPickupSprite;
    const c = document.createElement('canvas');
    c.width = 40; c.height = 40;
    const cx = c.getContext('2d');
    cx.translate(20, 20);

    cx.beginPath();
    cx.moveTo(-10, -8);
    cx.lineTo(10, -8);
    cx.lineTo(13, 0);
    cx.lineTo(10, 8);
    cx.lineTo(-10, 8);
    cx.lineTo(-13, 0);
    cx.closePath();
    const grad = cx.createLinearGradient(-12, -8, 12, 8);
    grad.addColorStop(0, '#fff0a6');
    grad.addColorStop(0.45, '#ffd54f');
    grad.addColorStop(1, '#d89b12');
    cx.fillStyle = grad;
    cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,0.35)';
    cx.lineWidth = 2;
    cx.stroke();

    cx.fillStyle = 'rgba(255,255,255,0.28)';
    cx.fillRect(-4, -6, 8, 2);
    cx.fillStyle = 'rgba(150,90,0,0.22)';
    cx.fillRect(-3, -1.5, 6, 3);

    _goldPickupSprite = c;
    return c;
  }

  function getXpPickupSprite() {
    if (_xpPickupSprite) return _xpPickupSprite;
    const c = document.createElement('canvas');
    c.width = 40; c.height = 40;
    const cx = c.getContext('2d');
    cx.translate(20, 20);

    cx.beginPath();
    cx.moveTo(0, -13);
    cx.lineTo(9, -2);
    cx.lineTo(0, 12);
    cx.lineTo(-9, -2);
    cx.closePath();
    const grad = cx.createLinearGradient(-8, -10, 8, 12);
    grad.addColorStop(0, '#d5fff6');
    grad.addColorStop(0.45, '#55efc4');
    grad.addColorStop(1, '#00b894');
    cx.fillStyle = grad;
    cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,0.4)';
    cx.lineWidth = 2;
    cx.stroke();

    cx.beginPath();
    cx.moveTo(0, -9);
    cx.lineTo(5, -2);
    cx.lineTo(0, 7);
    cx.lineTo(-5, -2);
    cx.closePath();
    cx.fillStyle = 'rgba(255,255,255,0.26)';
    cx.fill();

    _xpPickupSprite = c;
    return c;
  }

  function getPickupSprite(type) {
    if (type === 'gold') return getGoldPickupSprite();
    if (type === 'xp') return getXpPickupSprite();
    return getHeartSprite();
  }

  function getPickupGlow(type) {
    if (type === 'gold') return '255,213,79';
    if (type === 'xp') return '85,239,196';
    return '255,107,129';
  }

  pickups.each(pk => {
    if (!isOnScreen(pk.x, pk.y, 34)) return;
    if (!Number.isFinite(pk._bobSeed)) pk._bobSeed = Math.random() * Math.PI * 2;
    if (!Number.isFinite(pk._spawnT)) pk._spawnT = 0;
    if (!Number.isFinite(pk._spin)) pk._spin = (Math.random() - 0.5) * 0.35;
    const seed = pk._bobSeed;
    const spawnIn = Math.min(1, (pk._spawnT || 0) / 0.16);
    const bob = Math.sin(G.totalTime * (pk.type === 'heart' ? 1.5 : 2.2) + seed) * (pk.type === 'heart' ? 2 : 1.5);
    const t = (G.totalTime * 1.2 + seed * 0.05) % 1;
    let beat = pk.type === 'heart' ? 1 : 1 + Math.sin(G.totalTime * 4.2 + seed) * 0.06;
    if (pk.type === 'heart') {
      if (t < 0.1) beat = 1 + 0.2 * Math.sin(t / 0.1 * Math.PI);
      else if (t > 0.18 && t < 0.28) beat = 1 + 0.12 * Math.sin((t - 0.18) / 0.1 * Math.PI);
    }
    const magBoost = pk.mag ? 1.06 : 1;
    const scale = (0.84 + spawnIn * 0.16) * beat * magBoost;

    ctx.save();
    ctx.translate(pk.x, pk.y + bob);

    if (pk.mag) {
      const ang = Math.atan2(P.y - pk.y, P.x - pk.x);
      ctx.save();
      ctx.rotate(ang);
      ctx.strokeStyle = `rgba(${getPickupGlow(pk.type)},0.26)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.lineTo(-6, -1.5);
      ctx.moveTo(-18, 3.5);
      ctx.lineTo(-5, 1.4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, pk.type === 'heart' ? 18 : 16);
    halo.addColorStop(0, `rgba(${getPickupGlow(pk.type)},${pk.mag ? 0.22 : 0.12})`);
    halo.addColorStop(1, `rgba(${getPickupGlow(pk.type)},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, pk.type === 'heart' ? 18 : 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.rotate(pk._spin + Math.sin(G.totalTime * 2.4 + seed) * (pk.type === 'gold' ? 0.16 : 0.06));
    ctx.scale(scale, scale);
    ctx.drawImage(getPickupSprite(pk.type), -20, -20);
    ctx.restore();
  });

  enemies.each(e => {
    if (e.dying || e.spawning || !e._telegraph) return;
    const tx = e._telegraph.data && e._telegraph.data.targetX;
    const ty = e._telegraph.data && e._telegraph.data.targetY;
    if (!isOnScreen(e.x, e.y, 150) && !(tx !== undefined && ty !== undefined && isOnScreen(tx, ty, 120))) return;
    drawEnemyTelegraph(ctx, e);
  });

  // Enemies (with culling)
  enemies.each(e => {
    if (!isOnScreen(e.x, e.y, 100)) return;
    // (Shield drone aura removed — old enemy system)
    const drawX = Number.isFinite(e.drawX) ? e.drawX : e.x;
    const drawY = Number.isFinite(e.drawY) ? e.drawY : e.y;
    ctx.save(); ctx.translate(drawX, drawY);
    if (e.spawning) {
      drawEnemySpawnPortal(ctx, e);
      ctx.restore();
      return;
    }
    drawEnemyReadabilityBase(ctx, e);
    drawEnemyDeathReadout(ctx, e);
    // Smoother spawn reveal — ease-out curve for organic feel
    const spawnRevealDur = 0.35;
    const revealRaw = e.spawnReveal > 0 ? 1 - Math.max(0, Math.min(1, e.spawnReveal / spawnRevealDur)) : 1;
    const revealT = revealRaw * revealRaw * (3 - 2 * revealRaw); // smoothstep
    const revealScale = e.spawnReveal > 0 ? 0.6 + revealT * 0.4 : 1;
    const revealAlpha = e.spawnReveal > 0 ? revealT : 1;
    const revealLift = e.spawnReveal > 0 ? (1 - revealT) * 6 : 0;
    let deathAlpha = 1;
    let deathScale = 1;
    if (e.dying && e.deathFade > 0) {
      // Simple quick fade + shrink, no spin/lift
      const t = 1 - (e.deathFade / 0.18);
      const eased = t * t;
      deathAlpha = 1 - eased;
      deathScale = 1 - eased * 0.3;
    }
    ctx.translate(0, -(e.renderBob || 0) - revealLift);
    ctx.rotate(e.renderLean || 0);
    ctx.scale((e.renderScaleX || 1) * revealScale * deathScale, (e.renderScaleY || 1) * revealScale * deathScale);
    ctx.globalAlpha *= revealAlpha * deathAlpha;
    // Elite enemy gold aura
    if (e.isElite) {
      ctx.strokeStyle = `rgba(255,215,0,${0.5 + Math.sin(G.totalTime * 5) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.sz + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.scale(1.3, 1.3);
    }
    // Scale down split glitches
    if (e.isSplit) ctx.scale(0.6, 0.6);
    // Get sprite — pixel art (directional) or procedural (faceX flip)
    let spr = null;
    const pixData = typeof ENEMY_PIXEL_DATA !== 'undefined' && ENEMY_PIXEL_DATA[e.type] && ENEMY_PIXEL_DATA[e.type].ready ? ENEMY_PIXEL_DATA[e.type] : null;
    let drewPixel = false;
    if (pixData) {
      // Direction-aware pixel art enemy (supports 4 or 8 directions)
      const dx = P.x - e.x, dy = P.y - e.y;
      const moveAngle = Number.isFinite(e.renderDirAngle) ? e.renderDirAngle : Math.atan2(dy, dx);
      const dir = angleToEnemyDir(moveAngle, pixData.dirCount || 4);
      const state = e.dying ? 'death' : (e.anim || 'walk');
      // Try current animation state, fallback to walk if no frames for this state
      let dirFrames = pixData[state] && pixData[state][dir];
      if (!dirFrames || !dirFrames.length) dirFrames = pixData.walk && pixData.walk[dir];
      if (dirFrames && dirFrames.length) {
        const frameIndex = Math.min(e.animF, dirFrames.length - 1);
        const nextIndex = (e.anim === 'walk' && dirFrames.length > 1)
          ? (frameIndex + 1) % dirFrames.length
          : Math.min(frameIndex + 1, dirFrames.length - 1);
        spr = dirFrames[frameIndex];
        const nextSpr = dirFrames[nextIndex];
        if ((!spr || !spr.complete || !spr.naturalWidth) && pixData.idle[dir] && pixData.idle[dir].complete && pixData.idle[dir].naturalWidth) {
          spr = pixData.idle[dir];
        }
        if (spr && spr.complete && spr.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false;
          drawEnemyFrameBlend(ctx, spr, nextSpr && nextSpr.complete && nextSpr.naturalWidth > 0 ? nextSpr : null, e.animBlend || 0);
          ctx.imageSmoothingEnabled = true;
          drewPixel = true;
        }
      }
    }
    if (!drewPixel) {
      // Procedural enemy — horizontal flip
      if (e.faceX < 0) ctx.scale(-1, 1);
      let drewFallbackAnim = false;
      const animData = ENEMY_ANIMS[e.type];
      if (animData) {
        const st = animData[e.anim] || animData.walk;
        if (st && st.frames.length) {
          const frameIndex = Math.min(e.animF, st.frames.length - 1);
          const nextIndex = st.loop && st.frames.length > 1 ? (frameIndex + 1) % st.frames.length : Math.min(frameIndex + 1, st.frames.length - 1);
          spr = st.frames[frameIndex];
          drawEnemyFrameBlend(ctx, spr, st.frames[nextIndex], e.animBlend || 0);
          drewFallbackAnim = true;
        }
      }
      if (!spr) { const frames = ENEMY_FRAMES[e.type]; spr = frames ? frames[0] : ENEMY_SPRITES[e.type]; }
      if (spr && !drewFallbackAnim) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    }
    // Flash: redraw sprite in additive mode (skip for pixel art enemies — they have glow already)
    if (e.flash > 0 && spr && spr.complete !== false && !drewPixel) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7;
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.restore();
    }
    // Elite crown indicator
    if (e.isElite) {
      if (e.faceX < 0) ctx.scale(-1, 1); // unflip for text
      ctx.font = '14px Arial'; ctx.textAlign = 'center';
      ctx.fillText('👑', 0, -e.sz - 8);
    }
    ctx.restore();
  });

  // Boss
  if (G.boss && G.phase === 'boss') G.boss.draw(ctx);

  // Projectiles
  projs.each(p => {
    if (!isOnScreen(p.x, p.y, 20)) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (typeof renderProjectile === 'function') {
      renderProjectile(ctx, p);
    } else {
      ctx.fillStyle = p.col;
      const sz = p.friendly ? 5 * (p._size || 1) : 7;
      ctx.beginPath();
      ctx.arc(0, 0, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Dash afterimages
  drawAfterimages(ctx);

  // Intensity world effects (trail, aura — behind player)
  renderIntensityWorld(ctx);

  // Player (composited character system)
  drawPlayerCombatFeedback(ctx);
  renderJeff(ctx);

  // Ultimate shockwave (world-space)
  renderUltimateWorld(ctx);

  // Missions (world-space)
  renderMissions(ctx);

  // Particles (world-space)
  drawParticles(ctx);

  // God Candles (world-space)
  drawGodCandles(ctx);

  // Damage numbers (world-space) — enhanced with outlines + scale pop
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 3;
  ctx.font = "800 14px 'Exo 2'"; // Set once, use scaling instead of resizing font
  for (const d of dmgNums) {
    if (!isOnScreen(d.x, d.y, 50)) continue;
    if (d.degen && renderDegenText(ctx, d)) continue;
    const maxLife = d.maxLife || 0.4;
    const t = d.life / maxLife;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.globalAlpha = Math.min(1, t * 2.5);
    const isCrit = d.col === '#ffd700';
    const isHeal = d.col === '#55efc4';
    const pop = 1 + Math.max(0, (t - 0.5)) * 0.8;
    const baseSize = isCrit ? 1.3 : isHeal ? 1.07 : 1;
    const sc = pop * baseSize;
    ctx.scale(sc, sc);
    ctx.strokeText(d.n, 0, 0);
    ctx.fillStyle = d.col || '#f1f2f6';
    ctx.fillText(d.n, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // end world-space

  // === SCREEN-SPACE RENDERING ===

  // Cinematic Wave Transition
  if (G.phase === 'waveIntro') {
    const totalDur = G.waveIntroTotal || WAVE_BREATHER_DURATION;
    const meta = G._waveIntroMeta || buildWaveIntroMeta(G.wave);
    const t = 1 - G.waveIntroTime / totalDur; // 0→1 progress
    const fadeIn = Math.min(1, t * 4);      // 0→0.25: fade in
    const fadeOut = Math.min(1, G.waveIntroTime / 0.4); // last 0.4s: fade out
    const alpha = fadeIn * fadeOut;
    const anchorY = Math.max(88, H * 0.24);
    const titleY = anchorY + 42;
    const kickerY = anchorY + 6;
    const countdownY = anchorY - 28;
    const subLabelY = anchorY + 82;
    const diffBarY = anchorY + 92;
    const countdownLabelY = anchorY + 110;

    ctx.save();

    // Keep the arena readable: tint only the upper presentation band.
    const bandBottom = Math.min(H * 0.44, anchorY + 132);
    const bandGrad = ctx.createLinearGradient(0, 0, 0, bandBottom);
    bandGrad.addColorStop(0, `rgba(3, 6, 14, ${alpha * 0.82})`);
    bandGrad.addColorStop(0.52, `rgba(5, 10, 22, ${alpha * 0.42})`);
    bandGrad.addColorStop(1, 'rgba(5, 10, 22, 0)');
    ctx.fillStyle = bandGrad;
    ctx.fillRect(0, 0, W, bandBottom);

    // Horizontal lines expanding near the top anchor instead of through the player.
    const lineExpand = Math.min(1, t * 2.5);
    const lineW = W * 0.46 * lineExpand;
    const lineY1 = anchorY + 16;
    const lineY2 = anchorY + 58;

    ctx.globalAlpha = alpha * 0.8;
    const lineGrad = ctx.createLinearGradient(W / 2 - lineW / 2, 0, W / 2 + lineW / 2, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.2, combatAlphaColor(meta.accent, 0.8));
    lineGrad.addColorStop(0.5, combatAlphaColor(meta.reward, 1));
    lineGrad.addColorStop(0.8, combatAlphaColor(meta.accent, 0.8));
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(W / 2 - lineW / 2, lineY1, lineW, 2);
    ctx.fillRect(W / 2 - lineW / 2, lineY2, lineW, 2);

    // Wave number — still premium, but shifted out of the center combat lane.
    const wavePulse = 1 + Math.sin(Date.now() * 0.008) * 0.03;
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.shadowColor = meta.reward;
    ctx.shadowBlur = 24;
    ctx.font = `900 ${42 * wavePulse}px 'Exo 2'`;
    ctx.fillStyle = meta.reward;
    ctx.fillText(meta.title, W / 2, titleY);

    ctx.globalAlpha = alpha * 0.7;
    ctx.shadowBlur = 12;
    ctx.shadowColor = meta.accent;
    ctx.font = "600 12px 'JetBrains Mono'";
    ctx.fillStyle = meta.subColor;
    ctx.fillText(meta.kicker, W / 2, kickerY);

    const countdown = Math.max(1, Math.ceil(G.waveIntroTime));
    ctx.globalAlpha = alpha * 0.2;
    ctx.shadowBlur = 14;
    ctx.shadowColor = meta.reward;
    ctx.font = "900 30px 'JetBrains Mono'";
    ctx.fillStyle = meta.reward;
    ctx.fillText(String(countdown), W / 2, countdownY);

    // Slide in from right effect
    const slideIn = Math.min(1, (t - 0.15) * 3);
    if (slideIn > 0) {
      const offsetX = (1 - slideIn) * 100;
      ctx.globalAlpha = alpha * slideIn;
      ctx.shadowColor = meta.accent;
      ctx.shadowBlur = 10;
      ctx.font = "600 13px 'JetBrains Mono'";
      ctx.fillStyle = meta.accent;
      ctx.fillText(meta.subLabel, W / 2 + offsetX, subLabelY);

      // Difficulty bar
      const barW = 120;
      const barH = 4;
      const barX = W / 2 - barW / 2 + offsetX;
      const barY = diffBarY;
      const difficulty = meta.difficulty;

      ctx.globalAlpha = alpha * slideIn * 0.4;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.globalAlpha = alpha * slideIn * 0.9;
      const diffGrad = ctx.createLinearGradient(barX, 0, barX + barW * difficulty, 0);
      diffGrad.addColorStop(0, meta.accent);
      diffGrad.addColorStop(0.5, meta.reward);
      diffGrad.addColorStop(1, '#ff4757');
      ctx.fillStyle = diffGrad;
      ctx.fillRect(barX, barY, barW * difficulty, barH);

      ctx.globalAlpha = alpha * slideIn * 0.75;
      ctx.font = "700 10px 'JetBrains Mono'";
      ctx.fillStyle = meta.subColor;
      ctx.fillText(`${meta.countdownLabel} T-${countdown}`, W / 2 + offsetX, countdownLabelY);
    }

    ctx.restore();
  }

  // Enemy Direction Indicators (off-screen arrows)
  if (G.phase === 'wave' || G.phase === 'boss') {
    ctx.save();
    const indicatorDist = 40;
    const tacticalPanel = getTacticalHudLayout();
    const offscreen = [];
    enemies.each(e => {
      if (e.dying || e.spawning) return;
      const sx = e.x - CAM.x;
      const sy = e.y - CAM.y;
      // Only show for off-screen enemies
      if (sx >= -20 && sx <= W + 20 && sy >= -20 && sy <= H + 20) return;
      const angle = Math.atan2(sy - H / 2, sx - W / 2);
      const dist = Math.hypot(e.x - P.x, e.y - P.y);
      const score = typeof getEnemyThreatScore === 'function' ? getEnemyThreatScore(e) : 1;
      offscreen.push({ e, angle, dist, score });
    });
    offscreen.sort((a, b) => b.score - a.score || a.dist - b.dist);
    offscreen.slice(0, 8).forEach((entry, index) => {
      const { e, angle, dist, score } = entry;
      let edgeX = Math.max(indicatorDist, Math.min(W - indicatorDist, W / 2 + Math.cos(angle) * (W / 2 - indicatorDist)));
      let edgeY = Math.max(indicatorDist, Math.min(H - indicatorDist, H / 2 + Math.sin(angle) * (H / 2 - indicatorDist)));
      const pad = 16;
      if (edgeX > tacticalPanel.panelX - pad && edgeX < tacticalPanel.panelX + tacticalPanel.panelW + pad
        && edgeY > tacticalPanel.panelY - pad && edgeY < tacticalPanel.panelY + tacticalPanel.panelH + pad) {
        edgeX = tacticalPanel.panelX - pad;
        edgeY = Math.max(indicatorDist, Math.min(H - indicatorDist, edgeY));
      }
      const meta = typeof getEnemyThreatMeta === 'function' ? getEnemyThreatMeta(e) : { color: '#ff6b6b' };
      const color = e._threatColor || meta.color;
      const alpha = Math.max(0.3, Math.min(0.9, 1 - dist / 900 + score * 0.08));
      const pulse = 0.72 + Math.sin(Date.now() * 0.005 + index) * 0.28;
      const arrowSize = 7 + Math.min(6, score * 1.6);
      ctx.globalAlpha = alpha * pulse;
      ctx.save();
      ctx.translate(edgeX, edgeY);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.shadowColor = combatAlphaColor(color, 0.6);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(arrowSize, 0);
      ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.7);
      ctx.lineTo(-arrowSize * 0.2, 0);
      ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // Leverage indicator (screen-space)
  drawUltimateIndicator(ctx);

  // Mission HUD (screen-space)
  renderMissionHUD(ctx);

  // Degen FX (screen-space)
  renderDegenFX(ctx);

  // Screen intensity (bloom, chromatic, kill streak, combo particles)
  renderIntensityScreen(ctx);

  // Ultimate FX (screen-space)
  renderUltimateEffect(ctx);
  // ultimate HUD now drawn as left-side bar via drawUltimateIndicator

  // Market Event HUD + overlay
  renderMarketEventHUD(ctx);
  renderMarketEventOverlay(ctx);

  // Minimap
  drawMinimap(ctx);

  let vigW = W, vigH = H;
  if (typeof _cachedVigW === 'undefined') {
    window._cachedVigW = 0; window._cachedVigH = 0;
    window._cachedLowHpVig = null; window._cachedDangerVig = null;
  }

  // Low HP vignette
  if (P.hp < P.maxHp * 0.3 && G.phase !== 'menu') {
    ctx.globalAlpha = 0.15 + Math.sin(G.totalTime * 4) * 0.1;
    if (_cachedVigW !== W || _cachedVigH !== H || !_cachedLowHpVig) {
      _cachedVigW = W; _cachedVigH = H;
      _cachedLowHpVig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.6);
      _cachedLowHpVig.addColorStop(0, 'transparent');
      _cachedLowHpVig.addColorStop(1, '#ff0000');
    }
    ctx.fillStyle = _cachedLowHpVig;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // High leverage danger vignette (>20x)
  if (P.leverage > 20 && (G.phase === 'wave' || G.phase === 'boss')) {
    const dangerT = (P.leverage - 20) / 30; // 0 at 20x, 1 at 50x
    const pulseAlpha = 0.08 + dangerT * 0.15 + Math.sin(G.totalTime * 6) * 0.05;
    ctx.globalAlpha = pulseAlpha;
    if (_cachedVigW !== W || _cachedVigH !== H || !_cachedDangerVig) {
      _cachedVigW = W; _cachedVigH = H;
      _cachedDangerVig = ctx.createRadialGradient(W / 2, H / 2, W * 0.15, W / 2, H / 2, W * 0.55);
      _cachedDangerVig.addColorStop(0, 'transparent');
      _cachedDangerVig.addColorStop(0.6, 'rgba(255, 0, 0, 0.3)');
      _cachedDangerVig.addColorStop(1, 'rgba(180, 0, 0, 0.8)');
    }
    ctx.fillStyle = _cachedDangerVig;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    // Continuous danger shake is throttled and softened to avoid motion sickness.
    if ((G._dangerShakeCd || 0) <= 0) {
      const shakeIntensity = 0.12 + dangerT * 0.42;
      triggerShake(shakeIntensity, 0.06);
      G._dangerShakeCd = 0.22;
    }
  }

  // Dash cooldown indicator
  if (P.dashCd > 0) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#333';
    ctx.fillRect(W / 2 - 25, H - 15, 50, 6);
    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(W / 2 - 25, H - 15, 50 * (1 - P.dashCd / 1.0), 6);
    ctx.globalAlpha = 1;
  }

  if (G._screenFlash) {
    const flashT = Math.max(0, G._screenFlash.life / (G._screenFlash.maxLife || 0.05));
    let rgb = '255,255,255';
    if (G._screenFlash.kind === 'flash_purple') rgb = '190,110,255';
    else if (G._screenFlash.kind === 'flash_warm') rgb = '255,140,70';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = G._screenFlash.alpha * flashT;
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (G._weaponImpactPulse) {
    const pulseT = Math.max(0, G._weaponImpactPulse.life / (G._weaponImpactPulse.maxLife || 0.08));
    const px = P.x - CAM.x;
    const py = P.y - CAM.y;
    const radius = 54 + G._weaponImpactPulse.strength * 72;
    const axis = Number.isFinite(P.angle) ? P.angle : 0;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(px, py, radius * 0.08, px, py, radius);
    halo.addColorStop(0, combatAlphaColor('#ffffff', (0.05 + G._weaponImpactPulse.strength * 0.04) * pulseT));
    halo.addColorStop(0.24, combatAlphaColor(G._weaponImpactPulse.glow, (0.08 + G._weaponImpactPulse.strength * 0.12) * pulseT));
    halo.addColorStop(1, combatAlphaColor(G._weaponImpactPulse.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

    ctx.translate(px, py);
    ctx.rotate(axis);
    ctx.strokeStyle = combatAlphaColor(G._weaponImpactPulse.accent, (0.12 + G._weaponImpactPulse.strength * 0.18) * pulseT);
    ctx.lineWidth = G._weaponImpactPulse.killed ? 3 : 2.2;
    const streakLen = 22 + G._weaponImpactPulse.strength * 30;
    const streakOffset = 5 + G._weaponImpactPulse.strength * 8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-streakLen, side * (streakOffset + 5));
      ctx.lineTo(8, side * streakOffset);
      ctx.stroke();
    }
    if (G._weaponImpactPulse.boss || G._weaponImpactPulse.killed) {
      ctx.strokeStyle = combatAlphaColor(G._weaponImpactPulse.glow, (0.08 + G._weaponImpactPulse.strength * 0.12) * pulseT);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + G._weaponImpactPulse.strength * 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore(); // end shake
}

// ============ ULTIMATE INDICATOR (left side) ============
function drawUltimateIndicator(ctx) {
  const pct = ULT.charge / ULT.maxCharge;
  const ready = isUltReady();
  const x = 20, y = H / 2 - 60;

  ctx.save();
  ctx.globalAlpha = 0.85;

  // Background bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(x, y, 30, 120, 4);
  ctx.fill();
  ctx.strokeStyle = ready ? 'rgba(85,239,196,0.5)' : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Fill from bottom
  const fillH = 120 * pct;
  if (fillH > 0) {
    const grad = ctx.createLinearGradient(x, y + 120, x, y + 120 - fillH);
    if (ready) {
      const pulse = 0.7 + Math.sin(ULT.pulseTimer * 5) * 0.3;
      ctx.globalAlpha = pulse;
      grad.addColorStop(0, '#00b894');
      grad.addColorStop(1, '#55efc4');
      ctx.shadowColor = '#55efc4';
      ctx.shadowBlur = 12;
    } else {
      // Red (0%) → Orange (50%) → Green (100%)
      const hue = pct * 120; // 0=red, 60=yellow, 120=green
      const colBot = `hsl(${hue * 0.7}, 90%, 50%)`;
      const colTop = `hsl(${hue}, 80%, 55%)`;
      grad.addColorStop(0, colBot);
      grad.addColorStop(1, colTop);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 120 - fillH, 26, fillH, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Percentage text
  ctx.globalAlpha = 0.9;
  ctx.font = "bold 13px 'Exo 2'";
  ctx.textAlign = 'center';
  ctx.fillStyle = ready ? '#55efc4' : `hsl(${pct * 120}, 80%, 55%)`;
  ctx.fillText(ready ? 'R' : `${Math.floor(pct * 100)}%`, x + 15, y - 8);

  // Label
  ctx.font = "700 8px 'JetBrains Mono'";
  ctx.fillStyle = ready ? '#55efc4' : '#666';
  ctx.fillText(ready ? '🐾 ULT' : 'ULT', x + 15, y + 135);

  ctx.restore();
}

function getTacticalHudLayout() {
  const panelW = 156;
  const panelH = 190;
  const panelX = W - panelW - 16;
  const panelY = 44;
  const radarSize = 132;
  const radius = radarSize / 2;
  return {
    panelX,
    panelY,
    panelW,
    panelH,
    radarSize,
    radius,
    radarCx: panelX + panelW / 2,
    radarCy: panelY + 108,
  };
}

// ============ MINIMAP ============
function drawMinimap(ctx) {
  const layout = getTacticalHudLayout();
  const { panelX, panelY, panelW, panelH, radarSize, radius, radarCx: cx, radarCy: cy } = layout;
  const scale = radarSize / WORLD_W;
  let activeHostiles = 0;
  let closeThreats = 0;

  ctx.save();
  ctx.globalAlpha = 1;
  const phaseLabel = G.phase === 'boss' ? 'BOSS'
    : G.phase === 'bossIntro' ? 'SPIKE'
      : G.phase === 'waveIntro' ? 'BREATHER'
        : 'LIVE';

  ctx.textAlign = 'left';
  ctx.font = "700 8px 'JetBrains Mono'";
  ctx.fillStyle = 'rgba(241,242,246,0.42)';
  ctx.fillText('RADAR', panelX + 2, panelY + 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = G.phase === 'boss' ? '#ff6b6b' : G.phase === 'waveIntro' ? '#ffd166' : 'rgba(85,239,196,0.85)';
  ctx.fillText(phaseLabel, panelX + panelW - 2, panelY + 2);

  // --- Circular clipping ---
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();

  // Background
  ctx.fillStyle = 'rgba(3, 5, 12, 0.72)';
  ctx.fill();

  // Concentric range rings
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.08)';
  ctx.lineWidth = 0.5;
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * r / 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross-hair lines
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.05)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
  ctx.stroke();

  // Radar sweep (rotating gradient cone)
  const sweepAngle = (G.totalTime * 1.2) % (Math.PI * 2);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, sweepAngle - 0.4, sweepAngle);
  ctx.closePath();
  ctx.fill();
  // Sweep trail
  ctx.globalAlpha = 0.04;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, sweepAngle - 1.2, sweepAngle - 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Camera viewport rectangle
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  const vpx = cx - radius + CAM.x * scale;
  const vpy = cy - radius + CAM.y * scale;
  ctx.strokeRect(vpx, vpy, W * scale, H * scale);

  // --- Enemies ---
  enemies.each(e => {
    if (e.dying || e.spawning) return;
    activeHostiles++;
    const ex = cx - radius + e.x * scale;
    const ey = cy - radius + e.y * scale;
    const dx = ex - cx, dy = ey - cy;
    if (dx * dx + dy * dy > radius * radius) return; // Outside circle

    // Color-coded by threat
    const distToPlayer = Math.hypot(e.x - P.x, e.y - P.y);
    if (distToPlayer < 280) closeThreats++;
    if (distToPlayer < 200) {
      ctx.fillStyle = '#ff3838'; // Close threat — bright red
    } else if (distToPlayer < 500) {
      ctx.fillStyle = '#ff7675'; // Medium — coral
    } else {
      ctx.fillStyle = '#636e72'; // Far — dim grey
    }
    ctx.fillRect(ex - 1, ey - 1, 2, 2);
  });

  // --- Boss ---
  if (G.boss && G.phase === 'boss') {
    const bx = cx - radius + G.boss.x * scale;
    const by = cy - radius + G.boss.y * scale;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
    // Pulsing ring
    const pulseR = 7 + Math.sin(G.totalTime * 4) * 2;
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, pulseR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Pickups ---
  pickups.each(pk => {
    const px = cx - radius + pk.x * scale;
    const py = cy - radius + pk.y * scale;
    const dx = px - cx, dy = py - cy;
    if (dx * dx + dy * dy > radius * radius) return;
    ctx.fillStyle = pk.type === 'gold' ? '#ffd700' : '#00ff66';
    ctx.fillRect(px - 1, py - 1, 2, 2);
  });

  ctx.restore(); // Unclip

  // --- Player dot (always centered relative to world) ---
  const playerX = cx - radius + P.x * scale;
  const playerY = cy - radius + P.y * scale;

  // Player glow pulse
  const pulse = 1 + Math.sin(G.totalTime * 3) * 0.3;
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(playerX, playerY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Player aim direction indicator
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.42)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(playerX, playerY);
  ctx.lineTo(playerX + Math.cos(P.angle) * 12, playerY + Math.sin(P.angle) * 12);
  ctx.stroke();

  // --- Outer ring border ---
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks at cardinal points
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.38)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const innerR = i % 2 === 0 ? radius - 6 : radius - 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.font = "700 8px 'JetBrains Mono'";
  ctx.fillStyle = 'rgba(241,242,246,0.36)';
  ctx.fillText('HOST', panelX + 2, panelY + panelH - 4);
  ctx.font = "900 14px 'Exo 2'";
  ctx.fillStyle = closeThreats > 0 ? '#ff6b6b' : '#55efc4';
  ctx.fillText(String(activeHostiles), panelX + 36, panelY + panelH - 3);

  ctx.restore();
}


console.log("ADDING LISTENERS");
const MENU_MODE_BRIEF = {
  arcade: {
    kicker: 'OPERATOR BRIEF',
    title: 'Arcade is locked for this V1 window.',
    copy: 'Arcade remains in the roadmap, but is temporarily unavailable while we ship and stabilize Survivor on testnet.',
    card1Label: 'RUN SHAPE',
    card1Value: 'Locked Mode',
    card1Copy: 'Development paused until the Survivor V1 release lane is complete and validated.',
    card2Label: 'STATUS',
    card2Value: 'Coming Soon',
    card2Copy: 'Re-open after V1 testnet feedback and post-launch hardening.'
  },
  adventure: {
    kicker: 'OPERATOR BRIEF',
    title: 'Survivor is the full V1 ship path.',
    copy: 'This is the active release lane: progression, boss escalation, and the run quality we want for first public testers.',
    card1Label: 'RUN SHAPE',
    card1Value: 'Campaign Lane',
    card1Copy: 'Stage flow, boss cadence, and map identity create the core loop we are shipping now.',
    card2Label: 'BEST FOR',
    card2Value: 'V1 Playtests',
    card2Copy: 'Use this path for balancing, QA evidence, and wallet/testnet score validation.'
  }
};

function setMenuLaunchStatus(text) {
  const statusEl = document.getElementById('menu-launch-status');
  if (statusEl && typeof text === 'string') statusEl.textContent = text;
}

function isArcadeLocked() {
  return true;
}

function setMenuModePreview(mode) {
  const cfg = MENU_MODE_BRIEF[mode] || MENU_MODE_BRIEF.arcade;
  const panel = document.getElementById('menu-mode-brief');
  const arcadeBtn = document.getElementById('btn-arcade');
  const adventureBtn = document.getElementById('btn-adventure');
  if (panel) panel.dataset.mode = mode in MENU_MODE_BRIEF ? mode : 'arcade';
  if (arcadeBtn) arcadeBtn.classList.toggle('is-mode-active', mode === 'arcade');
  if (adventureBtn) adventureBtn.classList.toggle('is-mode-active', mode === 'adventure');
  const textMap = {
    'menu-brief-kicker': cfg.kicker,
    'menu-brief-title': cfg.title,
    'menu-brief-copy': cfg.copy,
    'menu-brief-card-1-label': cfg.card1Label,
    'menu-brief-card-1-value': cfg.card1Value,
    'menu-brief-card-1-copy': cfg.card1Copy,
    'menu-brief-card-2-label': cfg.card2Label,
    'menu-brief-card-2-value': cfg.card2Value,
    'menu-brief-card-2-copy': cfg.card2Copy
  };
  Object.entries(textMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function wireMenuModePreview(button, mode) {
  if (!button) return;
  const preview = () => setMenuModePreview(mode);
  button.addEventListener('mouseenter', preview);
  button.addEventListener('focus', preview);
  button.addEventListener('click', preview);
}

wireMenuModePreview(document.getElementById('btn-arcade'), 'arcade');
wireMenuModePreview(document.getElementById('btn-adventure'), 'adventure');
setMenuModePreview('adventure');
setMenuLaunchStatus('Arcade mode is locked for V1. Survivor is the active release path.');

document.getElementById('btn-arcade').addEventListener('click', () => {
  if (isArcadeLocked()) {
    setMenuModePreview('arcade');
    setMenuLaunchStatus('Arcade is coming soon. For now, launch Survivor for V1 playtests.');
    return;
  }
  if (typeof startArcadeFlow === 'function') {
    startArcadeFlow();
  } else {
    startGame('arcade');
  }
});
document.getElementById('btn-adventure').addEventListener('click', () => {
  setMenuLaunchStatus('Launching Survivor V1 lane...');
  startGame('adventure');
});

// Character Select buttons
document.getElementById('btn-char-confirm').addEventListener('click', () => {
  if (typeof confirmCharacterSelect === 'function') confirmCharacterSelect();
});
document.getElementById('btn-char-back').addEventListener('click', () => {
  if (typeof hideCharacterSelect === 'function') hideCharacterSelect();
  document.getElementById('mm').classList.remove('h');
});

// Map Select buttons
document.getElementById('btn-map-confirm').addEventListener('click', () => {
  if (typeof confirmMapSelect === 'function') confirmMapSelect();
});
document.getElementById('btn-map-back').addEventListener('click', () => {
  if (typeof hideMapSelect === 'function') hideMapSelect();
  if (typeof showCharacterSelect === 'function') showCharacterSelect();
  document.getElementById('char-select').classList.remove('h');
});

// DEV: Stage select — jump directly to any stage
const _devStageSelect = document.getElementById('dev-stage-select');
if (_devStageSelect) _devStageSelect.addEventListener('change', function () {
  const stage = parseInt(this.value);
  if (stage < 1) return;
  this.value = '0';
  devStartAtStage(stage);
});

function devStartAtStage(stage) {
  G.mode = 'adventure';
  G.stage = stage - 1;
  initAudio();
  if (window.MediaDirector && typeof MediaDirector.syncAudioSettings === 'function') MediaDirector.syncAudioSettings();
  document.getElementById('gm').classList.remove('dramatic');
  document.getElementById('vm').classList.remove('spectacular');
  document.querySelectorAll('.confetti-particle').forEach(e => e.remove());
  clearDamageFlash();
  G.wave = (stage - 1) * WAVES_PER_STAGE;
  G.gold = 30 + stage * 50; G.kills = 0; G.phase = 'wave'; G.prevPhase = null;
  G.boss = null; G.bossKey = null; G.freezeTime = 0; G.totalTime = 0; G.combo = 0; G.comboTimer = 0; G.maxCombo = 0; G.spawnCd = 0;
  G.waveIntroTime = 0; G.waveIntroTotal = 0; G.pendingLevelUps = 0; G._screenFlash = null; G._weaponImpactPulse = null; G._waveIntroMeta = null;
  G._recentSpawnTypes = [];
  G.totalDmgDealt = 0; G.totalDmgTaken = 0; G.totalGoldEarned = 0; G.bossesKilled = 0;
  G.dpsHistory = []; G.dpsAccum = 0; G.dpsTimer = 0; G.currentDPS = 0; G.lastMilestone = 0;
  G.maxStageReached = stage - 1;
  P.x = WORLD_W / 2; P.y = WORLD_H / 2;
  P.level = 5 + stage * 3; P.maxHp = 100 + stage * 40; P.hp = P.maxHp;
  P.spd = 220 + stage * 10; P.armor = stage; P.crit = 5 + stage * 2; P.kbMult = 1; P.dodge = 0;
  P.xp = 0; P.xpNext = typeof getXpThreshold === 'function' ? getXpThreshold(P.level) : 50; P.weapons = [{ id: 'pistol', level: 1, cd: 0 }];
  P._turrets = []; P._swingAngle = 0; P._orbitalDetachCd = 0;
  P.iframes = 0; P.dmgMult = 1 + stage * 0.1; P.cdMult = 1; P.magnetRange = 100;
  P.leverage = 1; P.leverageIdx = 0; P.dashCd = 0; P.dashTimer = 0; P.dashing = false; P.animTimer = 0;
  P.vx = 0; P.vy = 0; P.kbX = 0; P.kbY = 0;
  P._hitPulse = 0; P._hitPulseMax = 0; P._hitSeverity = 0; P._hitDirX = 0; P._hitDirY = -1;
  CAM.x = P.x - W / 2; CAM.y = P.y - H / 2;
  enemies.clear(); projs.clear(); pickups.clear(); hazards.clear(); dmgNums.length = 0; particles.length = 0;
  godCandles.length = 0; afterimages.length = 0; _hpDisplay = 100; _xpDisplay = 0;
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('boss-intro').classList.add('h');
  document.getElementById('milestone-banner').classList.add('h');
  resetMissions(); resetUltimate(); resetMarketEvents(); resetIntensity(); resetCharacterAnim(); hideLevelUpUI();
  cinematicPlayed = true; // skip cinematic
  showStageMap(() => {
    startNextWave();
    lastT = performance.now();
    requestAnimationFrame(loop);
  });
}

function devStartBossAtStage(stage) {
  const targetStage = Math.max(1, Math.floor(stage || 1));
  G.mode = 'adventure';
  G.stage = targetStage - 1;
  initAudio();
  if (window.MediaDirector && typeof MediaDirector.syncAudioSettings === 'function') MediaDirector.syncAudioSettings();
  document.getElementById('gm').classList.remove('dramatic');
  document.getElementById('vm').classList.remove('spectacular');
  document.querySelectorAll('.confetti-particle').forEach(e => e.remove());
  clearDamageFlash();
  G.wave = targetStage * WAVES_PER_STAGE;
  G.gold = 30 + targetStage * 50;
  G.kills = 0;
  G.phase = 'wave';
  G.prevPhase = null;
  G.boss = null;
  G.bossKey = null;
  G.freezeTime = 0;
  G.totalTime = 0;
  G.combo = 0;
  G.comboTimer = 0;
  G.maxCombo = 0;
  G.spawnCd = 0;
  G.waveIntroTime = 0;
  G.waveIntroTotal = 0;
  G.pendingLevelUps = 0;
  G._screenFlash = null;
  G._weaponImpactPulse = null;
  G._waveIntroMeta = null;
  G._recentSpawnTypes = [];
  G.totalDmgDealt = 0;
  G.totalDmgTaken = 0;
  G.totalGoldEarned = 0;
  G.bossesKilled = Math.max(0, targetStage - 1);
  G.dpsHistory = [];
  G.dpsAccum = 0;
  G.dpsTimer = 0;
  G.currentDPS = 0;
  G.lastMilestone = 0;
  G.maxStageReached = targetStage - 1;
  P.x = WORLD_W / 2;
  P.y = WORLD_H / 2;
  P.level = 5 + targetStage * 3;
  P.maxHp = 100 + targetStage * 40;
  P.hp = P.maxHp;
  P.spd = 220 + targetStage * 10;
  P.armor = targetStage;
  P.crit = 5 + targetStage * 2;
  P.kbMult = 1;
  P.dodge = 0;
  P.xp = 0;
  P.xpNext = typeof getXpThreshold === 'function' ? getXpThreshold(P.level) : 50;
  P.weapons = [{ id: 'pistol', level: 1, cd: 0 }];
  P._turrets = [];
  P._swingAngle = 0;
  P._orbitalDetachCd = 0;
  P.iframes = 0;
  P.dmgMult = 1 + targetStage * 0.1;
  P.cdMult = 1;
  P.magnetRange = 100;
  P.leverage = 1;
  P.leverageIdx = 0;
  P.dashCd = 0;
  P.dashTimer = 0;
  P.dashing = false;
  P.animTimer = 0;
  P.vx = 0;
  P.vy = 0;
  P.kbX = 0;
  P.kbY = 0;
  P._hitPulse = 0;
  P._hitPulseMax = 0;
  P._hitSeverity = 0;
  P._hitDirX = 0;
  P._hitDirY = -1;
  CAM.x = P.x - W / 2;
  CAM.y = P.y - H / 2;
  enemies.clear();
  projs.clear();
  pickups.clear();
  hazards.clear();
  dmgNums.length = 0;
  particles.length = 0;
  godCandles.length = 0;
  afterimages.length = 0;
  _hpDisplay = 100;
  _xpDisplay = 0;
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('mm').classList.add('h');
  document.getElementById('boss-intro').classList.add('h');
  document.getElementById('milestone-banner').classList.add('h');
  resetMissions();
  resetUltimate();
  resetMarketEvents();
  resetIntensity();
  resetCharacterAnim();
  hideLevelUpUI();
  cinematicPlayed = true;
  startBossIntro();
  lastT = performance.now();
  requestAnimationFrame(loop);
}

function getDebugLaunchConfig() {
  if (typeof window === 'undefined' || !window.location) return null;
  const params = new URLSearchParams(window.location.search || '');
  const stageRaw = params.get('devStage');
  const bossRaw = params.get('devBoss');
  if (!stageRaw && !bossRaw) return null;
  const stage = Math.max(1, parseInt(stageRaw || '1', 10) || 1);
  const boss = bossRaw === '1' || bossRaw === 'true' || bossRaw === 'boss';
  return { stage, boss };
}

function maybeRunDebugLaunch() {
  const cfg = getDebugLaunchConfig();
  if (!cfg) return;
  const run = () => {
    if (cfg.boss) devStartBossAtStage(cfg.stage);
    else devStartAtStage(cfg.stage);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    setTimeout(run, 0);
  }
}

window.devStartBossAtStage = devStartBossAtStage;
window.getDebugLaunchConfig = getDebugLaunchConfig;
maybeRunDebugLaunch();
document.getElementById('btn-next-stage').addEventListener('click', () => {
  if (G.phase === 'shop') {
    closePersistentShop();
  }
});
document.getElementById('btn-retry').addEventListener('click', () => startGame(G.mode));
document.getElementById('btn-menu').addEventListener('click', () => {
  stopMusic();
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('mm').classList.remove('h');
  setMenuModePreview('adventure');
  setMenuLaunchStatus('Arcade mode is locked for V1. Survivor is the active release path.');
  initAudio();
  startMusic();
  updateMenuHighscores();
});
document.getElementById('btn-vmenu').addEventListener('click', () => {
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('mm').classList.remove('h');
  setMenuModePreview('adventure');
  setMenuLaunchStatus('Arcade mode is locked for V1. Survivor is the active release path.');
  initAudio();
  startMusic();
  updateMenuHighscores();
});
// Pause menu buttons
document.getElementById('btn-resume').addEventListener('click', resumeGame);
document.getElementById('btn-quit').addEventListener('click', () => {
  stopMusic();
  G.phase = 'menu';
  G.prevPhase = null;
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('mm').classList.remove('h');
  setMenuModePreview('adventure');
  setMenuLaunchStatus('Arcade mode is locked for V1. Survivor is the active release path.');
  initAudio();
  startMusic();
  updateMenuHighscores();
});
const _pauseRangeBtn = document.getElementById('btn-range-pause');
if (_pauseRangeBtn) _pauseRangeBtn.addEventListener('click', () => { if (typeof showBulletPreview === 'function') showBulletPreview(); });
const _mainRangeBtn = document.getElementById('btn-range-main');
if (_mainRangeBtn) _mainRangeBtn.addEventListener('click', () => { if (typeof showBulletPreview === 'function') showBulletPreview(); });
// Stage map buttons
document.getElementById('btn-stagemap').addEventListener('click', () => {
  document.getElementById('pause-menu').classList.add('h');
  showStageMap(() => {
    // Return to pause menu
    document.getElementById('pause-menu').classList.remove('h');
  });
});
document.getElementById('stage-map-close').addEventListener('click', function () {
  // Apply selected stage before closing
  if (_stageMapSelected >= 0 && _stageMapSelected !== G.stage) {
    G.stage = _stageMapSelected;
    G.wave = _stageMapSelected * WAVES_PER_STAGE;
  }
  hideStageMap();
});

// Leaderboard
document.getElementById('btn-leaderboard').addEventListener('click', () => Leaderboard.open());
document.getElementById('btn-lb-back').addEventListener('click', () => Leaderboard.close());
document.querySelectorAll('.lb-tab').forEach(tab => {
  tab.addEventListener('click', () => Leaderboard.switchTab(tab.dataset.period));
});

// Initialize highscores on load
setTimeout(updateMenuHighscores, 100);

(function initMenuBG() {
  const mc = document.getElementById('menu-bg');
  const lbC = document.getElementById('lb-bg');
  if (!mc) return;
  mc.width = 1000; mc.height = 700;
  if (lbC) { lbC.width = 1000; lbC.height = 700; }
  const mx = mc.getContext('2d');
  const lbX = lbC ? lbC.getContext('2d') : null;

  const tickers = ['BTC', 'ETH', 'HYPE', 'SOL', 'DOGE', 'PEPE', 'ARB', 'OP', 'AVAX', 'MATIC', 'LINK', 'UNI', 'AAVE', 'CRV', 'SNX'];
  const columns = [];
  const colW = 65;
  const numCols = Math.ceil(1000 / colW);

  for (let i = 0; i < numCols; i++) {
    const items = [];
    const numItems = 8 + Math.floor(Math.random() * 6);
    for (let j = 0; j < numItems; j++) {
      items.push({
        y: j * 55 - Math.random() * 700,
        ticker: tickers[Math.floor(Math.random() * tickers.length)],
        price: (Math.random() * 50000).toFixed(Math.random() > 0.5 ? 2 : 0),
        isGreen: Math.random() > 0.45,
        change: ((Math.random() * 30) - 8).toFixed(1),
        speed: 0.3 + Math.random() * 0.5,
        alpha: 0.25 + Math.random() * 0.25,
      });
    }
    columns.push({ x: i * colW + Math.random() * 10, items });
  }



  function animateMenu() {
    const isLbOpen = !document.getElementById('lb').classList.contains('h');
    const isMainOpen = !document.getElementById('mm').classList.contains('h');

    if (G.phase !== 'menu' && !isLbOpen) {
      setTimeout(animateMenu, 500);
      return;
    }

    // Determine active context based on which menu is visible
    const activeCtx = isLbOpen && lbX ? lbX : mx;
    activeCtx.clearRect(0, 0, 1000, 700);


    // Draw falling ticker columns
    activeCtx.font = '600 9px "JetBrains Mono", monospace';
    for (const col of columns) {
      for (const item of col.items) {
        activeCtx.globalAlpha = item.alpha;
        activeCtx.fillStyle = item.isGreen ? '#00ff88' : '#ff4757';
        activeCtx.fillText(item.ticker, col.x, item.y);
        activeCtx.fillStyle = '#555';
        activeCtx.fillText('$' + item.price, col.x, item.y + 11);
        activeCtx.fillStyle = item.isGreen ? '#00ff88' : '#ff4757';
        activeCtx.fillText((item.isGreen ? '+' : '') + item.change + '%', col.x, item.y + 22);

        item.y += item.speed;
        if (item.y > 730) {
          item.y = -50;
          item.ticker = tickers[Math.floor(Math.random() * tickers.length)];
          item.price = (Math.random() * 50000).toFixed(Math.random() > 0.5 ? 2 : 0);
          item.isGreen = Math.random() > 0.45;
          item.change = ((Math.random() * 30) - 8).toFixed(1);
        }
      }
    }

    activeCtx.globalAlpha = 1;

    // Grid lines
    activeCtx.strokeStyle = 'rgba(80, 227, 194, 0.06)';
    activeCtx.lineWidth = 1;
    for (let y = 0; y < 700; y += 50) { activeCtx.beginPath(); activeCtx.moveTo(0, y); activeCtx.lineTo(1000, y); activeCtx.stroke(); }
    for (let x = 0; x < 1000; x += 50) { activeCtx.beginPath(); activeCtx.moveTo(x, 0); activeCtx.lineTo(x, 700); activeCtx.stroke(); }

    requestAnimationFrame(animateMenu);
  }

  animateMenu();
})();

// ============ FLOATING PARTICLES (Menu Background) ============
(function initMenuParticles() {
  const container = document.getElementById('menu-particles');
  if (!container) return;

  const PARTICLE_COUNT = 25;
  const particles = [];
  const colors = [
    'rgba(0, 255, 204, 0.6)',    // cyan
    'rgba(124, 77, 255, 0.5)',   // purple
    'rgba(80, 227, 194, 0.5)',   // green
    'rgba(0, 210, 255, 0.4)',    // blue
    'rgba(255, 0, 110, 0.3)',    // pink
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const el = document.createElement('div');
    const size = 2 + Math.random() * 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    el.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      box-shadow: 0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color};
      pointer-events: none;
      will-change: transform, opacity;
    `;
    container.appendChild(el);
    particles.push({
      el,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.015,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
    });
  }

  let t = 0;
  function animateParticles() {
    t += 0.016;
    // Only animate when menu is visible
    const mm = document.getElementById('mm');
    if (!mm || mm.classList.contains('h')) {
      requestAnimationFrame(animateParticles);
      return;
    }

    for (const p of particles) {
      p.x += p.vx * p.speed;
      p.y += p.vy * p.speed;

      // Subtle wave motion
      p.x += Math.sin(t * 0.5 + p.phase) * 0.008;
      p.y += Math.cos(t * 0.3 + p.phase) * 0.006;

      // Wrap around edges
      if (p.x < -2) p.x = 102;
      if (p.x > 102) p.x = -2;
      if (p.y < -2) p.y = 102;
      if (p.y > 102) p.y = -2;

      const alpha = 0.3 + Math.sin(t * 1.5 + p.phase) * 0.3;
      p.el.style.left = p.x + '%';
      p.el.style.top = p.y + '%';
      p.el.style.opacity = Math.max(0.1, alpha);
    }

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
})();
