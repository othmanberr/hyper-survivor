// ============ SMG BULLET — Orange Tracer ============
// Small, fast orange tracer with minimal trail
// Weapon: SMG (base) / Gatling Swarm (evolved)

(function registerSmgBullet() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'smg_bullet';
  const CORE_COLOR = '#fff3d9';
  const GLOW_COLOR = '#ffb347';
  const TRAIL_COLOR = '#ff961f';
  const TRAIL_LEN = 10;
  const TRAIL_ALPHA = 0.14;
  const DRAW_SIZE = 14;

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || DRAW_SIZE;
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;
    const core = isCrit ? '#fff4b3' : CORE_COLOR;
    const trail = isCrit ? '#ffd700' : TRAIL_COLOR;

    // -- Short hot trail --
    const speed = Math.hypot(p.vx, p.vy);
    const tLen = Math.max(sz * 0.8, TRAIL_LEN * Math.max(0.9, Math.min(1.5, speed / 800)));
    const tHalf = Math.max(1.5, sz * 0.14);
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.2, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha(trail, 0));
    tGrad.addColorStop(0.5, bulletColorWithAlpha(trail, TRAIL_ALPHA * 0.4));
    tGrad.addColorStop(1, bulletColorWithAlpha(trail, TRAIL_ALPHA));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.lineTo(-tLen * 0.4, -tHalf);
    ctx.lineTo(sz * 0.15, -tHalf * 0.8);
    ctx.lineTo(sz * 0.25, 0);
    ctx.lineTo(sz * 0.15, tHalf * 0.8);
    ctx.lineTo(-tLen * 0.4, tHalf);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // -- Compact glow --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.55);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.4));
    glowGrad.addColorStop(0.5, bulletColorWithAlpha(glow, 0.1));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.scale(1.1, 1);
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite --
    if (sprite) {
      const aspect = sprite.width / sprite.height;
      const dh = sz;
      const dw = sz * aspect;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 + Math.sin(getBulletTime() * 14) * 0.1;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
