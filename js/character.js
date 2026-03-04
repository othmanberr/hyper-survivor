// ============ ENHANCED CHARACTER ANIMATION SYSTEM ============
// 8 base sprites + ~16 generated variants = ~24 total frames
// Generated at load time via Canvas transforms (lean, tint, blend, stretch)

// ---- FRAME LOADER WITH CHROMA-KEY ----
const JEFF_FRAMES = {};
const JEFF_GENERATED = {}; // generated derivative sprites
const JEFF_FRAME_FILES = {
    idle: 'assets/player/jeff_idle.png',
    walk1: 'assets/player/jeff_walk1.png',
    walk2: 'assets/player/jeff_walk2.png',
    shootRight: 'assets/player/jeff_shoot_right.png',
    shootUp: 'assets/player/jeff_shoot_up.png',
    shootDown: 'assets/player/jeff_shoot_down.png',
    walkShoot1: 'assets/player/jeff_walk_shoot1.png',
    walkShoot2: 'assets/player/jeff_walk_shoot2.png',
};
let jeffFramesReady = 0;
const JEFF_TOTAL_FRAMES = Object.keys(JEFF_FRAME_FILES).length;
let jeffGeneratedReady = false;

function chromaKey(img) {
    try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        const imgData = cx.getImageData(0, 0, c.width, c.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            // Pure green background removal (aggressive)
            if (g > 80 && g > r * 1.15 && g > b * 1.15) {
                const greenExcess = g - Math.max(r, b);
                if (greenExcess > 40) {
                    d[i + 3] = 0; // fully transparent
                } else {
                    const alpha = Math.max(0, 255 - greenExcess * 6);
                    d[i + 3] = Math.min(d[i + 3], alpha);
                    d[i + 1] = Math.min(d[i + 1], Math.max(r, b) + 5);
                }
            }
        }
        cx.putImageData(imgData, 0, 0);
        return c;
    } catch (e) {
        console.warn('Chroma key failed (CORS?):', e);
        // Fallback: draw the image as-is (green bg will show)
        // Try to at least render it on a canvas for consistency
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 640;
        c.height = img.naturalHeight || 640;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        return c;
    }
}

Object.entries(JEFF_FRAME_FILES).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        try {
            JEFF_FRAMES[key] = chromaKey(img);
        } catch (e) {
            console.warn('Chroma key skipped for', key);
            JEFF_FRAMES[key] = img;
        }
        jeffFramesReady++;
        // When all base frames loaded, generate derivatives
        if (jeffFramesReady >= JEFF_TOTAL_FRAMES && !jeffGeneratedReady) {
            generateDerivedSprites();
        }
    };
    img.onerror = () => {
        console.error('Failed to load:', src);
        JEFF_FRAMES[key] = null;
        jeffFramesReady++;
        if (jeffFramesReady >= JEFF_TOTAL_FRAMES && !jeffGeneratedReady) {
            generateDerivedSprites();
        }
    };
});

function allJeffFramesReady() {
    return jeffFramesReady >= JEFF_TOTAL_FRAMES;
}

// ============ SPRITE GENERATOR ============
// Creates new sprites from base sprites using Canvas transformations

// Helper: create a transformed copy of a sprite
function transformSprite(src, opts) {
    if (!src) return null;
    const w = src.width || src.naturalWidth || 640;
    const h = src.height || src.naturalHeight || 640;
    const pad = 80; // padding for rotation overflow
    const c = document.createElement('canvas');
    c.width = w + pad * 2;
    c.height = h + pad * 2;
    const cx = c.getContext('2d');

    cx.save();
    cx.translate(c.width / 2, c.height / 2);

    // Rotation
    if (opts.rotate) cx.rotate(opts.rotate);
    // Scale / stretch
    const sx = opts.scaleX || 1;
    const sy = opts.scaleY || 1;
    cx.scale(sx, sy);
    // Offset
    const ox = opts.offsetX || 0;
    const oy = opts.offsetY || 0;

    cx.drawImage(src, -w / 2 + ox, -h / 2 + oy, w, h);
    cx.restore();

    // Color tint overlay
    if (opts.tint) {
        cx.save();
        cx.globalCompositeOperation = 'source-atop';
        cx.globalAlpha = opts.tintAlpha || 0.3;
        cx.fillStyle = opts.tint;
        cx.fillRect(0, 0, c.width, c.height);
        cx.restore();
    }

    // Brightness
    if (opts.brightness) {
        cx.save();
        cx.globalCompositeOperation = 'source-atop';
        cx.globalAlpha = Math.abs(opts.brightness);
        cx.fillStyle = opts.brightness > 0 ? '#ffffff' : '#000000';
        cx.fillRect(0, 0, c.width, c.height);
        cx.restore();
    }

    return c;
}

// Helper: blend two sprites together (crossfade)
function blendSprites(src1, src2, t) {
    if (!src1 || !src2) return src1 || src2;
    const w = Math.max(src1.width || 640, src2.width || 640);
    const h = Math.max(src1.height || 640, src2.height || 640);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');

    // Draw first sprite
    cx.globalAlpha = 1 - t;
    cx.drawImage(src1, (w - (src1.width || w)) / 2, (h - (src1.height || h)) / 2);
    // Draw second sprite blended on top
    cx.globalAlpha = t;
    cx.drawImage(src2, (w - (src2.width || w)) / 2, (h - (src2.height || h)) / 2);

    return c;
}

function generateDerivedSprites() {
    jeffGeneratedReady = true;
    const F = JEFF_FRAMES;
    const G = JEFF_GENERATED;

    // ---- WALK INTERMEDIATES (idle↔walk blends for smoother cycle) ----
    // walk_mid1: 50% blend idle → walk1
    G.walkMid1 = blendSprites(F.idle, F.walk1, 0.5);
    // walk_mid2: 50% blend idle → walk2
    G.walkMid2 = blendSprites(F.idle, F.walk2, 0.5);
    // walk_trans1: 30% blend walk1 → walk2 (transition)
    G.walkTrans = blendSprites(F.walk1, F.walk2, 0.5);

    // ---- RUN SPRITES (leaned forward + stretched) ----
    // run1: walk1 leaned forward
    G.run1 = transformSprite(F.walk1, { rotate: 0.12, scaleX: 1.05, scaleY: 0.95, offsetY: 5 });
    // run2: walk2 leaned forward
    G.run2 = transformSprite(F.walk2, { rotate: 0.12, scaleX: 1.05, scaleY: 0.95, offsetY: 5 });
    // run_mid: blend of run1 and run2
    G.runMid = blendSprites(G.run1, G.run2, 0.5);
    // run_push: extreme lean (push-off frame)
    G.runPush = transformSprite(F.walk1, { rotate: 0.18, scaleX: 1.08, scaleY: 0.92, offsetY: 8 });

    // ---- IDLE VARIANTS (breathing / micro-movements) ----
    // idle_breathe_in: slightly taller (inhale)
    G.idleBreatheIn = transformSprite(F.idle, { scaleX: 0.98, scaleY: 1.02 });
    // idle_breathe_out: slightly wider (exhale)
    G.idleBreatheOut = transformSprite(F.idle, { scaleX: 1.02, scaleY: 0.98 });
    // idle_sway_left: slight lean left
    G.idleSwayL = transformSprite(F.idle, { rotate: -0.03, offsetX: -3 });
    // idle_sway_right: slight lean right
    G.idleSwayR = transformSprite(F.idle, { rotate: 0.03, offsetX: 3 });

    // ---- HURT SPRITES ----
    // hurt1: red tint + squash
    G.hurt1 = transformSprite(F.idle, { scaleX: 1.15, scaleY: 0.85, tint: '#ff0000', tintAlpha: 0.35 });
    // hurt2: leaning back from impact
    G.hurt2 = transformSprite(F.idle, { rotate: -0.15, scaleX: 1.1, scaleY: 0.9, tint: '#ff0000', tintAlpha: 0.25, offsetX: -5 });
    // hurt_stagger: almost falling
    G.hurtStagger = transformSprite(F.idle, { rotate: -0.25, scaleX: 1.05, scaleY: 0.95, tint: '#ff3333', tintAlpha: 0.2, offsetX: -10 });

    // ---- DEATH SPRITES ----
    // death1: tilting
    G.death1 = transformSprite(F.idle, { rotate: 0.5, offsetY: 10, brightness: -0.15 });
    // death2: fallen
    G.death2 = transformSprite(F.idle, { rotate: 1.2, offsetY: 25, brightness: -0.3 });
    // death3: on ground
    G.death3 = transformSprite(F.idle, { rotate: 1.5, offsetY: 35, scaleY: 0.7, brightness: -0.4 });

    // ---- DASH SPRITES ----
    // dash1: extreme speed stretch
    G.dash1 = transformSprite(F.walk1, { scaleX: 1.2, scaleY: 0.85, rotate: 0.2, offsetY: 3 });
    // dash2: alternate leg
    G.dash2 = transformSprite(F.walk2, { scaleX: 1.2, scaleY: 0.85, rotate: 0.2, offsetY: 3 });

    // ---- SHOOT VARIANTS (recoil) ----
    // shoot_recoil: shoot right with kickback
    G.shootRecoil = transformSprite(F.shootRight, { scaleX: 0.95, scaleY: 1.03, offsetX: -8, brightness: 0.1 });
    // shoot_up_recoil
    G.shootUpRecoil = transformSprite(F.shootUp, { scaleY: 0.97, offsetY: 5, brightness: 0.1 });
    // shoot_down_recoil
    G.shootDownRecoil = transformSprite(F.shootDown, { scaleY: 1.03, offsetY: -3, brightness: 0.1 });

    console.log(`Generated ${Object.keys(G).length} derived sprites from ${JEFF_TOTAL_FRAMES} base frames`);
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
    idlePhase: 0, // for idle animation cycle
};

function setJeffState(st) {
    if (JEFF_ANIM.state === st) return;
    if (JEFF_ANIM.state === 'death') return;
    JEFF_ANIM.prevState = JEFF_ANIM.state;
    JEFF_ANIM.state = st;
}

// Called by game.js when player fires a weapon
function jeffShootReaction() {
    JEFF_ANIM.isShooting = true;
    JEFF_ANIM.shootTimer = 0.2;
    JEFF_ANIM.kickback = 6;
}

// ---- MUZZLE POSITION ----
function getWeaponMuzzleOffset() {
    // Kept for compatibility just in case but we'll introduce a new one with index
    const angle = P.angle;
    const muzzleDist = 22 - JEFF_ANIM.kickback * 0.3;
    return {
        x: Math.cos(angle) * muzzleDist,
        y: Math.sin(angle) * muzzleDist
    };
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
    return { x: Math.cos(arcAng) * arcRadius, y: Math.sin(arcAng) * arcRadius, arcAng: arcAng, arcRadius: arcRadius, startAng: startAng, endAng: endAng };
}

function getWeaponMuzzleOffsetByIndex(index, totalWeapons) {
    const offset = getWeaponOffset(index, totalWeapons);
    const muzzleLen = 6;

    let ox = offset.x;
    // Mirror the X coordinate if the character is facing left,
    // because the drawing context uses ctx.scale(-1, 1)
    if (typeof JEFF_ANIM !== 'undefined' && JEFF_ANIM.facingX < 0) {
        ox = -ox;
    }

    return {
        x: ox + Math.cos(P.angle) * muzzleLen,
        y: offset.y + Math.sin(P.angle) * muzzleLen
    };
}

// ---- UPDATE ----
function updateCharacterAnim(dt, inputSource) {
    const a = JEFF_ANIM;
    const i = inputSource || inp;
    const moving = !!(i.l || i.r || i.u || i.d);
    a.isMoving = moving;

    // Face movement direction
    const dx = i.r - i.l;
    if (dx !== 0) a.facingX = dx > 0 ? 1 : -1;

    // Aim zone (still based on aim angle for shooting animations)
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
    if (P.hp <= 0) { setJeffState('death'); a.deathTimer += dt; }
    else if (a.hitTimer > 0) { a.hitTimer -= dt; setJeffState('hit'); }
    else if (P.dashing) setJeffState('run');
    else if (moving) setJeffState('walk');
    else setJeffState('idle');

    // Walk/run phase
    const walkSpeed = P.dashing ? 14 : 9;
    if (moving || P.dashing) {
        a.walkPhase += dt * walkSpeed;
    }

    // Idle phase (for breathing/sway cycle)
    a.idlePhase += dt * 2.0;

    // Step bounce
    const stepSin = Math.sin(a.walkPhase * 2);
    if (moving || P.dashing) {
        a.stepBounce = Math.abs(stepSin) * (P.dashing ? 4 : 2.5);
        a.bobY = a.stepBounce;
        // Dust
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
        a.squash = 0.82; a.stretch = 1.18;
        a.hurtShake = a.hitTimer * 3;
    } else if (P.dashing) {
        a.squash = 1.06; a.stretch = 0.94;
        a.hurtShake *= 0.9;
    } else {
        const stepImpact = Math.max(0, -stepCos) * (moving ? 0.03 : 0);
        a.squash += (1 + stepImpact - a.squash) * Math.min(1, dt * 10);
        a.stretch += (1 - stepImpact - a.stretch) * Math.min(1, dt * 10);
        a.hurtShake *= 0.9;
    }

    a.landSquash *= 0.88;

    // Expression
    if (a.expressionTimer > 0) {
        a.expressionTimer -= dt;
        if (a.expressionTimer <= 0) a.expression = 'normal';
    }
    if (P.hp > 0 && P.hp / P.maxHp < 0.25) {
        a.expression = 'panic';
        // Sweat/stress particles when in panic
        if (Math.random() < 0.05 && typeof spawnParticles === 'function') {
            spawnParticles(P.x + (Math.random() - 0.5) * 10, P.y - 20, 1, {
                speed: 10, speedVar: 5, life: 0.4, size: 2, colors: ['#00ffff', '#aaffff'],
                gravity: 40, friction: 0.9, shape: 'circle'
            });
        }
    }
}

function jeffHitReaction() {
    JEFF_ANIM.hitTimer = 0.35;
    JEFF_ANIM.expression = 'hurt';
    JEFF_ANIM.expressionTimer = 0.5;
    JEFF_ANIM.squash = 0.65;
    JEFF_ANIM.stretch = 1.35;
    JEFF_ANIM.hurtShake = 4;
    JEFF_ANIM.kickback = 3;
}

function jeffKillReaction() {
    if (JEFF_ANIM.expression !== 'hurt' && JEFF_ANIM.expression !== 'panic') {
        JEFF_ANIM.expression = 'happy';
        JEFF_ANIM.expressionTimer = 0.3;
    }
}

// ============ RENDER ============
function renderJeff(ctx) {
    const a = JEFF_ANIM;
    ctx.save();
    ctx.translate(P.x, P.y);

    // Degen shake
    const jeffOfs = getJeffShakeOffset();
    ctx.translate(jeffOfs.x, jeffOfs.y);

    // Hurt shake
    if (a.hurtShake > 0.1) {
        ctx.translate(
            (Math.random() - 0.5) * a.hurtShake * 2,
            (Math.random() - 0.5) * a.hurtShake * 2
        );
    }

    // (Removed redundant ctx.filter for P.flash as it's handled via composite in renderJeffSprite)
    ctx.globalAlpha = P.iframes > 0 ? (Math.sin(Date.now() / 50) > 0 ? 1 : 0.15) : 1;

    drawAimArrow(ctx);

    // Body lean
    ctx.rotate(a.bodyLean * a.facingX);
    ctx.translate(a.idleSway, -a.bobY);

    // Squash/stretch
    ctx.scale(a.stretch, a.squash + a.landSquash);

    // Breathing in idle
    if (!a.isMoving && a.state === 'idle') {
        ctx.scale(1, 1 + Math.sin(a.breathPhase) * 0.012);
    }

    // Dynamic Shadow
    ctx.save();
    const shadowScale = Math.max(0.4, 1 - a.bobY * 0.15);
    ctx.globalAlpha = 0.3 * shadowScale;
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    const shadowW = (P.dashing ? 18 : 14) * shadowScale;
    const shadowH = (P.dashing ? 5 : 4) * shadowScale;
    // Keep shadow anchored on ground, while visual body moves via translate later
    ctx.ellipse(0, 22 + a.bobY, shadowW, shadowH, 0, 0, Math.PI * 2);
    // ctx.filter = blur removed for massive performance gains
    ctx.fill();
    ctx.restore();

    // Main sprite
    if (allJeffFramesReady()) {
        renderJeffSprite(ctx, a);
    } else {
        // Pixel art fallback
        ctx.save();
        if (a.facingX < 0) ctx.scale(-1, 1);
        const pf = PLAYER_FRAMES[Math.floor(G.totalTime * 6) % PLAYER_FRAMES.length] || PLAYER_SPR;
        const sc = 40 / pf.height;
        ctx.scale(sc, sc);
        ctx.drawImage(pf, -pf.width / 2, -pf.height / 2);
        ctx.restore();
    }

    ctx.restore();
}

// ============ FRAME SELECTION (using generated sprites) ============
function renderJeffSprite(ctx, a) {
    const shooting = a.isShooting || a.shootTimer > 0;
    const walking = a.state === 'walk' || a.state === 'run';
    const F = JEFF_FRAMES;
    const D = JEFF_GENERATED;
    const hasGenerated = jeffGeneratedReady && Object.keys(D).length > 0;

    let frame = null;

    // ---- DEATH (3-frame sequence) ----
    if (a.state === 'death') {
        if (hasGenerated) {
            const dp = Math.min(1, a.deathTimer * 1.5);
            if (dp < 0.3) frame = D.death1;
            else if (dp < 0.7) frame = D.death2;
            else frame = D.death3;
        }
        if (!frame) frame = F.idle;

        // ---- HIT (stagger sequence) ----
    } else if (a.state === 'hit') {
        if (hasGenerated) {
            if (a.hitTimer > 0.25) frame = D.hurt1;
            else if (a.hitTimer > 0.15) frame = D.hurt2;
            else frame = D.hurtStagger;
        }
        if (!frame) frame = F.shootRight || F.idle;

        // ---- DASH / RUN (4-frame cycle) ----
    } else if (a.state === 'run') {
        if (hasGenerated) {
            const phase = (a.walkPhase / Math.PI) % 4;
            if (phase < 1) frame = D.dash1 || D.run1;
            else if (phase < 2) frame = D.runMid || D.run2;
            else if (phase < 3) frame = D.dash2 || D.run2;
            else frame = D.runPush || D.run1;
        }
        if (!frame) {
            const wi = Math.floor(a.walkPhase / Math.PI) % 2;
            frame = wi === 0 ? F.walk1 : F.walk2;
        }

        // ---- WALK + SHOOT (4-frame cycle) ----
    } else if (walking && shooting) {
        const phase = (a.walkPhase / Math.PI) % 2;
        const wi = Math.floor(phase);
        frame = wi === 0 ? (F.walkShoot1 || F.shootRight) : (F.walkShoot2 || F.shootRight);

        // ---- WALK (6-frame cycle: idle→mid→walk1→mid→idle→mid→walk2→mid) ----
    } else if (walking) {
        if (hasGenerated) {
            const phase = (a.walkPhase / Math.PI) % 4;
            if (phase < 0.5) frame = D.walkMid1;       // idle→walk1 transition
            else if (phase < 1.5) frame = F.walk1;      // full walk1
            else if (phase < 2.0) frame = D.walkTrans;  // walk1→walk2 transition
            else if (phase < 2.5) frame = D.walkMid2;   // transition to walk2
            else if (phase < 3.5) frame = F.walk2;      // full walk2
            else frame = D.walkMid1;                     // walk2→idle transition
        }
        if (!frame) {
            const wi = Math.floor(a.walkPhase / Math.PI) % 2;
            frame = wi === 0 ? F.walk1 : F.walk2;
        }

        // ---- STANDING + SHOOTING (with recoil variants) ----
    } else if (shooting) {
        const useRecoil = hasGenerated && a.kickback > 1;
        if (a.aimZone === 'up') {
            frame = useRecoil ? D.shootUpRecoil : F.shootUp;
        } else if (a.aimZone === 'down') {
            frame = useRecoil ? D.shootDownRecoil : F.shootDown;
        } else {
            frame = useRecoil ? D.shootRecoil : F.shootRight;
        }
        if (!frame) frame = F.shootRight;

        // ---- IDLE (4-frame breathing/sway cycle) ----
    } else {
        if (hasGenerated) {
            const phase = (a.idlePhase) % 4;
            if (phase < 1) frame = D.idleBreatheIn || F.idle;
            else if (phase < 2) frame = D.idleSwayR || F.idle;
            else if (phase < 3) frame = D.idleBreatheOut || F.idle;
            else frame = D.idleSwayL || F.idle;
        }
        if (!frame) frame = F.idle;
    }

    // Ultimate fallback
    if (!frame) frame = F.idle;
    if (!frame) {
        ctx.save();
        if (a.facingX < 0) ctx.scale(-1, 1);
        const pf = PLAYER_FRAMES[0] || PLAYER_SPR;
        const sc = 1; // Used to be 40 / pf.height but new sprite is larger
        ctx.scale(sc, sc);
        ctx.drawImage(pf, -pf.width / 2, -pf.height / 2);
        ctx.restore();
        return;
    }

    // ---- DRAW ----
    const drawH = 60;
    const fw = frame.width || frame.naturalWidth || 640;
    const fh = frame.height || frame.naturalHeight || 640;
    const drawW = (fw / fh) * drawH;

    // Store frame info for afterimages
    a.currentFrame = { img: frame, w: drawW, h: drawH, facingX: a.facingX, headTilt: a.headTilt, bodyLean: a.bodyLean };

    // Kickback offset
    const kickX = -a.kickback * a.facingX * 0.5;
    const kickY = a.aimZone === 'up' ? a.kickback * 0.3 : (a.aimZone === 'down' ? -a.kickback * 0.3 : 0);

    ctx.save();
    ctx.translate(kickX, kickY);

    // Head tilt
    if (a.state !== 'death') ctx.rotate(a.headTilt);

    // Flip
    if (a.facingX < 0) ctx.scale(-1, 1);

    // Background weapons (under body)
    if (typeof WEAPONS !== 'undefined' && P.weapons && P.weapons.length > 0) {
        renderWeaponOnCharacter(ctx, a, drawW, drawH, false);
    }

    // Draw the main sprite
    ctx.drawImage(frame, -drawW / 2, -drawH / 2, drawW, drawH);

    // Hit tint overlay & Glitch
    if (a.hitTimer > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255, 30, 30, ${Math.min(0.7, a.hitTimer * 2)})`;
        ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        ctx.globalCompositeOperation = 'source-over';

        // Cyber Glitch effect
        if (Math.random() < 0.6) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.5;
            const glitchOffset = (Math.random() - 0.5) * 20;
            ctx.fillStyle = '#00ffff'; // cyan shift
            ctx.fillRect(-drawW / 2 + glitchOffset, -drawH * 0.2, drawW, 10);
            ctx.fillStyle = '#ff00ff'; // magenta shift
            ctx.fillRect(-drawW / 2 - glitchOffset, 0, drawW, 8);
            ctx.restore();
        }
    }

    ctx.restore();

    // Neon glow (fast additive)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.15;
    ctx.drawImage(frame, -drawW / 2 * 1.05, -drawH / 2 * 1.05, drawW * 1.05, drawH * 1.05);
    ctx.restore();

    // Expression overlay
    renderExpressionOverlay(ctx, a, drawW, drawH);

    // Weapon emoji — foreground (over body)
    if (typeof WEAPONS !== 'undefined' && P.weapons && P.weapons.length > 0) {
        renderWeaponOnCharacter(ctx, a, drawW, drawH, true);
    }
}

// ---- WEAPON EMOJI ON CHARACTER ----
function renderWeaponOnCharacter(ctx, a, drawW, drawH, isForeground) {
    if (!P.weapons || P.weapons.length === 0) return;

    ctx.save();
    const aimAngle = P.angle;
    const facing = a.facingX;

    P.weapons.forEach((w, index) => {
        // Check if rendering in foreground or background based on rotation angle.
        let isFront = (aimAngle > 0 && aimAngle < Math.PI); // aiming down (towards camera)
        if (facing < 0) {
            isFront = !isFront; // Flip logic when character is flipped
        }

        // We render background weapons ONLY if !isForeground and they are !isFront.
        // We render foreground weapons ONLY if isForeground and they are isFront.
        // If index === 0 (main weapon), we always draw it in foreground to ensure it's visible.
        if (index === 0) {
            if (!isForeground) return;
        } else {
            if (isForeground !== isFront) return;
        }

        const def = typeof WEAPONS !== 'undefined' ? WEAPONS[w.id] : null;
        if (!def || !def.icon) return;

        ctx.save();

        const offset = getWeaponOffset(index, P.weapons.length);

        if (index === 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, offset.arcRadius, offset.startAng - 0.1, offset.endAng + 0.1);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        let wx = offset.x;
        let wy = offset.y;
        let wrot = aimAngle; // All weapons point towards the aimAngle

        // Slight hover bob
        const floatTime = G.totalTime * 2 + index;
        wy += Math.sin(floatTime) * 3;

        // Draw a mounting node (fast layered draw)
        ctx.save();
        ctx.translate(wx, wy);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.translate(wx, wy);

        // Weapon rotation with flip logic
        if (Math.cos(wrot) < 0) {
            ctx.rotate(wrot - Math.PI);
            ctx.scale(-1, 1);
        } else {
            ctx.rotate(wrot);
        }

        ctx.globalAlpha = (index === 0 || index === 1) ? 0.95 : 0.65;
        ctx.font = (index === 0 || index === 1) ? '16px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Muzzle flash (only for main/off-hand weapon shooting)
        if ((index === 0) && a.kickback > 1 && def.type === 'proj') {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = Math.min(0.8, a.kickback * 0.3);

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            const flashCenterX = 8;
            const flashCenterY = 0;
            const flashRadius = 4 + a.kickback * 0.8;

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = (i % 2 === 0) ? flashRadius : flashRadius * 0.4;
                ctx.lineTo(flashCenterX + Math.cos(angle) * r, flashCenterY + Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = index === 0 ? '#ffaa00' : '#00bbff';
            ctx.beginPath();
            ctx.arc(flashCenterX, flashCenterY, flashRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const wSprite = typeof WEAPON_SPRITES !== 'undefined' ? WEAPON_SPRITES[w.id] : null;
        if (wSprite) {
            const scale = 0.55; // Render weapon smaller
            const dw = wSprite.width * scale;
            const dh = wSprite.height * scale;
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(wSprite, -dw / 2, -dh / 2, dw, dh);
            // additive glow instead of shadowBlur
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha *= 0.3;
            ctx.drawImage(wSprite, -dw / 2 - 1, -dh / 2 - 1, dw + 2, dh + 2);
            ctx.globalCompositeOperation = 'source-over';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillText(def.icon, 0, 0);
        }
        ctx.restore();
    });

    ctx.restore();
}

// ---- EXPRESSIONS ----
function renderExpressionOverlay(ctx, a, drawW, drawH) {
    const headY = -drawH * 0.25;

    if (a.expression === 'hurt') {
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        [-5, 5].forEach(ex => {
            ctx.beginPath(); ctx.moveTo(ex - 3, headY - 3); ctx.lineTo(ex + 3, headY + 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex + 3, headY - 3); ctx.lineTo(ex - 3, headY + 3); ctx.stroke();
        });
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.globalAlpha = a.hitTimer;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, drawH * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
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
        // Subtle glow ring, no stars
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, headY, drawW * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// ---- LASER SIGHT ----
function drawAimArrow(ctx) {
    ctx.save();

    // Dynamic fade based on distance
    const laserLength = 300;
    const gradient = ctx.createLinearGradient(0, 0, 0, -laserLength);
    gradient.addColorStop(0, 'rgba(0, 255, 204, 0.5)'); // Bright at barrel
    gradient.addColorStop(0.5, 'rgba(0, 255, 204, 0.1)'); // Fading
    gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');     // Invisible at end

    ctx.rotate(P.angle + Math.PI / 2); // Rotate to face outward (+90 deg for up/down gradient logic)

    // Slight width animation based on time to make it pulse
    const pulse = 1 + Math.sin(Date.now() / 100) * 0.3;

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.fillRect(-0.5 * pulse, -18, 1 * pulse, -laserLength);

    // Draw the dot at maximum range or enemy collision point
    // A simplified dot for now
    ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -laserLength - 18, 1.5, 0, Math.PI * 2);
    ctx.fill();

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
}
