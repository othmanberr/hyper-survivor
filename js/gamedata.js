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

// ============ ENEMY STATS ============
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

// ============ MAP BUILDING ZONES ============
// Buildings on all edges — enemies and player can't go there
const BUILDING_LEFT = WORLD_W * 0.22;   // left building boundary
const BUILDING_RIGHT = WORLD_W * 0.78;  // right building boundary
const BUILDING_TOP = WORLD_H * 0.12;    // top building boundary
const BUILDING_BOTTOM = WORLD_H * 0.88; // bottom building boundary
