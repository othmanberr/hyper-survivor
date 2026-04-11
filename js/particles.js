// ============ PARTICLE SYSTEM ============
const particles = [];
const MAX_PARTICLES = 500;

function particleColorWithAlpha(color, alpha) {
  if (!color) return `rgba(255,255,255,${alpha})`;
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
    if (hex.length === 6) {
      const value = parseInt(hex, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  const rgb = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(',').map(part => part.trim());
    return `rgba(${parts[0] || 255}, ${parts[1] || 255}, ${parts[2] || 255}, ${alpha})`;
  }
  return color;
}

function clampFx01(value) {
  return Math.max(0, Math.min(1, value));
}

function getCombatFxPalette() {
  if (typeof STAGE_PALETTES !== 'undefined' && Array.isArray(STAGE_PALETTES) && STAGE_PALETTES.length) {
    const stage = typeof G !== 'undefined' && Number.isFinite(G.stage) ? G.stage : 0;
    return STAGE_PALETTES[Math.max(0, Math.min(STAGE_PALETTES.length - 1, stage))] || STAGE_PALETTES[0];
  }
  return { accent: '#00f5ff', secondary: '#ffffff' };
}

function getCombatFxBoost() {
  const combo = typeof G !== 'undefined' ? clampFx01((G.combo || 0) / 45) : 0;
  const leverage = typeof P !== 'undefined' ? clampFx01(((P.leverage || 1) - 1) / 18) : 0;
  const boss = typeof G !== 'undefined' && G.phase === 'boss' ? 0.2 : 0;
  return {
    combo,
    leverage,
    boss,
    total: clampFx01(combo * 0.6 + leverage * 0.25 + boss)
  };
}

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
      rotation: config.rotation !== undefined ? config.rotation : angle,
      spin: config.spin || 0,
      bounce: config.bounce || 0,
      groundY: config.groundY !== undefined ? config.groundY : null,
      thickness: config.thickness || 2,
      length: config.length || 10,
      lengthEnd: config.lengthEnd !== undefined ? config.lengthEnd : 2,
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
    p.rotation += p.spin * dt;
    if (p.bounce && p.groundY !== null && p.y >= p.groundY && p.vy > 0) {
      p.y = p.groundY;
      p.vy *= -p.bounce;
      p.vx *= 0.78;
      if (Math.abs(p.vy) < 10) p.vy = 0;
    }
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
    } else if (p.shape === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.thickness * t);
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'line') {
      const len = p.lengthEnd + (p.length - p.lengthEnd) * t;
      ctx.rotate(p.rotation || 0);
      ctx.fillRect(-len / 2, -(p.thickness || 2) / 2, len, p.thickness || 2);
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
function fxEnemyDeath(x, y, color, opts) {
  opts = opts || {};
  const pal = getCombatFxPalette();
  const boost = getCombatFxBoost();
  const elite = !!opts.elite;
  const combo = Number.isFinite(opts.combo)
    ? opts.combo
    : (typeof G !== 'undefined' ? (G.combo || 0) : 0);
  const burstCount = elite ? 16 : 7 + Math.round(boost.total * 7);
  const sparkColors = [
    color || '#ff4444',
    pal.accent,
    pal.secondary,
    '#ffffff'
  ];

  spawnParticles(x, y, burstCount, {
    speed: elite ? 165 : 105 + boost.total * 80,
    speedVar: elite ? 110 : 70,
    life: elite ? 0.44 : 0.28 + boost.total * 0.08,
    size: elite ? 4.6 : 3.4,
    sizeEnd: 0,
    colors: sparkColors,
    friction: 0.88,
    shape: 'spark',
  });

  spawnParticles(x, y, elite ? 7 : 3 + Math.round(boost.combo * 4), {
    speed: 48 + boost.total * 36,
    speedVar: 22,
    life: 0.22 + boost.total * 0.08,
    size: elite ? 6 : 4,
    sizeEnd: 0,
    colors: [
      particleColorWithAlpha(color || pal.accent, elite ? 0.55 : 0.45),
      particleColorWithAlpha('#ffffff', 0.35),
    ],
    friction: 0.9,
    gravity: -35,
    shape: 'circle',
  });

  spawnParticles(x, y, 1, {
    speed: 0,
    life: elite ? 0.22 : 0.14,
    size: elite ? 13 : 9,
    sizeEnd: elite ? 34 : 24,
    color: particleColorWithAlpha(elite ? pal.secondary : color || pal.accent, elite ? 0.34 : 0.24),
    shape: 'ring',
    thickness: elite ? 3.2 : 2.1,
  });

  if (elite || combo >= 15) {
    spawnParticles(x, y, elite ? 6 : 3, {
      speed: elite ? 140 : 95,
      speedVar: 45,
      life: elite ? 0.24 : 0.18,
      size: 1,
      sizeEnd: 1,
      colors: [pal.secondary, '#ffffff', color || pal.accent],
      length: elite ? 28 : 20,
      lengthEnd: 6,
      thickness: elite ? 3 : 2,
      shape: 'line',
    });
  }

  if (elite) {
    spawnParticles(x, y, 1, {
      speed: 0,
      life: 0.16,
      size: 18,
      sizeEnd: 46,
      color: particleColorWithAlpha(pal.accent, 0.09),
      shape: 'circle',
    });
  }
}

function fxEnemyRewardBurst(x, y, opts) {
  opts = opts || {};
  const pal = getCombatFxPalette();
  const gold = Math.max(0, opts.gold || 0);
  const xp = Math.max(0, opts.xp || 0);
  const elite = !!opts.elite;
  const towardPlayer = typeof P !== 'undefined'
    ? Math.atan2(P.y - y, P.x - x)
    : -Math.PI / 2;

  const goldCount = gold > 0 ? Math.min(elite ? 6 : 4, 1 + Math.round(gold / 12)) : 0;
  if (goldCount > 0) {
    spawnParticles(x, y, goldCount, {
      angle: towardPlayer,
      spread: elite ? 1.15 : 1.45,
      speed: elite ? 125 : 92,
      speedVar: elite ? 45 : 34,
      life: elite ? 0.42 : 0.3,
      size: elite ? 4.4 : 3.2,
      sizeEnd: 0.8,
      colors: ['#ffd54f', '#fff2a3', '#ffffff'],
      friction: 0.9,
      gravity: 26,
      shape: 'square',
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 10,
    });
  }

  const xpCount = xp > 0 ? Math.min(elite ? 5 : 3, 1 + Math.round(xp / 10)) : 0;
  if (xpCount > 0) {
    spawnParticles(x, y, xpCount, {
      angle: towardPlayer,
      spread: elite ? 1.1 : 1.35,
      speed: elite ? 118 : 88,
      speedVar: elite ? 40 : 30,
      life: elite ? 0.38 : 0.28,
      size: elite ? 4 : 3,
      sizeEnd: 0.6,
      colors: ['#55efc4', '#00f5d4', pal.secondary],
      friction: 0.9,
      gravity: -10,
      shape: 'circle',
    });
  }

  if (elite || gold + xp >= 18) {
    spawnParticles(x, y, elite ? 4 : 2, {
      angle: towardPlayer,
      spread: 0.55,
      speed: elite ? 150 : 112,
      speedVar: 28,
      life: elite ? 0.22 : 0.18,
      size: 1,
      sizeEnd: 1,
      colors: ['#ffffff', '#ffe680', '#7dffda'],
      rotation: towardPlayer,
      length: elite ? 30 : 22,
      lengthEnd: 6,
      thickness: elite ? 3 : 2,
      shape: 'line',
    });
  }
}

function fxBossDeath(x, y) {
  const pal = getCombatFxPalette();
  for (let w = 0; w < 4; w++) {
    setTimeout(() => {
      spawnParticles(
        x + (Math.random() - 0.5) * 80,
        y + (Math.random() - 0.5) * 80,
        25, {
        speed: 200, speedVar: 150,
        life: 0.6, size: 6, sizeEnd: 0,
        colors: ['#ffd700', pal.accent, pal.secondary, '#ff6600', '#ff3333', '#fff'],
        friction: 0.9, shape: 'spark',
      }
      );
    }, w * 100);
  }
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.4,
    size: 32,
    sizeEnd: 100,
    color: particleColorWithAlpha(pal.accent, 0.14),
    shape: 'ring',
    thickness: 4,
  });
}

function fxBossAttackCue(x, y, accent, secondary, kind, phase2) {
  const primary = accent || '#ff7755';
  const alt = secondary || '#ffffff';
  const sizeBoost = phase2 ? 1.18 : 1;
  spawnParticles(x, y, phase2 ? 12 : 8, {
    speed: 70 * sizeBoost,
    speedVar: 38,
    life: 0.34,
    size: 4.2,
    sizeEnd: 0,
    colors: [primary, alt, '#ffffff'],
    friction: 0.88,
    shape: kind === 'portal' || kind === 'shield' ? 'square' : 'spark',
    spin: kind === 'portal' ? 6 : 0,
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.2,
    size: 16 * sizeBoost,
    sizeEnd: 42 * sizeBoost,
    color: particleColorWithAlpha(primary, 0.26),
    shape: 'ring',
    thickness: kind === 'beam' || kind === 'shield' ? 4 : 3,
  });
  if (kind === 'beam' || kind === 'dash' || kind === 'wall') {
    spawnParticles(x, y, phase2 ? 6 : 4, {
      speed: 22,
      speedVar: 8,
      life: 0.18,
      size: 1,
      sizeEnd: 1,
      colors: [alt, primary],
      length: kind === 'beam' ? 30 : 24,
      lengthEnd: 8,
      thickness: 2.5,
      shape: 'line',
    });
  }
  if (kind === 'ring' || kind === 'cascade' || kind === 'burst') {
    spawnParticles(x, y, 1, {
      speed: 0,
      life: 0.12,
      size: 8,
      sizeEnd: 24 * sizeBoost,
      color: particleColorWithAlpha(alt, 0.22),
      shape: 'circle',
    });
  }
}

function fxBossAttackImpact(x, y, accent, secondary, kind, phase2) {
  const primary = accent || '#ff7755';
  const alt = secondary || '#ffffff';
  const radius = (phase2 ? 72 : 56)
    + (kind === 'dash' ? 18 : 0)
    + (kind === 'ring' ? 10 : 0);
  spawnParticles(x, y, phase2 ? 18 : 12, {
    speed: radius * 2.2,
    speedVar: radius * 0.7,
    life: 0.3,
    size: 5,
    sizeEnd: 0,
    colors: [primary, alt, '#ffffff'],
    friction: 0.88,
    shape: 'spark',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.18,
    size: 14,
    sizeEnd: radius,
    color: particleColorWithAlpha(primary, 0.26),
    shape: 'ring',
    thickness: 5,
  });
  spawnParticles(x, y, phase2 ? 10 : 6, {
    speed: radius * 0.9,
    speedVar: radius * 0.35,
    life: 0.36,
    size: 3.6,
    sizeEnd: 1,
    colors: ['#666666', primary, alt],
    gravity: 180,
    friction: 0.92,
    shape: kind === 'portal' || kind === 'shield' ? 'square' : 'circle',
    bounce: 0.18,
    groundY: y + 18 + Math.random() * 18,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 10,
  });
}

function fxCritical(x, y) {
  // Disabled to improve performance during heavy combat
}

function fxPlayerHit(x, y, opts) {
  const pal = getCombatFxPalette();
  const hpRatio = typeof P !== 'undefined' && P.maxHp > 0 ? P.hp / P.maxHp : 1;
  const danger = clampFx01(opts && Number.isFinite(opts.danger) ? opts.danger : (0.45 - hpRatio) / 0.45);
  const intensity = clampFx01(((opts && opts.intensity) || 0.7) / 1.25);
  const dirX = opts && Number.isFinite(opts.dirX) ? opts.dirX : 0;
  const dirY = opts && Number.isFinite(opts.dirY) ? opts.dirY : -1;
  const dirAngle = Math.atan2(dirY, dirX || 0.0001);
  spawnParticles(x, y, 12 + Math.round(intensity * 6), {
    speed: 95 + danger * 45 + intensity * 55,
    speedVar: 48,
    life: 0.24 + danger * 0.08,
    size: 3.4 + intensity * 0.8,
    sizeEnd: 0,
    colors: ['#ff0000', '#ff4444', '#ff8888', '#ffffff'],
    friction: 0.93,
    shape: 'spark',
  });
  spawnParticles(x + dirX * 4, y + dirY * 4, 5 + Math.round(intensity * 4), {
    angle: dirAngle,
    spread: 0.85,
    speed: 70 + intensity * 90,
    speedVar: 28,
    life: 0.18 + intensity * 0.08,
    size: 2.4,
    sizeEnd: 0,
    colors: ['#ff5f6d', '#ffd4dd', '#ffffff'],
    friction: 0.9,
    shape: 'spark',
  });
  spawnParticles(x, y, 4, {
    speed: 36,
    speedVar: 20,
    life: 0.16,
    size: 1,
    sizeEnd: 1,
    colors: ['#ffffff', pal.secondary, '#ff8888'],
    length: 22,
    lengthEnd: 5,
    thickness: 2,
    shape: 'line',
  });
  spawnParticles(x - dirX * 3, y - dirY * 3, 2 + Math.round(intensity * 2), {
    angle: dirAngle + Math.PI,
    spread: 0.42,
    speed: 48 + intensity * 28,
    speedVar: 18,
    life: 0.14 + intensity * 0.04,
    size: 1,
    sizeEnd: 1,
    colors: ['#ffffff', '#ffdbe2', pal.secondary],
    rotation: dirAngle + Math.PI,
    length: 20 + intensity * 10,
    lengthEnd: 5,
    thickness: 2,
    shape: 'line',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.12 + intensity * 0.04,
    size: 8 + intensity * 2,
    sizeEnd: 18 + intensity * 4,
    color: particleColorWithAlpha(danger > 0.2 ? '#ff4757' : pal.secondary, 0.22),
    shape: 'ring',
    thickness: 2,
  });
}

function fxPlayerDodge(x, y) {
  spawnParticles(x, y, 9, {
    speed: 90, speedVar: 40,
    life: 0.22, size: 2.4, sizeEnd: 0,
    colors: ['#7ce8ff', '#dffcff', '#5bc0ff'],
    friction: 0.9, shape: 'spark',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.12, size: 10, sizeEnd: 18,
    color: '#7ce8ff',
    shape: 'ring',
    thickness: 2,
  });
}

function fxPickup(x, y, type, opts) {
  opts = opts || {};
  const pal = getCombatFxPalette();
  const color = type === 'gold' ? '#ffd700' : type === 'heart' ? '#55efc4' : '#00ff66';
  const accent = type === 'gold' ? '#fff3a1' : type === 'heart' ? '#d6fff4' : pal.secondary;
  const amount = Math.max(1, opts.amount || 1);
  const magnetic = !!opts.magnetic;
  const burstCount = type === 'heart' ? 9 : type === 'gold' ? 8 : 7;
  spawnParticles(x, y, burstCount + Math.min(3, Math.floor(amount / 20)), {
    speed: type === 'heart' ? 58 : 48,
    speedVar: type === 'gold' ? 30 : 24,
    life: type === 'heart' ? 0.34 : 0.28,
    size: type === 'heart' ? 2.8 : 2.4,
    sizeEnd: 0,
    colors: [color, accent, '#ffffff'],
    friction: 0.9,
    gravity: type === 'heart' ? -110 : -90,
    shape: type === 'gold' ? 'square' : 'circle',
    rotation: Math.random() * Math.PI * 2,
    spin: type === 'gold' ? (Math.random() - 0.5) * 8 : 0,
  });
  spawnParticles(x, y, type === 'heart' ? 3 : 2, {
    angle: -Math.PI / 2, spread: 0.3,
    speed: type === 'gold' ? 90 : 80,
    speedVar: 25,
    life: 0.16 + (type === 'heart' ? 0.04 : 0),
    size: 1,
    sizeEnd: 1,
    colors: [accent, '#ffffff'],
    rotation: -Math.PI / 2,
    length: 24, lengthEnd: 8, thickness: 2,
    shape: 'line',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: type === 'heart' ? 0.16 : 0.1,
    size: type === 'heart' ? 9 : 7,
    sizeEnd: type === 'heart' ? 18 : 14,
    color: particleColorWithAlpha(color, 0.22),
    shape: 'ring',
    thickness: type === 'heart' ? 2.4 : 2,
  });
  if (type === 'heart' || magnetic) {
    spawnParticles(x, y, 1, {
      speed: 0,
      life: 0.12,
      size: 4,
      sizeEnd: type === 'heart' ? 22 : 18,
      color: particleColorWithAlpha(accent, type === 'heart' ? 0.18 : 0.14),
      shape: 'ring',
      thickness: 1.6,
    });
  }
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

function fxCasingEject(x, y, angle) {
  spawnParticles(x, y, 1, {
    angle: angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4,
    spread: 0.25,
    speed: 80, speedVar: 40,
    life: 0.6, size: 3.5, sizeEnd: 2,
    color: '#d4a843',
    gravity: 400, friction: 0.96,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 16,
    bounce: 0.3,
    groundY: y + 24 + Math.random() * 12,
    shape: 'square',
  });
}

function fxBulletImpact(x, y, angle, color) {
  // Sparks deflecting back
  spawnParticles(x, y, 8, {
    angle: angle + Math.PI, spread: 1.0, // bounce back
    speed: 150, speedVar: 80,
    life: 0.25, size: 3, sizeEnd: 0,
    colors: [color || '#00f5ff', '#ffffff', '#ffff00'],
    friction: 0.88, shape: 'spark',
  });
  spawnParticles(x, y, 3, {
    angle: angle + Math.PI, spread: 1.1,
    speed: 40, speedVar: 20,
    life: 0.08,
    size: 1, sizeEnd: 1,
    colors: [color || '#00f5ff', '#ffffff'],
    rotation: angle + (Math.random() - 0.5) * 1.2,
    length: 16, lengthEnd: 4, thickness: 2,
    shape: 'line',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.1, size: 2, sizeEnd: 15,
    colors: ['rgba(255,255,255,0.8)'],
    shape: 'ring',
    thickness: 3,
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.06, size: 12, sizeEnd: 18,
    colors: [particleColorWithAlpha(color || '#ffffff', 0.24)],
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
  return;
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

// ============ PER-WEAPON MUZZLE FLASH VARIANTS ============

function fxMuzzleFlashSmall(x, y, angle) {
  spawnParticles(x, y, 1, {
    speed: 20, speedVar: 10,
    life: 0.04, size: 4, sizeEnd: 1,
    colors: ['#ffffff', '#aaffff'],
    friction: 0.8, shape: 'circle',
  });
  spawnParticles(x, y, 3, {
    angle, spread: 0.25,
    speed: 250, speedVar: 80,
    life: 0.1, size: 3, sizeEnd: 0,
    colors: ['#00f5ff', '#ffffff'],
    friction: 0.85, shape: 'spark',
  });
}

function fxMuzzleFlashRifle(x, y, angle) {
  spawnParticles(x, y, 2, {
    speed: 40, speedVar: 15,
    life: 0.06, size: 7, sizeEnd: 2,
    colors: ['#ffffff', '#ffddaa'],
    friction: 0.8, shape: 'circle',
  });
  spawnParticles(x, y, 6, {
    angle, spread: 0.2,
    speed: 350, speedVar: 120,
    life: 0.18, size: 4, sizeEnd: 0,
    colors: ['#ffcc66', '#ffffff', '#88ccff'],
    friction: 0.82, shape: 'spark',
  });
  spawnParticles(x, y, 2, {
    angle, spread: 0.6,
    speed: 30, speedVar: 15,
    life: 0.35, size: 3, sizeEnd: 7,
    colors: ['rgba(120,120,120,0.4)', 'rgba(80,80,80,0.3)'],
    friction: 0.92, shape: 'circle',
  });
}

function fxMuzzleFlashShotgun(x, y, angle) {
  spawnParticles(x, y, 3, {
    speed: 50, speedVar: 20,
    life: 0.08, size: 10, sizeEnd: 3,
    colors: ['#ffffff', '#ffaa44'],
    friction: 0.75, shape: 'circle',
  });
  spawnParticles(x, y, 10, {
    angle, spread: 0.6,
    speed: 400, speedVar: 200,
    life: 0.2, size: 4, sizeEnd: 0,
    colors: ['#ffaa00', '#ff6600', '#ffffff'],
    friction: 0.8, shape: 'spark',
  });
  spawnParticles(x, y, 4, {
    angle, spread: 1.0,
    speed: 50, speedVar: 30,
    life: 0.5, size: 5, sizeEnd: 10,
    colors: ['rgba(100,100,100,0.5)', 'rgba(60,60,60,0.3)'],
    friction: 0.88, shape: 'circle',
  });
}

function fxMuzzleFlashEnergy(x, y, angle) {
  spawnParticles(x, y, 2, {
    speed: 10, speedVar: 5,
    life: 0.06, size: 8, sizeEnd: 15,
    colors: ['#cc44ff', '#00ccff'],
    friction: 0.9, shape: 'circle',
  });
  spawnParticles(x, y, 4, {
    angle, spread: 0.4,
    speed: 200, speedVar: 100,
    life: 0.15, size: 3, sizeEnd: 0,
    colors: ['#cc44ff', '#ffffff', '#8844ff'],
    friction: 0.9, shape: 'spark',
  });
}

function fxMuzzleFlashFire(x, y, angle) {
  spawnParticles(x, y, 3, {
    speed: 30, speedVar: 15,
    life: 0.08, size: 8, sizeEnd: 2,
    colors: ['#ff6600', '#ffaa00', '#ffffff'],
    friction: 0.8, shape: 'circle',
  });
  spawnParticles(x, y, 8, {
    angle, spread: 0.5,
    speed: 250, speedVar: 150,
    life: 0.25, size: 4, sizeEnd: 1,
    colors: ['#ff4400', '#ff6600', '#ffaa00', '#ffcc00'],
    friction: 0.85, gravity: -60, shape: 'spark',
  });
}

// ============ PER-WEAPON IMPACT VARIANTS ============

function fxBulletImpactPierce(x, y, angle, color) {
  spawnParticles(x, y, 3, {
    angle: angle + Math.PI, spread: 0.5,
    speed: 100, speedVar: 50,
    life: 0.15, size: 2, sizeEnd: 0,
    colors: [color, '#ffffff'],
    friction: 0.9, shape: 'spark',
  });
}

function fxBulletImpactDebris(x, y, angle, color) {
  triggerShake(0.5, 0.03);
  spawnParticles(x, y, 8, {
    angle: angle + Math.PI, spread: 1.2,
    speed: 120, speedVar: 60,
    life: 0.3, size: 3, sizeEnd: 1,
    colors: [color, '#666666', '#888888'],
    gravity: 200, friction: 0.92, shape: 'square',
    bounce: 0.25,
    groundY: y + 14 + Math.random() * 14,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 14,
  });
  spawnParticles(x, y, 4, {
    angle: angle + Math.PI, spread: 0.8,
    speed: 170, speedVar: 70,
    life: 0.16, size: 3, sizeEnd: 0,
    colors: [color || '#cccccc', '#ffffff'],
    friction: 0.86, shape: 'spark',
  });
}

function fxBulletImpactFire(x, y, angle) {
  spawnParticles(x, y, 6, {
    speed: 80, speedVar: 40,
    life: 0.4, size: 4, sizeEnd: 1,
    colors: ['#ff4400', '#ff6600', '#ffaa00'],
    gravity: -40, friction: 0.9, shape: 'circle',
  });
  spawnParticles(x, y, 4, {
    speed: 10, speedVar: 5,
    life: 0.5, size: 3, sizeEnd: 8,
    colors: ['rgba(80,80,80,0.4)'],
    gravity: -30, friction: 0.95, shape: 'circle',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.5, size: 10, sizeEnd: 24,
    colors: ['rgba(255,120,0,0.22)'],
    shape: 'ring',
    thickness: 5,
  });
  spawnParticles(x, y, 6, {
    angle: angle + Math.PI, spread: 0.8,
    speed: 60, speedVar: 40,
    life: 0.38, size: 2.4, sizeEnd: 0,
    colors: ['#ff6600', '#ff4400', '#ffaa00'],
    gravity: -70, friction: 0.9, shape: 'spark',
  });
}

function fxBulletImpactElectric(x, y, color) {
  spawnParticles(x, y, 6, {
    speed: 150, speedVar: 100,
    life: 0.12, size: 2, sizeEnd: 0,
    colors: [color, '#ffffff', '#88ccff'],
    friction: 0.85, shape: 'spark',
  });
  spawnParticles(x, y, 4, {
    speed: 0,
    life: 0.1,
    size: 1, sizeEnd: 1,
    colors: [color || '#88ccff', '#ffffff'],
    rotation: Math.random() * Math.PI * 2,
    length: 18, lengthEnd: 4, thickness: 2,
    shape: 'line',
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.08, size: 3, sizeEnd: 18,
    colors: [color],
    shape: 'ring',
    thickness: 4,
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.06, size: 8, sizeEnd: 18,
    colors: ['rgba(255,255,255,0.28)'],
    shape: 'circle',
  });
}

function fxBulletImpactExplosion(x, y, radius, color) {
  const r = radius || 40;
  triggerShake(Math.max(1.5, r * 0.05), 0.08);
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.18, size: 12, sizeEnd: r * 0.85,
    colors: [particleColorWithAlpha(color || '#cc44ff', 0.22)],
    shape: 'ring',
    thickness: 6,
  });
  spawnParticles(x, y, 10, {
    speed: r * 1.8, speedVar: r,
    life: 0.28, size: 4.5, sizeEnd: 0,
    colors: [color || '#cc44ff', '#ffffff', '#ff88ff'],
    friction: 0.88, shape: 'spark',
  });
  spawnParticles(x, y, 8, {
    speed: r * 1.1, speedVar: r * 0.5,
    life: 0.36, size: 3.5, sizeEnd: 1,
    colors: ['#666666', '#888888', color || '#cc44ff'],
    gravity: 180, friction: 0.92, shape: 'square',
    bounce: 0.22,
    groundY: y + 18 + Math.random() * 18,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 12,
  });
  spawnParticles(x, y, 1, {
    speed: 0,
    life: 0.08, size: 10, sizeEnd: r * 0.4,
    colors: ['rgba(255,255,255,0.28)'],
    shape: 'circle',
  });
}
