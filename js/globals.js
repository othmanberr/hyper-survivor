// ============ GAME GLOBALS & CONSTANTS ============

// Boss order for cycling every 10 waves
const BOSS_ORDER = ['murad', 'carlos', 'ape', 'dokwon', 'logan', 'ruja', 'caroline', 'kwon', 'sam', 'cz'];
const WAVES_PER_STAGE = 2; // Normal: 5, set to 2 for testing

// ============ DEBUG MODE ============
// Mettre à true pour voir tous les ennemis en mode très facile
const DEBUG_ALL_ENEMIES = false;

// Wave duration per mode
window.WAVE_DURATION = function (wave) {
    if (G.mode === 'arcade') return Math.min(20 + wave * 0.8, 45);
    return Math.min(15 + wave * 1.5, 60);
}

// Difficulty scaling per wave per mode
window.getDifficulty = function (wave) {
    const enemyTypeCap = Math.max(0, (typeof ENEMY_DEFS !== 'undefined' ? ENEMY_DEFS.length : 8) - 1);
    if (typeof DEBUG_ALL_ENEMIES !== 'undefined' && DEBUG_ALL_ENEMIES) {
        return {
            hpMult: 0.06,                      // Ennemis meurent en 1 balle
            spdMult: 0.5,                       // Lents
            spawnRate: 2.5,                       // Spawn lent
            batchSize: 1,
            maxType: enemyTypeCap
        };
    }
    if (G.mode === 'arcade') {
        return {
            hpMult: 1 + wave * 0.12,
            spdMult: 1 + wave * 0.015,
            spawnRate: Math.max(0.08, 0.8 - wave * 0.007),
            batchSize: 2 + Math.floor(wave * 0.5),
            maxType: Math.min(enemyTypeCap, 2 + Math.floor((Math.max(1, wave) - 1) / 4))
        };
    }
    return {
        hpMult: 1 + wave * 0.08,
        spdMult: 1 + wave * 0.02,
        spawnRate: Math.max(0.15, 0.8 - wave * 0.03),
        batchSize: 2 + Math.floor(wave * 0.4),
        maxType: Math.min(enemyTypeCap, 2 + Math.floor((Math.max(1, wave) - 1) / 2))
    };
}

const WAVE_SPAWN_MIXES = [
    [
        { type: 0, weight: 34 },
        { type: 1, weight: 38 },
        { type: 2, weight: 28 }
    ],
    [
        { type: 0, weight: 26 },
        { type: 1, weight: 30 },
        { type: 2, weight: 24 },
        { type: 6, weight: 20 }
    ],
    [
        { type: 0, weight: 18 },
        { type: 1, weight: 24 },
        { type: 2, weight: 20 },
        { type: 3, weight: 14 },
        { type: 6, weight: 24 }
    ],
    [
        { type: 1, weight: 20 },
        { type: 2, weight: 18 },
        { type: 3, weight: 16 },
        { type: 4, weight: 12 },
        { type: 6, weight: 18 },
        { type: 7, weight: 16 }
    ],
    [
        { type: 1, weight: 16 },
        { type: 2, weight: 16 },
        { type: 3, weight: 14 },
        { type: 4, weight: 14 },
        { type: 5, weight: 12 },
        { type: 6, weight: 12 },
        { type: 7, weight: 16 }
    ],
    [
        { type: 0, weight: 8 },
        { type: 1, weight: 12 },
        { type: 2, weight: 14 },
        { type: 3, weight: 14 },
        { type: 4, weight: 14 },
        { type: 5, weight: 14 },
        { type: 6, weight: 10 },
        { type: 7, weight: 14 }
    ]
];

window.getWaveSpawnMix = function (wave, maxType) {
    const enemyTypeCap = Math.max(0, (typeof ENEMY_DEFS !== 'undefined' ? ENEMY_DEFS.length : 8) - 1);
    const cap = Math.max(0, Math.min(
        Number.isFinite(maxType) ? maxType : enemyTypeCap,
        enemyTypeCap
    ));
    const idx = wave <= 1 ? 0
        : wave <= 2 ? 1
            : wave <= 4 ? 2
                : wave <= 6 ? 3
                    : wave <= 9 ? 4
                        : 5;
    const mix = (WAVE_SPAWN_MIXES[idx] || WAVE_SPAWN_MIXES[WAVE_SPAWN_MIXES.length - 1])
        .filter(entry => entry.type <= cap);
    if (mix.length) return mix;
    const fallback = [];
    for (let type = 0; type <= cap; type++) fallback.push({ type, weight: 1 });
    return fallback;
}

const BOSSES = {
    murad:   { name: 'THE MEME PROPHET',      sub: 'Murad',          hp: 500,  spd: 1.0,  sz: 40, col: '#89ff3b', attacks: ['shillstorm', 'cultcircle'] },
    carlos:  { name: 'THE PONZI VOICE',      sub: 'Carlos Matos',   hp: 700,  spd: 1.0,  sz: 42, col: '#ffd54f', attacks: ['bitconnect', 'referral'] },
    ape:     { name: 'THE BORED APE',         sub: 'Ape',            hp: 800,  spd: 1.1,  sz: 44, col: '#8b6914', attacks: ['barrelthrow', 'apeslam'] },
    dokwon:  { name: 'THE SUN KING',           sub: 'Justin Sun',     hp: 1000, spd: 1.05, sz: 40, col: '#ff4444', attacks: ['deathspiral', 'depegfield'] },
    logan:   { name: 'THE CLOUT BUTCHER',     sub: 'Logan Paul',     hp: 1100, spd: 1.12, sz: 42, col: '#ff7ad9', attacks: ['flashko', 'scamzoo'] },
    ruja:    { name: 'THE PHANTOM QUEEN',     sub: 'Ruja Ignatova',  hp: 1200, spd: 1.08, sz: 42, col: '#cc44aa', attacks: ['goldenmirage', 'phantomverdict'] },
    caroline:{ name: 'THE SPREADSHEET QUEEN', sub: 'Caroline Ellison', hp: 1400, spd: 1.06, sz: 40, col: '#ff8fab', attacks: ['alamedadrain', 'liquidationcascade'] },
    kwon:    { name: 'THE TERRA DESTROYER',   sub: 'Do Kwon',            hp: 1600, spd: 1.1, sz: 42, col: '#e74c3c', attacks: ['lunacollapse', 'stablecoinfraud'] },
    sam:     { name: 'THE BACKDOOR KING',     sub: 'Sam Bankman-Fried', hp: 2000, spd: 0.9, sz: 46, col: '#6effcf', attacks: ['backdoorportals', 'balancesheet'] },
    cz:      { name: 'THE IRON EMPEROR',      sub: 'CZ',             hp: 2800, spd: 0.94, sz: 52, col: '#ffd84d', attacks: ['marketdomination', 'bisoncharge'] }
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
    mode: 'arcade', stage: 0, selectedCharacter: 'jeff', arcadeMap: 0,
    wave: 0, waveTime: 0, waveMaxTime: 0, phase: 'menu', prevPhase: null,
    gold: 0, kills: 0, boss: null, bossKey: null, freezeTime: 0, totalTime: 0, shopMode: 'wave',
    combo: 0, comboTimer: 0, maxCombo: 0, spawnCd: 0, bossIntroTime: 0,
    waveIntroTime: 0,
    totalDmgDealt: 0, totalDmgTaken: 0, totalGoldEarned: 0, bossesKilled: 0,
    dpsHistory: [], dpsAccum: 0, dpsTimer: 0, currentDPS: 0,
    lastMilestone: 0,
    pendingLevelUps: 0,
    _recentSpawnTypes: []
};

// Player object needs to use constants that might be in game.js. 
// We define them as properties or let them be initialized properly later if WORLD_W/H aren't ready.
const P = {
    x: 2000 / 2, y: 2000 / 2, sz: 12, hp: 100, maxHp: 100, spd: 200, armor: 0, crit: 5,
    xp: 0, xpNext: 50, level: 1, weapons: [], maxWeapons: 5, iframes: 0, flash: 0, angle: 0,
    dmgMult: 1, cdMult: 1, magnetRange: 100, kbMult: 1, dodge: 0,
    leverage: 1, leverageIdx: 0,
    dashCd: 0, dashTimer: 0, dashing: false, dashDir: { x: 0, y: 0 },
    animTimer: 0,
    vx: 0, vy: 0,
    kbX: 0, kbY: 0
};

// Export to window explicitly to avoid scoping issues with type="module" or strict mode
window.BOSS_ORDER = BOSS_ORDER;
window.WAVES_PER_STAGE = WAVES_PER_STAGE;
window.BOSSES = BOSSES;
window.LEVERAGE_STEPS = LEVERAGE_STEPS;
window.G = G;
window.P = P;
