// ============ PISTOL BULLET — Cyber Blaster ============
// Cyan energy slug with white-hot core and short directional trail
// Weapon: Cyber Blaster (base) / Plasma Cannon (evolved)

(function registerPistolBullet() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'pistol_bullet';
  const CORE_COLOR = '#ffffff';
  const GLOW_COLOR = '#58edff';
  const TRAIL_COLOR = '#1fd8ff';
  const TRAIL_LEN = 14;
  const TRAIL_ALPHA = 0.18;
  const DRAW_SIZE = 20;

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || DRAW_SIZE;
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;
    const core = isCrit ? '#fff4b3' : CORE_COLOR;
    const trail = isCrit ? '#ffd700' : TRAIL_COLOR;

    // -- Trail --
    const speed = Math.hypot(p.vx, p.vy);
    const tLen = Math.max(sz, TRAIL_LEN * Math.max(0.85, Math.min(1.7, speed / 700)));
    const tHalf = Math.max(2, sz * 0.18);
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.3, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha(trail, 0));
    tGrad.addColorStop(0.4, bulletColorWithAlpha(trail, TRAIL_ALPHA * 0.3));
    tGrad.addColorStop(1, bulletColorWithAlpha(trail, TRAIL_ALPHA));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.lineTo(-tLen * 0.5, -tHalf * 0.9);
    ctx.lineTo(sz * 0.2, -tHalf * 1.1);
    ctx.lineTo(sz * 0.4, 0);
    ctx.lineTo(sz * 0.2, tHalf * 1.1);
    ctx.lineTo(-tLen * 0.5, tHalf * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // -- Glow --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.7);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.45));
    glowGrad.addColorStop(0.5, bulletColorWithAlpha(glow, 0.12));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.scale(1.15, 1);
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.7, 0, Math.PI * 2);
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
      // Fallback: small cyan dot
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Crit shimmer --
    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 + Math.sin(getBulletTime() * 12) * 0.12;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
