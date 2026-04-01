// ============ BAT FIREBALL — Enemy Projectile ============
// Orange-red fireball launched by Bats, flickering flame with warm glow

(function registerBatFireball() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'bat_fireball';
  const GLOW_COLOR = '#ff6600';
  const CORE_COLOR = '#ffcc00';

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = (p._size || 1) * 14;
    const t = getBulletTime();
    const flicker = 0.85 + Math.sin(t * 22 + p.x * 0.04) * 0.15;

    // -- Fire trail --
    const speed = Math.hypot(p.vx, p.vy);
    const tLen = sz * 1.2 * flicker * Math.max(0.7, Math.min(1.3, speed / 200));
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.2, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha('#ff3300', 0));
    tGrad.addColorStop(0.5, bulletColorWithAlpha('#ff5500', 0.15));
    tGrad.addColorStop(1, bulletColorWithAlpha(CORE_COLOR, 0.3));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.quadraticCurveTo(-tLen * 0.4, -sz * 0.35 * flicker, sz * 0.15, 0);
    ctx.quadraticCurveTo(-tLen * 0.4, sz * 0.35 * flicker, -tLen, 0);
    ctx.fill();
    ctx.restore();

    // -- Warm glow --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.9 * flicker);
    glowGrad.addColorStop(0, bulletColorWithAlpha(GLOW_COLOR, 0.5 * flicker));
    glowGrad.addColorStop(0.4, bulletColorWithAlpha(GLOW_COLOR, 0.18));
    glowGrad.addColorStop(1, bulletColorWithAlpha(GLOW_COLOR, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.9 * flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite --
    if (sprite) {
      const d = sz * 1.1 * flicker;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
      ctx.imageSmoothingEnabled = true;
    } else {
      const fGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.35);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.4, CORE_COLOR);
      fGrad.addColorStop(1, GLOW_COLOR);
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Flickering spark --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bulletColorWithAlpha('#ffdd44', 0.4 * flicker);
    const sa = t * 18 + p.y * 0.03;
    ctx.beginPath();
    ctx.arc(Math.cos(sa) * sz * 0.15, Math.sin(sa) * sz * 0.12, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
