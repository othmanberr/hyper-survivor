const BULLET_PREVIEW_ORDER = [
  'pistol_bullet',
  'smg_bullet',
  'bolt',
  'pellet',
  'fire_pellet',
  'plasma_bolt',
  'railgun_beam',
  'spinning_axe',
  'lightning_axe',
  'red_slash',
  'god_slash',
  'drone_laser',
];

let _bulletPreview = null;

function formatBulletPreviewName(vis) {
  return vis.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

function ensureBulletPreviewUI() {
  if (_bulletPreview) return _bulletPreview;

  const overlay = document.createElement('div');
  overlay.id = 'bullet-preview-overlay';
  overlay.classList.add('h');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2200',
    background: 'radial-gradient(circle at top, rgba(24,41,66,0.96), rgba(4,8,18,0.98))',
    padding: '24px',
    boxSizing: 'border-box',
    display: 'none',
  });

  overlay.innerHTML = `
    <div style="height:100%;display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;">
      <div style="display:flex;flex-direction:column;min-height:0;border:1px solid rgba(83,203,255,0.25);background:rgba(6,13,24,0.88);box-shadow:0 18px 50px rgba(0,0,0,0.35);">
        <div style="padding:18px 18px 12px;border-bottom:1px solid rgba(83,203,255,0.18);">
          <div style="font:900 24px 'Exo 2';color:#f4fbff;letter-spacing:0.04em;">SHOOTING RANGE</div>
          <div style="margin-top:6px;font:12px 'JetBrains Mono', monospace;color:rgba(196,228,255,0.72);">Preview bullet bodies, trails, muzzle flashes and impacts.</div>
        </div>
        <div id="bullet-preview-list" style="padding:12px;display:flex;flex-direction:column;gap:8px;overflow:auto;"></div>
      </div>
      <div style="display:grid;grid-template-rows:auto minmax(0,1fr);gap:16px;min-width:0;">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border:1px solid rgba(83,203,255,0.25);background:rgba(6,13,24,0.88);padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,0.35);">
          <div id="bullet-preview-info" style="min-width:0;"></div>
          <button id="bullet-preview-close" class="mb red" style="flex:0 0 auto;">CLOSE [ESC]</button>
        </div>
        <div style="position:relative;min-width:0;min-height:0;border:1px solid rgba(83,203,255,0.25);background:rgba(6,13,24,0.92);box-shadow:0 18px 50px rgba(0,0,0,0.35);overflow:hidden;">
          <canvas id="bullet-preview-canvas" style="width:100%;height:100%;display:block;"></canvas>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const state = {
    overlay,
    list: overlay.querySelector('#bullet-preview-list'),
    info: overlay.querySelector('#bullet-preview-info'),
    canvas: overlay.querySelector('#bullet-preview-canvas'),
    closeBtn: overlay.querySelector('#bullet-preview-close'),
    buttons: new Map(),
    selectedVis: BULLET_PREVIEW_ORDER[0],
    projectile: null,
    respawnTimer: 0,
    time: 0,
    lastT: 0,
    raf: 0,
    returnToPause: false,
  };
  state.ctx = state.canvas.getContext('2d');

  BULLET_PREVIEW_ORDER.forEach(vis => {
    const btn = document.createElement('button');
    btn.className = 'mb';
    btn.textContent = formatBulletPreviewName(vis);
    Object.assign(btn.style, {
      textAlign: 'left',
      justifyContent: 'flex-start',
      fontSize: '12px',
      padding: '10px 12px',
      border: '1px solid rgba(83,203,255,0.18)',
      background: 'rgba(255,255,255,0.03)',
      color: '#e9f7ff',
    });
    btn.addEventListener('click', () => selectBulletPreviewVis(vis));
    state.list.appendChild(btn);
    state.buttons.set(vis, btn);
  });

  state.closeBtn.addEventListener('click', hideBulletPreview);
  window.addEventListener('resize', resizeBulletPreviewCanvas);

  _bulletPreview = state;
  resizeBulletPreviewCanvas();
  updateBulletPreviewInfo();
  return state;
}

function resizeBulletPreviewCanvas() {
  const state = ensureBulletPreviewUI();
  const rect = state.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  state.canvas.width = Math.max(1, Math.round(rect.width * dpr));
  state.canvas.height = Math.max(1, Math.round(rect.height * dpr));
  state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateBulletPreviewInfo() {
  const state = ensureBulletPreviewUI();
  const cfg = getBulletConfig(state.selectedVis);
  const title = formatBulletPreviewName(state.selectedVis);
  state.info.innerHTML = `
    <div style="font:900 30px 'Exo 2';color:#f4fbff;letter-spacing:0.04em;">${title}</div>
    <div style="margin-top:6px;font:13px 'JetBrains Mono', monospace;color:rgba(186,220,255,0.82);">
      CALIBER ${cfg.caliber || 'N/A'} &nbsp;|&nbsp; STYLE ${cfg.style || getBulletStyle(state.selectedVis)} &nbsp;|&nbsp; SOUND ${cfg.sound || 'default'}
    </div>
    <div style="margin-top:12px;font:13px 'JetBrains Mono', monospace;color:rgba(216,235,255,0.88);display:flex;flex-wrap:wrap;gap:12px 18px;">
      <span>SIZE ${cfg.size || 0}</span>
      <span>TRAIL ${(cfg.trailLength || 0).toFixed ? (cfg.trailLength || 0).toFixed(0) : (cfg.trailLength || 0)}</span>
      <span>RECOIL ${cfg.recoil && cfg.recoil.shake !== undefined ? cfg.recoil.shake : 0}</span>
      <span>MUZZLE ${cfg.muzzleFlash || 'none'}</span>
      <span>IMPACT ${cfg.impactEffect || 'spark'}</span>
    </div>
  `;

  state.buttons.forEach((btn, vis) => {
    const active = vis === state.selectedVis;
    btn.style.borderColor = active ? 'rgba(83,203,255,0.9)' : 'rgba(83,203,255,0.18)';
    btn.style.background = active ? 'linear-gradient(135deg, rgba(12,126,182,0.5), rgba(6,25,44,0.88))' : 'rgba(255,255,255,0.03)';
    btn.style.boxShadow = active ? '0 0 0 1px rgba(83,203,255,0.28) inset' : 'none';
  });
}

function selectBulletPreviewVis(vis) {
  const state = ensureBulletPreviewUI();
  state.selectedVis = vis;
  state.projectile = null;
  state.respawnTimer = 0;
  particles.length = 0;
  if (typeof G !== 'undefined') G._screenFlash = null;
  updateBulletPreviewInfo();
}

function buildPreviewProjectile(vis, x, y, sizeMult) {
  const cfg = getBulletConfig(vis);
  return {
    active: true,
    x, y,
    vx: cfg.isBeam ? 1100 : 650,
    vy: 0,
    dmg: 1,
    pierce: 1,
    hitCnt: 0,
    hits: new Set(),
    friendly: true,
    col: cfg.glowColor || '#ffffff',
    vis,
    _size: sizeMult || 1,
    _ang: 0,
    _homing: false,
    _homingStr: 0,
    _bounces: 0,
    _trail: !!cfg.trailLength,
    _explodeArea: 0,
    type: 'preview',
  };
}

function spawnBulletPreviewShot() {
  const state = ensureBulletPreviewUI();
  const rect = state.canvas.getBoundingClientRect();
  const sx = 100;
  const sy = rect.height * 0.68;
  const p = buildPreviewProjectile(state.selectedVis, CAM.x + sx, CAM.y + sy, state.selectedVis === 'railgun_beam' ? 1.2 : 1);
  if (typeof resetProjectileVisualState === 'function') resetProjectileVisualState(p);
  state.projectile = p;
  state.respawnTimer = 0;
  if (typeof fireMuzzleFlash === 'function') fireMuzzleFlash(state.selectedVis, p.x, p.y, 0);
  const cfg = getBulletConfig(state.selectedVis);
  if (typeof playSound === 'function' && cfg.sound) playSound(cfg.sound);
}

function drawBulletPreviewGrid(ctx, w, h, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#09111d');
  grad.addColorStop(1, '#04070d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(80,140,190,0.12)';
  ctx.lineWidth = 1;
  const step = 28;
  const drift = (time * 28) % step;
  for (let x = -step; x < w + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + drift, 0);
    ctx.lineTo(x + drift, h);
    ctx.stroke();
  }
  for (let y = 0; y < h + step; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(83,203,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(100, h * 0.68);
  ctx.lineTo(w - 100, h * 0.68);
  ctx.stroke();

  ctx.fillStyle = 'rgba(244,251,255,0.85)';
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillText('MUZZLE', 92, h * 0.68 - 16);
  ctx.fillText('IMPACT', w - 134, h * 0.68 - 16);
}

function drawBulletPreviewTarget(ctx, w, h) {
  const tx = w - 100;
  const ty = h * 0.68;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(-8, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(24, 0);
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -8);
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 24);
  ctx.stroke();
  ctx.restore();
}

function drawBulletPreviewStatic(ctx, vis, w, h) {
  const p = buildPreviewProjectile(vis, CAM.x + w * 0.62, CAM.y + h * 0.32, vis === 'railgun_beam' ? 1.35 : 2.2);
  p.vx = 1;
  p.vy = 0;
  ctx.save();
  ctx.translate(w * 0.62, h * 0.32);
  renderProjectile(ctx, p);
  ctx.restore();
}

function drawBulletPreviewFlash(ctx, w, h) {
  if (!G._screenFlash) return;
  const flashT = Math.max(0, G._screenFlash.life / (G._screenFlash.maxLife || 0.05));
  let rgb = '255,255,255';
  if (G._screenFlash.kind === 'flash_purple') rgb = '190,110,255';
  else if (G._screenFlash.kind === 'flash_warm') rgb = '255,140,70';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = G._screenFlash.alpha * flashT;
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function bulletPreviewFrame(ts) {
  const state = ensureBulletPreviewUI();
  if (!state.overlay.classList.contains('open')) return;

  const dt = Math.min(0.05, state.lastT ? (ts - state.lastT) / 1000 : 1 / 60);
  state.lastT = ts;
  state.time += dt;

  window.BULLET_TIME_OVERRIDE = state.time;
  window.BULLET_DT_OVERRIDE = dt;

  if (G._screenFlash) {
    G._screenFlash.life -= dt;
    if (G._screenFlash.life <= 0) G._screenFlash = null;
  }

  if (state.projectile) {
    state.projectile.x += state.projectile.vx * dt;
    state.projectile.y += state.projectile.vy * dt;
    if (typeof updateProjectileVisualState === 'function') updateProjectileVisualState(state.projectile, dt);
  } else {
    state.respawnTimer -= dt;
    if (state.respawnTimer <= 0) spawnBulletPreviewShot();
  }

  const rect = state.canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const impactX = CAM.x + w - 100;
  if (state.projectile && state.projectile.x >= impactX) {
    if (typeof fireBulletImpact === 'function') fireBulletImpact(state.selectedVis, impactX, state.projectile.y, 0);
    state.projectile = null;
    state.respawnTimer = 0.6;
  }

  updateParticles(dt);

  const ctx = state.ctx;
  ctx.clearRect(0, 0, w, h);
  drawBulletPreviewGrid(ctx, w, h, state.time);
  drawBulletPreviewTarget(ctx, w, h);
  drawBulletPreviewStatic(ctx, state.selectedVis, w, h);

  if (state.projectile) {
    ctx.save();
    ctx.translate(state.projectile.x - CAM.x, state.projectile.y - CAM.y);
    renderProjectile(ctx, state.projectile);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(-CAM.x, -CAM.y);
  drawParticles(ctx);
  ctx.restore();

  drawBulletPreviewFlash(ctx, w, h);

  state.raf = requestAnimationFrame(bulletPreviewFrame);
}

function showBulletPreview(vis) {
  const state = ensureBulletPreviewUI();
  const pauseMenu = document.getElementById('pause-menu');
  state.returnToPause = !!(pauseMenu && G.phase === 'paused' && !pauseMenu.classList.contains('h'));
  if (state.returnToPause) pauseMenu.classList.add('h');

  if (vis && BULLET_PREVIEW_ORDER.includes(vis)) state.selectedVis = vis;
  state.projectile = null;
  state.respawnTimer = 0;
  state.time = 0;
  state.lastT = 0;
  particles.length = 0;
  if (typeof G !== 'undefined') G._screenFlash = null;
  updateBulletPreviewInfo();
  resizeBulletPreviewCanvas();
  overlayOpen(state.overlay);
  if (typeof initAudio === 'function') initAudio();
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = requestAnimationFrame(bulletPreviewFrame);
}

function hideBulletPreview() {
  const state = ensureBulletPreviewUI();
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = 0;
  state.projectile = null;
  particles.length = 0;
  if (typeof G !== 'undefined') G._screenFlash = null;
  window.BULLET_TIME_OVERRIDE = undefined;
  window.BULLET_DT_OVERRIDE = undefined;
  overlayClose(state.overlay);
  if (state.returnToPause) {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.classList.remove('h');
  }
}

function overlayOpen(el) {
  el.classList.remove('h');
  el.classList.add('open');
  el.style.display = 'block';
}

function overlayClose(el) {
  el.classList.remove('open');
  el.classList.add('h');
  el.style.display = 'none';
}

function isBulletPreviewOpen() {
  return !!(_bulletPreview && _bulletPreview.overlay.classList.contains('open'));
}

window.showBulletPreview = showBulletPreview;
window.hideBulletPreview = hideBulletPreview;
window.isBulletPreviewOpen = isBulletPreviewOpen;
