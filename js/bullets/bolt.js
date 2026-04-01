// ============ BOLT — Rail Spiker / Crossbow ============
// Elongated ice-blue energy bolt with long piercing trail
// Weapon: Rail Spiker (base) / Railgun (evolved)

(function registerBolt() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'bolt';
  const CORE_COLOR = '#ffffff';
  const GLOW_COLOR = '#a8dfff';
  const TRAIL_COLOR = '#78c8ff';
  const TRAIL_LEN = 24;
  const TRAIL_ALPHA = 0.2;
  const DRAW_SIZE = 24;

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || DRAW_SIZE;
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;
    const core = isCrit ? '#fff4b3' : CORE_COLOR;
    const trail = isCrit ? '#ffd700' : TRAIL_COLOR;

    // -- Long piercing trail --
    const speed = Math.hypot(p.vx, p.vy);
    const tLen = Math.max(sz * 1.2, TRAIL_LEN * Math.max(0.9, Math.min(2.0, speed / 500)));
    const tHalf = Math.max(2, sz * 0.16);
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.35, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha(trail, 0));
    tGrad.addColorStop(0.3, bulletColorWithAlpha(trail, TRAIL_ALPHA * 0.25));
    tGrad.addColorStop(0.7, bulletColorWithAlpha(trail, TRAIL_ALPHA * 0.6));
    tGrad.addColorStop(1, bulletColorWithAlpha(trail, TRAIL_ALPHA));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.lineTo(-tLen * 0.6, -tHalf * 0.7);
    ctx.lineTo(sz * 0.1, -tHalf * 1.2);
    ctx.lineTo(sz * 0.45, 0);
    ctx.lineTo(sz * 0.1, tHalf * 1.2);
    ctx.lineTo(-tLen * 0.6, tHalf * 0.7);
    ctx.closePath();
    ctx.fill();

    // -- Inner core trail (white-hot) --
    const cGrad = ctx.createLinearGradient(-tLen * 0.7, 0, sz * 0.3, 0);
    cGrad.addColorStop(0, bulletColorWithAlpha(core, 0));
    cGrad.addColorStop(0.5, bulletColorWithAlpha(core, 0.12));
    cGrad.addColorStop(1, bulletColorWithAlpha(core, 0.35));
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen * 0.65, 0);
    ctx.lineTo(-tLen * 0.2, -tHalf * 0.3);
    ctx.lineTo(sz * 0.3, 0);
    ctx.lineTo(-tLen * 0.2, tHalf * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // -- Glow halo --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.75);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.5));
    glowGrad.addColorStop(0.45, bulletColorWithAlpha(glow, 0.14));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.scale(1.25, 1);
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.75, 0, Math.PI * 2);
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
      ctx.arc(0, 0, sz * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 + Math.sin(getBulletTime() * 11) * 0.12;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
