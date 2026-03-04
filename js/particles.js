// ============ PARTICLE SYSTEM ============
const particles = [];
const MAX_PARTICLES = 500;

function spawnParticles(x, y, count, config) {
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const angle = config.angle !== undefined
      ? config.angle + (Math.random() - 0.5) * (config.spread || Math.PI * 2)
      : Math.random() * Math.PI * 2;
    const speed = (config.speed || 100) + Math.random() * (config.speedVar || 50);

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: config.life || 0.5,
      maxLife: config.life || 0.5,
      size: config.size || 3,
      sizeEnd: config.sizeEnd !== undefined ? config.sizeEnd : 0,
      color: config.colors
        ? config.colors[Math.floor(Math.random() * config.colors.length)]
        : (config.color || '#fff'),
      gravity: config.gravity || 0,
      friction: config.friction || 0.98,
      shape: config.shape || 'circle', // circle, square, spark
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles[i] = particles[particles.length - 1]; particles.pop(); continue; }
    p.vy += p.gravity * dt;
    p.vx *= p.friction;
    p.vy *= p.friction;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    if (!isOnScreen(p.x, p.y, 20)) continue;
    const t = p.life / p.maxLife; // 1 -> 0
    const alpha = Math.min(1, t * 2); // fade out in second half
    const size = p.sizeEnd + (p.size - p.sizeEnd) * t;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    // Translate to particle position for drawing
    ctx.translate(p.x, p.y);

    if (p.vis === 'paw') {
      ctx.font = `${size * 2.5}px Arial`; // Use 'size' instead of 'p.sz'
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐾', 0, 0);
    } else if (p.shape === 'spark') {
      // Elongated spark in direction of movement
      const len = Math.hypot(p.vx, p.vy) * 0.03;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.rotate(ang);
      ctx.fillRect(-len, -size / 2, len * 2, size);
    } else if (p.shape === 'square') {
      ctx.fillRect(-size / 2, -size / 2, size, size); // Draw at (0,0) after translate
    } else { // Default to circle
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2); // Draw at (0,0) after translate
      ctx.fill();
    }
    ctx.restore();
  }
}

// Preset particle effects
function fxEnemyDeath(x, y, color) {
  spawnParticles(x, y, 12, {
    speed: 120, speedVar: 80,
    life: 0.35, size: 4, sizeEnd: 0,
    colors: [color || '#ff4444', '#ffaa00', '#fff'],
    friction: 0.92, shape: 'spark',
  });
  // Pixel debris
  spawnParticles(x, y, 6, {
    speed: 60, speedVar: 40,
    life: 0.5, size: 3, sizeEnd: 1,
    colors: ['#444', '#666', '#888'],
    gravity: 300, friction: 0.95, shape: 'square',
  });
}

function fxBossDeath(x, y) {
  for (let w = 0; w < 4; w++) {
    setTimeout(() => {
      spawnParticles(
        x + (Math.random() - 0.5) * 80,
        y + (Math.random() - 0.5) * 80,
        25, {
        speed: 200, speedVar: 150,
        life: 0.6, size: 6, sizeEnd: 0,
        colors: ['#ffd700', '#ff6600', '#ff3333', '#fff'],
        friction: 0.9, shape: 'spark',
      }
      );
    }, w * 100);
  }
}

function fxCritical(x, y) {
  // Disabled to improve performance during heavy combat
}

function fxPlayerHit(x, y) {
  spawnParticles(x, y, 10, {
    speed: 80, speedVar: 40,
    life: 0.3, size: 3, sizeEnd: 0,
    colors: ['#ff0000', '#ff4444', '#ff8888'],
    friction: 0.95, shape: 'circle',
  });
}

function fxPickup(x, y, type) {
  const color = type === 'gold' ? '#ffff00' : '#00ff66';
  spawnParticles(x, y, 5, {
    speed: 40, speedVar: 20,
    life: 0.25, size: 2, sizeEnd: 0,
    color, friction: 0.9, gravity: -80,
  });
}

function fxMuzzleFlash(x, y, angle) {
  // Core bright flash
  spawnParticles(x, y, 2, {
    speed: 30, speedVar: 10,
    life: 0.05, size: 6, sizeEnd: 2,
    colors: ['#ffffff', '#00ffff'],
    friction: 0.8, shape: 'circle',
  });
  // Directional sparks
  spawnParticles(x, y, 5, {
    angle, spread: 0.3,
    speed: 300, speedVar: 100,
    life: 0.15, size: 4, sizeEnd: 0,
    colors: ['#00f5ff', '#aaffff', '#ffffff'],
    friction: 0.85, shape: 'spark',
  });
  // Lingering smoke
  spawnParticles(x, y, 3, {
    angle, spread: 0.8,
    speed: 40, speedVar: 20,
    life: 0.4, size: 4, sizeEnd: 8,
    colors: ['rgba(100,100,100,0.5)', 'rgba(50,50,50,0.3)'],
    friction: 0.9, shape: 'circle',
  });
}

function fxBulletImpact(x, y, angle, color) {
  // Sparks deflecting back
  spawnParticles(x, y, 6, {
    angle: angle + Math.PI, spread: 1.0, // bounce back
    speed: 150, speedVar: 80,
    life: 0.25, size: 3, sizeEnd: 0,
    colors: [color || '#00f5ff', '#ffffff', '#ffff00'],
    friction: 0.88, shape: 'spark',
  });
  // Tiny shockwave ping
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.1, size: 2, sizeEnd: 15,
    colors: ['rgba(255,255,255,0.8)'],
    shape: 'circle',
  });
}

function fxExplosion(x, y, radius) {
  const count = Math.floor(radius / 4);
  spawnParticles(x, y, count, {
    speed: radius * 2, speedVar: radius,
    life: 0.4, size: 5, sizeEnd: 0,
    colors: ['#ff6600', '#ff3300', '#ffaa00', '#ffd700'],
    friction: 0.88, shape: 'spark',
  });
  // Shockwave ring particles
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    spawnParticles(x + Math.cos(a) * radius * 0.5, y + Math.sin(a) * radius * 0.5, 1, {
      angle: a, spread: 0.2,
      speed: 50, speedVar: 20,
      life: 0.3, size: 3, sizeEnd: 0,
      color: '#fff', friction: 0.9,
    });
  }
}

function fxKatanaSwing(x, y, angle) {
  for (let i = -3; i <= 3; i++) {
    const a = angle + i * 0.15;
    const dist = 50 + Math.abs(i) * 10;
    spawnParticles(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 1, {
      angle: a + Math.PI / 2, spread: 0.3,
      speed: 30, speedVar: 10,
      life: 0.2, size: 2, sizeEnd: 0,
      color: '#ff4444', friction: 0.9, shape: 'spark',
    });
  }
}

// ============ EVOLUTION / WEAPON FX ============

function fxEvolution(x, y) {
  // Massive golden burst
  spawnParticles(x, y, 40, {
    speed: 250, speedVar: 150,
    life: 0.8, size: 6, sizeEnd: 0,
    colors: ['#ffd700', '#ffaa00', '#fff', '#ffe066'],
    friction: 0.88, shape: 'spark',
  });
  // Rising golden motes
  spawnParticles(x, y, 20, {
    speed: 60, speedVar: 40,
    life: 1.2, size: 4, sizeEnd: 1,
    colors: ['#ffd700', '#ffcc00'],
    gravity: -120, friction: 0.96, shape: 'circle',
  });
  // Ring burst
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    spawnParticles(x + Math.cos(a) * 40, y + Math.sin(a) * 40, 1, {
      angle: a, spread: 0.1,
      speed: 180, speedVar: 30,
      life: 0.4, size: 3, sizeEnd: 0,
      color: '#ffd700', friction: 0.92, shape: 'spark',
    });
  }
}

function fxBeamImpact(x, y) {
  spawnParticles(x, y, 6, {
    speed: 80, speedVar: 40,
    life: 0.2, size: 3, sizeEnd: 0,
    colors: ['#00ff66', '#88ffaa', '#fff'],
    friction: 0.9, shape: 'spark',
  });
}

function fxChainLightning(points) {
  for (const pt of points) {
    spawnParticles(pt.x, pt.y, 3, {
      speed: 40, speedVar: 20,
      life: 0.15, size: 2, sizeEnd: 0,
      colors: ['#88ccff', '#ffffff', '#aaddff'],
      friction: 0.9, shape: 'circle',
    });
  }
}

function fxPuddleSplash(x, y) {
  spawnParticles(x, y, 8, {
    speed: 50, speedVar: 30,
    life: 0.3, size: 3, sizeEnd: 1,
    colors: ['#4488ff', '#66aaff', '#aaddff'],
    gravity: 100, friction: 0.94, shape: 'circle',
  });
}

// ============ GOD CANDLE EFFECT ============
const godCandles = [];

function fxGodCandle(x, y, dmg) {
  if (typeof dmgNumbersEnabled !== 'undefined' && !dmgNumbersEnabled) return;
  const height = 40 + Math.min(dmg * 0.8, 120);
  godCandles.push({
    x, y,
    height,
    life: 0.6,
    maxLife: 0.6,
    dmgText: '+' + Math.round(dmg),
    growPhase: 0
  });
}

function updateGodCandles(dt) {
  for (let i = godCandles.length - 1; i >= 0; i--) {
    const gc = godCandles[i];
    gc.life -= dt;
    gc.growPhase = Math.min(1, gc.growPhase + dt * 8);
    if (gc.life <= 0) { godCandles[i] = godCandles[godCandles.length - 1]; godCandles.pop(); }
  }
}

function drawGodCandles(ctx) {
  for (const gc of godCandles) {
    const t = gc.life / gc.maxLife;
    const alpha = Math.min(1, t * 3);
    const currentH = gc.height * gc.growPhase;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Candle body (green rectangle)
    ctx.fillStyle = '#00cc44';
    ctx.fillRect(gc.x - 4, gc.y - currentH, 8, currentH);

    // Wick (thin white line on top)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gc.x - 1, gc.y - currentH - 6, 2, 6);

    // Bright core
    ctx.fillStyle = '#44ff88';
    ctx.fillRect(gc.x - 2, gc.y - currentH, 4, currentH);

    // Damage text above
    if (gc.growPhase > 0.5) {
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff88';
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillText(gc.dmgText, gc.x, gc.y - currentH - 12);
    }

    ctx.restore();
  }
}

// ============ DASH AFTERIMAGES ============
const afterimages = [];

function fxDashAfterimage(x, y, angle, spriteFrame) {
  afterimages.push({ x, y, angle, sprite: spriteFrame, life: 0.2, maxLife: 0.2 });
}

function updateAfterimages(dt) {
  for (let i = afterimages.length - 1; i >= 0; i--) {
    afterimages[i].life -= dt;
    if (afterimages[i].life <= 0) { afterimages[i] = afterimages[afterimages.length - 1]; afterimages.pop(); }
  }
}

function drawAfterimages(ctx) {
  for (const ai of afterimages) {
    const t = ai.life / ai.maxLife;
    ctx.save();
    ctx.globalAlpha = t * 0.4;
    ctx.translate(ai.x, ai.y);
    // Use the player's aim angle, head tilt, and body lean
    ctx.rotate(ai.sprite.bodyLean * ai.sprite.facingX);
    if (ai.sprite.facingX < 0) ctx.scale(-1, 1);
    // Fast tint instead of slow ctx.filter
    ctx.drawImage(ai.sprite.img, -ai.sprite.w / 2, -ai.sprite.h / 2, ai.sprite.w, ai.sprite.h);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.fillRect(-ai.sprite.w / 2, -ai.sprite.h / 2, ai.sprite.w, ai.sprite.h);
    // Draw additive glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(ai.sprite.img, -ai.sprite.w / 2, -ai.sprite.h / 2, ai.sprite.w, ai.sprite.h);
    ctx.restore();
  }
}
