// ============ POOLS ============
const MAX_ENEMIES = 150;
const MAX_PROJECTILES = 300;
const MAX_DMG_NUMS = 80;

class Pool {
    constructor(f, n, max) {
        n = n || 200;
        this.max = max || Infinity;
        this.factory = f;
        this.items = [];
        for (let i = 0; i < n; i++) {
            const o = this.factory();
            o.active = false;
            this.items.push(o);
        }
    }
    get() {
        if (this.max !== Infinity && this.count >= this.max) return null;
        for (const o of this.items) {
            if (!o.active) {
                o.active = true;
                if (o.hits instanceof Set) {
                    o.hits.clear();
                    o.hitCnt = 0;
                    o.vis = null;
                    o._size = 1;
                    o._ang = undefined;
                    o._spin = 0;
                    o._homing = false;
                    o._homingStr = 0;
                    o._bounces = 0;
                    o._trail = false;
                    o._explodeArea = 0;
                    o._burnDmg = 0;
                    o._burnDuration = 0;
                    o._ttl = 0;
                    o._gravity = 0;
                    o._explodeOnExpire = false;
                    o._prevX = o.x;
                    o._prevY = o.y;
                    o._midX = o.x;
                    o._midY = o.y;
                    if (typeof resetProjectileVisualState === 'function') resetProjectileVisualState(o);
                }
                if (o.data && typeof o.data === 'object' && Object.prototype.hasOwnProperty.call(o, 'type') && Object.prototype.hasOwnProperty.call(o, 'life')) {
                    o.type = '';
                    o.life = 0;
                    o.tick = 0;
                    o.data = {};
                }
                return o;
            }
        }
        const o = this.factory();
        o.active = true;
        this.items.push(o);
        return o;
    }
    each(f) {
        for (const o of this.items) if (o.active) f(o);
    }
    clear() {
        for (const o of this.items) o.active = false;
    }
    get count() {
        let c = 0;
        for (const o of this.items) if (o.active) c++;
        return c;
    }
}

const enemies = new Pool(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, hp: 0, maxHp: 0, dmg: 0, spd: 0, sz: 0, type: 0, gold: 0, xp: 0, kbX: 0, kbY: 0, flash: 0, behaviorTimer: 0, behaviorState: 0, isSplit: false, isElite: false, anim: 'walk', animF: 0, animT: 0, animBlend: 0, faceX: 1, dying: false, deathFade: 0, drawX: NaN, drawY: NaN, renderDirAngle: NaN, renderBob: 0, renderLean: 0, renderScaleX: 1, renderScaleY: 1, spawnReveal: 0, deathLift: 0, deathRot: 0, deathSpin: 0, _attitude: 'hunt', _attitudeTimer: 0, _attitudePower: 0, _alertTimer: 0, _staggerTimer: 0, _spawnDirX: 0, _spawnDirY: 1, _hitDirX: 0, _hitDirY: -1, _deathDirX: 0, _deathDirY: -1, _burnTime: 0, _burnDmg: 0, _burnFxCd: 0 }), 500, MAX_ENEMIES);
const projs = new Pool(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 0, pierce: 1, hitCnt: 0, hits: new Set(), friendly: true, col: '#fff' }), 300, MAX_PROJECTILES);
const pickups = new Pool(() => ({ active: false, x: 0, y: 0, type: '', val: 0, mag: false }), 50);
const hazards = new Pool(() => ({ active: false, type: '', x: 0, y: 0, life: 0, tick: 0, data: {} }), 50);
const dmgNums = [];

function addDmgNum(obj) {
    return;
}

let _frameNearest = null, _frameNearestDistSq = Infinity;

// ============ SPATIAL HASH ============
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
    qry(x, y, r) {
        const rs = this._buf; rs.length = 0;
        for (let cx = Math.floor((x - r) / this.s); cx <= Math.floor((x + r) / this.s); cx++) {
            for (let cy = Math.floor((y - r) / this.s); cy <= Math.floor((y + r) / this.s); cy++) {
                const cl = this.c.get(`${cx},${cy}`);
                if (cl) {
                    for (let i = 0; i < cl.length; i++) {
                        const e = cl[i];
                        if ((e.x - x) ** 2 + (e.y - y) ** 2 <= r * r) rs.push(e);
                    }
                }
            }
        }
        return rs;
    }
};

// ============ ENEMY ANIMATION STATE MACHINE ============
function setAnim(e, state) {
    if (e.anim === state) return;
    if (e.anim === 'death') return; // death is terminal
    e.anim = state;
    e.animF = 0;
    e.animT = 0;
    e.animBlend = 0;
}

function wrapEnemyAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function updateEnemyVisualRuntime(e, dt) {
  if (!Number.isFinite(e.drawX)) e.drawX = e.x;
  if (!Number.isFinite(e.drawY)) e.drawY = e.y;
  // drawX/drawY is the ONLY smoothed render position (game.js also lerps → removed there)
  // Use exponential smoothing for very fluid motion
  const posFollow = Math.min(1, dt * (e.dying ? 28 : 22));
  e.drawX += (e.x - e.drawX) * posFollow;
  e.drawY += (e.y - e.drawY) * posFollow;

  const attitude = e._attitude || 'hunt';
  const attitudePower = Math.max(0, Math.min(1.25, e._attitudePower || 0));
  // Use smoothed velocity for direction (much less jittery)
  const svx = Number.isFinite(e._smoothVX) ? e._smoothVX : (e.vx || 0);
  const svy = Number.isFinite(e._smoothVY) ? e._smoothVY : (e.vy || 0);
  const speed = Math.hypot(svx, svy);
  let targetAngle = 0;
  if (attitude === 'windup' || attitude === 'cast' || attitude === 'alert' || attitude === 'support') {
    targetAngle = Math.atan2(P.y - e.y, P.x - e.x);
  } else if (speed > 10) targetAngle = Math.atan2(svy, svx);
  else if (typeof P !== 'undefined') targetAngle = Math.atan2(P.y - e.y, P.x - e.x);
  if (!Number.isFinite(e.renderDirAngle)) e.renderDirAngle = targetAngle;
  // Smooth angular interpolation — lower = more fluid turning
  const angleStep = Math.min(Math.abs(wrapEnemyAngle(targetAngle - e.renderDirAngle)), dt * (e.dying ? 4.5 : 5.0));
  const angleSign = Math.sign(wrapEnemyAngle(targetAngle - e.renderDirAngle));
  e.renderDirAngle = wrapEnemyAngle(e.renderDirAngle + angleSign * angleStep);

  let bobTarget = e.dying ? 0 : Math.sin((e.animF + (e.animBlend || 0)) * Math.PI * 0.66) * Math.min(3.2, speed * 0.018);
  if (attitude === 'alert') bobTarget += 1.1 * attitudePower;
  else if (attitude === 'windup' || attitude === 'cast') bobTarget += 1.6 * attitudePower;
  else if (attitude === 'commit') bobTarget += 0.9 * attitudePower;
  else if (attitude === 'stagger') bobTarget -= 0.8 * attitudePower;
  e.renderBob += (bobTarget - e.renderBob) * Math.min(1, dt * 8);
  let leanTarget = e.dying ? 0 : Math.max(-0.12, Math.min(0.12, svx / 800));
  if (attitude === 'commit') {
    leanTarget += Math.max(-0.12, Math.min(0.12, Math.cos(e.renderDirAngle || 0) * 0.08 * attitudePower));
  } else if (attitude === 'stagger') {
    const jitter = Math.sin((((typeof G !== 'undefined' ? G.totalTime : 0) || 0) * 42) + (e._motionSeed || 0));
    leanTarget += jitter * 0.12 * attitudePower;
  } else if (attitude === 'windup' || attitude === 'cast') {
    leanTarget *= 0.55;
  }
  e.renderLean += (leanTarget - e.renderLean) * Math.min(1, dt * 6);

  let scaleXTarget = 1;
  let scaleYTarget = 1;
  if (!e.dying && speed > 32) {
    scaleXTarget = 1 + Math.min(0.08, speed / 900);
    scaleYTarget = 1 - Math.min(0.06, speed / 1200);
  }
  if (attitude === 'alert') {
    scaleXTarget -= 0.03 * attitudePower;
    scaleYTarget += 0.05 * attitudePower;
  } else if (attitude === 'windup' || attitude === 'cast') {
    scaleXTarget -= 0.05 * attitudePower;
    scaleYTarget += 0.08 * attitudePower;
  } else if (attitude === 'commit') {
    scaleXTarget += 0.11 * attitudePower;
    scaleYTarget -= 0.08 * attitudePower;
  } else if (attitude === 'recover') {
    scaleXTarget += 0.03 * attitudePower;
    scaleYTarget -= 0.05 * attitudePower;
  } else if (attitude === 'stagger') {
    scaleXTarget += 0.09 * attitudePower;
    scaleYTarget -= 0.07 * attitudePower;
  }
  if (e.spawnReveal > 0) {
    e.spawnReveal = Math.max(0, e.spawnReveal - dt);
  }
  e.renderScaleX += (scaleXTarget - e.renderScaleX) * Math.min(1, dt * 7);
  e.renderScaleY += (scaleYTarget - e.renderScaleY) * Math.min(1, dt * 7);

  // Death: no lift/spin/drift — just freeze in place
  if (!e.dying) {
    e.deathLift = 0;
    e.deathRot = 0;
  }
}

function updateEnemyAnim(e, dt) {
    updateEnemyVisualRuntime(e, dt);

    // Post-death fade-out phase: hold last frame and fade to zero
    if (e.deathFade > 0) {
        e.deathFade -= dt;
        if (e.deathFade <= 0) {
            e.active = false; // fully faded → remove
        }
        return;
    }

    const ad = typeof ENEMY_ANIMS !== 'undefined' ? ENEMY_ANIMS[e.type] : null;
    if (!ad) return;
    const st = ad[e.anim];
    if (!st || !st.frames.length) return;

    // Dynamic animation speed — walk faster = animate faster
    let fps = st.fps || 7;
    if (e.anim === 'walk') {
      const svx = Number.isFinite(e._smoothVX) ? e._smoothVX : (e.vx || 0);
      const svy = Number.isFinite(e._smoothVY) ? e._smoothVY : (e.vy || 0);
      const spd = Math.hypot(svx, svy);
      const move = typeof ENEMY_MOVE !== 'undefined' ? (ENEMY_MOVE[e.type] || ENEMY_MOVE[0]) : null;
      const maxSpd = move ? (e.spd || 1) * move.maxSpd : 80;
      const spdRatio = Math.min(1.6, spd / Math.max(20, maxSpd * 0.5));
      fps = Math.max(3, fps * Math.max(0.4, spdRatio));
    } else if (e.anim === 'death') {
      fps = Math.max(7, fps);
    }

    e.animT += dt;
    const frameDur = 1 / fps;
    e.animBlend = Math.max(0, Math.min(1, e.animT / frameDur));
    if (e.animT >= frameDur) {
        e.animT -= frameDur;
        e.animF++;
        if (e.animF >= st.frames.length) {
            if (st.loop) {
                e.animF = 0;
            } else if (e.anim === 'death') {
                // Hold on last frame and start a shorter fade-out.
                e.animF = st.frames.length - 1;
                e.animBlend = 0;
                e.deathFade = 0.24;
                return;
            } else {
                e.anim = 'walk';
                e.animF = 0;
                e.animT = 0;
                e.animBlend = 0;
            }
        }
    }
}

// ============ UTILITY MATH/FORMAT METHODS ============
window.rand = function (min, max) { return Math.random() * (max - min) + min; }
window.rr = function (x, y, w, h, r) {
    const c = typeof ctx !== 'undefined' ? ctx : null;
    if (!c) return;
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
window.distSq = function (x1, y1, x2, y2) { return (x1 - x2) ** 2 + (y1 - y2) ** 2; }
window.formatNumber = function (num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
window.formatTime = function (s) {
    let m = Math.floor(s / 60);
    let sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// Export everything to global so game.js and other files can freely use them without module imports
window.Pool = Pool;
window.enemies = enemies;
window.projs = projs;
window.pickups = pickups;
window.hazards = hazards;
window.dmgNums = dmgNums;
window.addDmgNum = addDmgNum;
window.hash = hash;
window.setAnim = setAnim;
window.updateEnemyAnim = updateEnemyAnim;
