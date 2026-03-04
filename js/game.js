// Patch arc() to prevent negative radius crashes
const _origArc = CanvasRenderingContext2D.prototype.arc;
CanvasRenderingContext2D.prototype.arc = function (x, y, r, s, e, ccw) {
  return _origArc.call(this, x, y, Math.max(0, r), s, e, ccw);
};
// ============ GAME DATA ============
// Boss order for cycling every 10 waves
const BOSS_ORDER = ['loudmouth', 'hashbeast', 'spiralking', 'northstar', 'unbanker', 'vultures', 'prophet', 'mathsorcerer', 'guardian', 'emperor'];
const WAVES_PER_STAGE = 2; // Normal: 5, set to 2 for testing

// Wave duration per mode
function WAVE_DURATION(wave) {
  if (G.mode === 'arcade') return Math.min(20 + wave * 0.8, 45);
  return Math.min(15 + wave * 1.5, 60);
}

// Difficulty scaling per wave per mode
function getDifficulty(wave) {
  if (G.mode === 'arcade') {
    return {
      hpMult: 1 + wave * 0.12,
      spdMult: 1 + wave * 0.015,
      spawnRate: Math.max(0.08, 0.8 - wave * 0.007),
      batchSize: 2 + Math.floor(wave * 0.5),
      maxType: Math.min(7, Math.floor(wave / 5))
    };
  }
  return {
    hpMult: 1 + wave * 0.08,
    spdMult: 1 + wave * 0.02,
    spawnRate: Math.max(0.15, 0.8 - wave * 0.03),
    batchSize: 2 + Math.floor(wave * 0.4),
    maxType: Math.min(7, Math.floor(wave / 3))
  };
}

const BOSSES = {
  loudmouth: { name: 'THE LOUD MOUTH', sub: 'Richard Heart', hp: 500, spd: 1.0, sz: 40, attacks: ['pulse', 'mines'] },
  hashbeast: { name: 'THE HASH BEAST', sub: 'Jihan Wu', hp: 700, spd: 0.9, sz: 42, attacks: ['firetrail', 'spray'] },
  spiralking: { name: 'THE SPIRAL KING', sub: 'Do Kwon', hp: 900, spd: 1.2, sz: 38, attacks: ['gravity', 'meteors'] },
  northstar: { name: 'THE NORTH STAR', sub: 'Lazarus Group', hp: 800, spd: 1.8, sz: 35, attacks: ['teleport', 'codeline'] },
  unbanker: { name: 'THE UNBANKER', sub: 'Alex Mashinsky', hp: 1000, spd: 1.0, sz: 40, attacks: ['freeze', 'drain'] },
  vultures: { name: 'THE VULTURE TWINS', sub: 'Su & Kyle', hp: 1200, spd: 1.4, sz: 45, attacks: ['dive', 'arrowrain'] },
  prophet: { name: 'THE PROPHET', sub: 'Murad', hp: 1400, spd: 1.1, sz: 38, attacks: ['godcandle', 'laserbeam'] },
  mathsorcerer: { name: 'THE MATH SORCERER', sub: 'SBF', hp: 1600, spd: 1.3, sz: 42, attacks: ['clones', 'bullethell'] },
  guardian: { name: 'THE GREY GUARDIAN', sub: 'Gary Gensler', hp: 1800, spd: 0.6, sz: 48, attacks: ['walls', 'homingforms'] },
  emperor: { name: 'THE IRON EMPEROR', sub: 'CZ', hp: 2500, spd: 0.9, sz: 55, attacks: ['rotating4', 'dragonfire', 'summon'] }
};

// WEAPONS, UPGRADES, HEALS defined in weapons.js

// ============ LEVERAGE SYSTEM ============
const LEVERAGE_STEPS = [1, 2, 3, 5, 10, 15, 20, 25, 50];

function getLeverageStats(lev) {
  return {
    dmgMult: lev,                        // Direct: BaseDmg * Leverage
    recvMult: lev,                       // Direct: BaseEnemyDmg * Leverage
    sizeMult: 1 + (lev - 1) * 0.04      // Subtle size: 1x at 1, ~3x at 50
  };
}

// ============ GAME STATE ============
// Phases: menu, waveIntro, wave, bossIntro, boss, shop, transition, paused, gameover, levelup
const G = {
  mode: 'arcade', stage: 0,
  wave: 0, waveTime: 0, waveMaxTime: 0, phase: 'menu', prevPhase: null,
  gold: 0, kills: 0, boss: null, bossKey: null, freezeTime: 0, totalTime: 0, shopMode: 'wave',
  combo: 0, comboTimer: 0, maxCombo: 0, spawnCd: 0, bossIntroTime: 0,
  waveIntroTime: 0,
  // Tracking stats
  totalDmgDealt: 0, totalDmgTaken: 0, totalGoldEarned: 0, bossesKilled: 0,
  dpsHistory: [], dpsAccum: 0, dpsTimer: 0, currentDPS: 0,
  lastMilestone: 0,
  pendingLevelUps: 0  // Queue of level-ups waiting to be shown
};
const P = {
  x: WORLD_W / 2, y: WORLD_H / 2, sz: 12, hp: 100, maxHp: 100, spd: 200, armor: 0, crit: 5,
  xp: 0, xpNext: 50, level: 1, weapons: [], maxWeapons: 5, iframes: 0, flash: 0, angle: 0,
  dmgMult: 1, cdMult: 1, magnetRange: 100,
  leverage: 1, leverageIdx: 0,
  dashCd: 0, dashTimer: 0, dashing: false, dashDir: { x: 0, y: 0 },
  animTimer: 0,
  vx: 0, vy: 0
};

// ============ POOLS ============
const MAX_ENEMIES = 150;
const MAX_PROJECTILES = 300;
const MAX_DMG_NUMS = 80;

class Pool {
  constructor(f, n, max) { n = n || 200; this.max = max || Infinity; this.items = []; for (let i = 0; i < n; i++) { const o = f(); o.active = false; this.items.push(o); } }
  get() { if (this.max !== Infinity && this.count >= this.max) return null; for (const o of this.items) if (!o.active) { o.active = true; return o; } const o = { ...this.items[0], active: true }; this.items.push(o); return o; }
  each(f) { for (const o of this.items) if (o.active) f(o); }
  clear() { for (const o of this.items) o.active = false; }
  get count() { let c = 0; for (const o of this.items) if (o.active) c++; return c; }
}

const enemies = new Pool(() => ({ active: false, x: 0, y: 0, hp: 0, maxHp: 0, dmg: 0, spd: 0, sz: 0, type: 0, gold: 0, xp: 0, kbX: 0, kbY: 0, flash: 0, behaviorTimer: 0, behaviorState: 0, isSplit: false, isElite: false, anim: 'walk', animF: 0, animT: 0, faceX: 1, dying: false }), 500, MAX_ENEMIES);
const projs = new Pool(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 0, pierce: 1, hitCnt: 0, hits: new Set(), friendly: true, col: '#fff' }), 300, MAX_PROJECTILES);
const pickups = new Pool(() => ({ active: false, x: 0, y: 0, type: '', val: 0, mag: false }), 50);
const hazards = new Pool(() => ({ active: false, type: '', x: 0, y: 0, life: 0, tick: 0, data: {} }), 50);
const dmgNums = [];
function addDmgNum(obj) {
  // Disable raw damage numbers for performance, only keep special strings (LVL, Heals, Ult text)
  if (typeof obj.n === 'number' || !isNaN(obj.n)) return;
  if (dmgNums.length < MAX_DMG_NUMS) dmgNums.push(obj);
}

let _frameNearest = null, _frameNearestDistSq = Infinity;

const hash = {
  s: 64, c: new Map(), _buf: [], _arrays: [], _arrayIdx: 0,
  clear() { this.c.clear(); this._arrayIdx = 0; },
  _getArray() {
    if (this._arrayIdx >= this._arrays.length) this._arrays.push([]);
    const arr = this._arrays[this._arrayIdx++];
    arr.length = 0;
    return arr;
  },
  add(e) {
    const k = `${Math.floor(e.x / this.s)},${Math.floor(e.y / this.s)}`;
    let arr = this.c.get(k);
    if (!arr) {
      arr = this._getArray();
      this.c.set(k, arr);
    }
    arr.push(e);
  },
  qry(x, y, r) { const rs = this._buf; rs.length = 0; for (let cx = Math.floor((x - r) / this.s); cx <= Math.floor((x + r) / this.s); cx++) for (let cy = Math.floor((y - r) / this.s); cy <= Math.floor((y + r) / this.s); cy++) { const cl = this.c.get(`${cx},${cy}`); if (cl) for (let i = 0; i < cl.length; i++) { const e = cl[i]; if ((e.x - x) ** 2 + (e.y - y) ** 2 <= r * r) rs.push(e); } } return rs; }
};

// ============ ENEMY ANIMATION STATE MACHINE ============
function setAnim(e, state) {
  if (e.anim === state) return;
  if (e.anim === 'death') return; // death is terminal
  e.anim = state;
  e.animF = 0;
  e.animT = 0;
}

function updateEnemyAnim(e, dt) {
  const ad = ENEMY_ANIMS[e.type];
  if (!ad) return;
  const st = ad[e.anim];
  if (!st || !st.frames.length) return;
  e.animT += dt;
  const frameDur = 1 / st.fps;
  if (e.animT >= frameDur) {
    e.animT -= frameDur;
    e.animF++;
    if (e.animF >= st.frames.length) {
      if (st.loop) {
        e.animF = 0;
      } else if (e.anim === 'death') {
        e.active = false; // death anim finished → remove
        return;
      } else {
        // Non-looping anim finished (attack, hit) → back to walk
        e.anim = 'walk';
        e.animF = 0;
        e.animT = 0;
      }
    }
  }
}

const inp = { l: 0, r: 0, u: 0, d: 0, dash: 0, levUp: 0, levDown: 0 };

// ============ MOUSE MOVEMENT ============
let _mouseDown = false;
let _mouseWorldX = 0, _mouseWorldY = 0;
const _gameCanvas = document.getElementById('cv');
_gameCanvas.addEventListener('mousedown', e => {
  if (e.button === 0) { _mouseDown = true; e.preventDefault(); }
});
_gameCanvas.addEventListener('mouseup', e => {
  if (e.button === 0) _mouseDown = false;
});
_gameCanvas.addEventListener('mouseleave', () => { _mouseDown = false; });
_gameCanvas.addEventListener('mousemove', e => {
  const r = _gameCanvas.getBoundingClientRect();
  _mouseWorldX = (e.clientX - r.left) + CAM.x;
  _mouseWorldY = (e.clientY - r.top) + CAM.y;
});
_gameCanvas.addEventListener('contextmenu', e => e.preventDefault());

onkeydown = e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    if (!document.getElementById('settings-menu').classList.contains('h')) { closeSettings(); return; }
    togglePause(); return;
  }
  if (k === 'b') { if (G.phase === 'shop' && G.shopMode === 'persistent') closePersistentShop(); else openPersistentShop(); return; }
  if (k === 'a' || k === 'arrowleft') inp.l = 1;
  if (k === 'd' || k === 'arrowright') inp.r = 1;
  if (k === 'w' || k === 'arrowup') inp.u = 1;
  if (k === 's' || k === 'arrowdown') inp.d = 1;
  if (k === ' ') { inp.dash = 1; e.preventDefault(); }
  if (k === 'e') inp.levUp = 1;
  if (k === 'q') inp.levDown = 1;
  if (k === 'r') { activateUltimate(); }
  if (k === 't') { toggleRadio(); }
  if (k === ',') { prevStation(); }
  if (k === '.') { nextStation(); }
};
onkeyup = e => {
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'arrowleft') inp.l = 0;
  if (k === 'd' || k === 'arrowright') inp.r = 0;
  if (k === 'w' || k === 'arrowup') inp.u = 0;
  if (k === 's' || k === 'arrowdown') inp.d = 0;
  if (k === ' ') inp.dash = 0;
  if (k === 'e') inp.levUp = 0;
  if (k === 'q') inp.levDown = 0;
};

// ============ TOUCH CONTROLS ============
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
  document.getElementById('mobile-controls').classList.remove('h');

  // Joystick Setup
  const joystickZone = document.getElementById('joystick-zone');
  const joystickBase = document.getElementById('joystick-base');
  const joystickStick = document.getElementById('joystick-stick');

  let joystickActive = false;
  let joystickCenter = { x: 0, y: 0 };
  let joystickId = null;

  joystickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joystickActive) return;

    // Find the touch that started in this zone
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      joystickActive = true;
      joystickId = touch.identifier;

      const rect = joystickZone.getBoundingClientRect();
      // Position base where touched within the zone
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      joystickBase.style.left = `${x - joystickBase.offsetWidth / 2}px`;
      joystickBase.style.top = `${y - joystickBase.offsetHeight / 2}px`;
      joystickBase.style.bottom = 'auto'; // override default bottom
      joystickBase.classList.add('active');

      // The absolute screen pos of the center
      joystickCenter = { x: touch.clientX, y: touch.clientY };
      updateJoystickInput(touch.clientX, touch.clientY);
      break;
    }
  }, { passive: false });

  joystickZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!joystickActive) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickId) {
        updateJoystickInput(touch.clientX, touch.clientY);
        break;
      }
    }
  }, { passive: false });

  const endJoystick = (e) => {
    e.preventDefault();
    if (!joystickActive) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickId) {
        joystickActive = false;
        joystickId = null;
        joystickBase.classList.remove('active');
        joystickStick.style.transform = `translate(0px, 0px)`;
        inp.l = 0; inp.r = 0; inp.u = 0; inp.d = 0;
        break;
      }
    }
  };

  joystickZone.addEventListener('touchend', endJoystick, { passive: false });
  joystickZone.addEventListener('touchcancel', endJoystick, { passive: false });

  function updateJoystickInput(clientX, clientY) {
    const maxDist = joystickBase.offsetWidth / 2;
    let dx = clientX - joystickCenter.x;
    let dy = clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);

    // Visual stick movement capped at base radius
    const stickDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const stickX = Math.cos(angle) * stickDist;
    const stickY = Math.sin(angle) * stickDist;

    joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

    // Deadzone check
    if (dist < 10) {
      inp.l = 0; inp.r = 0; inp.u = 0; inp.d = 0;
      return;
    }

    // Set digital inputs based on angle (8-way movement simulation)
    // You could also convert `inp` to handle analog values if you change movement code
    inp.l = stickX < -maxDist * 0.2 ? 1 : 0;
    inp.r = stickX > maxDist * 0.2 ? 1 : 0;
    inp.u = stickY < -maxDist * 0.2 ? 1 : 0;
    inp.d = stickY > maxDist * 0.2 ? 1 : 0;
  }

  // Action Buttons
  const btnDash = document.getElementById('btn-mobile-dash');
  const btnShop = document.getElementById('btn-mobile-shop');
  const btnUlt = document.getElementById('btn-mobile-ult');

  // Prevent default double-tap zoom
  document.getElementById('action-buttons').addEventListener('touchstart', e => e.preventDefault(), { passive: false });

  // Dash
  btnDash.addEventListener('touchstart', (e) => {
    e.preventDefault();
    btnDash.classList.add('active');
    inp.dash = 1;
  }, { passive: false });
  btnDash.addEventListener('touchend', (e) => {
    e.preventDefault();
    btnDash.classList.remove('active');
    inp.dash = 0;
  }, { passive: false });

  // Shop
  btnShop.addEventListener('touchstart', (e) => {
    e.preventDefault();
    btnShop.classList.add('active');
    if (G.phase === 'shop' && G.shopMode === 'persistent') closePersistentShop();
    else openPersistentShop();
  }, { passive: false });
  btnShop.addEventListener('touchend', (e) => {
    e.preventDefault();
    btnShop.classList.remove('active');
  }, { passive: false });

  // Ultimate
  btnUlt.addEventListener('touchstart', (e) => {
    e.preventDefault();
    btnUlt.classList.add('active');
    activateUltimate();
  }, { passive: false });
  btnUlt.addEventListener('touchend', (e) => {
    e.preventDefault();
    btnUlt.classList.remove('active');
  }, { passive: false });
}

// ============ PAUSE SYSTEM ============
function togglePause() {
  if (G.phase === 'paused') {
    resumeGame();
  } else if (G.phase === 'wave' || G.phase === 'boss' || G.phase === 'bossIntro' || G.phase === 'waveIntro') {
    pauseGame();
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
function hitPlayer(dmg) {
  if (P.iframes > 0 || G.phase === 'gameover' || G.phase === 'victory') return;
  const levStats = getLeverageStats(P.leverage);
  const fd = Math.max(1, (dmg * levStats.recvMult) - P.armor);
  P.hp -= fd; P.iframes = 0.3; P.flash = 0.1;
  G.combo = 0;
  G.totalDmgTaken += fd;
  fxPlayerHit(P.x, P.y);
  playSound('playerHit');
  degenOnPlayerHit(P.x, P.y);
  jeffHitReaction();
  // Damage flash overlay
  triggerDamageFlash(fd, P.hp, P.maxHp);
  if (P.hp <= 0) {
    P.hp = 0;
    gameOver();
  } else {
    triggerShake(6 + P.leverage * 0.2, 0.15);
  }
}

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

function spawnEnemy(type, x, y, opts) {
  opts = opts || {};
  const stats = ENEMY_STATS[type];
  if (!stats) return;
  const diff = getDifficulty(G.wave);
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

function enemyDeath(e) {
  if (e.dying) return; // already dying
  const ex = e.x, ey = e.y, etype = e.type, eSplit = e.isSplit;
  e.dying = true; setAnim(e, 'death'); G.kills++;
  addCombo();
  checkMilestones();
  updateMissions(0);
  const bonusGold = G.combo >= 50 ? 5 : G.combo >= 20 ? 3 : G.combo >= 10 ? 1 : 0;
  const goldMult = getMarketGoldMult();
  // Auto-collect gold & XP directly (no physical pickup clutter)
  const goldVal = Math.round((e.gold + bonusGold) * goldMult);
  G.gold += goldVal; G.totalGoldEarned += goldVal;
  addXP(e.xp);
  // Gold & XP visual effects removed — auto-collected silently
  chargeUltimate(1);
  jeffKillReaction();
  fxEnemyDeath(ex, ey, ENEMY_COLORS[etype] || '#ff3333');
  playSound('enemyDeath');
  degenOnEnemyDeath(ex, ey);

  // Random heart drop (~15% chance)
  if (Math.random() < 0.05) {
    const hpk = pickups.get();
    if (hpk) {
      hpk.active = true; hpk.x = ex + (Math.random() - 0.5) * 20; hpk.y = ey + (Math.random() - 0.5) * 20;
      hpk.type = 'heart'; hpk.val = 15; hpk.mag = false;
    }
  }

  // Bomber: explode on death (AoE damage to player)
  if (etype === 5) {
    fxExplosion(ex, ey, 80);
    if (Math.hypot(P.x - ex, P.y - ey) < 80) hitPlayer(20);
  }

  // Glitch: split into 2 mini-copies (only if not already a split)
  if (etype === 7 && !eSplit) {
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnEnemy(7, ex + Math.cos(a) * 20, ey + Math.sin(a) * 20, { isSplit: true, hp: 60, sz: 8 });
    }
  }
}

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
// Cached shield drone list — rebuilt once per frame in enemy update loop
let _shieldDrones = [];
function hasShieldAura(e) {
  if (e.type === 6) return false;
  for (let i = 0; i < _shieldDrones.length; i++) {
    const d = _shieldDrones[i];
    if ((d.x - e.x) ** 2 + (d.y - e.y) ** 2 < 10000) return true; // 100^2
  }
  return false;
}

// ============ ENEMY BEHAVIORS ============
function updateEnemyBehavior(e, dt) {
  const dx = P.x - e.x, dy = P.y - e.y, ds = Math.hypot(dx, dy);
  const eSpdMult = getMarketEnemySpdMult();
  const edt = dt * eSpdMult;
  e.behaviorTimer -= edt;

  switch (e.type) {
    case 0: // FUD Bot — sinusoidal approach, periodic pulse
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

    case 1: // Jeet — charge then pause
      if (e.behaviorState === 0) {
        // Charging
        if (ds > 1) {
          e.x += (dx / ds) * e.spd * 90 * edt;
          e.y += (dy / ds) * e.spd * 90 * edt;
        }
        if (e.anim !== 'attack' && e.anim !== 'hit') setAnim(e, 'attack');
        if (e.behaviorTimer <= 0) { e.behaviorState = 1; e.behaviorTimer = 0.8; setAnim(e, 'walk'); }
      } else {
        // Paused
        if (e.behaviorTimer <= 0) { e.behaviorState = 0; e.behaviorTimer = 1.5; }
      }
      break;

    case 2: // Whale — slow, tanky, spawns minions occasionally
      if (ds > 1) {
        e.x += (dx / ds) * e.spd * 40 * edt;
        e.y += (dy / ds) * e.spd * 40 * edt;
      }
      if (e.behaviorTimer <= 0) {
        e.behaviorTimer = 4 + Math.random() * 2;
        setAnim(e, 'attack');
        // Spawn 2 small FUD bots around whale
        for (let i = 0; i < 2; i++) {
          const a = Math.random() * Math.PI * 2;
          spawnEnemy(0, e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30);
        }
      }
      break;

    case 3: // MEV Bot — teleport every 2s
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

    case 4: // Sniper — stays at ~300px distance, shoots every 3s
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

    case 5: // Bomber — charges at player, explodes on contact
      if (ds > 1) {
        e.x += (dx / ds) * e.spd * 80 * edt;
        e.y += (dy / ds) * e.spd * 80 * edt;
      }
      if (ds < 80 && e.anim === 'walk') setAnim(e, 'attack');
      // Explode on proximity
      if (ds < 40) {
        fxExplosion(e.x, e.y, 80);
        if (ds < 80) hitPlayer(e.dmg);
        e.hp = 0;
        enemyDeath(e);
      }
      break;

    case 6: // Shield Drone — follows nearest ally, provides damage reduction aura
      {
        // Find nearest non-drone enemy to follow
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
        // Periodic shield pulse
        if (e.behaviorTimer <= 0 && e.anim === 'walk') {
          setAnim(e, 'attack');
          e.behaviorTimer = 4 + Math.random() * 2;
        }
      }
      break;

    case 7: // Glitch — fast approach toward player, periodic corruption burst
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

// ============ SHOP ============
let shopWeapons = [];

function generateFullShop() {
  // Show ALL base weapons (not just unowned)
  shopWeapons = Object.entries(WEAPONS)
    .filter(([id, w]) => !w.isEvolution && w.cost > 0)
    .map(([id, w]) => ({ id, ...w }));
}

function getUpgradeCost(level) { return 50 + level * 30; }
function getSellValue(w) { const def = WEAPONS[w.id]; return Math.floor((def ? def.cost : 50) * 0.5); }

// Weapon stat display for shop
function _weaponStatsHTML(def, level, nextLevel) {
  const dmg = Math.round(def.dmg * (1 + level * 0.2));
  const rate = (1 / def.cd).toFixed(1);
  let html = '';

  // DMG — with upgrade delta if nextLevel provided
  if (nextLevel) {
    const nxtDmg = Math.round(def.dmg * (1 + nextLevel * 0.2));
    html += `<span class="ws ws-dmg">⚔${dmg}→<b>${nxtDmg}</b></span>`;
  } else {
    html += `<span class="ws ws-dmg">⚔${dmg}</span>`;
  }

  // Rate (coups/sec)
  html += `<span class="ws ws-rate">⚡${rate}/s</span>`;

  // Range/portee selon le type
  if (def.area) html += `<span class="ws ws-range">◎${def.area}</span>`;
  else if (def.orbitRadius) html += `<span class="ws ws-range">⟳${def.orbitRadius}</span>`;
  else if (def.spd) html += `<span class="ws ws-range">◎${def.spd}</span>`;

  // Stats speciales
  if (def.pierce && def.pierce > 1) html += `<span class="ws ws-special">↣${def.pierce}</span>`;
  if (def.cnt && def.cnt > 1) html += `<span class="ws ws-special">×${def.cnt}</span>`;
  if (def.bounces) html += `<span class="ws ws-special">↺${def.bounces}</span>`;
  if (def.type === 'homing') html += `<span class="ws ws-special">HOMING</span>`;
  if (def.burnDmg) html += `<span class="ws ws-special">BURN ${def.burnDmg}/s</span>`;

  return html;
}

function makeShopRow(icon, name, desc, costText, isMaxed, isSold, cantAfford, statsHTML) {
  const cls = ['shop-row-item'];
  if (isSold) cls.push('sold');
  if (cantAfford && !isSold) cls.push('cant-afford');
  const div = document.createElement('div');
  div.className = cls.join(' ');
  const statsRow = statsHTML ? `<div class="sri-stats">${statsHTML}</div>` : '';
  div.innerHTML = `<div class="sri-icon">${icon}</div><div class="sri-info"><div class="sri-name">${name}</div><div class="sri-desc">${desc}</div>${statsRow}</div><div class="sri-cost${isMaxed ? ' maxed' : ''}">${costText}</div>`;
  return div;
}

function renderShop() {
  document.getElementById('shop-gold-val').textContent = G.gold;

  // Inventory display with sell buttons
  const inv = document.getElementById('inv'); inv.innerHTML = '';
  P.weapons.forEach((w, idx) => {
    const slot = document.createElement('div');
    slot.className = 'inv-slot filled';
    const def = WEAPONS[w.id];
    if (def) {
      const sellVal = getSellValue(w);
      const canSell = P.weapons.length > 1;
      slot.innerHTML = `<div class="wep-icon">${def.icon}</div><div class="wep-lvl">Lv${w.level}</div>${canSell ? `<div class="inv-sell" title="Sell for ${sellVal} gold">✕</div>` : ''}`;
      if (canSell) {
        slot.querySelector('.inv-sell').onclick = (e) => {
          e.stopPropagation();
          G.gold += sellVal;
          P.weapons.splice(idx, 1);
          playSound('pickup');
          renderShop();
        };
      }
    }
    inv.appendChild(slot);
  });
  for (let i = P.weapons.length; i < P.maxWeapons; i++) {
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    slot.innerHTML = '<div class="wep-icon" style="opacity:0.15">+</div>';
    inv.appendChild(slot);
  }

  // === PLAYER STATS RECAP ===
  const psBar = document.getElementById('player-stats-bar');
  if (psBar) {
    const atkSpd = Math.round(100 / P.cdMult);
    psBar.innerHTML = `
      <div class="ps-stat"><span class="ps-icon">${ICO.hp}</span><span class="ps-val">${Math.ceil(P.hp)}/${P.maxHp}</span><span class="ps-label">HP</span></div>
      <div class="ps-stat"><span class="ps-icon">${ICO.armor}</span><span class="ps-val">${P.armor}</span><span class="ps-label">ARMOR</span></div>
      <div class="ps-stat"><span class="ps-icon">${ICO.speed}</span><span class="ps-val">${P.spd}</span><span class="ps-label">SPEED</span></div>
      <div class="ps-stat"><span class="ps-icon">${ICO.atkspd}</span><span class="ps-val">${atkSpd}%</span><span class="ps-label">ATK SPD</span></div>
      <div class="ps-stat"><span class="ps-icon">${ICO.magnet}</span><span class="ps-val">${P.magnetRange}</span><span class="ps-label">MAGNET</span></div>
    `;
  }

  // === BUY / UPGRADE WEAPONS ===
  const wepsEl = document.getElementById('shop-weps'); wepsEl.innerHTML = '';
  for (const sw of shopWeapons) {
    const owned = P.weapons.find(w => w.id === sw.id);
    const isMax = owned && owned.level >= 8;
    let cost, label, desc, stats;
    if (owned) {
      cost = getUpgradeCost(owned.level);
      label = isMax ? 'MAX ✓' : `${cost} ${ICO.gold}`;
      if (isMax) {
        desc = 'MAX LEVEL';
        stats = _weaponStatsHTML(sw, owned.level);
      } else {
        desc = `Upgrade → Lv${owned.level + 1}`;
        stats = _weaponStatsHTML(sw, owned.level, owned.level + 1);
      }
    } else {
      cost = sw.cost;
      label = `${cost} ${ICO.gold}`;
      desc = sw.desc;
      stats = _weaponStatsHTML(sw, 1);
    }
    const cantAfford = G.gold < cost;
    const nameText = owned ? `${sw.name} Lv${owned.level}` : sw.name;
    const item = makeShopRow(sw.icon, nameText, desc, label, isMax, isMax, cantAfford, stats);
    if (!isMax) {
      item.onclick = () => {
        if (G.gold < cost) return;
        if (owned) {
          // Upgrade existing
          G.gold -= cost;
          owned.level++;
          playSound('pickup');
        } else if (P.weapons.length < P.maxWeapons) {
          // Buy new
          G.gold -= cost;
          P.weapons.push({ id: sw.id, level: 1, cd: 0 });
          playSound('pickup');
        }
        renderShop();
      };
    }
    wepsEl.appendChild(item);
  }

  // === STAT UPGRADES ===
  const upEl = document.getElementById('shop-upgrades'); upEl.innerHTML = '';
  // UX 4: Stat upgrades with current → new preview
  const statPreviews = [
    { cur: () => P.spd, label: 'SPD' },
    { cur: () => P.armor, label: 'ARM' },
    { cur: () => P.crit, label: 'CRIT' },
    { cur: () => `${P.maxHp}`, label: 'HP' },
  ];
  for (let ui = 0; ui < UPGRADES.length; ui++) {
    const up = UPGRADES[ui];
    const sp = statPreviews[ui];
    const cantAfford = G.gold < up.cost;
    const curVal = sp ? sp.cur() : '';
    const descText = sp ? `${up.desc} (${sp.label}: ${curVal})` : up.desc;
    const item = makeShopRow(up.icon, up.name, descText, `${up.cost} ${ICO.gold}`, false, false, cantAfford);
    item.onclick = () => { if (G.gold >= up.cost) { G.gold -= up.cost; up.apply(); playSound('pickup'); renderShop(); } };
    upEl.appendChild(item);
  }


  // Button text
  const btn = document.getElementById('btn-next-stage');
  btn.textContent = G.shopMode === 'persistent' ? 'CLOSE SHOP [B]' : 'NEXT WAVE';
}

function showShopUI() {
  G.phase = 'shop';
  generateFullShop();
  renderShop();
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('shop').classList.remove('h');
  document.getElementById('boss-bar').classList.add('h');
  document.getElementById('boss-intro').classList.add('h');
}

function showShop() {
  G.shopMode = 'wave';
  showShopUI();
}

function openPersistentShop() {
  if (G.phase !== 'wave' && G.phase !== 'boss' && G.phase !== 'bossIntro' && G.phase !== 'waveIntro') return;

  G.prevPhase = G.phase;
  G.shopMode = 'persistent';
  showShopUI();
}

function closePersistentShop() {
  document.getElementById('shop').classList.add('h');
  G.phase = G.prevPhase || 'wave';
  G.prevPhase = null;
  lastT = performance.now();
  requestAnimationFrame(loop);
}

// ============ BOSS CLASS ============
class Boss {
  constructor(data, wave) {
    this.data = data; this.x = P.x; this.y = P.y - 200;
    this.hp = data.hp * (1 + wave * 0.05); this.maxHp = this.hp;
    this.sz = data.sz; this.spd = data.spd;
    this.attackCd = 2; this.attackIdx = 0; this.flash = 0;
    this.clones = []; this.diving = false; this.diveTarget = { x: 0, y: 0 };
  }
  update(dt) {
    if (!this.diving) {
      const dx = P.x - this.x, dy = P.y - this.y, ds = Math.hypot(dx, dy);
      if (ds > 100) { this.x += (dx / ds) * this.spd * 50 * dt; this.y += (dy / ds) * this.spd * 50 * dt; }
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
    for (const c of this.clones) { if (!isOnScreen(c.x, c.y, 100)) continue; ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = 0.4; const spr = BOSS_SPRITES[G.bossKey]; if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2); ctx.restore(); }
    if (this.diving) { ctx.save(); ctx.translate(this.diveTarget.x, this.diveTarget.y); ctx.fillStyle = 'rgba(255,0,0,0.2)'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.translate(this.x, this.y);
    const spr = BOSS_SPRITES[G.bossKey]; if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
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

// ============ GAME FLOW ============
function startGame(mode) {
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

// ============ HUD & UI ============
function formatTime(totalSecs) {
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} `;
}

function updateHUD() {
  // Lerp HP bar (fast catch-down on damage, slower heal-up)
  const hpTarget = P.hp / P.maxHp * 100;
  const hpSpeed = _hpDisplay > hpTarget ? 0.18 : 0.08; // faster on damage
  _hpDisplay += (hpTarget - _hpDisplay) * hpSpeed;
  if (Math.abs(_hpDisplay - hpTarget) < 0.3) _hpDisplay = hpTarget;
  DOM.hpb.style.width = `${_hpDisplay}%`;
  DOM.hpt.textContent = `${Math.ceil(P.hp)}/${P.maxHp}`;
  DOM.lvl.textContent = `LV ${P.level}`;

  // Lerp XP bar
  const xpTarget = Math.min(100, P.xp / P.xpNext * 100);
  _xpDisplay += (xpTarget - _xpDisplay) * 0.12;
  if (Math.abs(_xpDisplay - xpTarget) < 0.3) _xpDisplay = xpTarget;
  if (DOM.xpb) DOM.xpb.style.width = `${_xpDisplay}%`;

  if (G.mode === 'arcade') {
    DOM.stageInfo.textContent = `WAVE ${G.wave}/100`;
  } else {
    const stageNum = Math.floor((G.wave - 1) / WAVES_PER_STAGE) + 1;
    const waveInStage = ((G.wave - 1) % WAVES_PER_STAGE) + 1;
    DOM.stageInfo.textContent = `STAGE ${stageNum} — ${waveInStage}/${WAVES_PER_STAGE}`;
  }

  // Timer with progressive urgency (UX 3)
  if (G.phase === 'wave') {
    DOM.waveTimer.textContent = formatTime(G.waveTime);
    DOM.waveTimer.classList.remove('urgent', 'warning');
    if (G.waveTime <= 10) DOM.waveTimer.classList.add('urgent');
    else if (G.waveTime <= 20) DOM.waveTimer.classList.add('warning');
  } else {
    DOM.waveTimer.textContent = '';
    DOM.waveTimer.classList.remove('urgent', 'warning');
  }

  // Gold feedback (UX 6)
  const newGold = G.gold;
  if (G._lastGold !== undefined && newGold !== G._lastGold) {
    const delta = newGold - G._lastGold;
    if (delta !== 0) _showGoldDelta(delta);
  }
  G._lastGold = newGold;
  DOM.gold.textContent = G.gold;
}

// UX 6: Gold change popup
function _showGoldDelta(delta) {
  const el = document.getElementById('gold');
  if (!el) return;
  const popup = document.createElement('span');
  popup.className = 'gold-delta ' + (delta > 0 ? 'gold-plus' : 'gold-minus');
  popup.textContent = delta > 0 ? `+${delta}` : `${delta}`;
  el.parentElement.appendChild(popup);
  setTimeout(() => popup.remove(), 1200);
}

// ============ SHARED END SCREEN HELPERS ============
function buildWeaponRecap(containerId) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  for (const w of P.weapons) {
    const def = WEAPONS[w.id];
    el.innerHTML += `
      <div class="weapon-recap-item">
        <div class="weapon-recap-icon">${def.icon}</div>
        <div class="weapon-recap-name">${def.name}</div>
        <div class="weapon-recap-lvl">Lv${w.level}</div>
      </div>
    `;
  }
}

function buildDetailedStats(containerId) {
  const el = document.getElementById(containerId);
  const avgDPS = G.totalTime > 0 ? Math.round(G.totalDmgDealt / G.totalTime) : 0;
  const killsPerMin = G.totalTime > 0 ? Math.round(G.kills / (G.totalTime / 60)) : 0;
  const dmgRatio = G.totalDmgTaken > 0 ? (G.totalDmgDealt / G.totalDmgTaken).toFixed(1) : '∞';
  const efficiency = G.kills > 0 ? Math.round((G.totalDmgDealt / G.kills)) : 0;

  el.innerHTML = `
    <div class="end-stat-card"><div class="end-stat-val">${formatNumber(Math.round(G.totalDmgDealt))}</div><div class="end-stat-lbl">Damage Dealt</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${formatNumber(Math.round(G.totalDmgTaken))}</div><div class="end-stat-lbl">Damage Taken</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${G.totalGoldEarned}</div><div class="end-stat-lbl">Gold Earned</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${avgDPS}</div><div class="end-stat-lbl">Avg DPS</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${killsPerMin}</div><div class="end-stat-lbl">Kills/Min</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${G.bossesKilled}</div><div class="end-stat-lbl">Bosses Slain</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${dmgRatio}x</div><div class="end-stat-lbl">DMG Ratio</div></div>
    <div class="end-stat-card"><div class="end-stat-val">${efficiency}</div><div class="end-stat-lbl">DMG/Kill</div></div>
    <div class="dps-graph-wrap" style="grid-column: 1 / -1; margin-top: 6px;">
      <div style="font-family:'JetBrains Mono';font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:4px;text-transform:uppercase">DPS Over Time</div>
      <canvas id="dps-graph" width="380" height="60" style="width:100%;height:60px;border-radius:6px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06)"></canvas>
    </div>
  `;

  // Draw DPS sparkline graph
  setTimeout(() => drawDPSGraph(), 50);
}

function drawDPSGraph() {
  const canvas = document.getElementById('dps-graph');
  if (!canvas || !G.dpsHistory || G.dpsHistory.length < 2) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const data = G.dpsHistory;
  const maxDPS = Math.max(...data, 1);
  const padding = { top: 8, bottom: 6, left: 2, right: 2 };
  const graphW = w - padding.left - padding.right;
  const graphH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (graphH * i / 3);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // DPS line + fill
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = padding.left + (i / (data.length - 1)) * graphW;
    const y = padding.top + graphH - (data[i] / maxDPS) * graphH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // Stroke
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00cec9';
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Fill gradient
  ctx.lineTo(padding.left + graphW, padding.top + graphH);
  ctx.lineTo(padding.left, padding.top + graphH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphH);
  grad.addColorStop(0, 'rgba(0, 206, 201, 0.3)');
  grad.addColorStop(1, 'rgba(0, 206, 201, 0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Peak DPS marker
  const peakIdx = data.indexOf(maxDPS);
  const peakX = padding.left + (peakIdx / (data.length - 1)) * graphW;
  const peakY = padding.top;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(peakX, peakY + 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "600 8px 'JetBrains Mono'";
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = peakX > w / 2 ? 'right' : 'left';
  ctx.fillText(`Peak: ${Math.round(maxDPS)}`, peakX + (peakX > w / 2 ? -6 : 6), peakY + 5);
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function calculateRank() {
  // Score based on: time efficiency, kills, combo, bosses
  let score = 0;
  score += Math.min(30, G.kills / 50);  // up to 30 pts for kills
  score += Math.min(20, G.maxCombo / 10); // up to 20 pts for combo
  score += Math.min(20, G.bossesKilled * 2); // up to 20 pts for bosses
  const timePerWave = G.totalTime / Math.max(1, G.wave);
  score += Math.max(0, 30 - timePerWave / 5); // up to 30 pts for speed

  if (score >= 75) return 'S';
  if (score >= 55) return 'A';
  if (score >= 40) return 'B';
  if (score >= 25) return 'C';
  return 'D';
}

function gameOver() {
  G.phase = 'gameover'; stopMusic();
  saveHighscore();
  clearDamageFlash();
  // Stop any active screen shake
  shake.intensity = 0; shake.time = 0; shake.x = 0; shake.y = 0;
  // Show game over modal directly (no rug pull)
  if (G.mode === 'arcade') {
    document.getElementById('fo-stage').textContent = `${G.wave}/100`;
  } else {
    const stageNum = Math.floor((G.wave - 1) / WAVES_PER_STAGE) + 1;
    document.getElementById('fo-stage').textContent = `S${stageNum} W${G.wave}`;
  }
  document.getElementById('fo-kills').textContent = G.kills;
  document.getElementById('fo-time').textContent = formatTime(G.totalTime);
  document.getElementById('fo-combo').textContent = `${G.maxCombo}x`;
  buildWeaponRecap('fo-weapons');
  buildDetailedStats('fo-details');
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('boss-intro').classList.add('h');
  document.getElementById('pause-menu').classList.add('h');
  const gm = document.getElementById('gm');
  gm.classList.remove('h');
  gm.classList.add('dramatic');
  const goTitle = document.getElementById('go-title');
  const isLiquidated = P.leverage > 5;
  goTitle.textContent = isLiquidated ? 'LIQUIDATED' : 'DEFEATED';
  goTitle.setAttribute('data-text', goTitle.textContent);
  goTitle.classList.toggle('liquidated', isLiquidated);
  // UX 10: New highscore banner
  _showHighscoreBanner(gm);
}

function victory() {
  G.phase = 'victory'; stopMusic();

  const finishVictory = () => {
    saveHighscore();
    clearDamageFlash();
    // Rank
    const rank = calculateRank();
    const rankEl = document.getElementById('v-rank');
    rankEl.textContent = rank;
    rankEl.className = `rank-badge rank-${rank.toLowerCase()}`;
    // Mode-aware subtitle
    const vSub = document.querySelector('#vm .ms');
    if (vSub) {
      vSub.textContent = G.mode === 'arcade' ? '100 Waves Survived — The Grind Is Over' : 'All Protocols Conquered — The Market Is Yours';
    }
    // Stats
    document.getElementById('v-kills').textContent = G.kills;
    document.getElementById('v-time').textContent = formatTime(G.totalTime);
    document.getElementById('v-combo').textContent = `${G.maxCombo}x`;
    buildWeaponRecap('v-weapons');
    buildDetailedStats('v-details');
    document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
    document.getElementById('boss-intro').classList.add('h');
    document.getElementById('pause-menu').classList.add('h');
    const vm = document.getElementById('vm');
    vm.classList.remove('h');
    vm.classList.add('spectacular');
    // Spawn confetti
    spawnConfetti(vm);
    // UX 10: New highscore banner
    _showHighscoreBanner(vm);
  };

  if (G.mode === 'adventure') {
    playNarrative(NARRATIVE_TEXTS.epilogue, 'center', finishVictory);
  } else {
    finishVictory();
  }
}

function _showHighscoreBanner(container) {
  if (!G._isNewHighscore) return;
  G._isNewHighscore = false;
  const banner = document.createElement('div');
  banner.className = 'new-highscore-banner';
  banner.innerHTML = ICO.trophy + ' NEW HIGHSCORE!';
  container.appendChild(banner);
  setTimeout(() => banner.remove(), 5000);
}

function spawnConfetti(container) {
  const colors = ['#ffd700', '#ff6b6b', '#00cec9', '#6c5ce7', '#55efc4', '#fd79a8', '#00b894', '#e17055'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left = Math.random() * 100 + '%';
    el.style.top = -10 + 'px';
    el.style.width = (4 + Math.random() * 8) + 'px';
    el.style.height = (4 + Math.random() * 8) + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.style.animationDelay = Math.random() * 2 + 's';
    el.style.opacity = 0.7 + Math.random() * 0.3;
    container.appendChild(el);
    // Clean up after animation
    setTimeout(() => el.remove(), 6000);
  }
}

// ============ LEADERBOARD DATA PROVIDER ============
// Abstraction layer — swap localProvider for blockchainProvider later.
const LeaderboardData = (() => {
  const MAX_SCORES = 500;
  const localProvider = {
    getAllScores() {
      try { return Promise.resolve(JSON.parse(localStorage.getItem('hl_survivor_scores') || '[]')); }
      catch (e) { return Promise.resolve([]); }
    },
    saveScore(entry) {
      return this.getAllScores().then(scores => {
        scores.push(entry);
        scores.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
        if (scores.length > MAX_SCORES) scores.length = MAX_SCORES;
        localStorage.setItem('hl_survivor_scores', JSON.stringify(scores));
      });
    },
    getLifetimeStats() {
      try {
        const raw = JSON.parse(localStorage.getItem('hl_survivor_stats') || '{}');
        return Promise.resolve({
          totalKills: raw.totalKills || 0, totalGames: raw.totalGames || 0,
          totalTime: raw.totalTime || 0, bestWave: raw.bestWave || 0, bestCombo: raw.bestCombo || 0,
        });
      } catch (e) { return Promise.resolve({ totalKills: 0, totalGames: 0, totalTime: 0, bestWave: 0, bestCombo: 0 }); }
    },
    saveLifetimeStats(stats) {
      localStorage.setItem('hl_survivor_stats', JSON.stringify(stats));
      return Promise.resolve();
    }
  };
  let provider = localProvider;
  return {
    setProvider(p) { provider = p; },
    getAllScores() { return provider.getAllScores(); },
    saveScore(e) { return provider.saveScore(e); },
    getLifetimeStats() { return provider.getLifetimeStats(); },
    saveLifetimeStats(s) { return provider.saveLifetimeStats(s); },
    getScoresForPeriod(period) {
      return this.getAllScores().then(scores => {
        const now = Date.now();
        let cutoff = 0;
        if (period === 'daily') cutoff = now - 86400000;
        if (period === 'weekly') cutoff = now - 604800000;
        const filtered = cutoff > 0 ? scores.filter(s => s.date >= cutoff) : scores;
        filtered.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
        return filtered;
      });
    }
  };
})();

// ============ HIGHSCORE SYSTEM ============
function getHighscores() {
  try { return JSON.parse(localStorage.getItem('hl_survivor_scores') || '[]'); }
  catch (e) { return []; }
}

function saveHighscore() {
  const scores = getHighscores();
  const prevBest = scores.length > 0 ? scores[0].wave : 0;
  const entry = {
    wave: G.wave, kills: G.kills, time: Math.floor(G.totalTime),
    combo: G.maxCombo, gold: G.totalGoldEarned, mode: G.mode, date: Date.now()
  };
  // Save via provider (unlimited, capped at 500)
  LeaderboardData.saveScore(entry);
  // UX 10: New highscore announcement
  if (G.wave > prevBest && prevBest > 0) {
    G._isNewHighscore = true;
  }
  // Save lifetime stats
  LeaderboardData.getLifetimeStats().then(stats => {
    stats.totalKills += G.kills;
    stats.totalGames++;
    stats.totalTime += Math.floor(G.totalTime);
    stats.bestWave = Math.max(stats.bestWave, G.wave);
    stats.bestCombo = Math.max(stats.bestCombo, G.maxCombo);
    LeaderboardData.saveLifetimeStats(stats);
  });
}

function getLifetimeStats() {
  try {
    const raw = JSON.parse(localStorage.getItem('hl_survivor_stats') || '{}');
    return {
      totalKills: raw.totalKills || 0, totalGames: raw.totalGames || 0,
      totalTime: raw.totalTime || 0, bestWave: raw.bestWave || 0, bestCombo: raw.bestCombo || 0,
    };
  } catch (e) { return { totalKills: 0, totalGames: 0, totalTime: 0, bestWave: 0, bestCombo: 0 }; }
}

function updateMenuHighscores() {
  const container = document.getElementById('menu-highscores');
  if (!container) return;
  const scores = getHighscores();
  const stats = getLifetimeStats();
  if (scores.length === 0 && !stats.totalGames) {
    container.innerHTML = '';
    return;
  }
  let html = '<div class="hs-title">LEADERBOARD</div>';
  if (scores.length > 0) {
    html += '<div class="hs-list">';
    scores.slice(0, 5).forEach((s, i) => {
      const medal = i === 0 ? ICO.medal1 : i === 1 ? ICO.medal2 : i === 2 ? ICO.medal3 : `#${i + 1}`;
      html += `<div class="hs-row"><span class="hs-medal">${medal}</span><span class="hs-wave">W${s.wave}</span><span class="hs-kills">${s.kills}K</span><span class="hs-time">${formatTime(s.time)}</span></div>`;
    });
    html += '</div>';
  }
  if (stats.totalGames) {
    html += `<div class="hs-stats">${stats.totalGames} runs · ${stats.totalKills || 0} total kills · Best W${stats.bestWave || 0}</div>`;
  }
  container.innerHTML = html;
}

// ============ LEADERBOARD UI ============
const Leaderboard = (() => {
  let currentPeriod = 'all';

  function open() {
    document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
    document.getElementById('lb').classList.remove('h');
    currentPeriod = 'all';
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.period === 'all'));
    _renderLifetime();
    _renderScores('all');
  }

  function close() {
    document.getElementById('lb').classList.add('h');
    document.getElementById('mm').classList.remove('h');
  }

  function switchTab(period) {
    currentPeriod = period;
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.toggle('active', t.dataset.period === period));
    _renderScores(period);
  }

  function _renderLifetime() {
    LeaderboardData.getLifetimeStats().then(stats => {
      const el = document.getElementById('lb-lifetime');
      if (!stats.totalGames) { el.innerHTML = ''; return; }
      el.innerHTML = `
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">${stats.totalGames}</div><div class="lb-lifetime-label">RUNS</div></div>
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">${stats.totalKills.toLocaleString()}</div><div class="lb-lifetime-label">TOTAL KILLS</div></div>
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">W${stats.bestWave}</div><div class="lb-lifetime-label">BEST WAVE</div></div>
        <div class="lb-lifetime-item"><div class="lb-lifetime-val">${formatTime(stats.totalTime)}</div><div class="lb-lifetime-label">TOTAL TIME</div></div>
      `;
    });
  }

  function _renderScores(period) {
    const listEl = document.getElementById('lb-list');
    const emptyEl = document.getElementById('lb-empty');
    LeaderboardData.getScoresForPeriod(period).then(scores => {
      if (scores.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('h');
        return;
      }
      emptyEl.classList.add('h');
      listEl.innerHTML = scores.map((s, i) => {
        let cls = 'lb-row';
        if (i === 0) cls += ' lb-gold';
        else if (i === 1) cls += ' lb-silver';
        else if (i === 2) cls += ' lb-bronze';
        const rank = i === 0 ? ICO.medal1 : i === 1 ? ICO.medal2 : i === 2 ? ICO.medal3 : `${i + 1}`;
        const d = new Date(s.date);
        const dateStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
        return `<div class="${cls}">
          <span class="lb-col-rank">${rank}</span>
          <span class="lb-col-wave">W${s.wave}</span>
          <span class="lb-col-kills">${s.kills}</span>
          <span class="lb-col-time">${formatTime(s.time)}</span>
          <span class="lb-col-date">${dateStr}</span>
        </div>`;
      }).join('');
    });
  }

  return { open, close, switchTab };
})();

// ============ STAGE MAP — BLOOMBERG TERMINAL ============
let _stageMapAnim = null;
let _stageMapCallback = null;

function showStageMap(callback) {
  _stageMapCallback = callback || null;
  // Hide all other overlays first
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('stage-map').classList.remove('h');
  drawStageMap();
}

function hideStageMap() {
  document.getElementById('stage-map').classList.add('h');
  if (_stageMapAnim) { cancelAnimationFrame(_stageMapAnim); _stageMapAnim = null; }
  if (_stageMapCallback) { const cb = _stageMapCallback; _stageMapCallback = null; cb(); }
}

let _stageMapNodes = []; // store node positions for click detection
let _stageMapSelected = -1; // selected stage (-1 = none, uses G.stage)

function drawStageMap() {
  const canvas = document.getElementById('stage-map-canvas');
  _stageMapSelected = G.stage; // default selection = current stage

  // Add click handler (only once)
  if (!canvas._smClickBound) {
    canvas._smClickBound = true;
    canvas.style.cursor = 'default';
    canvas.addEventListener('mousemove', function(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let hover = false;
      for (const nd of _stageMapNodes) {
        const dx = mx - nd.x, dy = my - nd.y;
        if (dx * dx + dy * dy < 18 * 18 && nd.unlocked) { hover = true; break; }
      }
      canvas.style.cursor = hover ? 'pointer' : 'default';
    });
    canvas.addEventListener('click', function(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (const nd of _stageMapNodes) {
        const dx = mx - nd.x, dy = my - nd.y;
        if (dx * dx + dy * dy < 18 * 18 && nd.unlocked) {
          _stageMapSelected = nd.stage;
          return;
        }
      }
    });
  }
  const c = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cw = window.innerWidth, ch = window.innerHeight;
  const maxR = 9; // DEBUG: all stages unlocked
  let t = 0;
  const BG = '#0e1117', CARD = '#141921', RED = '#ef5350', GRN = '#2de2b0', BRD = '#1e2230';

  // Layout — toolbar left, time axis bottom
  const TOP_H = 34, HDR_H = 30;
  const TOOLBAR_W = 44, PRICE_AX_W = 70, TIME_AX_H = 28;
  const STAGE_LBL_W = 155;
  const BTN_H = 40;
  const CH_L = TOOLBAR_W + STAGE_LBL_W + 8, CH_R = cw - PRICE_AX_W, CH_T = TOP_H + HDR_H + 8, CH_B = ch - TIME_AX_H - BTN_H - 8;
  const CH_W = CH_R - CH_L, CH_H = CH_B - CH_T;

  // Ticker data — real market prices (March 2026)
  const TK = [
    {s:'BTC-USDC',p:63640,c:-5.88},{s:'ETH-USDC',p:1856,c:-8.73},{s:'SOL-USDC',p:80.04,c:-3.00},
    {s:'HYPE-USDC',p:30.87,c:16.98},{s:'DOGE-USDC',p:0.0963,c:-5.50},{s:'PEPE-USDC',p:0.000003508,c:-9.64},
    {s:'ARB-USDC',p:0.094,c:-6.91},{s:'PURR-USDC',p:0.42,c:-1.20},{s:'AVAX-USDC',p:8.51,c:-4.89},
    {s:'LINK-USDC',p:8.83,c:-3.34}
  ];
  let tkX = 0;

  // ── FIBONACCI RETRACEMENT — each stage = a fib level ──
  const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618, 2.618];
  const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%', '127.2%', '161.8%', '261.8%'];
  const FIB_LOW = 12000, FIB_HIGH = 85000;
  const FIB_RANGE = FIB_HIGH - FIB_LOW;

  // Map fib level to price
  function fib2price(f) { return FIB_LOW + f * FIB_RANGE; }

  // Price range for chart (add padding)
  const pMin = FIB_LOW - FIB_RANGE * 0.08;
  const pMax = fib2price(FIB_LEVELS[9]) + FIB_RANGE * 0.12;

  // Helpers
  function p2y(p) { return CH_B - ((p - pMin) / (pMax - pMin)) * CH_H; }
  function rr(x,y,w,h,r) { c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); }

  // Stage node positions — evenly spaced X, fib-level Y
  const sN = [];
  for (let s = 0; s < 10; s++) {
    const price = fib2price(FIB_LEVELS[s]);
    const x = CH_L + 40 + (s / 9) * (CH_W - 80);
    sN.push({x: x, y: p2y(price), price: price, fib: FIB_LEVELS[s], fibLabel: FIB_LABELS[s]});
  }

  // Flow dots
  const fDots = [];
  for (let i = 0; i < 12; i++) fDots.push({p: Math.random(), sp: 0.0015 + Math.random() * 0.003});

  // Floating particles (subtle background ambiance)
  const bgParts = [];
  for (let i = 0; i < 30; i++) bgParts.push({x: Math.random()*cw, y: Math.random()*ch, s: Math.random()*1.5+0.5, sp: Math.random()*0.3+0.1, a: Math.random()});

  // Floating price tags (HL homepage style)
  const floatTags = [];
  const ftData = [
    {s:'BTC',p:'$63,640',c:false},{s:'ETH',p:'$1,856',c:false},{s:'SOL',p:'$80.04',c:false},
    {s:'HYPE',p:'$30.87',c:true},{s:'DOGE',p:'$0.0963',c:false},{s:'PEPE',p:'$0.0000035',c:false},
    {s:'AVAX',p:'$8.51',c:false},{s:'LINK',p:'$8.83',c:false},{s:'ARB',p:'$0.094',c:false},
    {s:'PURR',p:'$0.42',c:false},{s:'OP',p:'$0.72',c:false},{s:'AAVE',p:'$198',c:true},
    {s:'WIF',p:'$0.38',c:true},{s:'TIA',p:'$2.84',c:true},{s:'SUI',p:'$2.21',c:false},
    {s:'INJ',p:'$9.60',c:true},{s:'SEI',p:'$0.14',c:false},{s:'JUP',p:'$0.41',c:true}
  ];
  for (let i = 0; i < ftData.length; i++) {
    const d = ftData[i];
    floatTags.push({
      x: Math.random() * cw,
      y: CH_T + Math.random() * CH_H * 0.85,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      sym: d.s, price: d.p, green: d.c,
      phase: Math.random() * Math.PI * 2,
      sz: 0.7 + Math.random() * 0.4
    });
  }

  function frame() {
    t += 0.016;
    c.clearRect(0, 0, cw * dpr, ch * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── BACKGROUND ──
    c.fillStyle = BG; c.fillRect(0, 0, cw, ch);

    // Subtle floating particles
    for (const p of bgParts) {
      p.y -= p.sp; if (p.y < -5) { p.y = ch + 5; p.x = Math.random() * cw; }
      c.globalAlpha = 0.06 + Math.sin(t * 2 + p.a * 6) * 0.03;
      c.fillStyle = GRN;
      c.beginPath(); c.arc(p.x, p.y, p.s, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    // Floating price tags (HL homepage style)
    for (const ft of floatTags) {
      ft.x += ft.vx; ft.y += ft.vy;
      // Bounce off edges
      if (ft.x < 30 || ft.x > cw - 100) ft.vx *= -1;
      if (ft.y < CH_T + 20 || ft.y > CH_B - 30) ft.vy *= -1;
      // Gentle floating motion
      const ofy = Math.sin(t * 0.8 + ft.phase) * 0.3;
      ft.y += ofy;
      const alpha = 0.06 + Math.sin(t * 0.5 + ft.phase) * 0.025;
      c.globalAlpha = alpha;
      // Pill background
      const lbl = ft.sym + '  ' + ft.price;
      c.font = (10 * ft.sz) + 'px "JetBrains Mono", monospace';
      const tw = c.measureText(lbl).width + 16;
      const th = 22 * ft.sz;
      rr(ft.x - 4, ft.y - th / 2, tw, th, th / 2);
      c.fillStyle = ft.green ? 'rgba(45,226,176,0.15)' : 'rgba(255,255,255,0.06)';
      c.fill();
      c.strokeStyle = ft.green ? 'rgba(45,226,176,0.2)' : 'rgba(255,255,255,0.08)';
      c.lineWidth = 1; rr(ft.x - 4, ft.y - th / 2, tw, th, th / 2); c.stroke();
      // Text
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillStyle = ft.green ? GRN : 'rgba(255,255,255,0.7)';
      c.fillText(lbl, ft.x + 4, ft.y);
    }
    c.globalAlpha = 1;

    // ── TOP BAR (scrolling ticker) ──
    c.fillStyle = '#0b0f18'; c.fillRect(0, 0, cw, TOP_H);
    c.strokeStyle = BRD; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, TOP_H); c.lineTo(cw, TOP_H); c.stroke();
    c.save(); c.beginPath(); c.rect(0, 0, cw, TOP_H); c.clip();
    tkX -= 0.4; if (tkX < -TK.length * 240) tkX = 0;
    c.font = '11px "JetBrains Mono", monospace'; c.textBaseline = 'middle';
    function fmtP(v) { if (v >= 1000) return '$'+v.toLocaleString(undefined,{maximumFractionDigits:0}); if (v >= 1) return '$'+v.toFixed(2); if (v >= 0.01) return '$'+v.toFixed(4); return '$'+v.toFixed(9); }
    const tkSp = 250;
    for (let i = 0; i < TK.length * 3; i++) {
      const tk = TK[i % TK.length], x = tkX + i * tkSp;
      if (x > cw + 50 || x < -tkSp) continue;
      c.textAlign = 'left';
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillText(tk.s, x + 12, TOP_H / 2);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillText(fmtP(tk.p), x + 107, TOP_H / 2);
      c.fillStyle = tk.c >= 0 ? GRN : RED;
      c.fillText((tk.c >= 0 ? '+' : '') + tk.c.toFixed(2) + '%', x + 190, TOP_H / 2);
      // Separator bar
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x, TOP_H * 0.25, 1, TOP_H * 0.5);
    }
    c.restore();

    // ── HEADER BAR (pair + key info only) ──
    const hy = TOP_H;
    c.fillStyle = CARD; c.fillRect(0, hy, cw, HDR_H);
    c.strokeStyle = BRD; c.beginPath(); c.moveTo(0, hy + HDR_H); c.lineTo(cw, hy + HDR_H); c.stroke();
    const selIdx = Math.min(_stageMapSelected, 9);
    const markP = sN[selIdx].price;
    const curFib = sN[selIdx];
    c.font = 'bold 14px "JetBrains Mono", monospace'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    const hdrX = TOOLBAR_W + 12;
    c.fillText('HYPER SURVIVOR', hdrX, hy + HDR_H / 2);
    // Fib-based stats (reflects selected stage)
    c.font = '11px "JetBrains Mono", monospace';
    c.fillStyle = GRN; c.fillText('$' + Math.round(markP).toLocaleString(), hdrX + 190, hy + HDR_H / 2);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.font = '10px "JetBrains Mono", monospace';
    c.fillText('FIB ' + curFib.fibLabel, hdrX + 290, hy + HDR_H / 2);
    c.fillStyle = GRN; c.fillText('+' + (curFib.fib * 100).toFixed(1) + '%', hdrX + 380, hy + HDR_H / 2);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.font = '9px "JetBrains Mono", monospace';
    c.fillText('Stage ' + (_stageMapSelected + 1) + ' / 10', hdrX + 470, hy + HDR_H / 2);

    // ── FIBONACCI RETRACEMENT (TradingView style — drawn by a trader) ──
    // Zone colors between fib levels (classic TV palette)
    const FIB_ZONE_COLORS = [
      'rgba(244,67,54,0.06)',    // 0 → 23.6%       red zone
      'rgba(255,152,0,0.05)',    // 23.6 → 38.2%    orange
      'rgba(255,235,59,0.05)',   // 38.2 → 50%      yellow
      'rgba(76,175,80,0.05)',    // 50 → 61.8%      green
      'rgba(45,226,176,0.06)',   // 61.8 → 78.6%    teal (golden pocket!)
      'rgba(33,150,243,0.05)',   // 78.6 → 100%     blue
      'rgba(156,39,176,0.04)',   // 100 → 127.2%    purple (extension)
      'rgba(233,30,99,0.04)',    // 127.2 → 161.8%  pink
      'rgba(255,193,7,0.04)',    // 161.8 → 261.8%  gold
    ];
    const FIB_LINE_COLORS = [
      '#ef5350',  // 0%
      '#ff9800',  // 23.6%
      '#fdd835',  // 38.2%
      '#66bb6a',  // 50%
      '#2de2b0',  // 61.8%
      '#42a5f5',  // 78.6%
      '#ab47bc',  // 100%
      '#ec407a',  // 127.2%
      '#ffa726',  // 161.8%
      '#ffd54f',  // 261.8%
    ];

    // Fib horizontal lines + labels
    for (let i = 0; i < 10; i++) {
      const fy = sN[i].y;
      const ul = i <= maxR, cur = i === _stageMapSelected;
      const lineCol = FIB_LINE_COLORS[i];

      // Horizontal fib line (colored, vivid)
      c.strokeStyle = lineCol;
      c.globalAlpha = cur ? 1 : ul ? 0.75 : 0.25;
      c.lineWidth = cur ? 3 : 2;
      c.beginPath(); c.moveTo(CH_L, fy); c.lineTo(CH_R, fy); c.stroke();
      c.globalAlpha = 1;

      // LEFT label pill — Stage name (centered in label zone)
      const pal_f = STAGE_PALETTES[i];
      const stageTxt = pal_f.name.toUpperCase();
      c.font = (cur ? 'bold ' : '') + '10px "JetBrains Mono", monospace';
      const lblH = 20;
      const lblX = TOOLBAR_W + 4;
      const lblW2 = STAGE_LBL_W - 4;
      rr(lblX, fy - lblH / 2, lblW2, lblH, 3);
      c.fillStyle = cur ? lineCol : 'rgba(30,34,48,0.9)'; c.fill();
      c.strokeStyle = cur ? lineCol : (ul ? lineCol + '55' : 'rgba(255,255,255,0.06)');
      c.lineWidth = 1; rr(lblX, fy - lblH / 2, lblW2, lblH, 3); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = cur ? '#000' : (ul ? lineCol : 'rgba(255,255,255,0.2)');
      c.fillText(stageTxt, lblX + lblW2 / 2, fy);

    }

    // ── PRICE CURVE (the main rising line through stages) ──
    // Area fill under unlocked curve
    if (maxR >= 0) {
      c.beginPath(); c.moveTo(sN[0].x, sN[0].y);
      for (let i = 1; i <= maxR; i++) {
        const prev = sN[i - 1], cur = sN[i];
        const cpx = (prev.x + cur.x) / 2;
        c.quadraticCurveTo(cpx, prev.y, cur.x, cur.y);
      }
      c.lineTo(sN[maxR].x, CH_B); c.lineTo(sN[0].x, CH_B); c.closePath();
      const aGrad = c.createLinearGradient(0, CH_T, 0, CH_B);
      aGrad.addColorStop(0, 'rgba(45,226,176,0.1)'); aGrad.addColorStop(1, 'rgba(45,226,176,0)');
      c.fillStyle = aGrad; c.fill();

      // Glowing line
      c.beginPath(); c.moveTo(sN[0].x, sN[0].y);
      for (let i = 1; i <= maxR; i++) {
        const prev = sN[i - 1], cur = sN[i];
        const cpx = (prev.x + cur.x) / 2;
        c.quadraticCurveTo(cpx, prev.y, cur.x, cur.y);
      }
      c.strokeStyle = GRN; c.shadowColor = GRN; c.shadowBlur = 10; c.lineWidth = 2.5; c.stroke();
      c.shadowBlur = 0;
    }

    // Current price tag on right axis (reflects selected stage)
    const curY = sN[_stageMapSelected].y;
    c.fillStyle = GRN; rr(CH_R + 2, curY - 11, PRICE_AX_W - 8, 22, 3); c.fill();
    c.fillStyle = '#000'; c.font = 'bold 10px "JetBrains Mono", monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('$' + Math.round(markP).toLocaleString(), CH_R + PRICE_AX_W / 2 - 2, curY);

    // ── FLOW DOTS along unlocked curve ──
    if (maxR > 0) {
      for (const fd of fDots) {
        fd.p += fd.sp; if (fd.p > 1) fd.p = 0;
        const seg = fd.p * maxR, si = Math.floor(seg), sf = seg - si;
        if (si < maxR) {
          const a = sN[si], b = sN[si + 1];
          const dx = a.x + (b.x - a.x) * sf;
          const dy = a.y + (b.y - a.y) * sf;
          c.beginPath(); c.arc(dx, dy, 2, 0, Math.PI * 2);
          c.fillStyle = GRN; c.shadowColor = GRN; c.shadowBlur = 8;
          c.globalAlpha = 0.4 + Math.sin(t * 5 + fd.p * 10) * 0.4;
          c.fill(); c.shadowBlur = 0; c.globalAlpha = 1;
        }
      }
    }

    // ── STAGE NODES ON THE CURVE ──
    _stageMapNodes = [];
    for (let i = 0; i < 10; i++) {
      const nx = sN[i].x, ny = sN[i].y;
      const pal = STAGE_PALETTES[i];
      const ul = i <= maxR, sel = i === _stageMapSelected;
      _stageMapNodes.push({x: nx, y: ny, stage: i, unlocked: ul});

      if (!ul) {
        // Locked: red node with stage number
        c.beginPath(); c.arc(nx, ny, 14, 0, Math.PI * 2);
        c.fillStyle = '#1a1014'; c.fill();
        c.strokeStyle = RED; c.lineWidth = 2;
        c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1;
        c.font = 'bold 11px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = RED; c.globalAlpha = 0.6;
        c.fillText('' + (i + 1), nx, ny);
        c.globalAlpha = 1;
      } else if (sel) {
        // Selected stage: pulsing glow node
        const pulse = Math.sin(t * 3) * 0.3 + 0.7;
        // Outer glow rings
        c.beginPath(); c.arc(nx, ny, 26 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
        c.strokeStyle = GRN + '15'; c.lineWidth = 1; c.stroke();
        c.beginPath(); c.arc(nx, ny, 20 + Math.sin(t * 2.5) * 2, 0, Math.PI * 2);
        c.strokeStyle = GRN + '25'; c.lineWidth = 1; c.stroke();
        // Main node
        c.beginPath(); c.arc(nx, ny, 16, 0, Math.PI * 2);
        c.fillStyle = '#0e1117'; c.fill();
        c.strokeStyle = GRN; c.lineWidth = 2.5; c.shadowColor = GRN; c.shadowBlur = 15;
        c.stroke(); c.shadowBlur = 0;
        // Inner glow
        const ig = c.createRadialGradient(nx, ny, 0, nx, ny, 14);
        ig.addColorStop(0, 'rgba(45,226,176,' + (0.15 * pulse).toFixed(2) + ')');
        ig.addColorStop(1, 'rgba(45,226,176,0)');
        c.fillStyle = ig; c.beginPath(); c.arc(nx, ny, 14, 0, Math.PI * 2); c.fill();
        // Stage number inside node
        c.font = 'bold 12px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = GRN; c.fillText('' + (i + 1), nx, ny);
      } else {
        // Unlocked: green node + stage number
        c.beginPath(); c.arc(nx, ny, 12, 0, Math.PI * 2);
        c.fillStyle = '#0e1117'; c.fill();
        c.strokeStyle = GRN; c.lineWidth = 2;
        c.shadowColor = GRN; c.shadowBlur = 6; c.stroke(); c.shadowBlur = 0;
        c.font = 'bold 11px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = GRN; c.fillText('' + (i + 1), nx, ny);
      }
    }

    // ── LEFT TOOLBAR (TradingView style drawing tools) ──
    c.fillStyle = '#0b0f18'; c.fillRect(0, TOP_H, TOOLBAR_W, ch - TOP_H);
    c.strokeStyle = BRD; c.lineWidth = 1;
    c.beginPath(); c.moveTo(TOOLBAR_W, TOP_H); c.lineTo(TOOLBAR_W, ch); c.stroke();

    const tools = [
      // 0: Cursor (arrow)
      (x,y) => { c.beginPath(); c.moveTo(x-4,y-8); c.lineTo(x-4,y+4); c.lineTo(x-1,y+1); c.lineTo(x+3,y+7); c.lineTo(x+5,y+6); c.lineTo(x+1,y); c.lineTo(x+5,y); c.closePath(); c.fill(); },
      // 1: Crosshair
      (x,y) => { c.beginPath(); c.moveTo(x,y-8); c.lineTo(x,y-3); c.moveTo(x,y+3); c.lineTo(x,y+8); c.moveTo(x-8,y); c.lineTo(x-3,y); c.moveTo(x+3,y); c.lineTo(x+8,y); c.stroke(); c.beginPath(); c.arc(x,y,3,0,Math.PI*2); c.stroke(); },
      // 2: Trend line (with endpoints)
      (x,y) => { c.beginPath(); c.moveTo(x-8,y+6); c.lineTo(x+8,y-6); c.stroke(); c.beginPath(); c.arc(x-8,y+6,2,0,Math.PI*2); c.fill(); c.beginPath(); c.arc(x+8,y-6,2,0,Math.PI*2); c.fill(); },
      // 3: Fib retracement (highlighted — active tool)
      (x,y) => { c.beginPath(); c.moveTo(x-8,y+7); c.lineTo(x-8,y-7); c.lineTo(x+8,y-7); c.stroke(); for(let j=0;j<4;j++){const ly=y-7+j*4.7; c.beginPath(); c.moveTo(x-7,ly); c.lineTo(x+7,ly); c.stroke();} },
      // 4: Horizontal ray
      (x,y) => { c.beginPath(); c.moveTo(x-8,y); c.lineTo(x+8,y); c.stroke(); c.beginPath(); c.arc(x-8,y,2,0,Math.PI*2); c.fill(); c.beginPath(); c.moveTo(x+5,y-3); c.lineTo(x+8,y); c.lineTo(x+5,y+3); c.stroke(); },
      // 5: Channel (parallel lines)
      (x,y) => { c.beginPath(); c.moveTo(x-8,y+2); c.lineTo(x+8,y-4); c.moveTo(x-8,y+7); c.lineTo(x+8,y+1); c.stroke(); c.setLineDash([2,2]); c.beginPath(); c.moveTo(x-8,y+4.5); c.lineTo(x+8,y-1.5); c.stroke(); c.setLineDash([]); },
      // 6: Pitchfork
      (x,y) => { c.beginPath(); c.moveTo(x-8,y+5); c.lineTo(x,y-7); c.lineTo(x+8,y+5); c.stroke(); c.setLineDash([2,2]); c.beginPath(); c.moveTo(x,y-7); c.lineTo(x,y+7); c.stroke(); c.setLineDash([]); },
      // 7: Rectangle
      (x,y) => { c.strokeRect(x-7,y-5,14,10); c.beginPath(); c.arc(x-7,y-5,1.5,0,Math.PI*2); c.fill(); c.beginPath(); c.arc(x+7,y+5,1.5,0,Math.PI*2); c.fill(); },
      // 8: Brush / freehand
      (x,y) => { c.beginPath(); c.moveTo(x-7,y+4); c.quadraticCurveTo(x-4,y-6,x,y); c.quadraticCurveTo(x+4,y+6,x+7,y-2); c.stroke(); },
      // 9: Text "Abc"
      (x,y) => { c.font = '10px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Abc', x, y); },
      // 10: Ruler / measure
      (x,y) => { c.beginPath(); c.moveTo(x-7,y+6); c.lineTo(x+7,y-6); c.stroke(); c.beginPath(); c.arc(x-7,y+6,1.5,0,Math.PI*2); c.fill(); c.beginPath(); c.arc(x+7,y-6,1.5,0,Math.PI*2); c.fill(); c.beginPath(); c.moveTo(x-7,y+6); c.lineTo(x-7,y-2); c.moveTo(x+7,y-6); c.lineTo(x+7,y+2); c.stroke(); },
      // 11: Magnet
      (x,y) => { c.beginPath(); c.arc(x,y-3,6,Math.PI,0); c.stroke(); c.fillRect(x-6,y-3,3,7); c.fillRect(x+3,y-3,3,7); },
      // 12: Eye (show/hide)
      (x,y) => { c.beginPath(); c.moveTo(x-8,y); c.quadraticCurveTo(x,y-7,x+8,y); c.quadraticCurveTo(x,y+7,x-8,y); c.closePath(); c.stroke(); c.beginPath(); c.arc(x,y,2.5,0,Math.PI*2); c.fill(); },
      // 13: Trash can
      (x,y) => { c.beginPath(); c.moveTo(x-6,y-4); c.lineTo(x+6,y-4); c.stroke(); c.beginPath(); c.moveTo(x-2,y-4); c.lineTo(x-1,y-7); c.lineTo(x+1,y-7); c.lineTo(x+2,y-4); c.stroke(); c.beginPath(); c.moveTo(x-5,y-4); c.lineTo(x-4,y+7); c.lineTo(x+4,y+7); c.lineTo(x+5,y-4); c.stroke(); c.beginPath(); c.moveTo(x-1,y-2); c.lineTo(x-1,y+5); c.moveTo(x+1,y-2); c.lineTo(x+1,y+5); c.stroke(); }
    ];

    const fibToolIdx = 3;
    const tStartY = TOP_H + 20;
    const toolSpacing = 32;
    for (let i = 0; i < tools.length; i++) {
      const tx = TOOLBAR_W / 2, ty = tStartY + i * toolSpacing;
      if (ty > ch - 60) break;
      // Separator lines between tool groups
      if (i === 2 || i === 7 || i === 10 || i === 12) {
        c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(6, ty - toolSpacing / 2); c.lineTo(TOOLBAR_W - 6, ty - toolSpacing / 2); c.stroke();
      }
      // Highlight active tool (fib)
      if (i === fibToolIdx) {
        c.fillStyle = 'rgba(45,226,176,0.12)';
        rr(4, ty - 12, TOOLBAR_W - 8, 24, 4); c.fill();
        c.strokeStyle = GRN + '33'; c.lineWidth = 1;
        rr(4, ty - 12, TOOLBAR_W - 8, 24, 4); c.stroke();
      }
      c.strokeStyle = i === fibToolIdx ? GRN : 'rgba(255,255,255,0.35)';
      c.fillStyle = i === fibToolIdx ? GRN : 'rgba(255,255,255,0.35)';
      c.lineWidth = 1.3;
      tools[i](tx, ty);
    }

    // ── BOTTOM TIME AXIS ──
    const taY = CH_B + 4;
    c.fillStyle = '#0b0f18'; c.fillRect(TOOLBAR_W, taY, cw - TOOLBAR_W, TIME_AX_H);
    c.strokeStyle = BRD; c.lineWidth = 1;
    c.beginPath(); c.moveTo(TOOLBAR_W, taY); c.lineTo(cw, taY); c.stroke();

    c.font = '9px "JetBrains Mono", monospace'; c.textBaseline = 'middle'; c.textAlign = 'center';
    // Time labels at each stage x position
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let i = 0; i < 10; i++) {
      const tx = sN[i].x;
      const m = months[(i + 2) % 12];
      const yr = i < 10 ? '25' : '26';
      const label = m + " '" + yr;
      // Tick mark
      c.strokeStyle = 'rgba(255,255,255,0.1)';
      c.beginPath(); c.moveTo(tx, taY); c.lineTo(tx, taY + 5); c.stroke();
      // Label
      c.fillStyle = i === G.stage ? GRN : 'rgba(255,255,255,0.3)';
      c.fillText(label, tx, taY + 16);
    }

    _stageMapAnim = requestAnimationFrame(frame);
  }
  frame();
}

// ============ EVENT LISTENERS ============
// ============ SETTINGS ============
let dmgNumbersEnabled = true;

const SETTINGS_DEFAULTS = { masterVol: 50, sfxVol: 60, musicVol: 30, radioVol: 50, shakeEnabled: true, dmgNumbersEnabled: true };

function loadSettings() {
  let s = SETTINGS_DEFAULTS;
  try {
    const raw = localStorage.getItem('hl_survivor_settings');
    if (raw) s = Object.assign({}, SETTINGS_DEFAULTS, JSON.parse(raw));
  } catch(e) {}
  // Apply audio
  if (masterGain) masterGain.gain.value = s.masterVol / 100;
  if (sfxGain) sfxGain.gain.value = s.sfxVol / 100;
  if (musicGain) musicGain.gain.value = s.musicVol / 100;
  if (typeof setRadioVolume === 'function') setRadioVolume(s.radioVol / 100);
  // Apply toggles
  shakeEnabled = s.shakeEnabled;
  dmgNumbersEnabled = s.dmgNumbersEnabled;
  // Sync UI
  document.getElementById('set-master').value = s.masterVol;
  document.getElementById('set-master-val').textContent = s.masterVol;
  document.getElementById('set-sfx').value = s.sfxVol;
  document.getElementById('set-sfx-val').textContent = s.sfxVol;
  document.getElementById('set-music').value = s.musicVol;
  document.getElementById('set-music-val').textContent = s.musicVol;
  document.getElementById('set-radio').value = s.radioVol;
  document.getElementById('set-radio-val').textContent = s.radioVol;
  const shakeBtn = document.getElementById('set-shake');
  shakeBtn.textContent = s.shakeEnabled ? 'ON' : 'OFF';
  shakeBtn.className = 'settings-toggle ' + (s.shakeEnabled ? 'on' : 'off');
  const dmgBtn = document.getElementById('set-dmgnums');
  dmgBtn.textContent = s.dmgNumbersEnabled ? 'ON' : 'OFF';
  dmgBtn.className = 'settings-toggle ' + (s.dmgNumbersEnabled ? 'on' : 'off');
}

function saveSettings() {
  const s = {
    masterVol: parseInt(document.getElementById('set-master').value),
    sfxVol: parseInt(document.getElementById('set-sfx').value),
    musicVol: parseInt(document.getElementById('set-music').value),
    radioVol: parseInt(document.getElementById('set-radio').value),
    shakeEnabled: shakeEnabled,
    dmgNumbersEnabled: dmgNumbersEnabled
  };
  try { localStorage.setItem('hl_survivor_settings', JSON.stringify(s)); } catch(e) {}
}

let _settingsReturnTo = null;

function openSettings(returnTo) {
  _settingsReturnTo = returnTo || null;
  if (returnTo) document.getElementById(returnTo).classList.add('h');
  document.getElementById('settings-menu').classList.remove('h');
}

function closeSettings() {
  document.getElementById('settings-menu').classList.add('h');
  if (_settingsReturnTo) document.getElementById(_settingsReturnTo).classList.remove('h');
  _settingsReturnTo = null;
}

// Settings sliders
['master', 'sfx', 'music', 'radio'].forEach(key => {
  document.getElementById('set-' + key).addEventListener('input', function() {
    document.getElementById('set-' + key + '-val').textContent = this.value;
    const v = this.value / 100;
    if (key === 'master' && masterGain) masterGain.gain.value = v;
    else if (key === 'sfx' && sfxGain) sfxGain.gain.value = v;
    else if (key === 'music' && musicGain) musicGain.gain.value = v;
    else if (key === 'radio' && typeof setRadioVolume === 'function') setRadioVolume(v);
    saveSettings();
  });
});

// Settings toggles
document.getElementById('set-shake').addEventListener('click', function() {
  shakeEnabled = !shakeEnabled;
  this.textContent = shakeEnabled ? 'ON' : 'OFF';
  this.className = 'settings-toggle ' + (shakeEnabled ? 'on' : 'off');
  saveSettings();
});

document.getElementById('set-dmgnums').addEventListener('click', function() {
  dmgNumbersEnabled = !dmgNumbersEnabled;
  this.textContent = dmgNumbersEnabled ? 'ON' : 'OFF';
  this.className = 'settings-toggle ' + (dmgNumbersEnabled ? 'on' : 'off');
  saveSettings();
});

// Settings open/close buttons
document.getElementById('btn-settings-main').addEventListener('click', () => openSettings('mm'));
document.getElementById('btn-settings-pause').addEventListener('click', () => openSettings('pause-menu'));
document.getElementById('btn-settings-close').addEventListener('click', closeSettings);

// Load saved settings on startup
setTimeout(() => { initAudio(); loadSettings(); }, 50);

document.getElementById('btn-arcade').addEventListener('click', () => startGame('arcade'));
document.getElementById('btn-adventure').addEventListener('click', () => startGame('adventure'));

// DEV: Stage select — jump directly to any stage
document.getElementById('dev-stage-select').addEventListener('change', function() {
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
document.getElementById('stage-map-close').addEventListener('click', function() {
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

// ============ MENU BACKGROUND ANIMATION ============
(function initMenuBG() {
  const mc = document.getElementById('menu-bg');
  if (!mc) return;
  mc.width = 1000; mc.height = 700;
  const mx = mc.getContext('2d');

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
    if (G.phase !== 'menu') {
      setTimeout(animateMenu, 500);
      return;
    }
    mx.clearRect(0, 0, 1000, 700);


    // Draw falling ticker columns
    mx.font = '600 9px "JetBrains Mono", monospace';
    for (const col of columns) {
      for (const item of col.items) {
        mx.globalAlpha = item.alpha;
        mx.fillStyle = item.isGreen ? '#00ff88' : '#ff4757';
        mx.fillText(item.ticker, col.x, item.y);
        mx.fillStyle = '#555';
        mx.fillText('$' + item.price, col.x, item.y + 11);
        mx.fillStyle = item.isGreen ? '#00ff88' : '#ff4757';
        mx.fillText((item.isGreen ? '+' : '') + item.change + '%', col.x, item.y + 22);

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

    mx.globalAlpha = 1;

    // Grid lines
    mx.strokeStyle = 'rgba(80, 227, 194, 0.06)';
    mx.lineWidth = 1;
    for (let y = 0; y < 700; y += 50) { mx.beginPath(); mx.moveTo(0, y); mx.lineTo(1000, y); mx.stroke(); }
    for (let x = 0; x < 1000; x += 50) { mx.beginPath(); mx.moveTo(x, 0); mx.lineTo(x, 700); mx.stroke(); }

    requestAnimationFrame(animateMenu);
  }

  animateMenu();
})();
