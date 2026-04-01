// ============ PELLET — Shotgun Spread ============
// Simple silver ball, no trail, multiple fired at once
// Weapon: Shotgun (base) / Dragon's Breath (evolved)

(function registerPellet() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'pellet';
  const CORE_COLOR = '#ffffff';
  const GLOW_COLOR = '#c8d6e5';
  const DRAW_SIZE = 10;

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || DRAW_SIZE;
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;
    const core = isCrit ? '#fff4b3' : CORE_COLOR;

    // -- Subtle metallic glow --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.6);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.3));
    glowGrad.addColorStop(0.6, bulletColorWithAlpha(glow, 0.08));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite --
    if (sprite) {
      const d = sz * 1.1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
      ctx.imageSmoothingEnabled = true;
    } else {
      // Fallback: metallic sphere
      const sphGrad = ctx.createRadialGradient(-sz * 0.08, -sz * 0.08, 0, 0, 0, sz * 0.32);
      sphGrad.addColorStop(0, '#ffffff');
      sphGrad.addColorStop(0.4, '#c8d6e5');
      sphGrad.addColorStop(1, '#8395a7');
      ctx.fillStyle = sphGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Speed streaks (brief flash on fast pellets) --
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 400) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.3, (speed - 400) / 1200);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.5, 0);
      ctx.lineTo(-sz * 1.2, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 + Math.sin(getBulletTime() * 10) * 0.1;
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
