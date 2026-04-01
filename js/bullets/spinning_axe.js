// ============ SPINNING AXE — Base Axe Weapon ============
// Dark metal throwing axe with purple energy glow, spinning
// Weapon: Axe (base)

(function registerSpinningAxe() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'spinning_axe';
  const GLOW_COLOR = '#a29bfe';

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || 20;
    const t = getBulletTime();
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;

    // -- Subtle purple aura --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.6);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.25));
    glowGrad.addColorStop(0.5, bulletColorWithAlpha(glow, 0.08));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite with ghosts --
    const axeSpr = sprite ||
      (typeof BULLET_SPRITES !== 'undefined' ? BULLET_SPRITES.spinning_axe : null) ||
      (typeof WEAPON_SPRITES !== 'undefined' ? WEAPON_SPRITES.axe : null);

    if (axeSpr) {
      const dw = sprite ? 32 : axeSpr.width * 0.5;
      const dh = sprite ? 32 : axeSpr.height * 0.5;

      // Rotation ghosts
      for (let i = 2; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = 0.06 + i * 0.04;
        ctx.rotate(-0.2 * i);
        ctx.drawImage(axeSpr, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      // Main sprite
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(axeSpr, -dw / 2, -dh / 2, dw, dh);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.font = `${sz * 3.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1FA93}', 0, 0);
    }

    // -- Motion blur arc --
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.45, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    ctx.restore();

    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 + Math.sin(t * 11) * 0.1;
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
