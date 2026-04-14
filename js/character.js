// ============ 8-DIRECTIONAL CHARACTER ANIMATION SYSTEM ============
// PixelLab pixel art sprites: 8 idle rotations + 8-directional walk animation
// No chroma key needed (transparent background pixel art)

// ---- DIRECTION SYSTEM ----
const JEFF_DIR_NAMES = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];

// ---- MULTI-CHARACTER SPRITE SYSTEM ----
// Each character has: { sprites: {dir: {idle,walk,shoot,hurt}}, idleReady, walkReady, shootReady, hurtReady, hurtShared, drawHeight, animFrames, walkFrames, path }
const CHAR_DATA = {
    jeff: {
        sprites: {}, idleReady: false, walkReady: false, shootReady: false, hurtReady: false,
        hurtShared: null, drawHeight: 100, animFrames: 6, walkFramesPerDir: 6,
        path: 'assets/player/jeff_new/',
        walkDirs: ['south', 'north', 'west', 'south-west', 'east', 'south-east', 'north-west', 'north-east'],
        walkMirror: {},
        shootDirs: ['south', 'south-west', 'west', 'north-west', 'east', 'south-east', 'north-east', 'north'],
        shootMirror: {},
        hasShoot: true, hasHurt: true,
        victoryAnims: ['macarena'],
        victoryFrames: {}, victoryReady: false
    },
    hypurr: {
        sprites: {}, idleReady: false, walkReady: false, shootReady: false, hurtReady: false,
        hurtShared: null, drawHeight: 100, animFrames: 6, walkFramesPerDir: 6,
        path: 'assets/player/hypurr/',
        walkDirs: ['south', 'north', 'west', 'east', 'south-east', 'north-west', 'north-east', 'south-west'],
        walkMirror: {},
        shootDirs: [],
        shootMirror: {},
        hasShoot: false, hasHurt: false,
        victoryAnims: ['catnip_freakout'],
        victoryFrames: {}, victoryReady: false
    },
    pasheur: {
        sprites: {}, idleReady: false, walkReady: false, shootReady: false, hurtReady: false,
        hurtShared: null, drawHeight: 100, animFrames: 6, walkFramesPerDir: 6,
        path: 'assets/player/pasheur/',
        walkDirs: ['south', 'north', 'west', 'east', 'south-east', 'north-west', 'north-east', 'south-west'],
        walkMirror: {},
        shootDirs: [],
        shootMirror: {},
        hasShoot: false, hasHurt: false,
        victoryAnims: ['keyboard_warrior'],
        victoryFrames: {}, victoryReady: false
    },
    catbalette: {
        sprites: {}, idleReady: false, walkReady: false, shootReady: false, hurtReady: false,
        hurtShared: null, drawHeight: 100, animFrames: 6, walkFramesPerDir: 6,
        path: 'assets/player/catbalette/',
        walkDirs: ['south', 'north', 'west', 'east', 'south-east', 'north-west', 'north-east', 'south-west'],
        walkMirror: {},
        shootDirs: [],
        shootMirror: {},
        hasShoot: false, hasHurt: false,
        victoryAnims: ['diva_stretch'],
        victoryFrames: {}, victoryReady: false
    },
    pip: {
        sprites: {}, idleReady: false, walkReady: false, shootReady: false, hurtReady: false,
        hurtShared: null, drawHeight: 100, animFrames: 6, walkFramesPerDir: 6,
        path: 'assets/player/pip/',
        walkDirs: ['south', 'north', 'west', 'east', 'south-east', 'north-west', 'north-east', 'south-west'],
        walkMirror: {},
        shootDirs: [],
        shootMirror: {},
        hasShoot: false, hasHurt: false,
        victoryAnims: ['tiny_flex'],
        victoryFrames: {}, victoryReady: false
    },
    mage: {
        sprites: {}, idleReady: false, walkReady: false, shootReady: false, hurtReady: false,
        hurtShared: null, drawHeight: 100, animFrames: 6, walkFramesPerDir: 6,
        path: 'assets/player/mage/',
        walkDirs: ['south', 'north', 'west', 'east', 'south-east', 'north-west', 'north-east', 'south-west'],
        walkMirror: {},
        shootDirs: [],
        shootMirror: {},
        hasShoot: false, hasHurt: false,
        victoryAnims: ['arcane_burst'],
        victoryFrames: {}, victoryReady: false
    }
};

// Legacy compat aliases
const JEFF_SPRITES = CHAR_DATA.jeff.sprites;
let jeffIdleReady = false;
let jeffWalkReady = false;
let jeffShootReady = false;
let jeffHurtReady = false;
const JEFF_DRAW_HEIGHT = 100;
let JEFF_HURT_SHARED = null;
const JEFF_ANIM_FRAMES = 6;

// Legacy compat (referenced in game.js fallback)
const JEFF_FRAMES = {};
const JEFF_GENERATED = {};

// Get active character data based on selection
function getActiveChar() {
    const id = (typeof G !== 'undefined' && G.selectedCharacter) ? G.selectedCharacter : (typeof _selectedCharId !== 'undefined' ? _selectedCharId : 'jeff');
    return CHAR_DATA[id] || CHAR_DATA.jeff;
}
function getActiveSprites() { return getActiveChar().sprites; }

// ---- ANGLE → DIRECTION ----
function angleToJeffDir(angle) {
    let a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const idx = Math.round(a / (Math.PI / 4)) % 8;
    return JEFF_DIR_NAMES[idx];
}

// ---- GENERIC CHARACTER LOADER ----
function loadCharIdle(charId) {
    const cd = CHAR_DATA[charId];
    if (!cd) return;
    let loaded = 0;
    const total = JEFF_DIR_NAMES.length;
    JEFF_DIR_NAMES.forEach(dir => {
        cd.sprites[dir] = { idle: null, walk: [], shoot: [], hurt: null };
        const img = new Image();
        img.src = cd.path + dir + '.png';
        img.onload = () => {
            cd.sprites[dir].idle = img;
            loaded++;
            if (loaded >= total) {
                cd.idleReady = true;
                if (charId === 'jeff') jeffIdleReady = true;
                console.log(charId + ': 8 idle rotations loaded');
                loadCharWalkFrames(charId);
            }
        };
        img.onerror = () => {
            console.warn(charId + ' idle fail:', dir);
            loaded++;
            if (loaded >= total) {
                cd.idleReady = true;
                if (charId === 'jeff') jeffIdleReady = true;
                loadCharWalkFrames(charId);
            }
        };
    });
}

// Load all characters on startup
loadCharIdle('jeff');
loadCharIdle('hypurr');
loadCharIdle('pasheur');
loadCharIdle('catbalette');
loadCharIdle('pip');

const JEFF_WALK_AVAILABLE = ['south', 'north', 'west', 'south-west', 'east', 'south-east', 'north-west', 'north-east'];
const JEFF_WALK_MIRROR_MAP = {};
const JEFF_WALK_FRAMES_PER_DIR = 6;
const JEFF_FRAME_SIZE = 104;

// Horizontally flip a frame (Image or Canvas) → Canvas
function flipFrameH(src) {
    const w = src.width || src.naturalWidth || JEFF_FRAME_SIZE;
    const h = src.height || src.naturalHeight || JEFF_FRAME_SIZE;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.translate(w, 0);
    cx.scale(-1, 1);
    cx.drawImage(src, 0, 0, w, h);
    return c;
}

function loadCharWalkFrames(charId) {
    const cd = CHAR_DATA[charId];
    if (!cd || cd.walkDirs.length === 0) {
        cd.walkReady = false;
        if (cd.hasShoot) loadCharShootFrames(charId);
        else if (cd.hasHurt) loadCharHurtSprites(charId);
        return;
    }
    let dirsLoaded = 0;
    const totalDirs = cd.walkDirs.length;

    cd.walkDirs.forEach(dir => {
        let framesLoaded = 0;
        const frames = [];

        for (let fi = 0; fi < cd.walkFramesPerDir; fi++) {
            const img = new Image();
            const padIdx = String(fi).padStart(3, '0');
            img.src = cd.path + 'walk/' + dir + '/frame_' + padIdx + '.png';
            img.onload = () => {
                frames[fi] = img;
                framesLoaded++;
                if (framesLoaded >= cd.walkFramesPerDir) {
                    cd.sprites[dir].walk = frames;
                    dirsLoaded++;
                    if (dirsLoaded >= totalDirs) onAllWalkLoaded();
                }
            };
            img.onerror = () => {
                framesLoaded++;
                if (framesLoaded >= cd.walkFramesPerDir) {
                    cd.sprites[dir].walk = frames.filter(Boolean);
                    dirsLoaded++;
                    if (dirsLoaded >= totalDirs) onAllWalkLoaded();
                }
            };
        }
    });

    function onAllWalkLoaded() {
        // Generate mirrored directions
        Object.entries(cd.walkMirror).forEach(([mirrorDir, sourceDir]) => {
            const sourceFrames = cd.sprites[sourceDir] && cd.sprites[sourceDir].walk;
            if (sourceFrames && sourceFrames.length > 0) {
                if (!cd.sprites[mirrorDir]) cd.sprites[mirrorDir] = { idle: null, walk: [], shoot: [], hurt: null };
                cd.sprites[mirrorDir].walk = sourceFrames.map(f => flipFrameH(f));
            }
        });
        cd.walkReady = cd.walkDirs.some(d => cd.sprites[d] && cd.sprites[d].walk.length > 0);
        if (charId === 'jeff') jeffWalkReady = cd.walkReady;
        const sDir = cd.sprites['south'];
        const count = sDir ? sDir.walk.length : 0;
        console.log(charId + ': walk loaded (' + count + ' frames/dir)');
        // Chain: load shoot frames after walk
        if (cd.hasShoot) loadCharShootFrames(charId);
        else if (cd.hasHurt) loadCharHurtSprites(charId);
    }
}

// Legacy alias
function loadJeffWalkFrames() { loadCharWalkFrames('jeff'); }

// ---- LOAD SHOOT ANIMATION ----
const JEFF_SHOOT_AVAILABLE = ['south', 'south-west', 'west', 'north-west', 'east', 'south-east', 'north-east', 'north'];
const JEFF_SHOOT_MIRROR_MAP = {};

function loadCharShootFrames(charId) {
    const cd = CHAR_DATA[charId];
    if (!cd || cd.shootDirs.length === 0) {
        if (cd.hasHurt) loadCharHurtSprites(charId);
        return;
    }
    let dirsLoaded = 0;
    const totalDirs = cd.shootDirs.length;

    cd.shootDirs.forEach(dir => {
        let framesLoaded = 0;
        const frames = [];

        for (let fi = 0; fi < cd.animFrames; fi++) {
            const img = new Image();
            const padIdx = String(fi).padStart(3, '0');
            img.src = cd.path + 'shoot/' + dir + '/frame_' + padIdx + '.png';
            img.onload = () => {
                frames[fi] = img;
                framesLoaded++;
                if (framesLoaded >= cd.animFrames) {
                    cd.sprites[dir].shoot = frames;
                    dirsLoaded++;
                    if (dirsLoaded >= totalDirs) onAllShootLoaded();
                }
            };
            img.onerror = () => {
                framesLoaded++;
                if (framesLoaded >= cd.animFrames) {
                    cd.sprites[dir].shoot = frames.filter(Boolean);
                    dirsLoaded++;
                    if (dirsLoaded >= totalDirs) onAllShootLoaded();
                }
            };
        }
    });

    function onAllShootLoaded() {
        Object.entries(cd.shootMirror).forEach(([mirrorDir, sourceDir]) => {
            const sourceFrames = cd.sprites[sourceDir] && cd.sprites[sourceDir].shoot;
            if (sourceFrames && sourceFrames.length > 0) {
                cd.sprites[mirrorDir].shoot = sourceFrames.map(f => flipFrameH(f));
            }
        });
        cd.shootReady = cd.shootDirs.some(d => cd.sprites[d] && cd.sprites[d].shoot.length > 0);
        if (charId === 'jeff') jeffShootReady = cd.shootReady;
        console.log(charId + ': shoot loaded (' + cd.animFrames + ' frames/dir)');
        if (cd.hasHurt) loadCharHurtSprites(charId);
    }
}

function loadCharHurtSprites(charId) {
    const cd = CHAR_DATA[charId];
    if (!cd) return;
    let done = 0;
    const shared = new Image();
    shared.onload = () => {
        cd.hurtShared = shared;
        if (charId === 'jeff') JEFF_HURT_SHARED = shared;
    };
    shared.onerror = () => { };
    shared.src = cd.path + 'hurt.png';

    JEFF_DIR_NAMES.forEach(dir => {
        const img = new Image();
        img.onload = () => {
            cd.sprites[dir].hurt = img;
            done++;
            if (done >= JEFF_DIR_NAMES.length) {
                cd.hurtReady = true;
                if (charId === 'jeff') jeffHurtReady = true;
            }
        };
        img.onerror = () => {
            done++;
            if (done >= JEFF_DIR_NAMES.length) {
                cd.hurtReady = true;
                if (charId === 'jeff') jeffHurtReady = true;
            }
        };
        img.src = cd.path + 'hurt/' + dir + '.png';
    });
}

// ---- LOAD VICTORY ANIMATIONS ----
function loadCharVictoryAnims(charId) {
    const cd = CHAR_DATA[charId];
    if (!cd || !cd.victoryAnims || cd.victoryAnims.length === 0) return;
    let animsLoaded = 0;
    const totalAnims = cd.victoryAnims.length;

    cd.victoryAnims.forEach(animName => {
        cd.victoryFrames[animName] = [];
        let framesLoaded = 0;
        const frameCount = 4; // PixelLab custom anims = 4 frames
        const frames = [];

        for (let fi = 0; fi < frameCount; fi++) {
            const img = new Image();
            const padIdx = String(fi).padStart(3, '0');
            img.src = cd.path + 'victory/' + animName + '/frame_' + padIdx + '.png';
            img.onload = () => {
                frames[fi] = img;
                framesLoaded++;
                if (framesLoaded >= frameCount) {
                    cd.victoryFrames[animName] = frames;
                    animsLoaded++;
                    if (animsLoaded >= totalAnims) {
                        cd.victoryReady = true;
                        console.log(charId + ': victory anims loaded (' + totalAnims + ' dances)');
                    }
                }
            };
            img.onerror = () => {
                framesLoaded++;
                if (framesLoaded >= frameCount) {
                    cd.victoryFrames[animName] = frames.filter(Boolean);
                    animsLoaded++;
                    if (animsLoaded >= totalAnims) {
                        cd.victoryReady = true;
                    }
                }
            };
        }
    });
}

// Load Jeff's victory anims after startup
loadCharVictoryAnims('jeff');
loadCharVictoryAnims('hypurr');
loadCharVictoryAnims('pasheur');
loadCharVictoryAnims('catbalette');
loadCharVictoryAnims('pip');

// Legacy aliases
function loadJeffShootFrames() { loadCharShootFrames('jeff'); }
function loadJeffHurtSprites() { loadCharHurtSprites('jeff'); }

function allJeffFramesReady() {
    return getActiveChar().idleReady;
}

// ---- ANIMATION STATE ----
const JEFF_ANIM = {
    state: 'idle',
    prevState: 'idle',
    hitTimer: 0,
    facingX: 1,
    isMoving: false,
    walkPhase: 0,
    bobY: 0,
    squash: 1,
    stretch: 1,
    expression: 'normal',
    expressionTimer: 0,
    breathPhase: 0,
    aimZone: 'right',
    isShooting: false,
    shootTimer: 0,
    // Enhanced
    bodyLean: 0,
    headTilt: 0,
    kickback: 0,
    stepBounce: 0,
    armSwing: 0,
    landSquash: 0,
    dustTimer: 0,
    idleSway: 0,
    runLean: 0,
    deathTimer: 0,
    hurtShake: 0,
    idlePhase: 0,
    // Directional
    currentDir: 'south',   // facing direction for rendering
    moveDir: 'south',      // movement direction
    walkFrameIdx: 0,       // fractional walk frame index
    // Victory dance
    victoryActive: false,
    victoryAnim: null,      // current victory anim name
    victoryTimer: 0,
    victoryFrameIdx: 0,
    victoryLoopCount: 0,
};

function setJeffState(st) {
    if (JEFF_ANIM.state === st) return;
    if (JEFF_ANIM.state === 'death') return;
    if (JEFF_ANIM.state === 'victory' && st !== 'idle' && st !== 'death') return; // lock during victory
    JEFF_ANIM.prevState = JEFF_ANIM.state;
    JEFF_ANIM.state = st;
}

function jeffShootReaction(kickback) {
    JEFF_ANIM.isShooting = true;
    JEFF_ANIM.shootTimer = 0.2;
    JEFF_ANIM.kickback = Math.max(JEFF_ANIM.kickback || 0, kickback || 6);
}

// ---- MUZZLE / WEAPON POSITIONS (unchanged API) ----
function getWeaponMuzzleOffset() {
    const angle = P.angle;
    const muzzleDist = 22 - JEFF_ANIM.kickback * 0.3;
    return { x: Math.cos(angle) * muzzleDist, y: Math.sin(angle) * muzzleDist };
}

function getWeaponOffset(index, totalWeapons) {
    const secCount = totalWeapons || 1;
    const secIdx = index;
    const startAng = -Math.PI * 0.85;
    const endAng = -Math.PI * 0.15;
    let arcAng = -Math.PI / 2;
    if (secCount > 1) {
        arcAng = startAng + (secIdx / (secCount - 1)) * (endAng - startAng);
    }
    const arcRadius = 45;
    return { x: Math.cos(arcAng) * arcRadius, y: Math.sin(arcAng) * arcRadius, arcAng, arcRadius, startAng, endAng };
}

function getWeaponMuzzleOffsetByIndex(index, totalWeapons) {
    // Check if this weapon is orbital (drones) — they fire from orbit position
    const w = P.weapons && P.weapons[index];
    const def = w && typeof WEAPONS !== 'undefined' ? WEAPONS[w.id] : null;
    if (def && def.type === 'orbital') {
        const offset = getWeaponOffset(index, totalWeapons);
        const muzzleLen = 6;
        let ox = offset.x;
        if (typeof JEFF_ANIM !== 'undefined' && JEFF_ANIM.facingX < 0) ox = -ox;
        return { x: ox + Math.cos(P.angle) * muzzleLen, y: offset.y + Math.sin(P.angle) * muzzleLen };
    }

    // Arm weapons: compute arm index (skip orbital for counting)
    let armIdx = 0;
    let armCount = 0;
    if (P.weapons) {
        for (let i = 0; i < P.weapons.length; i++) {
            const wd = typeof WEAPONS !== 'undefined' ? WEAPONS[P.weapons[i].id] : null;
            if (wd && wd.type === 'orbital') continue;
            if (i === index) armIdx = armCount;
            armCount++;
        }
    }

    // Use shared two-arm helper for consistent angle
    const weaponAngle = getArmWeaponAngle(armIdx, armCount, P.angle);
    const muzzleDist = ARM_RADIUS + 14;
    return {
        x: Math.cos(weaponAngle) * muzzleDist,
        y: Math.sin(weaponAngle) * muzzleDist + ARM_Y_OFFSET
    };
}

// ---- UPDATE ----
function updateCharacterAnim(dt, inputSource) {
    const a = JEFF_ANIM;
    const i = inputSource || inp;
    const moving = !!(i.l || i.r || i.u || i.d);
    a.isMoving = moving;

    // Movement direction
    const dx = (i.r ? 1 : 0) - (i.l ? 1 : 0);
    const dy = (i.d ? 1 : 0) - (i.u ? 1 : 0);
    if (dx !== 0) a.facingX = dx > 0 ? 1 : -1;

    if (moving) {
        const moveAngle = Math.atan2(dy, dx);
        a.moveDir = angleToJeffDir(moveAngle);
        a.currentDir = a.moveDir; // face movement direction when moving
    } else {
        // When idle, face aim direction
        a.currentDir = angleToJeffDir(P.angle);
    }

    // Aim zone (for weapon display)
    const aimAngle = P.angle;
    let normAngle = aimAngle;
    while (normAngle > Math.PI) normAngle -= Math.PI * 2;
    while (normAngle < -Math.PI) normAngle += Math.PI * 2;
    if (normAngle < -0.6) a.aimZone = 'up';
    else if (normAngle > 0.6) a.aimZone = 'down';
    else a.aimZone = 'right';

    // Shoot timer + kickback
    if (a.shootTimer > 0) {
        a.shootTimer -= dt;
        if (a.shootTimer <= 0) a.isShooting = false;
    }
    a.kickback *= Math.pow(0.001, dt);

    // State machine
    if (a.victoryActive) {
        setJeffState('victory');
        a.victoryTimer += dt;
        // Cycle through 4 frames at ~4fps for goofy slow dance
        a.victoryFrameIdx += dt * 4;
        const ac = getActiveChar();
        const frames = ac.victoryFrames && ac.victoryFrames[a.victoryAnim];
        if (frames && frames.length > 0) {
            if (a.victoryFrameIdx >= frames.length) {
                a.victoryFrameIdx = 0;
                a.victoryLoopCount++;
            }
        }
        a.currentDir = 'south'; // always face camera
    } else if (P.hp <= 0) { setJeffState('death'); a.deathTimer += dt; }
    else if (a.hitTimer > 0) { a.hitTimer -= dt; setJeffState('hit'); }
    else if (P.dashing) setJeffState('run');
    else if (moving) setJeffState('walk');
    else setJeffState('idle');

    // Walk/run phase + walk frame cycling
    const walkSpeed = P.dashing ? 14 : 9;
    if (moving || P.dashing) {
        a.walkPhase += dt * walkSpeed;
        // Advance walk frame (cycle through 6 frames based on walk speed)
        a.walkFrameIdx += dt * (P.dashing ? 12 : 8);
    }

    // Idle phase
    a.idlePhase += dt * 2.0;

    // Step bounce
    const stepSin = Math.sin(a.walkPhase * 2);
    if (moving || P.dashing) {
        a.stepBounce = Math.abs(stepSin) * (P.dashing ? 4 : 2.5);
        a.bobY = a.stepBounce;
        if (stepSin > 0.9 && a.dustTimer <= 0) {
            a.dustTimer = 0.15;
            fxFootstepDust(P.x, P.y + 18);
        }
    } else {
        a.stepBounce *= 0.85;
        a.bobY = a.stepBounce;
    }
    if (a.dustTimer > 0) a.dustTimer -= dt;

    // Body lean
    const targetLean = P.dashing ? 0.15 : (moving ? 0.04 : 0);
    a.bodyLean += (targetLean - a.bodyLean) * Math.min(1, dt * 8);

    // Head tilt
    a.headTilt += (normAngle * 0.06 - a.headTilt) * Math.min(1, dt * 10);

    // Idle sway
    a.idleSway = !moving && !P.dashing ? Math.sin(G.totalTime * 1.2) * 0.8 : 0;

    // Breathing
    a.breathPhase += dt * 2.5;

    // Squash/stretch
    const stepCos = Math.cos(a.walkPhase * 2);
    if (a.hitTimer > 0) {
        a.squash += (0.88 - a.squash) * Math.min(1, dt * 16);
        a.stretch += (1.12 - a.stretch) * Math.min(1, dt * 16);
        const targetHurtShake = 0.8 + a.hitTimer * 2.2;
        a.hurtShake += (targetHurtShake - a.hurtShake) * Math.min(1, dt * 20);
    } else if (P.dashing) {
        a.squash = 1.06; a.stretch = 0.94;
        a.hurtShake *= Math.pow(0.02, dt);
    } else {
        const stepImpact = Math.max(0, -stepCos) * (moving ? 0.03 : 0);
        a.squash += (1 + stepImpact - a.squash) * Math.min(1, dt * 10);
        a.stretch += (1 - stepImpact - a.stretch) * Math.min(1, dt * 10);
        a.hurtShake *= Math.pow(0.02, dt);
    }
    a.landSquash *= 0.88;

    // Expression
    if (a.expressionTimer > 0) {
        a.expressionTimer -= dt;
        if (a.expressionTimer <= 0) a.expression = 'normal';
    }
    if (P.hp > 0 && P.hp / P.maxHp < 0.25) {
        a.expression = 'panic';
        if (Math.random() < 0.05 && typeof spawnParticles === 'function') {
            spawnParticles(P.x + (Math.random() - 0.5) * 10, P.y - 20, 1, {
                speed: 10, speedVar: 5, life: 0.4, size: 2, colors: ['#00ffff', '#aaffff'],
                gravity: 40, friction: 0.9, shape: 'circle'
            });
        }
    }
}

function jeffHitReaction(intensity) {
    const amp = Math.max(0.9, Math.min(1.45, intensity || 1));
    JEFF_ANIM.hitTimer = 0.28 + amp * 0.12;
    JEFF_ANIM.expression = 'hurt';
    JEFF_ANIM.expressionTimer = 0.4 + amp * 0.16;
    JEFF_ANIM.squash = 0.88 - amp * 0.05;
    JEFF_ANIM.stretch = 1.12 + amp * 0.06;
    JEFF_ANIM.hurtShake = 1.2 + amp * 0.7;
    JEFF_ANIM.kickback = Math.max(JEFF_ANIM.kickback || 0, 2.4 + amp * 1.4);
}

function jeffKillReaction() {
    if (JEFF_ANIM.expression !== 'hurt' && JEFF_ANIM.expression !== 'panic') {
        JEFF_ANIM.expression = 'happy';
        JEFF_ANIM.expressionTimer = 0.3;
    }
}

// ---- VICTORY DANCE ----
function startVictoryDance() {
    const ac = getActiveChar();
    if (!ac.victoryAnims || ac.victoryAnims.length === 0) return;
    // Pick a random victory animation
    const animName = ac.victoryAnims[Math.floor(Math.random() * ac.victoryAnims.length)];
    JEFF_ANIM.victoryActive = true;
    JEFF_ANIM.victoryAnim = animName;
    JEFF_ANIM.victoryTimer = 0;
    JEFF_ANIM.victoryFrameIdx = 0;
    JEFF_ANIM.victoryLoopCount = 0;
    JEFF_ANIM.currentDir = 'south'; // face camera for victory
    setJeffState('victory');
    console.log('Victory dance:', animName);
}

function stopVictoryDance() {
    JEFF_ANIM.victoryActive = false;
    JEFF_ANIM.victoryAnim = null;
    JEFF_ANIM.victoryTimer = 0;
    JEFF_ANIM.victoryLoopCount = 0;
    if (JEFF_ANIM.state === 'victory') {
        JEFF_ANIM.state = 'idle';
    }
}

// ============ RENDER ============
function renderJeff(ctx) {
    const a = JEFF_ANIM;
    const nowT = (typeof G !== 'undefined' && Number.isFinite(G.totalTime)) ? G.totalTime : Date.now() / 1000;
    ctx.save();
    ctx.translate(P.x, P.y);

    // Degen shake
    const jeffOfs = getJeffShakeOffset();
    ctx.translate(jeffOfs.x, jeffOfs.y);

    // Hurt shake
    if (a.hurtShake > 0.08) {
        const hurtX = Math.sin(nowT * 34) * a.hurtShake * 0.38;
        const hurtY = Math.sin(nowT * 21 + 0.9) * a.hurtShake * 0.16;
        ctx.translate(
            hurtX,
            hurtY
        );
    }

    if (P.iframes > 0) {
        const iframeMix = Math.min(1, P.iframes / 0.5);
        const softPulse = 0.5 + 0.5 * Math.sin(nowT * 18);
        ctx.globalAlpha = Math.max(0.9, Math.min(1, 0.965 - softPulse * 0.04 * iframeMix));
    } else {
        ctx.globalAlpha = 1;
    }

    // Body lean
    ctx.rotate(a.bodyLean * a.facingX);
    ctx.translate(a.idleSway, -a.bobY);

    // Squash/stretch
    ctx.scale(a.stretch, a.squash + a.landSquash);

    // Breathing in idle
    if (!a.isMoving && a.state === 'idle') {
        ctx.scale(1, 1 + Math.sin(a.breathPhase) * 0.012);
    }

    // Main sprite
    const _ac = getActiveChar();
    if (_ac.idleReady) {
        renderJeffSprite(ctx, a);
    } else {
        // Pixel art fallback
        ctx.save();
        if (a.facingX < 0) ctx.scale(-1, 1);
        const pf = (typeof PLAYER_FRAMES !== 'undefined' && PLAYER_FRAMES.length)
            ? PLAYER_FRAMES[Math.floor(G.totalTime * 6) % PLAYER_FRAMES.length]
            : (typeof PLAYER_SPR !== 'undefined' ? PLAYER_SPR : null);
        if (pf) {
            const sc = 40 / pf.height;
            ctx.scale(sc, sc);
            ctx.drawImage(pf, -pf.width / 2, -pf.height / 2);
        }
        ctx.restore();
    }

    ctx.restore();
}

// ============ DIRECTIONAL FRAME SELECTION + RENDERING ============
function renderJeffSprite(ctx, a) {
    const ac = getActiveChar();
    const dir = a.currentDir;
    const dirData = ac.sprites[dir];
    if (!dirData) return;

    let frame = null;
    const shooting = a.isShooting || a.shootTimer > 0;

    // For shooting, use aim direction (P.angle) instead of movement direction
    const aimDir = angleToJeffDir(P.angle);
    const aimDirData = ac.sprites[aimDir] || dirData;

    // ---- VICTORY DANCE ----
    if (a.state === 'victory' && a.victoryActive) {
        const frames = ac.victoryFrames && ac.victoryFrames[a.victoryAnim];
        if (frames && frames.length > 0) {
            const fi = Math.floor(a.victoryFrameIdx) % frames.length;
            frame = frames[fi];
        }
        if (!frame) frame = dirData.idle;

    // ---- DEATH ----
    } else if (a.state === 'death') {
        const southData = ac.sprites['south'];
        const baseFrame = (southData && southData.idle) || dirData.idle;
        if (baseFrame) {
            const dp = Math.min(1, a.deathTimer * 1.5);
            frame = applyDeathTransform(baseFrame, dp);
        }

    // ---- HIT ----
    } else if (a.state === 'hit') {
        frame = dirData.hurt || ac.hurtShared || dirData.idle;

    // ---- RUN / DASH (+ optional shoot overlay) ----
    } else if (a.state === 'run') {
        if (ac.walkReady && dirData.walk.length > 0) {
            const nFrames = dirData.walk.length;
            const fi = Math.floor(a.walkFrameIdx) % nFrames;
            frame = dirData.walk[fi];
        }
        if (!frame) frame = dirData.idle;

    // ---- WALK + SHOOT ----
    } else if (a.state === 'walk' && shooting) {
        // Use shoot animation frame based on aim direction
        if (ac.shootReady && aimDirData.shoot.length > 0) {
            const nFrames = aimDirData.shoot.length;
            const shootProgress = 1 - (a.shootTimer / 0.2); // 0→1 during shoot
            const fi = Math.min(nFrames - 1, Math.floor(shootProgress * nFrames));
            frame = aimDirData.shoot[fi];
        }
        // Fallback to walk frame
        if (!frame && ac.walkReady && dirData.walk.length > 0) {
            const nFrames = dirData.walk.length;
            const fi = Math.floor(a.walkFrameIdx) % nFrames;
            frame = dirData.walk[fi];
        }
        if (!frame) frame = dirData.idle;

    // ---- WALK ----
    } else if (a.state === 'walk') {
        if (ac.walkReady && dirData.walk.length > 0) {
            const nFrames = dirData.walk.length;
            const fi = Math.floor(a.walkFrameIdx) % nFrames;
            frame = dirData.walk[fi];
        }
        if (!frame) frame = dirData.idle;

    // ---- STANDING + SHOOT ----
    } else if (shooting) {
        if (ac.shootReady && aimDirData.shoot.length > 0) {
            const nFrames = aimDirData.shoot.length;
            const shootProgress = 1 - (a.shootTimer / 0.2);
            const fi = Math.min(nFrames - 1, Math.floor(shootProgress * nFrames));
            frame = aimDirData.shoot[fi];
        }
        if (!frame) frame = aimDirData.idle || dirData.idle;

    // ---- IDLE ----
    } else {
        frame = dirData.idle;
    }

    // Ultimate fallback
    if (!frame) {
        // Try south idle
        const south = ac.sprites['south'];
        frame = south ? south.idle : null;
    }
    if (!frame) {
        // Legacy pixel art fallback
        ctx.save();
        if (a.facingX < 0) ctx.scale(-1, 1);
        const pf = (typeof PLAYER_FRAMES !== 'undefined' && PLAYER_FRAMES[0]) || (typeof PLAYER_SPR !== 'undefined' ? PLAYER_SPR : null);
        if (pf) {
            const sc = 40 / pf.height;
            ctx.scale(sc, sc);
            ctx.drawImage(pf, -pf.width / 2, -pf.height / 2);
        }
        ctx.restore();
        return;
    }

    // ---- DRAW ----
    const drawH = ac.drawHeight;
    const fw = frame.width || frame.naturalWidth || 104;
    const fh = frame.height || frame.naturalHeight || 104;
    const drawW = (fw / fh) * drawH;

    // Store frame info for afterimages
    a.currentFrame = { img: frame, w: drawW, h: drawH, facingX: a.facingX, headTilt: a.headTilt, bodyLean: a.bodyLean };

    // Kickback offset
    const kickX = -a.kickback * a.facingX * 0.5;
    const kickY = a.aimZone === 'up' ? a.kickback * 0.3 : (a.aimZone === 'down' ? -a.kickback * 0.3 : 0);

    ctx.save();
    ctx.translate(kickX, kickY);

    // Head tilt (subtle)
    if (a.state !== 'death') ctx.rotate(a.headTilt);

    // No more horizontal flip — we have actual directional sprites!
    // But weapon rendering still uses facingX for arc direction
    // So we keep facingX updated but don't flip the sprite

    // Background weapons (under body)
    if (typeof WEAPONS !== 'undefined' && P.weapons && P.weapons.length > 0) {
        renderWeaponOnCharacter(ctx, a, drawW, drawH, false);
    }

    // Draw the main sprite (pixel art crisp)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.imageSmoothingEnabled = true;

    ctx.restore();

    // Neon glow (additive)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.15;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, -drawW / 2 * 1.05, -drawH / 2 * 1.05, drawW * 1.05, drawH * 1.05);
    ctx.imageSmoothingEnabled = true;
    ctx.restore();

    // Expression overlay
    renderExpressionOverlay(ctx, a, drawW, drawH);

    // Foreground weapons (over body)
    if (typeof WEAPONS !== 'undefined' && P.weapons && P.weapons.length > 0) {
        renderWeaponOnCharacter(ctx, a, drawW, drawH, true);
    }
}

// ---- DEATH TRANSFORM (canvas transform on idle frame) ----
function applyDeathTransform(baseFrame, progress) {
    const fw = baseFrame.width || baseFrame.naturalWidth || 104;
    const fh = baseFrame.height || baseFrame.naturalHeight || 104;
    const pad = 40;
    const c = document.createElement('canvas');
    c.width = fw + pad * 2; c.height = fh + pad * 2;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.save();
    cx.translate(c.width / 2, c.height / 2);

    // Tilt and fall
    const rotation = progress * 1.5;
    const yOffset = progress * 35;
    const scaleY = 1 - progress * 0.3;
    const darkness = progress * 0.4;

    cx.rotate(rotation);
    cx.translate(0, yOffset);
    cx.scale(1, scaleY);
    cx.drawImage(baseFrame, -fw / 2, -fh / 2, fw, fh);
    cx.restore();

    // Darken
    if (darkness > 0) {
        cx.save();
        cx.globalCompositeOperation = 'source-atop';
        cx.globalAlpha = darkness;
        cx.fillStyle = '#000000';
        cx.fillRect(0, 0, c.width, c.height);
        cx.restore();
    }

    return c;
}

// ---- WEAPON ON CHARACTER (two-arm system) ----
// 1 weapon  → single arm at aim direction
// 2+ weapons → right arm + left arm, alternating (akimbo style)
// Orbital weapons (drones) orbit independently around Jeff
const ARM_RADIUS = 16;   // distance from center to hand
const ARM_Y_OFFSET = 4;  // slightly below center (torso level)
const ARM_SPREAD = 0.45; // ~26° between right and left arm

// Shared helper: compute weapon angle for a given arm slot
// Used by both rendering and muzzle offset for consistency
function getArmWeaponAngle(armIdx, armCount, aimAngle) {
    if (armCount <= 1) return aimAngle;
    // Alternate right (even) / left (odd)
    const isRight = armIdx % 2 === 0;
    const baseOff = isRight ? -ARM_SPREAD / 2 : ARM_SPREAD / 2;
    // Stack extra weapons on same arm with tiny extra spread
    const slot = Math.floor(armIdx / 2);
    const maxSlots = Math.ceil(armCount / 2);
    const extra = maxSlots > 1 ? slot * 0.10 * (isRight ? -1 : 1) : 0;
    return aimAngle + baseOff + extra;
}

function renderWeaponOnCharacter(ctx, a, drawW, drawH, isForeground) {
    if (!P.weapons || P.weapons.length === 0) return;

    const aimAngle = P.angle;
    const aimingDown = (aimAngle > 0 && aimAngle < Math.PI);

    // Separate orbital from arm weapons
    const armWeapons = [];
    const orbitalWeapons = [];
    P.weapons.forEach((w, index) => {
        const def = typeof WEAPONS !== 'undefined' ? WEAPONS[w.id] : null;
        if (!def || !def.icon) return;
        if (def.type === 'orbital') {
            orbitalWeapons.push({ w, index, def });
        } else {
            armWeapons.push({ w, index, def });
        }
    });

    // ---- ARM WEAPONS: two-arm akimbo system ----
    const armCount = armWeapons.length;
    armWeapons.forEach((entry, armIdx) => {
        const { w, index, def } = entry;

        // Layer sorting
        if (isForeground !== aimingDown) return;

        ctx.save();

        // Compute weapon angle using the two-arm system
        const weaponAngle = getArmWeaponAngle(armIdx, armCount, aimAngle);

        // Hand position
        const handX = Math.cos(weaponAngle) * ARM_RADIUS;
        const handY = Math.sin(weaponAngle) * ARM_RADIUS + ARM_Y_OFFSET;

        // Kickback recoil (primary full, others damped)
        const kick = armIdx === 0 ? a.kickback : a.kickback * 0.25;
        const recoilX = -Math.cos(weaponAngle) * kick * 0.6;
        const recoilY = -Math.sin(weaponAngle) * kick * 0.6;

        ctx.translate(handX + recoilX, handY + recoilY);

        // Rotate weapon to face its arm direction
        if (Math.cos(weaponAngle) < 0) {
            ctx.rotate(weaponAngle - Math.PI);
            ctx.scale(-1, 1);
        } else {
            ctx.rotate(weaponAngle);
        }

        // Primary full opacity, secondary slightly dimmer
        ctx.globalAlpha = armIdx === 0 ? 0.95 : 0.85;

        // Muzzle flash (primary arm only)
        if (armIdx === 0 && a.kickback > 1 && (def.type === 'proj' || def.type === 'homing')) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = Math.min(0.8, a.kickback * 0.3);
            const tipX = 12;
            const flashR = 4 + a.kickback * 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let fi = 0; fi < 8; fi++) {
                const fA = (fi / 8) * Math.PI * 2;
                const r = (fi % 2 === 0) ? flashR : flashR * 0.35;
                ctx.lineTo(tipX + Math.cos(fA) * r, Math.sin(fA) * r);
            }
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath(); ctx.arc(tipX, 0, flashR * 0.45, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // Draw weapon sprite
        const wSprite = typeof WEAPON_SPRITES !== 'undefined' ? WEAPON_SPRITES[w.id] : null;
        const scale = armIdx === 0 ? 0.38 : 0.32;
        if (wSprite) {
            const dw = wSprite.width * scale;
            const dh = wSprite.height * scale;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(wSprite, -dw * 0.25, -dh / 2, dw, dh);
            // Subtle glow
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.15;
            ctx.drawImage(wSprite, -dw * 0.3 - 1, -dh / 2 - 1, dw + 2, dh + 2);
            ctx.globalCompositeOperation = 'source-over';
            ctx.imageSmoothingEnabled = true;
        } else {
            ctx.font = armIdx === 0 ? '14px sans-serif' : '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.icon, 4, 0);
        }

        ctx.restore();
    });

    // ---- ORBITAL WEAPONS: orbit around Jeff (drones only) ----
    orbitalWeapons.forEach((entry) => {
        const { w, def } = entry;
        const droneCount = def.cnt || 2;
        for (let di = 0; di < droneCount; di++) {
            const orbitAngle = G.totalTime * (def.orbitSpeed || 2.5) + (di / droneCount) * Math.PI * 2;
            const orbitR = def.orbitRadius || 70;
            const ox = Math.cos(orbitAngle) * orbitR * 0.4;
            const oy = Math.sin(orbitAngle) * orbitR * 0.25 - 10;

            const droneFront = (oy > 0);
            if (isForeground !== droneFront) continue;

            ctx.save();
            ctx.translate(ox, oy);
            ctx.globalAlpha = 0.7;

            const wSprite = typeof WEAPON_SPRITES !== 'undefined' ? WEAPON_SPRITES[w.id] : null;
            if (wSprite) {
                const dw = wSprite.width * 0.22;
                const dh = wSprite.height * 0.22;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(wSprite, -dw / 2, -dh / 2, dw, dh);
                ctx.imageSmoothingEnabled = true;
            } else {
                ctx.font = '8px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(def.icon, 0, 0);
            }
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });
}

// ---- EXPRESSIONS ----
function renderExpressionOverlay(ctx, a, drawW, drawH) {
    const headY = -drawH * 0.25;

    if (a.expression === 'hurt') {
        return;
    } else if (a.expression === 'panic') {
        ctx.fillStyle = '#66ccff';
        ctx.globalAlpha = 0.7;
        const t = Date.now() * 0.005;
        const dropY = headY - 6 + Math.sin(t) * 3;
        ctx.beginPath(); ctx.arc(drawW * 0.35, dropY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(drawW * 0.35, dropY - 3);
        ctx.lineTo(drawW * 0.35 + 1.5, dropY);
        ctx.lineTo(drawW * 0.35 - 1.5, dropY);
        ctx.fill();
        const dropY2 = headY - 2 + Math.cos(t * 1.3) * 2;
        ctx.beginPath(); ctx.arc(-drawW * 0.3, dropY2, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    } else if (a.expression === 'happy') {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, headY, drawW * 0.4, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
}

// ---- LASER SIGHT ----
function drawAimArrow(ctx) {
    ctx.save();
    const laserLength = 300;
    const gradient = ctx.createLinearGradient(0, 0, 0, -laserLength);
    gradient.addColorStop(0, 'rgba(0, 255, 204, 0.5)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 204, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
    ctx.rotate(P.angle + Math.PI / 2);
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.3;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.fillRect(-0.5 * pulse, -18, 1 * pulse, -laserLength);
    ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, -laserLength - 18, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// ---- FOOTSTEP DUST ----
function fxFootstepDust(x, y) {
    if (typeof spawnParticles !== 'function') return;
    spawnParticles(x, y, 3, {
        speed: 20, speedVar: 15,
        life: 0.2, size: 2, sizeEnd: 0,
        colors: ['#666', '#888', '#555'],
        gravity: -30, friction: 0.92, shape: 'circle',
    });
}

// ---- RESET ----
function resetCharacterAnim() {
    JEFF_ANIM.state = 'idle';
    JEFF_ANIM.prevState = 'idle';
    JEFF_ANIM.hitTimer = 0;
    JEFF_ANIM.facingX = 1;
    JEFF_ANIM.isMoving = false;
    JEFF_ANIM.walkPhase = 0;
    JEFF_ANIM.bobY = 0;
    JEFF_ANIM.squash = 1;
    JEFF_ANIM.stretch = 1;
    JEFF_ANIM.expression = 'normal';
    JEFF_ANIM.expressionTimer = 0;
    JEFF_ANIM.aimZone = 'right';
    JEFF_ANIM.isShooting = false;
    JEFF_ANIM.shootTimer = 0;
    JEFF_ANIM.bodyLean = 0;
    JEFF_ANIM.headTilt = 0;
    JEFF_ANIM.kickback = 0;
    JEFF_ANIM.stepBounce = 0;
    JEFF_ANIM.armSwing = 0;
    JEFF_ANIM.landSquash = 0;
    JEFF_ANIM.dustTimer = 0;
    JEFF_ANIM.idleSway = 0;
    JEFF_ANIM.runLean = 0;
    JEFF_ANIM.deathTimer = 0;
    JEFF_ANIM.hurtShake = 0;
    JEFF_ANIM.idlePhase = 0;
    JEFF_ANIM.currentDir = 'south';
    JEFF_ANIM.moveDir = 'south';
    JEFF_ANIM.walkFrameIdx = 0;
    JEFF_ANIM.victoryActive = false;
    JEFF_ANIM.victoryAnim = null;
    JEFF_ANIM.victoryTimer = 0;
    JEFF_ANIM.victoryFrameIdx = 0;
    JEFF_ANIM.victoryLoopCount = 0;
}
