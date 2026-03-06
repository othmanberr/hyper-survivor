// ============ CORE GAME FILE ============
console.log("GAME.JS LOADED");
// Note: Global state (G, P, WEAPONS, etc.), utilities, UI, Input, Combat, and Shop
// are now managed in their respective modules and loaded via index.html.parate <script> tags

console.log("GAME.JS LINE 6 REACHED");

// ============ PAUSE SYSTEM ============
function togglePause() {
  if (G.phase !== 'wave' && G.phase !== 'paused' && G.phase !== 'boss' && G.phase !== 'milestone') return;
  if (G.phase === 'paused') {
    resumeGame();
  } else {
    G.prevPhase = G.phase;
    G.phase = 'paused';
    // Populate weapon display
    const pw = document.getElementById('pause-weapons');
    pw.innerHTML = P.weapons.map(w => {
      const def = WEAPONS[w.id];
      return `<div class="pause-wep"><div class="pause-wep-icon">${def.icon}</div><div class="pause-wep-lvl">Lv${w.level}</div><div class="pause-wep-info">${def.name}</div></div>`;
    }).join('');
    // Populate pause stats
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
    // Show/hide MAP button based on game mode
    const mapBtn = document.getElementById('btn-stagemap');
    if (mapBtn) mapBtn.style.display = G.mode === 'adventure' ? '' : 'none';
    document.getElementById('pause-menu').classList.remove('h');
  }
}

function pauseGame() {
  G.prevPhase = G.phase;
  G.phase = 'paused';
  // Populate weapon display
  const pw = document.getElementById('pause-weapons');
  pw.innerHTML = P.weapons.map(w => {
    const def = WEAPONS[w.id];
    return `<div class="pause-wep"><div class="pause-wep-icon">${def.icon}</div><div class="pause-wep-lvl">Lv${w.level}</div><div class="pause-wep-info">${def.name}</div></div>`;
  }).join('');
  // Populate pause stats
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
  // Show/hide MAP button based on game mode
  const mapBtn = document.getElementById('btn-stagemap');
  if (mapBtn) mapBtn.style.display = G.mode === 'adventure' ? '' : 'none';
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
  gold: document.getElementById('gold'),
  bossBarFill: document.getElementById('boss-bar-fill'),
  bossBarHp: document.getElementById('boss-bar-hp'),
  xpb: document.getElementById('xpb'),
};
let lastT = 0, orbAng = 0;

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

const ENEMY_STATS = [
  { hp: 15, dmg: 5, spd: 1.3, sz: 10, gold: 3, xp: 2 },    // 0: FUD Bot
  { hp: 40, dmg: 12, spd: 1.0, sz: 14, gold: 6, xp: 4 },    // 1: Jeet
  { hp: 60, dmg: 18, spd: 1.6, sz: 12, gold: 10, xp: 6 },   // 2: Whale
  { hp: 100, dmg: 25, spd: 1.3, sz: 16, gold: 15, xp: 10 },  // 3: MEV Bot
  { hp: 30, dmg: 20, spd: 0.8, sz: 10, gold: 8, xp: 5 },    // 4: Sniper
  { hp: 50, dmg: 30, spd: 1.4, sz: 14, gold: 12, xp: 7 },   // 5: Bomber
  { hp: 80, dmg: 8, spd: 1.0, sz: 14, gold: 10, xp: 8 },    // 6: Shield Drone
  { hp: 120, dmg: 15, spd: 2.0, sz: 12, gold: 15, xp: 12 }   // 7: Glitch
];





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

function showMilestone(text) {
  const el = document.getElementById('milestone-banner');
  el.classList.remove('h');
  el.innerHTML = `<div class="milestone-text">${text}</div>`;
  setTimeout(() => el.classList.add('h'), 1500);
}

// ============ MAP BUILDING ZONES ============
// Buildings on all edges — enemies and player can't go there
const BUILDING_LEFT = WORLD_W * 0.22;   // left building boundary
const BUILDING_RIGHT = WORLD_W * 0.78;  // right building boundary
const BUILDING_TOP = WORLD_H * 0.12;    // top building boundary
const BUILDING_BOTTOM = WORLD_H * 0.88; // bottom building boundary

// ============ CONTINUOUS ENEMY SPAWNING ============
function spawnContinuous(dt) {
  G.spawnCd -= dt;
  if (G.spawnCd > 0) return;
  if (enemies.count >= MAX_ENEMIES) return; // prevent unbounded growth

  const diff = getDifficulty(G.wave);
  G.spawnCd = diff.spawnRate;

  const room = MAX_ENEMIES - enemies.count;
  const batch = Math.min(diff.batchSize, room);
  for (let i = 0; i < batch; i++) {
    // Spawn from TOP or BOTTOM roads only
    const fromTop = Math.random() > 0.5;
    const x = BUILDING_LEFT + Math.random() * (BUILDING_RIGHT - BUILDING_LEFT);
    const y = fromTop ? -30 - Math.random() * 80 : WORLD_H + 30 + Math.random() * 80;
    const type = Math.min(diff.maxType, Math.floor(Math.random() * (diff.maxType + 1)));

    // Elite enemy chance — from wave 5+, 8% chance
    const isElite = G.wave >= 5 && Math.random() < 0.08;
    if (isElite) {
      spawnEnemy(type, x, y, { isElite: true, hp: ENEMY_STATS[type].hp * 3, dmg: ENEMY_STATS[type].dmg * 2, gold: ENEMY_STATS[type].gold * 3, xp: ENEMY_STATS[type].xp * 3, sz: ENEMY_STATS[type].sz * 1.3 });
    } else {
      spawnEnemy(type, x, y);
    }
  }
}

// ============ SHIELD DRONE AURA ============
// Handled in combat.js

// ============ ENEMY BEHAVIORS ============
// Handled in combat.js




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

// ============ GAME FLOW ============
function startGame(mode) {
  console.log("START GAME CALLED WITH MODE:", mode);
  G.mode = mode || 'arcade';
  G.stage = 0;
  initAudio();
  // Start radio instead of procedural music
  if (!radioActive) startRadio();
  showRadioWidget();
  // Clean up previous game UI effects
  document.getElementById('gm').classList.remove('dramatic');
  document.getElementById('vm').classList.remove('spectacular');
  document.querySelectorAll('.confetti-particle').forEach(e => e.remove());
  clearDamageFlash();
  G.wave = 0; G.gold = 30; G.kills = 0; G.phase = 'wave'; G.prevPhase = null;
  G.boss = null; G.bossKey = null; G.freezeTime = 0; G.totalTime = 0; G.combo = 0; G.comboTimer = 0; G.maxCombo = 0; G.spawnCd = 0;
  G.waveIntroTime = 0; G.pendingLevelUps = 0;
  // Reset tracking stats
  G.totalDmgDealt = 0; G.totalDmgTaken = 0; G.totalGoldEarned = 0; G.bossesKilled = 0;
  G.dpsHistory = []; G.dpsAccum = 0; G.dpsTimer = 0; G.currentDPS = 0; G.lastMilestone = 0;
  G.maxStageReached = 0;
  P.x = WORLD_W / 2; P.y = WORLD_H / 2; P.hp = 100; P.maxHp = 100; P.spd = 200; P.armor = 0; P.crit = 5;
  P.xp = 0; P.xpNext = 50; P.level = 1; P.weapons = [{ id: 'pistol', level: 1, cd: 0 }];
  P._turrets = []; P._swingAngle = 0; P._orbitalDetachCd = 0;
  P.iframes = 0; P.dmgMult = 1; P.cdMult = 1; P.magnetRange = 100;
  P.leverage = 1; P.leverageIdx = 0; P.dashCd = 0; P.dashTimer = 0; P.dashing = false; P.animTimer = 0;
  P.vx = 0; P.vy = 0;
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
  G.spawnCd = 1;

  // Show wave intro banner
  G.phase = 'waveIntro';
  G.waveIntroTime = 2.0;
  document.getElementById('boss-bar').classList.add('h');
}

function nextWaveAfterBoss() {
  console.log('[BOSS] nextWaveAfterBoss called, mode:', G.mode, 'wave:', G.wave);
  const goldReward = 40 + G.wave * 10;
  G.gold += goldReward;
  G.totalGoldEarned += goldReward;
  G.bossesKilled++;
  triggerShake(15, 0.5);
  triggerSlowmo(0.15, 0.8);
  fxBossDeath(G.boss.x, G.boss.y);
  playSound('bossDeath');

  showWaveClearBanner();

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

function showWaveClearBanner() {
  const gc = document.getElementById('gc');
  const banner = document.createElement('div');
  banner.className = 'stage-clear-banner';
  const stageNum = Math.floor(G.wave / WAVES_PER_STAGE);
  const subText = G.mode === 'adventure' ? `STAGE ${stageNum} COMPLETE` : `WAVE ${G.wave} COMPLETE`;
  banner.innerHTML = `
    <div class="stage-clear-text">BOSS DEFEATED</div>
    <div class="stage-clear-sub">${subText}</div>
  `;
  gc.appendChild(banner);
  setTimeout(() => banner.remove(), 1800);
}

// ============ MAIN LOOP ============
window.onerror = function (m, s, l, c, e) { console.error("CRASH", m, e) };

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

  // Leverage input
  if (inp.levUp && P.leverageIdx < LEVERAGE_STEPS.length - 1) { P.leverageIdx++; P.leverage = LEVERAGE_STEPS[P.leverageIdx]; inp.levUp = 0; }
  if (inp.levDown && P.leverageIdx > 0) { P.leverageIdx--; P.leverage = LEVERAGE_STEPS[P.leverageIdx]; inp.levDown = 0; }

  if (G.freezeTime > 0) { G.freezeTime -= dt; render(); updateHUD(); requestAnimationFrame(loop); return; }

  // ---- WAVE INTRO PHASE ----
  if (G.phase === 'waveIntro') {
    G.waveIntroTime -= dt;
    if (G.waveIntroTime <= 0) {
      G.phase = 'wave';
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
      // Wave ended — mode-specific transitions
      if (G.mode === 'arcade') {
        // Arcade: 100 waves, no bosses, victory at 100
        if (G.wave >= 100) {
          victory();
        } else {
          startNextWave();
        }
      } else {
        // Adventure: boss every 5 waves (end of stage)
        if (G.wave % WAVES_PER_STAGE === 0) {
          startBossIntro();
        } else {
          startNextWave();
        }
      }
      render(); updateHUD(); requestAnimationFrame(loop); return;
    }
  }

  // ---- BOSS PHASE ----
  if (G.phase === 'boss' && G.boss) {
    G.boss.update(dt);
    DOM.bossBarFill.style.width = `${Math.max(0, G.boss.hp / G.boss.maxHp * 100)}%`;
    DOM.bossBarHp.textContent = `${Math.max(0, Math.ceil(G.boss.hp))} / ${Math.ceil(G.boss.maxHp)}`;
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

  // Instant aim snap to target (no slow interpolation)
  if (_nearest) {
    P.angle = targetAngle;
  } else {
    let angleDiff = targetAngle - P.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    P.angle += angleDiff * Math.min(1, dt * 15);
  }

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
    const maxSpeed = P.spd;
    const currentSpeed = Math.hypot(P.vx, P.vy);
    if (currentSpeed > maxSpeed) {
      P.vx = (P.vx / currentSpeed) * maxSpeed;
      P.vy = (P.vy / currentSpeed) * maxSpeed;
    }
  }

  // Apply velocity to position
  P.x += P.vx * dt;
  P.y += P.vy * dt;

  // Clamp to playable area (between buildings)
  if (P.x < BUILDING_LEFT + P.sz) { P.x = BUILDING_LEFT + P.sz; P.vx *= -0.5; }
  else if (P.x > BUILDING_RIGHT - P.sz) { P.x = BUILDING_RIGHT - P.sz; P.vx *= -0.5; }

  if (P.y < BUILDING_TOP + P.sz) { P.y = BUILDING_TOP + P.sz; P.vy *= -0.5; }
  else if (P.y > BUILDING_BOTTOM - P.sz) { P.y = BUILDING_BOTTOM - P.sz; P.vy *= -0.5; }

  if (P.iframes > 0) P.iframes -= dt; if (P.flash > 0) P.flash -= dt; orbAng += dt * 2.5;

  // Update camera
  updateCamera(dt);

  // ---- ENEMY UPDATE ----
  hash.clear();
  _frameNearest = null; _frameNearestDistSq = Infinity;
  _shieldDrones.length = 0;
  enemies.each(e => {
    // Cache shield drones for O(1) lookup in hasShieldAura()
    if (e.type === 6 && !e.dying) _shieldDrones.push(e);
    // Update animation for all enemies (including dying)
    updateEnemyAnim(e, dt);
    // Track facing direction
    const fdx = P.x - e.x;
    if (Math.abs(fdx) > 2) e.faceX = fdx > 0 ? 1 : -1;

    if (e.dying) return; // dying enemies: render only, no behavior/collision

    updateEnemyBehavior(e, dt);

    // Clamp to playable area (between buildings)
    e.x = Math.max(BUILDING_LEFT + 10, Math.min(BUILDING_RIGHT - 10, e.x));
    e.y = Math.max(BUILDING_TOP + 10, Math.min(BUILDING_BOTTOM - 10, e.y));

    e.x += e.kbX * dt * 60; e.y += e.kbY * dt * 60;
    e.kbX *= 0.9; e.kbY *= 0.9;
    if (e.flash > 0) e.flash -= dt;
    hash.add(e);
    const dsSq = (P.x - e.x) ** 2 + (P.y - e.y) ** 2;
    if (dsSq < _frameNearestDistSq) { _frameNearestDistSq = dsSq; _frameNearest = e; }
    const ds = Math.sqrt(dsSq);
    if (P.iframes <= 0 && ds < e.sz + P.sz) hitPlayer(e.dmg);
  });
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

    const def = WEAPONS[w.id];
    if (!def) continue;

    const isCrit = Math.random() * 100 < P.crit;
    const dmg = def.dmg * (1 + w.level * 0.2) * P.dmgMult * levStats.dmgMult * (isCrit ? 2 : 1);
    w.cd = def.cd * P.cdMult;
    // Get muzzle offset so bullets come from the weapon on the arc mounting
    const muzzle = getWeaponMuzzleOffsetByIndex(weaponIndex, P.weapons.length);
    const mx = P.x + muzzle.x, my = P.y + muzzle.y;

    // Aim from muzzle position directly at nearest enemy for perfect accuracy
    let ang = _wNearest ? Math.atan2(_wNearest.y - my, _wNearest.x - mx) : P.angle;

    // Trigger shoot animation
    if (weaponIndex === 0) jeffShootReaction();

    // Helper: hit enemy with damage
    const _hitEnemy = (e, d, kb) => {
      const ds = Math.hypot(e.x - P.x, e.y - P.y) || 1;
      if (e.dying) return; // skip dying enemies
      e.hp -= d; G.totalDmgDealt += d; e.flash = 0.08;
      if (!e.dying) setAnim(e, 'hit');
      if (kb) { e.kbX += (e.x - P.x) / ds * kb; e.kbY += (e.y - P.y) / ds * kb; }
      degenOnEnemyHit(e.x, e.y - e.sz, isCrit);
      if (isCrit) { fxCritical(e.x, e.y); fxGodCandle(e.x, e.y, d); playSound('critical'); triggerSlowmo(0.3, 0.08); }
      if (e.hp <= 0) { enemyDeath(e); if (def.lifesteal) P.hp = Math.min(P.maxHp, P.hp + def.lifesteal); }
    };

    // ---- PROJECTILE ----
    if (def.type === 'proj') {
      const cnt = def.cnt || 1;
      const spread = def.spread || 0.15;
      playSound('shoot');
      fxMuzzleFlash(mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4, ang);
      for (let i = 0; i < cnt; i++) {
        const a = ang + (i - (cnt - 1) / 2) * spread;
        const p = projs.get(); if (p) {
          p.x = mx; p.y = my; p.vx = Math.cos(a) * def.spd; p.vy = Math.sin(a) * def.spd;
          p.dmg = dmg; p.pierce = def.pierce || 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#00f5ff';
          p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize;
          p._homing = false; p._bounces = 0;
          p._trail = (def.vis === 'bolt'); // Crossbow has persistent trail
          p._explodeArea = 0; p.vis = def.vis; p._ang = a;
        }
      }
      if (def.vis === 'pellet') {
        // Huge shotgun flash
        fxExplosion(mx, my, 25);
        triggerShake(4, 0.15);
      }
    }

    // ---- HOMING ----
    else if (def.type === 'homing') {
      playSound('shoot');
      const p = projs.get(); if (p) { p.x = mx; p.y = my; p.vx = Math.cos(ang) * def.spd; p.vy = Math.sin(ang) * def.spd; p.dmg = dmg; p.pierce = def.pierce || 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#00ddff'; p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize; p._homing = true; p._homingStr = def.homingStr || 5; p._bounces = 0; p._trail = false; p._explodeArea = 0; p.vis = def.vis; p._ang = ang; }
    }

    // ---- NOVA (360 burst) ----
    else if (def.type === 'nova') {
      playSound('shotgun');
      const cnt = def.cnt || 20;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 2;
        const p = projs.get(); if (p) { p.x = mx; p.y = my; p.vx = Math.cos(a) * def.spd; p.vy = Math.sin(a) * def.spd; p.dmg = dmg; p.pierce = def.pierce || 1; p.friendly = true; p.col = isCrit ? '#ffd700' : '#ff4444'; p.hits = new Set(); p.hitCnt = 0; p.active = true; p._size = projSize; p._homing = false; p._bounces = 0; p._trail = false; p._explodeArea = 0; p.vis = def.vis; p._ang = a; }
      }
      triggerShake(3, 0.1);
    }

    // ---- BOUNCE ----
    else if (def.type === 'bounce') {
      playSound('rocket');
      const p = projs.get(); if (p) {
        p.x = mx; p.y = my; p.vx = Math.cos(ang) * def.spd; p.vy = Math.sin(ang) * def.spd;
        p.dmg = dmg; p.pierce = 999; p.friendly = true;
        p.col = isCrit ? '#ffd700' : '#ff8800'; p.hits = new Set(); p.hitCnt = 0; p.active = true;
        p._size = projSize * (def.scale || 1); p._homing = false;
        p._bounces = def.bounces || 3;
        p._trail = true; // Always trail on bounce weapons (like Axe)
        p._explodeArea = def.explodeArea || 0;
        p.vis = def.vis; p._ang = ang;
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
      hash.qry(P.x, P.y, def.area).forEach(e => {
        const ea = Math.atan2(e.y - P.y, e.x - P.x);
        let diff = ea - ang; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < Math.PI * 0.5) _hitEnemy(e, dmg, 4);
      });
      if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - P.x, G.boss.y - P.y) < def.area) { G.totalDmgDealt += dmg; G.boss.hit(dmg); }
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
            h.data = { dmg: dmg, area: def.area || 90, targetY: P.y + (Math.random() - 0.5) * 200, fallSpeed: def.fallSpeed || 500, hit: false };
            h.active = true;
          }
        }, i * 150);
      }
    }

    // ---- AURA (Gas Fee) ----
    else if (def.type === 'aura') {
      // Continuous damage — no projectile
      const area = def.area * (1 + w.level * 0.1);
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
        const offX = (Math.random() - 0.5) * 400, offY = (Math.random() - 0.5) * 400;
        h.type = 'friendlyPuddle'; h.x = P.x + offX; h.y = P.y + offY;
        h.life = def.duration || 5; h.tick = 0;
        h.data = { dmg: dmg, area: def.area || 90, magnet: def.magnet || 0 };
        h.active = true;
      }
      playSound('hit');
    }

    // ---- ORBITAL (Support Drones) ----
    else if (def.type === 'orbital') {
      const orbSpd = def.orbitSpeed || 2;
      const orbRad = def.orbitRadius || 60;
      const cnt = def.cnt || 2;
      P._orbitalAngles = P._orbitalAngles || {};
      if (!P._orbitalAngles[w.id]) P._orbitalAngles[w.id] = 0;
      P._orbitalAngles[w.id] += orbSpd * dt;

      for (let i = 0; i < cnt; i++) {
        const offsetAng = P._orbitalAngles[w.id] + (i / cnt) * Math.PI * 2;
        const px = P.x + Math.cos(offsetAng) * orbRad;
        const py = P.y + Math.sin(offsetAng) * orbRad;

        ctx.save();
        // Laser connection
        ctx.beginPath();
        ctx.moveTo(P.x, P.y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(0, 210, 211, ${0.3 + Math.sin(G.totalTime * 5) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isCrit ? '#ffd700' : '#00d2d3';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(px, py, 6 * projSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Hit enemies
        hash.qry(px, py, 25).forEach(e => {
          if (!w.hits) w.hits = new WeakMap();
          const lastHit = w.hits.get(e) || 0;
          if (G.totalTime - lastHit > 0.5) {
            _hitEnemy(e, dmg, 1);
            w.hits.set(e, G.totalTime);
          }
        });
        if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - px, G.boss.y - py) < G.boss.sz + 15) {
          if (!w.hits) w.hits = new WeakMap();
          const lastHit = w.hits.get(G.boss) || 0;
          if (G.totalTime - lastHit > 0.5) {
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
        else { cur.hp -= chainDmg; G.totalDmgDealt += chainDmg; cur.flash = 0.08; if (cur.hp <= 0) enemyDeath(cur); }
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
        p._homing = false; p._bounces = 0; p._trail = false; p._explodeArea = 0;
      }
      playSound('shoot');
    }
  }
  // Decay chain flash
  for (const turret of P._turrets) { if (turret._chainFlash > 0) turret._chainFlash -= dt; }

  // ---- PROJECTILES ----
  projs.each(p => {
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

    const _px = p.x, _py = p.y; // store previous position
    p.x += p.vx * dt; p.y += p.vy * dt;

    // Sweep check: also check midpoint for fast projectiles to avoid tunneling
    p._prevX = _px; p._prevY = _py;
    p._midX = (_px + p.x) * 0.5; p._midY = (_py + p.y) * 0.5;

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
          const h = hazards.get(); if (h) { h.type = 'fire'; h.x = p.x; h.y = p.y; h.life = 2; h.tick = 0; h.active = true; }
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
        const h = hazards.get(); if (h) { h.type = 'fire'; h.x = p.x; h.y = p.y; h.life = 1.5; h.tick = 0; h.active = true; }
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
        addDmgNum({ x: e.x, y: e.y - e.sz, n: Math.round(finalDmg), life: 0.35, col: isCrit ? '#ffd700' : '#fff' });
        if (isCrit) { fxCritical(e.x, e.y); fxGodCandle(e.x, e.y, p.dmg); playSound('critical'); triggerSlowmo(0.3, 0.08); }
        else playSound('hit');
        if (e.hp <= 0) enemyDeath(e);

        if (p._explodeArea > 0) {
          fxExplosion(p.x, p.y, p._explodeArea);
          triggerShake(5, 0.15);
          hash.qry(p.x, p.y, p._explodeArea).forEach(e2 => {
            if (e2 !== e) {
              e2.hp -= p.dmg * 0.5; G.totalDmgDealt += p.dmg * 0.5; e2.flash = 0.08;
              if (e2.hp <= 0) enemyDeath(e2);
            }
          });
          p.active = false;
        }

        if (p.active && ++p.hitCnt >= p.pierce) p.active = false;
      });
      if (G.boss && G.phase === 'boss' && !p.hits.has(G.boss) && Math.hypot(G.boss.x - p.x, G.boss.y - p.y) < G.boss.sz + 10) {
        p.hits.add(G.boss); G.totalDmgDealt += p.dmg; G.boss.hit(p.dmg); if (++p.hitCnt >= p.pierce) p.active = false;
      }
    } else {
      if (Math.hypot(P.x - p.x, P.y - p.y) < P.sz + 8) { hitPlayer(p.dmg); p.active = false; }
    }
  });

  // ---- HAZARDS ----
  hazards.each(h => {
    h.life -= dt; h.tick += dt; if (h.life <= 0) { h.active = false; return; }
    const dx = P.x - h.x, dy = P.y - h.y, ds = Math.hypot(dx, dy);

    // === ENEMY HAZARDS ===
    if (h.type === 'mine' && ds < 40 && h.tick > 0.5) { if (ds < 90) hitPlayer(30 * (1 - ds / 90)); h.active = false; fxExplosion(h.x, h.y, 60); }
    if (h.type === 'fire' && ds < 30) hitPlayer(10 * dt);
    if (h.type === 'meteor') { h.y += 320 * dt; if (h.y > WORLD_H + 50) h.active = false; if (ds < 50) hitPlayer(25); }
    if (h.type === 'godcandle' && Math.abs(P.x - h.x) < 40) hitPlayer(45 * dt);
    if (h.type === 'wall') { const horiz = h.data.horizontal; if (horiz && Math.abs(P.y - h.y) < 20 && P.x > h.x - 200 && P.x < h.x + 200) P.y = h.y + (P.y > h.y ? 25 : -25); if (!horiz && Math.abs(P.x - h.x) < 20 && P.y > h.y - 150 && P.y < h.y + 150) P.x = h.x + (P.x > h.x ? 25 : -25); }
    if (h.type === 'homingform') { const a = Math.atan2(P.y - h.y, P.x - h.x); h.x += Math.cos(a) * 45 * dt; h.y += Math.sin(a) * 45 * dt; if (ds < 30) { hitPlayer(18); h.active = false; } }
    if (h.type === 'laser') { const a = h.data.baseAngle + h.tick * h.data.speed; const lx = Math.cos(a), ly = Math.sin(a); const lt = ((P.x - h.x) * lx + (P.y - h.y) * ly); if (lt > 0) { const px = h.x + lx * lt, py = h.y + ly * lt; if (Math.hypot(P.x - px, P.y - py) < 30) hitPlayer(35 * dt); } }

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
        // Whirlpool magnet effect
        if (h.data.magnet > 0) {
          const ed = Math.hypot(e.x - h.x, e.y - h.y) || 1;
          e.x += (h.x - e.x) / ed * h.data.magnet * dt;
          e.y += (h.y - e.y) / ed * h.data.magnet * dt;
        }
        if (e.hp <= 0) enemyDeath(e);
      });
      if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - h.x, G.boss.y - h.y) < h.data.area) {
        G.totalDmgDealt += h.data.dmg * dt * 0.3; G.boss.hit(h.data.dmg * dt * 0.3);
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
          if (e.hp <= 0) enemyDeath(e);
        });
        if (G.boss && G.phase === 'boss' && Math.hypot(G.boss.x - h.x, G.boss.y - h.data.targetY) < h.data.area) {
          G.totalDmgDealt += h.data.dmg; G.boss.hit(h.data.dmg);
        }
      }
    }
  });

  // ---- PICKUPS ----
  pickups.each(pk => {
    const dx = P.x - pk.x, dy = P.y - pk.y, ds = Math.hypot(dx, dy);
    // Hearts: no magnet, walk-over pickup at 30px, only if not full HP
    if (pk.type === 'heart') {
      if (ds < 30 && P.hp < P.maxHp) {
        pk.active = false;
        fxPickup(pk.x, pk.y, pk.type);
        playSound('pickup');
        P.hp = Math.min(P.maxHp, P.hp + pk.val);
        addDmgNum({ x: pk.x, y: pk.y - 10, n: '+' + pk.val, life: 0.6, col: '#55efc4' });
      }
      return;
    }
    if (ds < P.magnetRange) pk.mag = true;
    if (pk.mag) {
      pk.x += dx / ds * 450 * dt; pk.y += dy / ds * 450 * dt;
      if (ds < 20) {
        pk.active = false;
        fxPickup(pk.x, pk.y, pk.type);
        playSound('pickup');
        if (pk.type === 'gold') { G.gold += pk.val; G.totalGoldEarned += pk.val; }
        else if (pk.type === 'xp') { addXP(pk.val); }
        else if (pk.type === 'heart') {
          P.hp = Math.min(P.maxHp, P.hp + pk.val);
          addDmgNum({ x: pk.x, y: pk.y - 10, n: '+' + pk.val, life: 0.6, col: '#55efc4' });
        }
      }
    }
  });

  // Damage numbers (only strings like level up / heal now)
  for (let i = dmgNums.length - 1; i >= 0; i--) { dmgNums[i].life -= dt; dmgNums[i].y -= 35 * dt; if (dmgNums[i].life <= 0) { dmgNums[i] = dmgNums[dmgNums.length - 1]; dmgNums.pop(); } }

  updateParticles(dt);

  G.dt = dt;
  render();
  updateHUD();

  // Mid-wave levelups disabled; they happen before shop
  // if (G.pendingLevelUps > 0 && G.phase !== 'levelup') {
  //   processNextLevelUp();
  //   return;
  // }

  requestAnimationFrame(loop);
}

// ============ RENDER ============
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
    if (h.type === 'mine') { ctx.fillStyle = h.tick > 0.5 ? '#ff3333' : '#880000'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 6); }
    if (h.type === 'fire') { ctx.fillStyle = `rgba(255,100,0,${Math.min(0.5, h.life / 2)})`; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill(); }
    if (h.type === 'meteor') { ctx.fillStyle = '#ff3333'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill(); }
    if (h.type === 'godcandle') { ctx.fillStyle = `rgba(0,255,0,${0.3 + Math.sin(h.tick * 15) * 0.15})`; ctx.fillRect(-35, -WORLD_H, 70, WORLD_H * 2); }
    if (h.type === 'wall') { ctx.fillStyle = 'rgba(255,50,50,0.5)'; const w = h.data.horizontal ? 400 : 30, ht = h.data.horizontal ? 30 : 300; ctx.fillRect(-w / 2, -ht / 2, w, ht); }
    if (h.type === 'homingform') { ctx.fillStyle = '#777'; ctx.fillRect(-15, -20, 30, 28); ctx.fillStyle = '#ff0'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('SEC', 0, 0); }
    if (h.type === 'laser') { const a = h.data.baseAngle + h.tick * h.data.speed; ctx.strokeStyle = `rgba(255,215,0,${0.5 + Math.sin(h.tick * 20) * 0.2})`; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 700, Math.sin(a) * 700); ctx.stroke(); }
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
      const alpha = 0.12 + Math.sin(G.totalTime * 3) * 0.05;
      ctx.fillStyle = def.slow ? `rgba(140,0,255,${alpha})` : `rgba(0,255,100,${alpha})`;
      ctx.beginPath(); ctx.arc(0, 0, w._auraRadius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = def.slow ? 'rgba(180,80,255,0.3)' : 'rgba(0,255,100,0.3)';
      ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    // Orbitals
    if (def.type === 'orbital' && w._orbCnt) {
      for (let i = 0; i < w._orbCnt; i++) {
        const a = orbAng * w._orbSpeed + (i / w._orbCnt) * Math.PI * 2;
        const ox = P.x + Math.cos(a) * w._orbRadius;
        const oy = P.y + Math.sin(a) * w._orbRadius;
        if (!isOnScreen(ox, oy, 20)) continue;
        ctx.save(); ctx.translate(ox, oy);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00ddff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
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

  // Pickups
  // Only render hearts (only pickup type on the map)
  pickups.each(pk => {
    if (pk.type !== 'heart') return;
    if (!isOnScreen(pk.x, pk.y, 30)) return;
    ctx.save(); ctx.translate(pk.x, pk.y);
    const t = (G.totalTime * 1.2) % 1;
    let beat = 1;
    if (t < 0.1) beat = 1 + 0.2 * Math.sin(t / 0.1 * Math.PI);
    else if (t > 0.18 && t < 0.28) beat = 1 + 0.12 * Math.sin((t - 0.18) / 0.1 * Math.PI);
    const bob = Math.sin(G.totalTime * 1.5) * 2;
    ctx.translate(0, bob);
    ctx.scale(beat, beat);

    const spr = getHeartSprite();
    ctx.drawImage(spr, -20, -20);
    ctx.restore();
  });

  // Enemies (with culling)
  enemies.each(e => {
    if (!isOnScreen(e.x, e.y, 100)) return;
    // Shield Drone aura circle
    if (e.type === 6 && !e.dying) {
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.strokeStyle = `rgba(0,255,255,${0.15 + Math.sin(G.totalTime * 4) * 0.08})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.save(); ctx.translate(e.x, e.y);
    // Dying enemies fade out
    if (e.dying) {
      const ad = ENEMY_ANIMS[e.type] && ENEMY_ANIMS[e.type].death;
      const progress = ad ? e.animF / Math.max(1, ad.frames.length - 1) : 1;
      ctx.globalAlpha = 1 - progress * 0.6;
    }
    // Elite enemy gold aura
    if (e.isElite) {
      ctx.strokeStyle = `rgba(255,215,0,${0.5 + Math.sin(G.totalTime * 5) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.sz + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.scale(1.3, 1.3);
    }
    // Scale down split glitches
    if (e.isSplit) ctx.scale(0.6, 0.6);
    // Horizontal flip
    if (e.faceX < 0) ctx.scale(-1, 1);
    // Get sprite from animation state
    const animData = ENEMY_ANIMS[e.type];
    let spr = null;
    if (animData) {
      const st = animData[e.anim] || animData.walk;
      if (st && st.frames.length) spr = st.frames[Math.min(e.animF, st.frames.length - 1)];
    }
    if (!spr) { const frames = ENEMY_FRAMES[e.type]; spr = frames ? frames[0] : ENEMY_SPRITES[e.type]; }
    if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    // Flash: redraw sprite in additive mode (replaces expensive ctx.filter)
    if (e.flash > 0 && spr) {
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
    ctx.save(); ctx.translate(p.x, p.y);

    // Adjust rotation for directional projectiles
    if (p.vis === 'spinning_axe' || p.vis === 'lightning_axe') {
      p._spin = (p._spin || 0) + 15 * G.dt;
      ctx.rotate(p._spin);
    } else if (p.vis !== 'plasma_bolt' && p.vis !== 'pellet' && p.vis !== 'fire_pellet' && p.type !== 'orbital') {
      // Anything that is a directed beam/slash/bullet
      p._ang = p._ang !== undefined ? p._ang : Math.atan2(p.vy, p.vx);
      ctx.rotate(p._ang);
    }

    ctx.fillStyle = p.col;
    const sz = p.friendly ? 5 * (p._size || 1) : 7;
    const isCrit = p.col === '#ffd700';

    if (p.vis === 'pistol_bullet' || p.vis === 'smg_bullet') {
      const isPistol = p.vis === 'pistol_bullet';

      // Outer glow trail (no shadowBlur for perf)
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = isPistol ? '#ffaa00' : '#ffcc00';
      ctx.fillRect(-sz * 3.5, -sz * 0.5, sz * 5, sz);
      ctx.globalAlpha = 1;

      // Core metallic tracer line
      ctx.fillStyle = isPistol ? '#ffeecc' : '#ffffff';
      ctx.fillRect(-sz * 3, -sz * 0.2, sz * 4, sz * 0.4);

      // Bright tip (muzzle-facing side)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sz * 1, 0, sz * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.vis === 'pellet' || p.vis === 'fire_pellet') {
      const isFire = p.vis === 'fire_pellet';

      // Motion blur trail (longer and thicker)
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = isCrit ? '#ffd700' : (isFire ? '#ff5500' : '#777777');
      ctx.fillRect(-sz * 2.2, -sz * 0.25, sz * 2.2, sz * 0.5);
      ctx.globalAlpha = 1;

      // Small solid pellet core (larger)
      ctx.fillStyle = isFire ? '#ffcc00' : '#dddddd';
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (p.vis === 'bolt') {
      ctx.fillStyle = isCrit ? '#ffd700' : '#a4b0be';
      ctx.fillRect(-sz * 2, -sz * 0.4, sz * 4, sz * 0.8);
    } else if (p.vis === 'red_slash' || p.vis === 'god_slash') {
      ctx.fillStyle = isCrit ? '#ffd700' : (p.vis === 'god_slash' ? '#00ff44' : '#ff4757');
      ctx.beginPath();
      ctx.arc(0, 0, sz * (p.vis === 'god_slash' ? 3.5 : 2.5), -Math.PI * 0.3, Math.PI * 0.3);
      ctx.lineWidth = sz * (p.vis === 'god_slash' ? 1.5 : 1);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
    } else if (p.vis === 'spinning_axe' || p.vis === 'lightning_axe') {
      const wSprite = typeof WEAPON_SPRITES !== 'undefined' ? (p.vis === 'lightning_axe' ? WEAPON_SPRITES.chainLightning : WEAPON_SPRITES.axe) : null;
      if (wSprite) {
        const scale = 0.55;
        const dw = wSprite.width * scale;
        const dh = wSprite.height * scale;
        ctx.drawImage(wSprite, -dw / 2, -dh / 2, dw, dh);
      } else {
        ctx.font = `${sz * 4}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🪓', 0, 0);
      }
    } else if (p.vis === 'plasma_bolt') {
      ctx.globalCompositeOperation = 'lighter';
      // Outer aura
      ctx.fillStyle = isCrit ? '#ffaa00' : '#9900ff';
      ctx.beginPath(); ctx.arc(0, 0, sz * 2.0, 0, Math.PI * 2); ctx.fill();
      // Mid spark
      ctx.fillStyle = isCrit ? '#ffffaa' : '#dd88ff';
      ctx.beginPath(); ctx.arc(0, 0, sz * 1.2, 0, Math.PI * 2); ctx.fill();
      // Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, sz * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (p.vis === 'railgun_beam') {
      ctx.fillStyle = '#aaddff';
      ctx.fillRect(0, -sz * 0.8, W * 2, sz * 1.6); // Massive beam stretching off screen
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, -sz * 0.3, W * 2, sz * 0.6);
    } else if (p.vis === 'drone_laser') {
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-sz * 1.5, -sz * 0.3, sz * 3, sz * 0.6);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, sz, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });

  // Dash afterimages
  drawAfterimages(ctx);

  // Intensity world effects (trail, aura — behind player)
  renderIntensityWorld(ctx);

  // Player (composited character system)
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
    const totalDur = 2.0;
    const t = 1 - G.waveIntroTime / totalDur; // 0→1 progress
    const fadeIn = Math.min(1, t * 4);      // 0→0.25: fade in
    const fadeOut = Math.min(1, G.waveIntroTime / 0.4); // last 0.4s: fade out
    const alpha = fadeIn * fadeOut;

    ctx.save();

    // Dark overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
    ctx.fillRect(0, 0, W, H);

    // Horizontal lines expanding from center
    const lineExpand = Math.min(1, t * 2.5);
    const lineW = W * 0.7 * lineExpand;
    const lineY1 = H / 2 - 40;
    const lineY2 = H / 2 + 35;

    ctx.globalAlpha = alpha * 0.8;
    const lineGrad = ctx.createLinearGradient(W / 2 - lineW / 2, 0, W / 2 + lineW / 2, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.2, 'rgba(0, 206, 201, 0.8)');
    lineGrad.addColorStop(0.5, 'rgba(255, 215, 0, 1)');
    lineGrad.addColorStop(0.8, 'rgba(0, 206, 201, 0.8)');
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(W / 2 - lineW / 2, lineY1, lineW, 2);
    ctx.fillRect(W / 2 - lineW / 2, lineY2, lineW, 2);

    // Wave number — big, centered
    const wavePulse = 1 + Math.sin(Date.now() * 0.008) * 0.03;
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.font = `900 ${52 * wavePulse}px 'Exo 2'`;
    ctx.fillStyle = '#ffd700';
    if (G.mode === 'adventure') {
      const sn = Math.floor((G.wave - 1) / WAVES_PER_STAGE) + 1;
      const wn = ((G.wave - 1) % WAVES_PER_STAGE) + 1;
      ctx.fillText(`STAGE ${sn} — WAVE ${wn}`, W / 2, H / 2 + 5);
    } else {
      ctx.fillText(`WAVE ${G.wave}/100`, W / 2, H / 2 + 5);
    }

    // Enemy info
    const diff = getDifficulty(G.wave);
    const typeNames = ['FUD Bot', 'Jeet', 'Whale', 'MEV Bot', 'Sniper', 'Bomber', 'Shield Drone', 'Glitch'];
    const maxName = typeNames[diff.maxType] || '???';

    // Slide in from right effect
    const slideIn = Math.min(1, (t - 0.15) * 3);
    if (slideIn > 0) {
      const offsetX = (1 - slideIn) * 100;
      ctx.globalAlpha = alpha * slideIn;
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur = 10;
      ctx.font = "600 13px 'JetBrains Mono'";
      ctx.fillStyle = '#00cec9';
      ctx.fillText(`NEW ENEMY: ${maxName}`, W / 2 + offsetX, H / 2 + 55);

      // Difficulty bar
      const barW = 120;
      const barH = 4;
      const barX = W / 2 - barW / 2 + offsetX;
      const barY = H / 2 + 64;
      const difficulty = Math.min(1, G.wave / 20);

      ctx.globalAlpha = alpha * slideIn * 0.4;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.globalAlpha = alpha * slideIn * 0.9;
      const diffGrad = ctx.createLinearGradient(barX, 0, barX + barW * difficulty, 0);
      diffGrad.addColorStop(0, '#00cec9');
      diffGrad.addColorStop(0.5, '#ffd700');
      diffGrad.addColorStop(1, '#ff4757');
      ctx.fillStyle = diffGrad;
      ctx.fillRect(barX, barY, barW * difficulty, barH);
    }

    ctx.restore();
  }

  // Kills counter (bottom-right)
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = "900 22px 'Exo 2'";
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
  ctx.shadowBlur = 8;
  ctx.fillText(`${G.kills} `, W - 18, H - 30);
  ctx.shadowBlur = 0;
  ctx.font = "700 8px 'JetBrains Mono'";
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText('KILLS', W - 18, H - 16);
  ctx.restore();

  // Enemy Direction Indicators (off-screen arrows)
  if (G.phase === 'wave' || G.phase === 'boss') {
    ctx.save();
    const indicatorDist = 40;
    const arrowSize = 8;
    let count = 0;
    enemies.each(e => {
      if (count >= 8) return; // max 8 indicators
      const sx = e.x - CAM.x;
      const sy = e.y - CAM.y;
      // Only show for off-screen enemies
      if (sx >= -20 && sx <= W + 20 && sy >= -20 && sy <= H + 20) return;
      count++;

      const angle = Math.atan2(sy - H / 2, sx - W / 2);
      // Clamp position to screen edge
      const edgeX = Math.max(indicatorDist, Math.min(W - indicatorDist, W / 2 + Math.cos(angle) * (W / 2 - indicatorDist)));
      const edgeY = Math.max(indicatorDist, Math.min(H - indicatorDist, H / 2 + Math.sin(angle) * (H / 2 - indicatorDist)));

      const dist = Math.hypot(e.x - P.x, e.y - P.y);
      const alpha = Math.max(0.3, Math.min(0.8, 1 - dist / 800));
      const pulse = 0.7 + Math.sin(Date.now() * 0.005 + count) * 0.3;

      ctx.globalAlpha = alpha * pulse;
      ctx.save();
      ctx.translate(edgeX, edgeY);
      ctx.rotate(angle);

      // Red chevron arrow
      ctx.fillStyle = e.type >= 3 ? '#ff4757' : '#ff6b6b';
      ctx.shadowColor = 'rgba(255, 71, 87, 0.6)';
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
    // Continuous subtle shake
    const shakeIntensity = 1 + dangerT * 3;
    triggerShake(shakeIntensity, 0.05);
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

// ============ MINIMAP ============
function drawMinimap(ctx) {
  const size = 160;
  const radius = size / 2;
  const cx = W - radius - 14, cy = 90 + radius;
  const scale = size / WORLD_W;

  ctx.save();
  ctx.globalAlpha = 1;

  // --- Circular clipping ---
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();

  // Background
  ctx.fillStyle = 'rgba(2, 4, 10, 0.85)';
  ctx.fill();

  // Concentric range rings
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.1)';
  ctx.lineWidth = 0.5;
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * r / 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross-hair lines
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.06)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
  ctx.stroke();

  // Radar sweep (rotating gradient cone)
  const sweepAngle = (G.totalTime * 1.2) % (Math.PI * 2);
  const sweepGrad = ctx.createConicalGradient ? null : null; // Fallback: manual arc
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, sweepAngle - 0.4, sweepAngle);
  ctx.closePath();
  ctx.fill();
  // Sweep trail
  ctx.globalAlpha = 0.05;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, sweepAngle - 1.2, sweepAngle - 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Camera viewport rectangle
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  const vpx = cx - radius + CAM.x * scale;
  const vpy = cy - radius + CAM.y * scale;
  ctx.strokeRect(vpx, vpy, W * scale, H * scale);

  // --- Enemies ---
  enemies.each(e => {
    const ex = cx - radius + e.x * scale;
    const ey = cy - radius + e.y * scale;
    const dx = ex - cx, dy = ey - cy;
    if (dx * dx + dy * dy > radius * radius) return; // Outside circle

    // Color-coded by threat
    const distToPlayer = Math.hypot(e.x - P.x, e.y - P.y);
    if (distToPlayer < 200) {
      ctx.fillStyle = '#ff3838'; // Close threat — bright red
    } else if (distToPlayer < 500) {
      ctx.fillStyle = '#ff7675'; // Medium — coral
    } else {
      ctx.fillStyle = '#636e72'; // Far — dim grey
    }
    ctx.fillRect(ex - 1, ey - 1, 2.5, 2.5);
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
  ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Player aim direction indicator
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(playerX, playerY);
  ctx.lineTo(playerX + Math.cos(P.angle) * 12, playerY + Math.sin(P.angle) * 12);
  ctx.stroke();

  // --- Outer ring border ---
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks at cardinal points
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const innerR = i % 2 === 0 ? radius - 6 : radius - 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  ctx.restore();
}


console.log("ADDING LISTENERS");
document.getElementById('btn-arcade').addEventListener('click', () => startGame('arcade'));
document.getElementById('btn-adventure').addEventListener('click', () => startGame('adventure'));

// DEV: Stage select — jump directly to any stage
document.getElementById('dev-stage-select').addEventListener('change', function () {
  const stage = parseInt(this.value);
  if (stage < 1) return;
  this.value = '0';
  devStartAtStage(stage);
});

function devStartAtStage(stage) {
  G.mode = 'adventure';
  G.stage = stage - 1;
  initAudio();
  if (!radioActive) startRadio();
  showRadioWidget();
  document.getElementById('gm').classList.remove('dramatic');
  document.getElementById('vm').classList.remove('spectacular');
  document.querySelectorAll('.confetti-particle').forEach(e => e.remove());
  clearDamageFlash();
  G.wave = (stage - 1) * WAVES_PER_STAGE;
  G.gold = 30 + stage * 50; G.kills = 0; G.phase = 'wave'; G.prevPhase = null;
  G.boss = null; G.bossKey = null; G.freezeTime = 0; G.totalTime = 0; G.combo = 0; G.comboTimer = 0; G.maxCombo = 0; G.spawnCd = 0;
  G.waveIntroTime = 0; G.pendingLevelUps = 0;
  G.totalDmgDealt = 0; G.totalDmgTaken = 0; G.totalGoldEarned = 0; G.bossesKilled = 0;
  G.dpsHistory = []; G.dpsAccum = 0; G.dpsTimer = 0; G.currentDPS = 0; G.lastMilestone = 0;
  G.maxStageReached = stage - 1;
  P.x = WORLD_W / 2; P.y = WORLD_H / 2;
  P.level = 5 + stage * 3; P.maxHp = 100 + stage * 40; P.hp = P.maxHp;
  P.spd = 220 + stage * 10; P.armor = stage; P.crit = 5 + stage * 2;
  P.xp = 0; P.xpNext = 50; P.weapons = [{ id: 'pistol', level: 1, cd: 0 }];
  P._turrets = []; P._swingAngle = 0; P._orbitalDetachCd = 0;
  P.iframes = 0; P.dmgMult = 1 + stage * 0.1; P.cdMult = 1; P.magnetRange = 100;
  P.leverage = 1; P.leverageIdx = 0; P.dashCd = 0; P.dashTimer = 0; P.dashing = false; P.animTimer = 0;
  P.vx = 0; P.vy = 0;
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
document.getElementById('btn-next-stage').addEventListener('click', () => {
  if (G.shopMode === 'persistent') {
    closePersistentShop();
  } else {
    document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
    startNextWave();
  }
});
document.getElementById('btn-retry').addEventListener('click', () => startGame(G.mode));
document.getElementById('btn-menu').addEventListener('click', () => { stopMusic(); document.querySelectorAll('.mo').forEach(m => m.classList.add('h')); document.getElementById('mm').classList.remove('h'); updateMenuHighscores(); });
document.getElementById('btn-vmenu').addEventListener('click', () => { document.querySelectorAll('.mo').forEach(m => m.classList.add('h')); document.getElementById('mm').classList.remove('h'); updateMenuHighscores(); });
// Pause menu buttons
document.getElementById('btn-resume').addEventListener('click', resumeGame);
document.getElementById('btn-quit').addEventListener('click', () => { stopMusic(); G.phase = 'menu'; G.prevPhase = null; document.querySelectorAll('.mo').forEach(m => m.classList.add('h')); document.getElementById('mm').classList.remove('h'); updateMenuHighscores(); });
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
