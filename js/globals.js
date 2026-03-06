// ============ GAME GLOBALS & CONSTANTS ============

// Boss order for cycling every 10 waves
const BOSS_ORDER = ['loudmouth', 'hashbeast', 'spiralking', 'northstar', 'unbanker', 'vultures', 'prophet', 'mathsorcerer', 'guardian', 'emperor'];
const WAVES_PER_STAGE = 2; // Normal: 5, set to 2 for testing

// Wave duration per mode
window.WAVE_DURATION = function (wave) {
    if (G.mode === 'arcade') return Math.min(20 + wave * 0.8, 45);
    return Math.min(15 + wave * 1.5, 60);
}

// Difficulty scaling per wave per mode
window.getDifficulty = function (wave) {
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

// ============ LEVERAGE SYSTEM ============
const LEVERAGE_STEPS = [1, 2, 3, 5, 10, 15, 20, 25, 50];

window.getLeverageStats = function (lev) {
    return {
        dmgMult: lev,
        recvMult: lev,
        sizeMult: 1 + (lev - 1) * 0.04
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
    totalDmgDealt: 0, totalDmgTaken: 0, totalGoldEarned: 0, bossesKilled: 0,
    dpsHistory: [], dpsAccum: 0, dpsTimer: 0, currentDPS: 0,
    lastMilestone: 0,
    pendingLevelUps: 0
};

// Player object needs to use constants that might be in game.js. 
// We define them as properties or let them be initialized properly later if WORLD_W/H aren't ready.
const P = {
    x: 2000 / 2, y: 2000 / 2, sz: 12, hp: 100, maxHp: 100, spd: 200, armor: 0, crit: 5,
    xp: 0, xpNext: 50, level: 1, weapons: [], maxWeapons: 5, iframes: 0, flash: 0, angle: 0,
    dmgMult: 1, cdMult: 1, magnetRange: 100,
    leverage: 1, leverageIdx: 0,
    dashCd: 0, dashTimer: 0, dashing: false, dashDir: { x: 0, y: 0 },
    animTimer: 0,
    vx: 0, vy: 0
};

// Export to window explicitly to avoid scoping issues with type="module" or strict mode
window.BOSS_ORDER = BOSS_ORDER;
window.WAVES_PER_STAGE = WAVES_PER_STAGE;
window.BOSSES = BOSSES;
window.LEVERAGE_STEPS = LEVERAGE_STEPS;
window.G = G;
window.P = P;
