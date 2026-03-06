// ============ POOLS ============
const MAX_ENEMIES = 150;
const MAX_PROJECTILES = 300;
const MAX_DMG_NUMS = 80;

class Pool {
    constructor(f, n, max) {
        n = n || 200;
        this.max = max || Infinity;
        this.items = [];
        for (let i = 0; i < n; i++) {
            const o = f();
            o.active = false;
            this.items.push(o);
        }
    }
    get() {
        if (this.max !== Infinity && this.count >= this.max) return null;
        for (const o of this.items) {
            if (!o.active) {
                o.active = true;
                return o;
            }
        }
        const o = { ...this.items[0], active: true };
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

const enemies = new Pool(() => ({ active: false, x: 0, y: 0, hp: 0, maxHp: 0, dmg: 0, spd: 0, sz: 0, type: 0, gold: 0, xp: 0, kbX: 0, kbY: 0, flash: 0, behaviorTimer: 0, behaviorState: 0, isSplit: false, isElite: false, anim: 'walk', animF: 0, animT: 0, faceX: 1, dying: false }), 500, MAX_ENEMIES);
const projs = new Pool(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 0, pierce: 1, hitCnt: 0, hits: new Set(), friendly: true, col: '#fff' }), 300, MAX_PROJECTILES);
const pickups = new Pool(() => ({ active: false, x: 0, y: 0, type: '', val: 0, mag: false }), 50);
const hazards = new Pool(() => ({ active: false, type: '', x: 0, y: 0, life: 0, tick: 0, data: {} }), 50);
const dmgNums = [];

function addDmgNum(obj) {
    if (typeof obj.n === 'number' || !isNaN(obj.n)) return;
    if (dmgNums.length < MAX_DMG_NUMS) dmgNums.push(obj);
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
}

function updateEnemyAnim(e, dt) {
    const ad = typeof ENEMY_ANIMS !== 'undefined' ? ENEMY_ANIMS[e.type] : null; // Ensure globals are safe
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
