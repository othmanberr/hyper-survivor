// ============ FIRE PELLET — Ember Projectile ============
// Fiery ember with flickering particles, warm glow
// Weapon: Flamethrower (base) / Dragon's Breath (evolved)

(function registerFirePellet() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'fire_pellet';
  const CORE_COLOR = '#fff2bf';
  const GLOW_COLOR = '#ff7a18';
  const TRAIL_COLOR = '#ff5a1f';
  const DRAW_SIZE = 18;

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || DRAW_SIZE;
    const t = getBulletTime();
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;
    const core = isCrit ? '#fff4b3' : CORE_COLOR;

    // -- Flickering fire trail --
    const speed = Math.hypot(p.vx, p.vy);
    const flicker = Math.sin(t * 20 + p.x * 0.03) * 0.15 + 0.85;
    const tLen = sz * 0.9 * flicker * Math.max(0.8, Math.min(1.4, speed / 500));
    const tHalf = sz * 0.25 * flicker;
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.2, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha(TRAIL_COLOR, 0));
    tGrad.addColorStop(0.4, bulletColorWithAlpha(TRAIL_COLOR, 0.12));
    tGrad.addColorStop(0.8, bulletColorWithAlpha(GLOW_COLOR, 0.22));
    tGrad.addColorStop(1, bulletColorWithAlpha(core, 0.35));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.quadraticCurveTo(-tLen * 0.5, -tHalf * 1.3, sz * 0.15, 0);
    ctx.quadraticCurveTo(-tLen * 0.5, tHalf * 1.3, -tLen, 0);
    ctx.fill();
    ctx.restore();

    // -- Warm glow (pulsing) --
    const pulse = 0.9 + Math.sin(t * 16 + p.y * 0.02) * 0.1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.7 * pulse);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.5 * pulse));
    glowGrad.addColorStop(0.4, bulletColorWithAlpha(glow, 0.16));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite --
    if (sprite) {
      const d = sz * 1.0;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
      ctx.imageSmoothingEnabled = true;
    } else {
      // Fallback: hot core dot
      const fGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.25);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.5, '#ffcc00');
      fGrad.addColorStop(1, '#ff6600');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Ambient sparks (small hot pixel) --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bulletColorWithAlpha('#ffd27a', 0.5 * flicker);
    ctx.beginPath();
    ctx.arc(-sz * 0.15, Math.sin(t * 25) * sz * 0.08, Math.max(1.2, sz * 0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 + Math.sin(t * 13) * 0.1;
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
