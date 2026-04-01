// ============ PLASMA BOLT — Plasma Cannon ============
// Large pulsing purple plasma sphere with energy crackle
// Weapon: Plasma Cannon (evolved from Cyber Blaster)

(function registerPlasmaBolt() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'plasma_bolt';
  const CORE_COLOR = '#ffffff';
  const GLOW_COLOR = '#b84dff';
  const TRAIL_COLOR = '#9730ff';
  const DRAW_SIZE = 26;

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || DRAW_SIZE;
    const t = getBulletTime();
    const glow = isCrit ? '#ffd700' : GLOW_COLOR;
    const core = isCrit ? '#fff4b3' : CORE_COLOR;
    const trail = isCrit ? '#ffd700' : TRAIL_COLOR;

    // -- Plasma trail (wide, diffuse) --
    const speed = Math.hypot(p.vx, p.vy);
    const tLen = Math.max(sz, 18 * Math.max(0.9, Math.min(1.6, speed / 600)));
    const tHalf = sz * 0.28;
    ctx.save();
    const tGrad = ctx.createLinearGradient(-tLen, 0, sz * 0.3, 0);
    tGrad.addColorStop(0, bulletColorWithAlpha(trail, 0));
    tGrad.addColorStop(0.35, bulletColorWithAlpha(trail, 0.1));
    tGrad.addColorStop(1, bulletColorWithAlpha(trail, 0.2));
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(-tLen, 0);
    ctx.lineTo(-tLen * 0.5, -tHalf);
    ctx.lineTo(sz * 0.2, -tHalf * 1.1);
    ctx.lineTo(sz * 0.35, 0);
    ctx.lineTo(sz * 0.2, tHalf * 1.1);
    ctx.lineTo(-tLen * 0.5, tHalf);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // -- Large pulsing glow --
    const pulse = 1 + Math.sin(t * 12 + p.x * 0.01) * 0.08;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.9 * pulse);
    glowGrad.addColorStop(0, bulletColorWithAlpha(glow, 0.55));
    glowGrad.addColorStop(0.35, bulletColorWithAlpha(glow, 0.28));
    glowGrad.addColorStop(0.7, bulletColorWithAlpha(glow, 0.08));
    glowGrad.addColorStop(1, bulletColorWithAlpha(glow, 0));
    ctx.fillStyle = glowGrad;
    ctx.scale(1.08, 1);
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.9 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -- Sprite --
    if (sprite) {
      const d = sz * pulse;
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -d / 2, -d / 2, d, d);
      ctx.imageSmoothingEnabled = true;
      ctx.restore();
    } else {
      const sGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 0.3);
      sGrad.addColorStop(0, '#ffffff');
      sGrad.addColorStop(0.5, '#cc88ff');
      sGrad.addColorStop(1, '#8844ff');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Crackling energy ring --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = bulletColorWithAlpha(glow, 0.2 + Math.sin(t * 16 + p.x * 0.02 + p.y * 0.02) * 0.05);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.38 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // -- Orbiting sparks --
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      const a = t * 8 + i * Math.PI + (p.x + p.y) * 0.005;
      const r = sz * 0.32 * pulse;
      ctx.fillStyle = bulletColorWithAlpha('#cc88ff', 0.4);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

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
