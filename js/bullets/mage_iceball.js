// ============ MAGE ICEBALL — Enemy Projectile ============
// Cold blue-white ice sphere that slows the player on hit
// Crystalline glow with frost particles

(function registerMageIceball() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'mage_iceball';
  const GLOW_COLOR = '#88ccff';
  const CORE_COLOR = '#eef8ff';
  const FROST_COLOR = '#aaddff';

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = (p._size || 1) * 16;
    const t = getBulletTime();
    const shimmer = 0.92 + Math.sin(t * 14 + p.x * 0.03) * 0.08;

    // -- Frost trail (icy particles behind) --
    const speed = Math.hypot(p.vx, p.vy);
    const tLen = sz * 0.8 * Math.max(0.7, Math.min(1.2, speed / 220));
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.15, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha(FROST_COLOR, 0));
    tGrad.addColorStop(0.5, bulletColorWithAlpha(GLOW_COLOR, 0.1));
    tGrad.addColorStop(1, bulletColorWithAlpha(CORE_COLOR, 0.2));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.lineTo(-tLen * 0.4, -sz * 0.2);
    ctx.lineTo(sz * 0.1, 0);
    ctx.lineTo(-tLen * 0.4, sz * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // -- Cold blue glow --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.85 * shimmer);
    glowGrad.addColorStop(0, bulletColorWithAlpha(GLOW_COLOR, 0.45 * shimmer));
    glowGrad.addColorStop(0.35, bulletColorWithAlpha(GLOW_COLOR, 0.2));
    glowGrad.addColorStop(0.7, bulletColorWithAlpha(FROST_COLOR, 0.06));
    glowGrad.addColorStop(1, bulletColorWithAlpha(FROST_COLOR, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.85 * shimmer, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite --
    if (sprite) {
      const d = sz * 1.05;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
      ctx.imageSmoothingEnabled = true;
    } else {
      const iGrad = ctx.createRadialGradient(-sz * 0.05, -sz * 0.05, 0, 0, 0, sz * 0.3);
      iGrad.addColorStop(0, '#ffffff');
      iGrad.addColorStop(0.4, CORE_COLOR);
      iGrad.addColorStop(1, GLOW_COLOR);
      ctx.fillStyle = iGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Crystalline ring --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = bulletColorWithAlpha(FROST_COLOR, 0.2 + Math.sin(t * 10) * 0.06);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.35 * shimmer, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // -- Orbiting frost crystals --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + i * (Math.PI * 2 / 3) + p.y * 0.005;
      const r = sz * 0.3 * shimmer;
      ctx.fillStyle = bulletColorWithAlpha('#ffffff', 0.35);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
