// ============ GAME GLOBALS & CONSTANTS ============

// Boss order for cycling every 10 waves
const BOSS_ORDER = ['murad', 'carlos', 'ape', 'dokwon', 'logan', 'ruja', 'caroline', 'kwon', 'sam', 'cz'];
const WAVES_PER_STAGE = window.HS_DEV_SHORT_STAGE === true ? 2 : 5;

// ============ DEBUG MODE ============
// Mettre à true pour voir tous les ennemis en mode très facile
const DEBUG_ALL_ENEMIES = false;

// Wave duration per mode
window.WAVE_DURATION = function (wave) {
    if (G.mode === 'arcade') {
        if (wave <= 3) return 18 + wave * 0.9;
        if (wave <= 10) return 20 + wave * 0.75;
        return Math.min(26 + wave * 0.6, 42);
    }
    if (wave <= 2) return 15 + wave * 1.1;
    if (wave <= 8) return 16 + wave * 1.35;
    return Math.min(24 + wave * 1.0, 55);
}

const XP_THRESHOLDS = [40, 64, 92, 126, 166, 212, 264, 322];

window.getXpThreshold = function (level) {
    const currentLevel = Math.max(1, Math.floor(level || 1));
    const idx = currentLevel - 1;
    if (idx < XP_THRESHOLDS.length) return XP_THRESHOLDS[idx];
    const tail = idx - (XP_THRESHOLDS.length - 1);
    const last = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    return Math.floor(last + tail * 74 + tail * tail * 6);
}

const ARCADE_EARLY_DIFFICULTY = [
    { hpMult: 0.94, spdMult: 0.98, spawnRate: 0.70, batchSize: 2, maxType: 2 },
    { hpMult: 1.02, spdMult: 1.00, spawnRate: 0.64, batchSize: 3, maxType: 2 },
    { hpMult: 1.10, spdMult: 1.02, spawnRate: 0.59, batchSize: 3, maxType: 3 },
    { hpMult: 1.18, spdMult: 1.04, spawnRate: 0.55, batchSize: 4, maxType: 3 },
    { hpMult: 1.28, spdMult: 1.06, spawnRate: 0.51, batchSize: 4, maxType: 4 },
    { hpMult: 1.36, spdMult: 1.07, spawnRate: 0.48, batchSize: 4, maxType: 4 },
    { hpMult: 1.46, spdMult: 1.08, spawnRate: 0.45, batchSize: 5, maxType: 6 },
    { hpMult: 1.54, spdMult: 1.09, spawnRate: 0.43, batchSize: 5, maxType: 6 },
    { hpMult: 1.62, spdMult: 1.10, spawnRate: 0.41, batchSize: 5, maxType: 7 },
    { hpMult: 1.70, spdMult: 1.11, spawnRate: 0.39, batchSize: 6, maxType: 7 }
];

const ADVENTURE_EARLY_DIFFICULTY = [
    { hpMult: 0.82, spdMult: 0.94, spawnRate: 0.90, batchSize: 1, maxType: 1 },
    { hpMult: 0.88, spdMult: 0.95, spawnRate: 0.84, batchSize: 2, maxType: 1 },
    { hpMult: 0.94, spdMult: 0.96, spawnRate: 0.80, batchSize: 2, maxType: 2 },
    { hpMult: 1.00, spdMult: 0.97, spawnRate: 0.76, batchSize: 2, maxType: 2 },
    { hpMult: 1.06, spdMult: 0.98, spawnRate: 0.72, batchSize: 3, maxType: 3 },
    { hpMult: 1.12, spdMult: 1.00, spawnRate: 0.68, batchSize: 3, maxType: 3 },
    { hpMult: 1.18, spdMult: 1.01, spawnRate: 0.64, batchSize: 3, maxType: 4 },
    { hpMult: 1.24, spdMult: 1.02, spawnRate: 0.60, batchSize: 4, maxType: 4 },
    { hpMult: 1.30, spdMult: 1.03, spawnRate: 0.57, batchSize: 4, maxType: 5 },
    { hpMult: 1.36, spdMult: 1.04, spawnRate: 0.54, batchSize: 4, maxType: 5 }
];

// Difficulty scaling per wave per mode
window.getDifficulty = function (wave) {
    const enemyTypeCap = Math.max(0, (typeof ENEMY_DEFS !== 'undefined' ? ENEMY_DEFS.length : 8) - 1);
    const stageNum = Math.floor((Math.max(1, wave) - 1) / WAVES_PER_STAGE) + 1;
    const stageTypeCap = Math.max(1, Math.min(enemyTypeCap, Math.floor(((stageNum - 1) / 9) * enemyTypeCap) + 1));
    if (typeof DEBUG_ALL_ENEMIES !== 'undefined' && DEBUG_ALL_ENEMIES) {
        return {
            hpMult: 0.06,                      // Ennemis meurent en 1 balle
            spdMult: 0.5,                       // Lents
            spawnRate: 2.5,                       // Spawn lent
            batchSize: 1,
            maxType: enemyTypeCap
        };
    }
    const presets = G.mode === 'arcade' ? ARCADE_EARLY_DIFFICULTY : ADVENTURE_EARLY_DIFFICULTY;
    if (wave <= presets.length) {
        const preset = presets[Math.max(0, wave - 1)];
        return {
            hpMult: preset.hpMult,
            spdMult: preset.spdMult,
            spawnRate: preset.spawnRate,
            batchSize: preset.batchSize,
            maxType: Math.min(stageTypeCap, preset.maxType)
        };
    }
    if (G.mode === 'arcade') {
        return {
            hpMult: 1.70 + Math.max(0, wave - 10) * 0.09,
            spdMult: 1.11 + Math.max(0, wave - 10) * 0.012,
            spawnRate: Math.max(0.22, 0.39 - Math.max(0, wave - 10) * 0.012),
            batchSize: Math.min(8, 6 + Math.floor(Math.max(0, wave - 10) / 2)),
            maxType: enemyTypeCap
        };
    }
    const maxAdventureWave = 10 * WAVES_PER_STAGE;
    const tailProgress = Math.min(1, Math.max(0, (wave - ADVENTURE_EARLY_DIFFICULTY.length) / Math.max(1, maxAdventureWave - ADVENTURE_EARLY_DIFFICULTY.length)));
    const eased = Math.pow(tailProgress, 1.2);
    return {
        hpMult: 1.36 + eased * 0.84,
        spdMult: 1.04 + eased * 0.20,
        spawnRate: Math.max(0.30, 0.54 - eased * 0.24),
        batchSize: Math.min(8, 4 + Math.floor(eased * 4.2)),
        maxType: stageTypeCap
    };
}

const WAVE_SPAWN_MIXES = [
    [
        { type: 0, weight: 36 },
        { type: 1, weight: 34 },
        { type: 2, weight: 30 }
    ],
    [
        { type: 0, weight: 24 },
        { type: 1, weight: 28 },
        { type: 2, weight: 24 },
        { type: 3, weight: 24 }
    ],
    [
        { type: 0, weight: 16 },
        { type: 1, weight: 22 },
        { type: 2, weight: 20 },
        { type: 3, weight: 20 },
        { type: 4, weight: 22 }
    ],
    [
        { type: 1, weight: 18 },
        { type: 2, weight: 18 },
        { type: 3, weight: 18 },
        { type: 4, weight: 18 },
        { type: 6, weight: 28 }
    ],
    [
        { type: 1, weight: 14 },
        { type: 2, weight: 16 },
        { type: 3, weight: 16 },
        { type: 4, weight: 16 },
        { type: 6, weight: 18 },
        { type: 7, weight: 20 }
    ],
    [
        { type: 0, weight: 8 },
        { type: 1, weight: 12 },
        { type: 2, weight: 12 },
        { type: 3, weight: 14 },
        { type: 4, weight: 14 },
        { type: 5, weight: 12 },
        { type: 6, weight: 14 },
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
        : wave <= 3 ? 1
            : wave <= 5 ? 2
                : wave <= 7 ? 3
                    : wave <= 10 ? 4
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

const OPENING_MEDIA = {
    videoCandidates: [
        'assets/video/Cinematic Opening Cutscene 2D Pixel Art Game.mp4',
        'assets/video/cinematic.mp4'
    ],
    musicCandidates: [
        'assets/Neon Chaser - Google Gemini.mp3'
    ],
    musicDuck: 0.18,
    musicFadeMs: 260,
    musicVolume: 0.9,
    accent: '#6effcf',
    secondary: '#ffd84d',
    kicker: 'JEFF VS THE SYSTEM',
    title: 'HYPERSURVIVOR',
    subtitle: 'SURVIVE THE MARKET . CONQUER THE CHAIN',
    lines: [
        'The market was never a place.',
        'It became a world.',
        'Ten rulers. One survivor.',
        'Enter the system.'
    ],
    cueTimes: [0.25, 1.4, 2.75, 4.15],
    playbackRate: 0.74,
    safetyMs: 14000
};

const HS_MEDIA_INVENTORY = {
    available: new Set([
        'assets/video/Cinematic Opening Cutscene 2D Pixel Art Game.mp4',
        'assets/video/cinematic.mp4',
        'assets/Neon Chaser - Google Gemini.mp3'
    ]),
    dead: new Set([
        'assets/video/outro_victory.mp4',
        'assets/video/outro_defeat.mp4',
        'assets/audio/music/victory_theme.ogg',
        'assets/audio/music/defeat_theme.ogg'
    ])
};

function normalizeMediaList(candidates, kind) {
    const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
    const seen = new Set();
    const normalized = [];
    const mode = kind === 'required' ? 'required' : 'optional';
    for (const src of list) {
        if (seen.has(src)) continue;
        seen.add(src);
        if (HS_MEDIA_INVENTORY.available.has(src)) {
            normalized.push(src);
            continue;
        }
        if (HS_MEDIA_INVENTORY.dead.has(src)) continue;
        if (mode === 'required') normalized.push(src);
    }
    return normalized;
}

window.getAvailableMedia = function (candidates, opts) {
    const options = opts || {};
    return normalizeMediaList(candidates, options.kind);
};

window.shouldProbeMediaAsset = function (src, opts) {
    if (!src) return false;
    if (HS_MEDIA_INVENTORY.available.has(src)) return true;
    if (HS_MEDIA_INVENTORY.dead.has(src)) return false;
    return !!(opts && opts.allowUnknown);
};

const STAGE_MEDIA = {
    default: {
        musicCandidates: ['assets/Neon Chaser - Google Gemini.mp3'],
        musicVolume: 0.88,
        musicFadeMs: 180
    },
    arcade: {
        musicCandidates: ['assets/Neon Chaser - Google Gemini.mp3'],
        musicVolume: 0.88,
        musicFadeMs: 180
    },
    adventure: {
        musicCandidates: ['assets/Neon Chaser - Google Gemini.mp3'],
        musicVolume: 0.88,
        musicFadeMs: 180
    }
};

const ENDING_MEDIA = {
    victory: {
        kicker: 'MARKET PURGED',
        title: 'HYPERSURVIVOR',
        subtitle: 'VICTORY SEQUENCE',
        lines: [
            'The market falls silent.',
            'Jeff walks out alive.'
        ],
        videoCandidates: ['assets/video/outro_victory.mp4'],
        musicCandidates: ['assets/audio/music/victory_theme.ogg'],
        musicDuck: 0.12,
        musicFadeMs: 220,
        musicVolume: 0.96,
        accent: '#ffd84d',
        secondary: '#6effcf',
        safetyMs: 4200
    },
    defeat: {
        kicker: 'SYSTEM LOSS',
        title: 'LIQUIDATED',
        subtitle: 'RUN TERMINATED',
        lines: [
            'The system keeps feeding.',
            'Jeff falls back into the noise.'
        ],
        videoCandidates: ['assets/video/outro_defeat.mp4'],
        musicCandidates: ['assets/audio/music/defeat_theme.ogg'],
        musicDuck: 0.12,
        musicFadeMs: 220,
        musicVolume: 0.96,
        accent: '#ff6b6b',
        secondary: '#ffd84d',
        safetyMs: 3600
    }
};

const BOSS_MEDIA = {
    murad: {
        kicker: 'DOMAIN BREACH',
        domain: 'CULT SWARM',
        entryLine: 'Murad. Here, conviction no longer needs proof.',
        deathLine: 'The cult breaks. Faith alone cannot hold.',
        chips: ['Belief', 'Contagion', 'Swarm'],
        palette: ['#89ff3b', '#d8ff8a', '#0c1805'],
        identVideoCandidates: ['assets/video/boss/murad_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/murad_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_murad_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/murad_death.ogg']
    },
    carlos: {
        kicker: 'SIGNAL AMPLIFIED',
        domain: 'PONZI BROADCAST',
        entryLine: 'Carlos. One voice is enough when the crowd wants a dream.',
        deathLine: 'The echo dies. The dream can no longer repeat itself.',
        chips: ['Referral', 'Noise', 'Euphoria'],
        palette: ['#ffd54f', '#fff1b3', '#221503'],
        identVideoCandidates: ['assets/video/boss/carlos_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/carlos_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_carlos_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/carlos_death.ogg']
    },
    ape: {
        kicker: 'HERD BREACH',
        domain: 'STAMPED GROUND',
        entryLine: 'Ape. When everyone charges, nobody thinks.',
        deathLine: 'The dust settles. The pack stops moving.',
        chips: ['Charge', 'Riot', 'Momentum'],
        palette: ['#8b6914', '#d4b161', '#1a1205'],
        identVideoCandidates: ['assets/video/boss/ape_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/ape_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_ape_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/ape_death.ogg']
    },
    dokwon: {
        kicker: 'FALSE SUN',
        domain: 'RADIANT DECEPTION',
        entryLine: 'The sun rules as long as nobody dares to look behind it.',
        deathLine: 'Even false suns burn out in the end.',
        chips: ['Prestige', 'Halo', 'Mask'],
        palette: ['#ff4444', '#ff9a7a', '#220607'],
        identVideoCandidates: ['assets/video/boss/dokwon_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/dokwon_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_dokwon_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/dokwon_death.ogg']
    },
    logan: {
        kicker: 'CROWD EXTRACTION',
        domain: 'CLOUT ARENA',
        entryLine: 'Logan. Here, attention is worth more than blood.',
        deathLine: 'Without a crowd, there is no crown.',
        chips: ['Camera', 'Flash', 'Audience'],
        palette: ['#ff7ad9', '#ffc3f0', '#250818'],
        identVideoCandidates: ['assets/video/boss/logan_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/logan_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_logan_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/logan_death.ogg']
    },
    ruja: {
        kicker: 'PHANTOM COURT',
        domain: 'GOLD MIRAGE',
        entryLine: 'Ruja. The most beautiful promise is often the emptiest.',
        deathLine: 'A mirage dies the moment someone reaches it.',
        chips: ['Luxury', 'Mirage', 'Vanish'],
        palette: ['#cc44aa', '#f0a9ff', '#180416'],
        identVideoCandidates: ['assets/video/boss/ruja_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/ruja_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_ruja_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/ruja_death.ogg']
    },
    caroline: {
        kicker: 'LEDGER PRESSURE',
        domain: 'LIQUIDATION GRID',
        entryLine: 'Caroline. Every number eventually finds someone to sacrifice.',
        deathLine: 'The model held. The world did not.',
        chips: ['Sheet', 'Drain', 'Pressure'],
        palette: ['#ff8fab', '#ffd3df', '#220813'],
        identVideoCandidates: ['assets/video/boss/caroline_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/caroline_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_caroline_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/caroline_death.ogg']
    },
    kwon: {
        kicker: 'PEG FAILURE',
        domain: 'COLLAPSE ENGINE',
        entryLine: 'Do Kwon. Stability is the most fragile belief of all.',
        deathLine: 'The peg was only a prayer in disguise.',
        chips: ['Depeg', 'Collapse', 'Spiral'],
        palette: ['#e74c3c', '#ff9e93', '#260706'],
        identVideoCandidates: ['assets/video/boss/kwon_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/kwon_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_kwon_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/kwon_death.ogg']
    },
    sam: {
        kicker: 'BACKDOOR OPEN',
        domain: 'HIDDEN ARCHITECTURE',
        entryLine: 'Sam. Invisible doors are the easiest to call destiny.',
        deathLine: 'Once seen, the trick loses its magic.',
        chips: ['Portal', 'Ledger', 'Maze'],
        palette: ['#6effcf', '#c8fff0', '#061813'],
        identVideoCandidates: ['assets/video/boss/sam_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/sam_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_sam_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/sam_death.ogg']
    },
    cz: {
        kicker: 'IMPERIAL LOCK',
        domain: 'IRON CITADEL',
        entryLine: 'CZ. After chaos, the ones who remain always want to rule.',
        deathLine: 'Even iron yields when it thinks itself eternal.',
        chips: ['Order', 'Hammer', 'Empire'],
        palette: ['#ffd84d', '#fff0ab', '#231a04'],
        identVideoCandidates: ['assets/video/boss/cz_ident.mp4'],
        introAudioCandidates: ['assets/audio/stingers/cz_intro.ogg'],
        loopAudioCandidates: ['assets/audio/music/boss_cz_loop.ogg'],
        deathAudioCandidates: ['assets/audio/stingers/cz_death.ogg']
    }
};

window.getOpeningMedia = function () {
    return {
        ...OPENING_MEDIA,
        videoCandidates: normalizeMediaList(OPENING_MEDIA.videoCandidates, 'required'),
        musicCandidates: normalizeMediaList(OPENING_MEDIA.musicCandidates, 'required')
    };
}

window.getStageMediaProfile = function (stageIndex, mode) {
    const modeKey = mode === 'arcade' ? 'arcade' : 'adventure';
    const profile = {
        ...(STAGE_MEDIA.default || {}),
        ...(STAGE_MEDIA[modeKey] || {})
    };
    return {
        ...profile,
        musicCandidates: normalizeMediaList(profile.musicCandidates, 'required')
    };
}

window.getEndingMediaProfile = function (kind) {
    const profile = ENDING_MEDIA[kind] || null;
    if (!profile) return null;
    return {
        ...profile,
        videoCandidates: normalizeMediaList(profile.videoCandidates, 'optional'),
        musicCandidates: normalizeMediaList(profile.musicCandidates, 'optional')
    };
}

window.getNarrativeTransitionProfile = function (kind, bossKey) {
    const bossMedia = bossKey ? (BOSS_MEDIA[bossKey] || {}) : {};
    const bossTuning = bossKey && typeof getBossFightTuning === 'function'
        ? getBossFightTuning(bossKey)
        : null;
    const variant = kind === 'boss'
        ? 'boss'
        : kind === 'ending'
            ? 'ending'
            : 'opening';
    const profile = {
        opening: {
            musicDuck: OPENING_MEDIA.musicDuck || 0.18,
            musicFadeMs: OPENING_MEDIA.musicFadeMs || 260,
            overlayHoldMs: 220,
            restoreDelayMs: 160,
            lineStepMs: 1200,
            videoLeadMs: 180
        },
        boss: {
            musicDuck: bossMedia.musicDuck || 0.16,
            musicFadeMs: bossMedia.musicFadeMs || 180,
            overlayHoldMs: Math.max(220, Math.round((bossTuning && bossTuning.introTime ? bossTuning.introTime : 2.4) * 340)),
            restoreDelayMs: Math.max(180, Math.round((bossTuning && bossTuning.introTime ? bossTuning.introTime : 2.4) * 220)),
            lineStepMs: 900,
            videoLeadMs: 120
        },
        ending: {
            musicDuck: (kind === 'victory' ? ENDING_MEDIA.victory.musicDuck : ENDING_MEDIA.defeat.musicDuck) || 0.12,
            musicFadeMs: (kind === 'victory' ? ENDING_MEDIA.victory.musicFadeMs : ENDING_MEDIA.defeat.musicFadeMs) || 220,
            overlayHoldMs: 260,
            restoreDelayMs: 180,
            lineStepMs: 1000,
            videoLeadMs: 140
        }
    };
    return profile[variant];
}

window.getBossMediaProfile = function (bossKey) {
    const bossData = BOSSES[bossKey] || {};
    const fallbackPalette = [bossData.col || '#ffd84d', '#f7f3d7', '#07090f'];
    const profile = {
        kicker: 'THREAT SIGNAL',
        domain: 'MARKET DOMAIN',
        entryLine: `${bossData.sub || 'Unknown'} stands in Jeff's path.`,
        deathLine: 'The signal breaks. The path opens again.',
        chips: ['Threat', 'Signal', 'Domain'],
        palette: fallbackPalette,
        musicDuck: 0.16,
        musicFadeMs: 180,
        musicVolume: 0.96,
        identVideoCandidates: [`assets/video/boss/${bossKey}_ident.mp4`],
        introAudioCandidates: [`assets/audio/stingers/${bossKey}_intro.ogg`],
        loopAudioCandidates: [`assets/audio/music/boss_${bossKey}_loop.ogg`],
        deathAudioCandidates: [`assets/audio/stingers/${bossKey}_death.ogg`],
        ...(BOSS_MEDIA[bossKey] || {})
    };
    return {
        ...profile,
        identVideoCandidates: normalizeMediaList(profile.identVideoCandidates, 'optional'),
        introAudioCandidates: normalizeMediaList(profile.introAudioCandidates, 'optional'),
        loopAudioCandidates: normalizeMediaList(profile.loopAudioCandidates, 'optional'),
        deathAudioCandidates: normalizeMediaList(profile.deathAudioCandidates, 'optional')
    };
}

const BOSS_FIGHT_TUNING = {
    default: {
        hpScale: 1,
        introTime: 3.0,
        phase2Threshold: 0.5,
        firstAttackCd: 2.0,
        attackCooldown: [1.55, 2.5],
        phase2Cooldown: [1.05, 1.77],
        phaseBreakCd: 0.9,
        attackRecovery: {}
    },
    murad: {
        hpScale: 0.9,
        introTime: 2.65,
        phase2Threshold: 0.58,
        firstAttackCd: 2.2,
        attackCooldown: [1.8, 2.3],
        phase2Cooldown: [1.24, 1.62],
        phaseBreakCd: 1.02,
        attackRecovery: {
            shillstorm: 0.18,
            cultcircle: 0.32
        }
    },
    carlos: {
        hpScale: 0.94,
        introTime: 2.8,
        phase2Threshold: 0.56,
        firstAttackCd: 2.3,
        attackCooldown: [1.9, 2.35],
        phase2Cooldown: [1.28, 1.72],
        phaseBreakCd: 1.0,
        attackRecovery: {
            bitconnect: 0.34,
            referral: 0.22
        }
    },
    ape: {
        hpScale: 0.98,
        introTime: 2.9,
        phase2Threshold: 0.54,
        firstAttackCd: 2.15,
        attackCooldown: [1.8, 2.28],
        phase2Cooldown: [1.2, 1.66],
        phaseBreakCd: 0.96,
        attackRecovery: {
            barrelthrow: 0.26,
            apeslam: 0.34
        }
    }
};

window.getBossFightTuning = function (bossKey) {
    const base = BOSS_FIGHT_TUNING.default;
    const specific = BOSS_FIGHT_TUNING[bossKey] || {};
    return {
        ...base,
        ...specific,
        attackRecovery: {
            ...(base.attackRecovery || {}),
            ...(specific.attackRecovery || {})
        }
    };
}

window.getBossHpScale = function (bossKey, wave) {
    const tuning = typeof getBossFightTuning === 'function' ? getBossFightTuning(bossKey) : BOSS_FIGHT_TUNING.default;
    const currentWave = Math.max(1, Math.floor(wave || 1));
    const waveScale = currentWave <= 10
        ? 1 + currentWave * 0.12
        : 2.2 + (currentWave - 10) * 0.14;
    return waveScale * (tuning.hpScale || 1);
}

const BOSS_VISUALS = {
    murad: {
        accent: '#89ff3b', secondary: '#d8ff8a', motif: 'hex', tag: 'CULT SWARM',
        attacks: {
            shillstorm: { label: 'SHILLSTORM', kind: 'fan', duration: 1.05 },
            cultcircle: { label: 'CULT CIRCLE', kind: 'dash', duration: 1.15 }
        }
    },
    carlos: {
        accent: '#ffd54f', secondary: '#fff2a6', motif: 'diamond', tag: 'PONZI WAVE',
        attacks: {
            bitconnect: { label: 'BITCONNECT', kind: 'ring', duration: 1.15 },
            referral: { label: 'REFERRAL', kind: 'summon', duration: 0.95 }
        }
    },
    ape: {
        accent: '#8b6914', secondary: '#d8b56b', motif: 'spike', tag: 'RUG STAMPEDE',
        attacks: {
            barrelthrow: { label: 'BARREL THROW', kind: 'bombard', duration: 0.95 },
            apeslam: { label: 'FLOOR SWEEP', kind: 'wall', duration: 1.05 }
        }
    },
    dokwon: {
        accent: '#ff4444', secondary: '#ff9e7a', motif: 'spiral', tag: 'BURN SPIRAL',
        attacks: {
            deathspiral: { label: 'DEATH SPIRAL', kind: 'ring', duration: 1.0 },
            depegfield: { label: 'DEPEG FIELD', kind: 'zone', duration: 0.95 }
        }
    },
    logan: {
        accent: '#ff7ad9', secondary: '#ffd6f6', motif: 'slash', tag: 'CLOUT BLITZ',
        attacks: {
            flashko: { label: 'FLASH KO', kind: 'dash', duration: 1.0 },
            scamzoo: { label: 'SCAM ZOO', kind: 'summon', duration: 0.95 }
        }
    },
    ruja: {
        accent: '#cc44aa', secondary: '#ffd08a', motif: 'crown', tag: 'PHANTOM COURT',
        attacks: {
            goldenmirage: { label: 'GOLDEN MIRAGE', kind: 'clone', duration: 1.0 },
            phantomverdict: { label: 'PHANTOM VERDICT', kind: 'dash', duration: 1.1 }
        }
    },
    caroline: {
        accent: '#ff8fab', secondary: '#ffd6e3', motif: 'grid', tag: 'LEDGER PRESSURE',
        attacks: {
            alamedadrain: { label: 'ALAMEDA DRAIN', kind: 'beam', duration: 1.0 },
            liquidationcascade: { label: 'LIQUIDATION', kind: 'cascade', duration: 1.05 }
        }
    },
    kwon: {
        accent: '#e74c3c', secondary: '#ffb199', motif: 'ring', tag: 'COLLAPSE ENGINE',
        attacks: {
            lunacollapse: { label: 'LUNA COLLAPSE', kind: 'zone', duration: 1.1 },
            stablecoinfraud: { label: 'STABLECOIN FRAUD', kind: 'burst', duration: 1.0 }
        }
    },
    sam: {
        accent: '#6effcf', secondary: '#d5fff3', motif: 'square', tag: 'BACKDOOR GRID',
        attacks: {
            backdoorportals: { label: 'BACKDOOR PORTALS', kind: 'portal', duration: 1.0 },
            balancesheet: { label: 'BALANCE SHEET', kind: 'shield', duration: 0.95 }
        }
    },
    cz: {
        accent: '#ffd84d', secondary: '#fff1a6', motif: 'chevron', tag: 'MARKET HAMMER',
        attacks: {
            marketdomination: { label: 'MARKET DOMINATION', kind: 'wall', duration: 1.1 },
            bisoncharge: { label: 'BISON CHARGE', kind: 'dash', duration: 1.0 }
        }
    }
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
    xp: 0, xpNext: window.getXpThreshold(1), level: 1, weapons: [], maxWeapons: 5, iframes: 0, flash: 0, angle: 0,
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
window.BOSS_VISUALS = BOSS_VISUALS;
window.LEVERAGE_STEPS = LEVERAGE_STEPS;
window.G = G;
window.P = P;
