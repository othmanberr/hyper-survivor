// ============ LIGHTNING AXE — Chain Lightning ============
// Spinning electric axe with lightning arcs to nearby enemies
// Weapon: Chain Lightning (evolved from Axe)

(function registerLightningAxe() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'lightning_axe';
  const GLOW_COLOR = '#ffee00';
  const ARC_COLOR = '#ffff88';

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || 36;
    const t = getBulletTime();
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;

    // -- Electric glow aura --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.65);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.35));
    glowGrad.addColorStop(0.5, bulletColorWithAlpha(glow, 0.1));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite with motion ghosts --
    const axeSpr = sprite ||
      (typeof BULLET_SPRITES !== 'undefined' ? BULLET_SPRITES.lightning_axe : null) ||
      (typeof WEAPON_SPRITES !== 'undefined' ? WEAPON_SPRITES.chainLightning : null);

    if (axeSpr) {
      const dw = sprite ? 36 : axeSpr.width * 0.55;
      const dh = sprite ? 36 : axeSpr.height * 0.55;

      // Ghost afterimages
      for (let i = 2; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = 0.08 + i * 0.05;
        ctx.rotate(-0.18 * i);
        ctx.drawImage(axeSpr, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      // Main sprite
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(axeSpr, -dw / 2, -dh / 2, dw, dh);
      ctx.imageSmoothingEnabled = true;
    } else {
      // Fallback emoji
      ctx.font = `${sz * 1.2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u{1FA93}', 0, 0);
    }

    // -- Lightning arcs radiating outward --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = ARC_COLOR;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = sz * 0.7;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      ctx.lineTo(Math.cos(a + 0.3) * r, Math.sin(a + 0.3) * r);
      ctx.stroke();
    }
    ctx.restore();

    // -- Chain lightning to nearby enemies --
    if (typeof hash !== 'undefined' && p && p.friendly) {
      const nearby = hash.qry(p.x, p.y, 80).slice(0, 2);
      if (nearby.length) {
        ctx.save();
        ctx.rotate(-(p._spin || p._ang || 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,240,120,0.55)';
        ctx.lineWidth = 1.4;
        nearby.forEach(function(e) {
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

    if (isCrit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 + Math.sin(t * 12) * 0.12;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
