// ============ BULLET EFFECTS SYSTEM ============
// Central registry: maps vis type -> visual config + effects
// Loaded from data/bullets.json, provides lookup + dispatch

let BULLET_CONFIG = {};
const BULLET_BODY_CACHE = new Map();

// ---- FALLBACK (used before JSON loads or for unknown types) ----
const _BULLET_FALLBACK = {
  sprite: null, size: 20, glowColor: '#ffffff', trailLength: 0,
  rotation: 'directional', muzzleFlash: 'small',
  impactEffect: 'spark', impactColor: '#ffffff',
  recoil: { shake: 1, duration: 0.05 }, sound: 'shoot'
};

// ---- LOAD CONFIG ----
(function loadBulletConfig() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/bullets.json?v=' + Date.now(), true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        BULLET_CONFIG = JSON.parse(xhr.responseText);
        console.log('[bullets] Config loaded:', Object.keys(BULLET_CONFIG).length, 'types');
      } catch (e) {
        console.warn('[bullets] Failed to parse config:', e);
      }
    }
  };
  xhr.onerror = function () {
    console.warn('[bullets] Failed to load config, using fallbacks');
  };
  xhr.send();
})();

// ---- LOOKUP FUNCTIONS ----

function getBulletConfig(vis) {
  return BULLET_CONFIG[vis] || _BULLET_FALLBACK;
}

function getBulletSize(vis, sizeOverride) {
  const cfg = getBulletConfig(vis);
  return (cfg.size || 20) * (sizeOverride || 1);
}

function getBulletGlow(vis, isCrit) {
  const cfg = getBulletConfig(vis);
  return isCrit ? '#ffd700' : (cfg.glowColor || '#ffffff');
}

function getBulletTrail(vis) {
  const cfg = getBulletConfig(vis);
  if (!cfg.trailLength) return null;
  return {
    length: cfg.trailLength,
    color: cfg.trailColor || cfg.glowColor,
    alpha: cfg.trailAlpha || 0.25,
    width: cfg.trailWidth || 0.7
  };
}

function getBulletRotationType(vis) {
  const cfg = getBulletConfig(vis);
  return cfg.rotation || 'directional';
}

function getBulletStyle(vis) {
  const cfg = getBulletConfig(vis);
  if (cfg.style) return cfg.style;
  if (cfg.isBeam) return 'beam';
  if (vis === 'red_slash' || vis === 'god_slash') return 'slash';
  if (vis === 'spinning_axe' || vis === 'lightning_axe') return 'axe';
  if (vis === 'drone_laser') return 'laser';
  return cfg.sprite ? 'slug' : 'fallback';
}

function bulletColorWithAlpha(color, alpha) {
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

function getBulletTime() {
  if (typeof window !== 'undefined' && Number.isFinite(window.BULLET_TIME_OVERRIDE)) return window.BULLET_TIME_OVERRIDE;
  return typeof G !== 'undefined' && Number.isFinite(G.totalTime) ? G.totalTime : 0;
}

function getBulletDt() {
  if (typeof window !== 'undefined' && Number.isFinite(window.BULLET_DT_OVERRIDE)) return window.BULLET_DT_OVERRIDE;
  return typeof G !== 'undefined' && Number.isFinite(G.dt) ? G.dt : (1 / 60);
}

function getBulletBodyCacheKey(vis, style, drawSize, isCrit) {
  return `${vis || 'fallback'}:${style}:${Math.round(drawSize)}:${isCrit ? 1 : 0}`;
}

function resetProjectileVisualState(p) {
  if (!p) return;
  p._posHistory = [];
  p._emberTimer = 0;
  p._sparkTimer = 0;
  p._screenFxDone = false;
}

function updateProjectileVisualState(p, dt) {
  if (!p || !p.active) return;
  const trail = getBulletTrail(p.vis);
  if (trail) {
    p._posHistory = p._posHistory || [];
    p._posHistory.push({ x: p.x, y: p.y });
    if (p._posHistory.length > 20) p._posHistory.shift();
  } else if (p._posHistory && p._posHistory.length) {
    p._posHistory.length = 0;
  }

  const style = getBulletStyle(p.vis);
  if (style === 'ember') {
    p._emberTimer = (p._emberTimer || 0) - dt;
    if (p._emberTimer <= 0 && typeof spawnParticles === 'function') {
      p._emberTimer = 0.03 + Math.random() * 0.03;
      spawnParticles(p.x, p.y, 1, {
        speed: 16, speedVar: 10,
        life: 0.28, size: 2.2, sizeEnd: 0.6,
        colors: ['#ff6600', '#ff4400', '#ffaa00'],
        gravity: -50, friction: 0.9, shape: 'circle',
      });
    }
  }

  if (style === 'plasma' && typeof spawnParticles === 'function' && Math.random() < 0.18) {
    const orbitA = getBulletTime() * 10 + (p.x + p.y) * 0.01;
    spawnParticles(p.x + Math.cos(orbitA) * 5, p.y + Math.sin(orbitA) * 5, 1, {
      speed: 10, speedVar: 4,
      life: 0.12, size: 1.5, sizeEnd: 0,
      colors: ['#ffffff', '#cc88ff', '#8844ff'],
      friction: 0.86, shape: 'circle',
    });
  }

  if (style === 'slash' && p.vis === 'god_slash' && typeof spawnParticles === 'function' && Math.random() < 0.14) {
    spawnParticles(p.x, p.y, 1, {
      speed: 24, speedVar: 14,
      life: 0.18, size: 2.1, sizeEnd: 0,
      colors: ['#00ff88', '#66ffaa', '#b6ffcf'],
      gravity: -18, friction: 0.88, shape: 'circle',
    });
  }

  if (style === 'beam' && typeof spawnParticles === 'function') {
    p._sparkTimer = (p._sparkTimer || 0) - dt;
    if (p._sparkTimer <= 0) {
      p._sparkTimer = 0.045;
      const cfg = getBulletConfig(p.vis);
      const beamLen = Math.min(cfg.beamLength || 900, 320);
      const ang = p._ang !== undefined ? p._ang : Math.atan2(p.vy, p.vx);
      const off = 20 + Math.random() * beamLen;
      spawnParticles(
        p.x + Math.cos(ang) * off,
        p.y + Math.sin(ang) * off,
        1,
        {
          speed: 30, speedVar: 16,
          life: 0.12, size: 2.2, sizeEnd: 0,
          colors: ['#44ccff', '#ffffff', '#88e6ff'],
          friction: 0.84, shape: 'spark',
        }
      );
    }
  }
}

function fireScreenEffect(vis) {
  const cfg = getBulletConfig(vis);
  if (!cfg.screenEffect || typeof G === 'undefined') return;
  G._screenFlash = {
    kind: cfg.screenEffect,
    alpha: cfg.screenEffectAlpha || 0.1,
    life: cfg.screenEffectLife || 0.05,
    maxLife: cfg.screenEffectLife || 0.05
  };
}

function resolveBulletPalette(cfg, p, isCrit) {
  return {
    glow: isCrit ? '#ffd700' : (cfg.glowColor || p.col || '#ffffff'),
    core: isCrit ? '#fff4b3' : (cfg.coreColor || '#ffffff'),
    trail: isCrit ? '#ffd700' : (cfg.trailColor || cfg.glowColor || p.col || '#ffffff'),
    accent: isCrit ? '#ffe28a' : (cfg.accentColor || cfg.glowColor || p.col || '#ffffff')
  };
}

function drawTaperedTrail(ctx, length, halfWidth, outerColor, innerColor, alpha) {
  const outerGrad = ctx.createLinearGradient(-length, 0, halfWidth * 0.8, 0);
  outerGrad.addColorStop(0, bulletColorWithAlpha(outerColor, 0));
  outerGrad.addColorStop(0.35, bulletColorWithAlpha(outerColor, alpha * 0.25));
  outerGrad.addColorStop(1, bulletColorWithAlpha(outerColor, alpha));
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.moveTo(-length, 0);
  ctx.lineTo(-length * 0.55, -halfWidth * 0.95);
  ctx.lineTo(halfWidth * 0.2, -halfWidth * 1.05);
  ctx.lineTo(halfWidth * 0.85, 0);
  ctx.lineTo(halfWidth * 0.2, halfWidth * 1.05);
  ctx.lineTo(-length * 0.55, halfWidth * 0.95);
  ctx.closePath();
  ctx.fill();

  const innerGrad = ctx.createLinearGradient(-length * 0.8, 0, halfWidth * 0.55, 0);
  innerGrad.addColorStop(0, bulletColorWithAlpha(innerColor, 0));
  innerGrad.addColorStop(0.55, bulletColorWithAlpha(innerColor, alpha * 0.18));
  innerGrad.addColorStop(1, bulletColorWithAlpha(innerColor, alpha * 0.75));
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.moveTo(-length * 0.78, 0);
  ctx.lineTo(-length * 0.28, -halfWidth * 0.35);
  ctx.lineTo(halfWidth * 0.42, 0);
  ctx.lineTo(-length * 0.28, halfWidth * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawBulletGlow(ctx, color, radiusX, radiusY, alpha, stretch) {
  const radius = Math.max(radiusX, radiusY);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  grad.addColorStop(0, bulletColorWithAlpha(color, alpha * 0.55));
  grad.addColorStop(0.55, bulletColorWithAlpha(color, alpha * 0.2));
  grad.addColorStop(1, bulletColorWithAlpha(color, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grad;
  ctx.scale(Math.max(0.55, radiusX / radius) * (stretch || 1), Math.max(0.55, radiusY / radius));
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCritOverlay(ctx, radius) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.22 + Math.sin(getBulletTime() * 12) * 0.12;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawConfiguredTrail(ctx, p, cfg, colors, drawSize, rotType, motionAngle) {
  const trail = getBulletTrail(p.vis);
  if (!trail) return;
  const hist = p._posHistory || [];
  if (hist.length >= 2) {
    const heading = rotType === 'directional' ? (p._ang !== undefined ? p._ang : motionAngle) : 0;
    const cos = Math.cos(-heading);
    const sin = Math.sin(-heading);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < hist.length; i++) {
      const a = hist[i - 1];
      const b = hist[i];
      const ax = (a.x - p.x) * cos - (a.y - p.y) * sin;
      const ay = (a.x - p.x) * sin + (a.y - p.y) * cos;
      const bx = (b.x - p.x) * cos - (b.y - p.y) * sin;
      const by = (b.x - p.x) * sin + (b.y - p.y) * cos;
      const t = i / hist.length;
      ctx.globalAlpha = trail.alpha * t;
      ctx.strokeStyle = bulletColorWithAlpha(colors.trail, 0.25 + t * 0.75);
      ctx.lineWidth = Math.max(1, drawSize * 0.08 + trail.width * drawSize * 0.12 * t);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const speed = Math.hypot(p.vx, p.vy);
  const trailLen = Math.max(drawSize, trail.length * Math.max(0.85, Math.min(1.7, speed / 700)));
  const trailHalfWidth = Math.max(2, drawSize * 0.22 * trail.width);
  ctx.save();
  if (rotType !== 'directional') ctx.rotate(motionAngle);
  drawTaperedTrail(ctx, trailLen, trailHalfWidth, colors.trail, colors.core, trail.alpha);
  ctx.restore();
}

function drawStaticBulletBody(ctx, style, sprite, drawSz, colors, isCrit, cfg) {
  const glowAlpha = cfg.glowAlpha !== undefined ? cfg.glowAlpha : (isCrit ? 0.24 : 0.14);
  const glowStretch = cfg.glowStretch || 1;

  if (style === 'laser') {
    const len = drawSz * 1.3;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createLinearGradient(-len * 0.8, 0, len, 0);
    glow.addColorStop(0, bulletColorWithAlpha(colors.glow, 0));
    glow.addColorStop(0.35, bulletColorWithAlpha(colors.glow, 0.5));
    glow.addColorStop(1, bulletColorWithAlpha(colors.core, 0.9));
    ctx.strokeStyle = glow;
    ctx.lineWidth = Math.max(2, drawSz * 0.14);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-len * 0.8, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.strokeStyle = bulletColorWithAlpha('#ffffff', 0.85);
    ctx.lineWidth = Math.max(1, drawSz * 0.06);
    ctx.beginPath();
    ctx.moveTo(-len * 0.35, 0);
    ctx.lineTo(len * 0.9, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (sprite) {
    const aspect = sprite.width / sprite.height;
    const dh = drawSz;
    const dw = drawSz * aspect;
    drawBulletGlow(ctx, colors.glow, dw * 0.45, dh * 0.4, isCrit ? glowAlpha + 0.08 : glowAlpha, glowStretch);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh);
    ctx.imageSmoothingEnabled = true;
    return;
  }

  drawBulletGlow(ctx, colors.glow, drawSz * 0.8, drawSz * 0.6, glowAlpha, glowStretch);
  ctx.fillStyle = colors.core;
  ctx.beginPath();
  ctx.arc(0, 0, drawSz * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function getCachedBulletBody(vis, style, drawSz, isCrit, sprite, colors, cfg) {
  if (typeof document === 'undefined') return null;
  const key = getBulletBodyCacheKey(vis, style, drawSz, isCrit);
  if (BULLET_BODY_CACHE.has(key)) return BULLET_BODY_CACHE.get(key);

  const size = Math.ceil(drawSz * 4 + 36);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const cctx = canvas.getContext('2d');
  cctx.translate(size / 2, size / 2);
  drawStaticBulletBody(cctx, style, sprite, drawSz, colors, isCrit, cfg);
  BULLET_BODY_CACHE.set(key, canvas);
  return canvas;
}

function drawSpriteBulletVisual(ctx, p, cfg, sprite, style, colors, rotType, motionAngle, isCrit) {
  const drawSz = getBulletSize(p.vis, p._size);
  drawConfiguredTrail(ctx, p, cfg, colors, drawSz, rotType, motionAngle);
  const body = getCachedBulletBody(p.vis, style, drawSz, isCrit, sprite, colors, cfg);
  if (body) {
    const pulse = style === 'plasma' ? (1 + Math.sin(getBulletTime() * 12 + p.x * 0.01) * 0.08) : 1;
    ctx.save();
    if (pulse !== 1) ctx.scale(pulse, pulse);
    ctx.drawImage(body, -body.width / 2, -body.height / 2);
    ctx.restore();
  } else renderFallbackProjectile(ctx, p, cfg, colors, isCrit);

  if (style === 'plasma') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = bulletColorWithAlpha(colors.glow, 0.2 + Math.sin(getBulletTime() * 16 + p.x * 0.02 + p.y * 0.02) * 0.05);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, drawSz * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (style === 'ember') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bulletColorWithAlpha('#ffd27a', 0.55);
    ctx.beginPath();
    ctx.arc(-drawSz * 0.18, 0, Math.max(1.5, drawSz * 0.14), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (isCrit) drawCritOverlay(ctx, drawSz * 0.5);
}

function drawRailgunBeam(ctx, cfg, size, sprite, colors, isCrit) {
  const edgeColor = isCrit ? '#ffb63d' : (cfg.beamEdgeColor || colors.glow);
  const coreColor = isCrit ? '#fff4c2' : (cfg.beamCoreColor || colors.core);
  const beamLen = cfg.beamLength || Math.max(W * 1.15, 960);
  const beamWidth = size * (cfg.beamWidthMult || 1.05);
  const outerWidth = beamWidth * 1.85;
  const pulse = 0.9 + Math.sin(getBulletTime() * 18) * 0.08;
  const beamStart = -beamLen * 0.04;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const shellGrad = ctx.createLinearGradient(beamStart, 0, beamLen, 0);
  shellGrad.addColorStop(0, bulletColorWithAlpha(edgeColor, 0));
  shellGrad.addColorStop(0.08, bulletColorWithAlpha(edgeColor, 0.1 * pulse));
  shellGrad.addColorStop(0.55, bulletColorWithAlpha(edgeColor, 0.22 * pulse));
  shellGrad.addColorStop(0.92, bulletColorWithAlpha(edgeColor, 0.08 * pulse));
  shellGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
  ctx.fillStyle = shellGrad;
  ctx.beginPath();
  ctx.moveTo(beamStart, 0);
  ctx.lineTo(beamStart + beamLen * 0.12, -outerWidth * 0.72);
  ctx.lineTo(beamLen, -outerWidth * 0.34);
  ctx.lineTo(beamLen + outerWidth * 0.9, 0);
  ctx.lineTo(beamLen, outerWidth * 0.34);
  ctx.lineTo(beamStart + beamLen * 0.12, outerWidth * 0.72);
  ctx.closePath();
  ctx.fill();

  const midGrad = ctx.createLinearGradient(beamStart, 0, beamLen, 0);
  midGrad.addColorStop(0, bulletColorWithAlpha(edgeColor, 0));
  midGrad.addColorStop(0.08, bulletColorWithAlpha(edgeColor, 0.35 * pulse));
  midGrad.addColorStop(0.7, bulletColorWithAlpha(edgeColor, 0.5 * pulse));
  midGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
  ctx.fillStyle = midGrad;
  ctx.fillRect(beamStart, -beamWidth * 0.36, beamLen, beamWidth * 0.72);

  const coreGrad = ctx.createLinearGradient(beamStart, 0, beamLen, 0);
  coreGrad.addColorStop(0, bulletColorWithAlpha(coreColor, 0));
  coreGrad.addColorStop(0.12, bulletColorWithAlpha(coreColor, 0.8 * pulse));
  coreGrad.addColorStop(0.85, bulletColorWithAlpha(coreColor, 0.92 * pulse));
  coreGrad.addColorStop(1, bulletColorWithAlpha(coreColor, 0));
  ctx.fillStyle = coreGrad;
  ctx.fillRect(beamStart, -beamWidth * 0.12, beamLen, beamWidth * 0.24);

  if (sprite) {
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.38;
    ctx.drawImage(sprite, beamStart, -beamWidth * 0.28, beamLen, beamWidth * 0.56);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
  }

  const tipGrad = ctx.createRadialGradient(beamLen, 0, 0, beamLen, 0, outerWidth * 1.35);
  tipGrad.addColorStop(0, bulletColorWithAlpha(coreColor, 0.75 * pulse));
  tipGrad.addColorStop(0.45, bulletColorWithAlpha(edgeColor, 0.3 * pulse));
  tipGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
  ctx.fillStyle = tipGrad;
  ctx.beginPath();
  ctx.ellipse(beamLen, 0, outerWidth * 1.2, outerWidth * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  const originGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerWidth * 1.25);
  originGrad.addColorStop(0, bulletColorWithAlpha(coreColor, 0.85));
  originGrad.addColorStop(0.45, bulletColorWithAlpha(edgeColor, 0.35 * pulse));
  originGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
  ctx.fillStyle = originGrad;
  ctx.beginPath();
  ctx.arc(0, 0, outerWidth * 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSlashVisual(ctx, vis, isCrit, size) {
  const isGod = vis === 'god_slash';
  const baseColor = isCrit ? '#ffd700' : (isGod ? '#00ff44' : '#ff4757');
  const ghostCount = 3;
  for (let i = ghostCount - 1; i >= 0; i--) {
    const ghostT = i / ghostCount;
    ctx.save();
    ctx.globalAlpha = 0.15 + ghostT * 0.18;
    ctx.scale(1 - ghostT * 0.06, 1 - ghostT * 0.06);
    ctx.strokeStyle = bulletColorWithAlpha(baseColor, 0.7 - ghostT * 0.2);
    ctx.lineWidth = size * (isGod ? 1.9 : 1.25) * (1 - ghostT * 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, size * (isGod ? 3.6 : 2.6), -Math.PI * (0.38 - ghostT * 0.04), Math.PI * (0.38 - ghostT * 0.04));
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = size * (isGod ? 1.8 : 1.2);
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.arc(0, 0, size * (isGod ? 3.5 : 2.5), -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = size * (isGod ? 0.8 : 0.5);
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, size * (isGod ? 3.5 : 2.5), -Math.PI * 0.2, Math.PI * 0.2);
  ctx.stroke();
}

function drawAxeVisual(ctx, p, vis, size) {
  const sprite = vis === 'lightning_axe' && typeof BULLET_SPRITES !== 'undefined' ? BULLET_SPRITES.lightning_axe : null;
  const fallback = typeof WEAPON_SPRITES !== 'undefined' ? (vis === 'lightning_axe' ? WEAPON_SPRITES.chainLightning : WEAPON_SPRITES.axe) : null;
  const axeSpr = sprite || fallback;
  if (axeSpr) {
    const dw = sprite ? 36 : axeSpr.width * 0.55;
    const dh = sprite ? 36 : axeSpr.height * 0.55;
    for (let i = 2; i >= 1; i--) {
      ctx.save();
      ctx.globalAlpha = 0.08 + i * 0.05;
      ctx.rotate(-0.18 * i);
      ctx.drawImage(axeSpr, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(axeSpr, -dw / 2, -dh / 2, dw, dh);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.font = `${size * 4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1FA93}', 0, 0);
  }
  if (vis === 'lightning_axe') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#ffee00';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = size * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      ctx.lineTo(Math.cos(a + 0.3) * r, Math.sin(a + 0.3) * r);
      ctx.stroke();
    }
    ctx.restore();

    if (typeof hash !== 'undefined' && p && p.friendly) {
      const nearby = hash.qry(p.x, p.y, 80).slice(0, 2);
      if (nearby.length) {
        ctx.save();
        ctx.rotate(-(p._spin || p._ang || 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,240,120,0.55)';
        ctx.lineWidth = 1.4;
        nearby.forEach(e => {
          const ex = e.x - p.x;
          const ey = e.y - p.y;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(ex * 0.33, ey * 0.33);
          ctx.lineTo(ex * 0.66 + (Math.random() - 0.5) * 8, ey * 0.66 + (Math.random() - 0.5) * 8);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        });
        ctx.restore();
      }
    }
  }
}

function drawDroneLaserVisual(ctx, size) {
  const colors = { glow: '#00e5ff', core: '#ffffff' };
  const body = getCachedBulletBody('drone_laser', 'laser', size * 2, false, null, colors, { glowAlpha: 0.16 });
  if (body) ctx.drawImage(body, -body.width / 2, -body.height / 2);
}

function renderFallbackProjectile(ctx, p, cfg, colors, isCrit) {
  const size = p.friendly ? 5 * (p._size || 1) : 7;
  drawBulletGlow(ctx, colors.glow, size * 1.5, size * 1.1, cfg.glowAlpha !== undefined ? cfg.glowAlpha : 0.16, 1);
  ctx.fillStyle = colors.core;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
  ctx.fill();
  if (isCrit) drawCritOverlay(ctx, size * 0.9);
}

// ---- CUSTOM RENDERER REGISTRY ----
// Individual bullet scripts register into BULLET_RENDERERS[vis] = fn(ctx, p, cfg, sprite, isCrit, motionAngle)
if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

// ---- ENEMY PROJECTILE SPRITES ----
// Map boss projectile colors to sprite images
const ENEMY_PROJ_SPRITES = {};
const ENEMY_PROJ_COLOR_MAP = {
  '#89ff3b': 'toxic_green',     // Murad
  '#ffd54f': 'coin_gold',       // Carlos
  '#8b6914': 'fireball_orange', // Ape
  '#ff4444': 'energy_red',      // Dokwon
  '#ff7ad9': 'heart_pink',      // Logan
  '#cc44aa': 'magic_purple',    // Ruja
  '#ff8fab': 'heart_pink',      // Caroline
  '#e74c3c': 'energy_red',      // Kwon
  '#6effcf': 'ice_cyan',        // Sam
  '#ffd84d': 'coin_gold',       // CZ
  '#ffd08a': 'coin_gold',       // CZ alt
  '#d8a3ff': 'magic_purple',    // Ruja alt
  '#67d7ff': 'ice_cyan',        // Dokwon projectiles
  '#ff6600': 'fireball_orange', // Bat enemy
  '#88ccff': 'ice_cyan',        // Mage enemy
};

(function loadEnemyProjSprites() {
  const spriteNames = ['fireball_orange', 'toxic_green', 'magic_purple', 'energy_red', 'coin_gold', 'ice_cyan', 'heart_pink'];
  spriteNames.forEach(name => {
    const img = new Image();
    img.src = 'assets/bullets/' + name + '.png';
    img.onload = () => { ENEMY_PROJ_SPRITES[name] = img; };
  });
  // Fire hazard ground sprite
  const fireHaz = new Image();
  fireHaz.src = 'assets/bullets/fire_hazard.png';
  fireHaz.onload = () => { window._fireHazardSprite = fireHaz; };
  window._fireHazardSprite = fireHaz;
})();

function getEnemyProjSprite(col) {
  const name = ENEMY_PROJ_COLOR_MAP[col];
  return name ? ENEMY_PROJ_SPRITES[name] : null;
}

// ---- ENEMY PROJECTILE RENDERER ----
// Beautiful visuals for boss/enemy projectiles — uses sprites when available
function renderEnemyProjectile(ctx, p) {
  const sz = 7 * (p._size || 1);
  const col = p.col || '#ff0000';
  const t = typeof G !== 'undefined' ? G.totalTime || 0 : Date.now() / 1000;
  const motionAngle = Math.atan2(p.vy, p.vx);

  // Parse color for glow effects
  const r = parseInt(col.slice(1, 3), 16) || 255;
  const g = parseInt(col.slice(3, 5), 16) || 0;
  const b = parseInt(col.slice(5, 7), 16) || 0;

  const sprite = getEnemyProjSprite(col);

  ctx.save();
  ctx.rotate(motionAngle);

  // Outer glow (large, soft)
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 2.5);
  glowGrad.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
  glowGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.1)`);
  glowGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glowGrad;
  ctx.beginPath(); ctx.arc(0, 0, sz * 2.5, 0, Math.PI * 2); ctx.fill();

  // Trail (motion blur behind the projectile)
  const trailLen = sz * 3;
  const trailGrad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
  trailGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  trailGrad.addColorStop(0.6, `rgba(${r},${g},${b},0.15)`);
  trailGrad.addColorStop(1, `rgba(${r},${g},${b},0.4)`);
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(0, -sz * 0.6);
  ctx.lineTo(-trailLen, 0);
  ctx.lineTo(0, sz * 0.6);
  ctx.closePath();
  ctx.fill();

  if (sprite) {
    // Sprite-based rendering with glow
    const spriteSz = sz * 2.8;
    const pulse = 1 + Math.sin(t * 8 + p.x * 0.1) * 0.08;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3 + Math.sin(t * 12 + p.y * 0.1) * 0.1;
    ctx.drawImage(sprite, -spriteSz * 0.55 * pulse, -spriteSz * 0.55 * pulse, spriteSz * 1.1 * pulse, spriteSz * 1.1 * pulse);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(sprite, -spriteSz * 0.5, -spriteSz * 0.5, spriteSz, spriteSz);
  } else {
    // Fallback: canvas-drawn fireball
    const bodyGrad = ctx.createRadialGradient(sz * 0.2, 0, 0, 0, 0, sz);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.25, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},1)`);
    bodyGrad.addColorStop(0.7, col);
    bodyGrad.addColorStop(1, `rgba(${r >> 1},${g >> 1},${b >> 1},0.6)`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.arc(0, 0, sz, 0, Math.PI * 2); ctx.fill();

    // Inner hot core
    ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 20 + p.x * 0.1) * 0.2})`;
    ctx.beginPath(); ctx.arc(sz * 0.15, 0, sz * 0.35, 0, Math.PI * 2); ctx.fill();

    // Flickering flame particles
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const fa = t * 12 + i * 2.1 + p.y * 0.05;
      const fx = Math.cos(fa) * sz * 0.6;
      const fy = Math.sin(fa) * sz * 0.5;
      const fSz = sz * (0.2 + Math.sin(fa * 1.3) * 0.1);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + Math.sin(fa) * 0.15})`;
      ctx.beginPath(); ctx.arc(fx, fy, fSz, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

function renderProjectile(ctx, p) {
  if (!ctx || !p) return;

  // Enemy projectiles get special visual treatment
  if (!p.friendly && !p.vis) {
    renderEnemyProjectile(ctx, p);
    return;
  }

  const cfg = getBulletConfig(p.vis);
  const style = getBulletStyle(p.vis);
  const rotType = getBulletRotationType(p.vis);
  const motionAngle = Math.atan2(p.vy, p.vx);
  const isCrit = p.col === '#ffd700';
  const colors = resolveBulletPalette(cfg, p, isCrit);
  const size = p.friendly ? 5 * (p._size || 1) : 7;
  const sprites = typeof BULLET_SPRITES !== 'undefined' ? BULLET_SPRITES : {};
  const sprite = sprites[p.vis];

  try {
    // Apply rotation before rendering
    if (rotType === 'spin') {
      const spinSpd = cfg.spinSpeed || 15;
      p._spin = (p._spin || 0) + spinSpd * getBulletDt();
      ctx.rotate(p._spin);
    } else if (rotType === 'directional' && p.type !== 'orbital') {
      p._ang = p._ang !== undefined ? p._ang : motionAngle;
      ctx.rotate(p._ang);
    }

    // Check for custom per-bullet renderer first
    const customRenderer = BULLET_RENDERERS[p.vis];
    if (customRenderer) {
      customRenderer(ctx, p, cfg, sprite, isCrit, motionAngle);
      return;
    }

    // Fallback to generic style-based rendering
    switch (style) {
      case 'slug':
      case 'pellet':
      case 'plasma':
      case 'ember':
        drawSpriteBulletVisual(ctx, p, cfg, sprite, style, colors, rotType, motionAngle, isCrit);
        break;
      case 'beam':
        drawRailgunBeam(ctx, cfg, size, sprites.railgun_beam, colors, isCrit);
        break;
      case 'slash':
        drawSlashVisual(ctx, p.vis, isCrit, size);
        break;
      case 'axe':
        drawAxeVisual(ctx, p, p.vis, size);
        break;
      case 'laser':
        drawDroneLaserVisual(ctx, size);
        break;
      default:
        renderFallbackProjectile(ctx, p, cfg, colors, isCrit);
        break;
    }
  } catch (err) {
    if (!p._renderErrLogged) {
      console.error('[bullets] renderProjectile failed for', p.vis, err);
      p._renderErrLogged = true;
    }
    renderFallbackProjectile(ctx, p, cfg, colors, isCrit);
  }
}

// ---- MUZZLE FLASH DISPATCH ----
function fireMuzzleFlash(vis, x, y, angle) {
  const cfg = getBulletConfig(vis);
  const type = cfg.muzzleFlash || 'small';
  switch (type) {
    case 'none': break;
    case 'small':   fxMuzzleFlashSmall(x, y, angle); break;
    case 'rifle':   fxMuzzleFlashRifle(x, y, angle); break;
    case 'shotgun': fxMuzzleFlashShotgun(x, y, angle); break;
    case 'energy':  fxMuzzleFlashEnergy(x, y, angle); break;
    case 'fire':    fxMuzzleFlashFire(x, y, angle); break;
    default:        fxMuzzleFlash(x, y, angle); break;
  }
  if (cfg.casingEject && typeof fxCasingEject === 'function') fxCasingEject(x, y, angle);
  fireScreenEffect(vis);
}

// ---- IMPACT DISPATCH ----
function fireBulletImpact(vis, x, y, angle) {
  const cfg = getBulletConfig(vis);
  const type = cfg.impactEffect || 'spark';
  const color = cfg.impactColor || cfg.glowColor;
  switch (type) {
    case 'spark':     fxBulletImpact(x, y, angle, color); break;
    case 'pierce':    fxBulletImpactPierce(x, y, angle, color); break;
    case 'debris':    fxBulletImpactDebris(x, y, angle, color); break;
    case 'fire':      fxBulletImpactFire(x, y, angle); break;
    case 'explosion': fxBulletImpactExplosion(x, y, cfg.explosionRadius || 40, color); break;
    case 'electric':  fxBulletImpactElectric(x, y, color); break;
    case 'slash': break; // melee handles its own fx
  }
}

// ---- RECOIL DISPATCH ----
function fireRecoil(vis) {
  const cfg = getBulletConfig(vis);
  if (cfg.recoil && cfg.recoil.shake > 0) {
    triggerShake(cfg.recoil.shake, cfg.recoil.duration);
  }
}
