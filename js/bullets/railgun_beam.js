// ============ RAILGUN BEAM — Piercing Energy Beam ============
// Long horizontal laser beam with hot core, edge glow, and tip flare
// Weapon: Railgun (evolved from Rail Spiker)

(function registerRailgunBeam() {
  if (typeof BULLET_RENDERERS === 'undefined') window.BULLET_RENDERERS = {};

  const VIS = 'railgun_beam';
  const CORE_COLOR = '#eafcff';
  const EDGE_COLOR = '#27a9ff';

  function render(ctx, p, cfg, sprite, isCrit, motionAngle) {
    const sz = getBulletSize(p.vis, p._size) || 18;
    const t = getBulletTime();
    const edgeColor = isCrit ? '#ffb63d' : EDGE_COLOR;
    const coreColor = isCrit ? '#fff4c2' : CORE_COLOR;
    const beamLen = (cfg && cfg.beamLength) || Math.max(typeof W !== 'undefined' ? W * 1.15 : 960, 960);
    const beamWidth = sz * ((cfg && cfg.beamWidthMult) || 1.1);
    const outerWidth = beamWidth * 1.85;
    const pulse = 0.9 + Math.sin(t * 18) * 0.08;
    const beamStart = -beamLen * 0.04;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // -- Outer shell glow --
    const shellGrad = ctx.createLinearGradient(beamStart, 0, beamLen, 0);
    shellGrad.addColorStop(0, bulletColorWithAlpha(edgeColor, 0));
    shellGrad.addColorStop(0.08, bulletColorWithAlpha(edgeColor, 0.1 * pulse));
    shellGrad.addColorStop(0.55, bulletColorWithAlpha(edgeColor, 0.22 * pulse));
    shellGrad.addColorStop(0.92, bulletColorWithAlpha(edgeColor, 0.08 * pulse));
    shellGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.moveTo(beamStart, 0);
    ctx.lineTo(beamStart + beamLen * 0.12, -outerWidth * 0.72);
    ctx.lineTo(beamLen, -outerWidth * 0.34);
    ctx.lineTo(beamLen + outerWidth * 0.9, 0);
    ctx.lineTo(beamLen, outerWidth * 0.34);
    ctx.lineTo(beamStart + beamLen * 0.12, outerWidth * 0.72);
    ctx.closePath();
    ctx.fill();

    // -- Mid layer --
    const midGrad = ctx.createLinearGradient(beamStart, 0, beamLen, 0);
    midGrad.addColorStop(0, bulletColorWithAlpha(edgeColor, 0));
    midGrad.addColorStop(0.08, bulletColorWithAlpha(edgeColor, 0.35 * pulse));
    midGrad.addColorStop(0.7, bulletColorWithAlpha(edgeColor, 0.5 * pulse));
    midGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
    ctx.fillStyle = midGrad;
    ctx.fillRect(beamStart, -beamWidth * 0.36, beamLen, beamWidth * 0.72);

    // -- White-hot core --
    const coreGrad = ctx.createLinearGradient(beamStart, 0, beamLen, 0);
    coreGrad.addColorStop(0, bulletColorWithAlpha(coreColor, 0));
    coreGrad.addColorStop(0.12, bulletColorWithAlpha(coreColor, 0.8 * pulse));
    coreGrad.addColorStop(0.85, bulletColorWithAlpha(coreColor, 0.92 * pulse));
    coreGrad.addColorStop(1, bulletColorWithAlpha(coreColor, 0));
    ctx.fillStyle = coreGrad;
    ctx.fillRect(beamStart, -beamWidth * 0.12, beamLen, beamWidth * 0.24);

    // -- Sprite overlay (tiled along beam) --
    if (sprite) {
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.38;
      ctx.drawImage(sprite, beamStart, -beamWidth * 0.28, beamLen, beamWidth * 0.56);
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true;
    }

    // -- Tip flare --
    const tipGrad = ctx.createRadialGradient(beamLen, 0, 0, beamLen, 0, outerWidth * 1.35);
    tipGrad.addColorStop(0, bulletColorWithAlpha(coreColor, 0.75 * pulse));
    tipGrad.addColorStop(0.45, bulletColorWithAlpha(edgeColor, 0.3 * pulse));
    tipGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
    ctx.fillStyle = tipGrad;
    ctx.beginPath();
    ctx.ellipse(beamLen, 0, outerWidth * 1.2, outerWidth * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // -- Origin flare --
    const originGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerWidth * 1.25);
    originGrad.addColorStop(0, bulletColorWithAlpha(coreColor, 0.85));
    originGrad.addColorStop(0.45, bulletColorWithAlpha(edgeColor, 0.35 * pulse));
    originGrad.addColorStop(1, bulletColorWithAlpha(edgeColor, 0));
    ctx.fillStyle = originGrad;
    ctx.beginPath();
    ctx.arc(0, 0, outerWidth * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // -- Noise/ripple along beam --
    for (let i = 0; i < 4; i++) {
      const rx = beamLen * (0.15 + i * 0.2) + Math.sin(t * 14 + i) * 20;
      const ry = Math.sin(t * 22 + i * 3.7) * beamWidth * 0.25;
      ctx.fillStyle = bulletColorWithAlpha(coreColor, 0.4 * pulse);
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  BULLET_RENDERERS[VIS] = render;
  console.log('[bullet] Registered:', VIS);
})();
