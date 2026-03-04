// ============ ENHANCED SPRITE SYSTEM ============

function createSprite(data, pal, scale) {
  scale = scale || 1;
  const rows = data.trim().split('\n'), h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
  const x = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let i = 0; i < (rows[y] || '').length; i++) { const ch = rows[y][i]; if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i * scale, y * scale, scale, scale); } }
  return c;
}

function createEnhancedSprite(data, palette, scale, options) {
  options = options || {};
  const rows = data.trim().split('\n');
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const pad = (options.glowRadius || 0) + (options.outline ? scale + 1 : 0) + 2;

  const base = document.createElement('canvas');
  base.width = w * scale + pad * 2;
  base.height = h * scale + pad * 2;
  const bCtx = base.getContext('2d');

  // Outline: draw sprite shifted in 8 directions
  if (options.outline) {
    bCtx.globalAlpha = 0.9;
    const offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    for (const [ox, oy] of offsets) {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < (rows[y] || '').length; x++) {
          if (palette[rows[y][x]]) {
            bCtx.fillStyle = options.outline;
            bCtx.fillRect(pad + x * scale + ox, pad + y * scale + oy, scale, scale);
          }
        }
    }
    bCtx.globalAlpha = 1;
  }

  // Main sprite pixels
  for (let y = 0; y < h; y++)
    for (let x = 0; x < (rows[y] || '').length; x++) {
      const ch = rows[y][x];
      if (palette[ch]) {
        bCtx.fillStyle = palette[ch];
        bCtx.fillRect(pad + x * scale, pad + y * scale, scale, scale);
      }
    }

  // Glow
  if (options.glow) {
    const final = document.createElement('canvas');
    final.width = base.width; final.height = base.height;
    const fCtx = final.getContext('2d');
    fCtx.shadowColor = options.glow;
    fCtx.shadowBlur = options.glowRadius || 8;
    fCtx.globalAlpha = 0.5;
    fCtx.drawImage(base, 0, 0);
    fCtx.shadowBlur = 0;
    fCtx.globalAlpha = 1;
    fCtx.drawImage(base, 0, 0);
    return final;
  }
  return base;
}

// ============ PLAYER -- JEFF (Fallback pixel sprite) ============
const PLAYER_FRAMES = [
  createEnhancedSprite(`
......hhhhh.......
....hhhhhhhhh.....
....hhhhhhhhhh....
....hhhhhhhhh.....
...ssssssssss.....
...ssssssssss.....
...ssssssssss.....
....ssssssss......
.....ssmss........
......ssss........
....WWWWWWWW......
...WWWWWWWWWW.....
..WWWWWWWWWWWW....
..WWWWWWWWWWWW....
..WWWWWWWWWWWW....
...WWWWWWWWWW.....
....dddddddd.....
...dd....ddd......
...dd.....dd......
`, {
    h: '#1a1a2a', s: '#d4a574', m: '#c4956a', g: '#00ddff',
    W: '#ffffff', w: '#cccccc', d: '#1a1a30', B: '#222230'
  }, 1.0, { outline: '#000000' }),
  createEnhancedSprite(`
......hhhhh.......
....hhhhhhhhh.....
....hhhhhhhhhh....
....hhhhhhhhh.....
...ssssssssss.....
...ssssssssss.....
...ssssssssss.....
....ssssssss......
.....ssmss........
......ssss........
....WWWWWWWW......
...WWWWWWWWWW.....
..WWWWWWWWWWWW....
..WWWWWWWWWWWW....
..WWWWWWWWWWWW....
...WWWWWWWWWW.....
....dddddddd.....
...ddd...ddd......
...dd......dd.....
`, {
    h: '#1a1a2a', s: '#d4a574', m: '#c4956a', g: '#00ddff',
    W: '#ffffff', w: '#cccccc', d: '#1a1a30', B: '#222230'
  }, 1.0, { outline: '#000000' })
];

const PLAYER_SPR = PLAYER_FRAMES[0];

// ============ HD-2D PROCEDURAL ENEMY SPRITES ============
// Premium Hi-Bit style: procedural textures, chiaroscuro, multi-pass bloom

// --- Core color utilities ---
function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (Math.min(255, Math.max(0, r | 0)) << 16) + (Math.min(255, Math.max(0, g | 0)) << 8) + Math.min(255, Math.max(0, b | 0))).toString(16).slice(1);
}
function lighten(hex, pct) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * pct, g + (255 - g) * pct, b + (255 - b) * pct);
}
function darken(hex, pct) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - pct), g * (1 - pct), b * (1 - pct));
}

function metalGrad(ctx, x, y, w, h, base) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, lighten(base, 0.25));
  g.addColorStop(0.35, base);
  g.addColorStop(1, darken(base, 0.35));
  return g;
}

function radialGrad(ctx, cx, cy, r, inner, outer) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  return g;
}

function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i - Math.PI / 2;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function applyGlow(canvas, color, radius) {
  const pad = radius * 2;
  const c = document.createElement('canvas');
  c.width = canvas.width + pad * 2;
  c.height = canvas.height + pad * 2;
  const x = c.getContext('2d');
  x.shadowColor = color;
  x.shadowBlur = radius;
  x.globalAlpha = 0.5;
  x.drawImage(canvas, pad, pad);
  x.shadowBlur = 0;
  x.globalAlpha = 1;
  x.drawImage(canvas, pad, pad);
  return c;
}


// ============ ARTICULATED ENEMY SPRITE SYSTEM ============
// Multi-state animations: walk, attack, hit, death
// Each enemy = articulated body parts, positions change per frame & state
// Pre-rendered at init → runtime = 1x drawImage per enemy

const _W = 80, _H = 80;

function makeFrame(fn) {
  const c = document.createElement('canvas');
  c.width = _W; c.height = _H;
  const x = c.getContext('2d');
  fn(x);
  return c;
}

function applyEnemyGlow(canvas, color, r) {
  const p = r * 2 + 2;
  const c = document.createElement('canvas');
  c.width = canvas.width + p * 2;
  c.height = canvas.height + p * 2;
  const x = c.getContext('2d');
  x.shadowColor = color;
  x.shadowBlur = r;
  x.globalAlpha = 0.35;
  x.drawImage(canvas, p, p);
  x.shadowBlur = r * 0.5;
  x.globalAlpha = 0.5;
  x.drawImage(canvas, p, p);
  x.shadowBlur = 0;
  x.globalAlpha = 1;
  x.drawImage(canvas, p, p);
  return c;
}

// --- Shared drawing primitives ---
function _body(ctx, cx, cy, w, h, col, radius) {
  ctx.fillStyle = metalGrad(ctx, cx - w / 2, cy - h / 2, w, h, col);
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, radius || 4);
  ctx.fill();
  ctx.strokeStyle = darken(col, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function _oval(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = metalGrad(ctx, cx - rx, cy - ry, rx * 2, ry * 2, col);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darken(col, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function _circ(ctx, cx, cy, r, col) {
  ctx.fillStyle = radialGrad(ctx, cx - r * 0.3, cy - r * 0.3, r, lighten(col, 0.2), darken(col, 0.3));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darken(col, 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function _limb(ctx, x1, y1, x2, y2, thick, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = thick;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function _glow(ctx, cx, cy, r, col, blur) {
  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = blur || 6;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function _visor(ctx, cx, cy, w, h, col, blur) {
  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = blur || 5;
  ctx.fillStyle = col;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

function _spark(ctx, cx, cy, size, col) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = col;
  ctx.shadowBlur = 4;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * size, cy + Math.sin(a) * size);
    ctx.stroke();
  }
  ctx.restore();
}

function _smoke(ctx, cx, cy, r, alpha) {
  ctx.fillStyle = `rgba(100,100,100,${alpha || 0.3})`;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function _debris(ctx, pieces, progress) {
  for (const p of pieces) {
    ctx.fillStyle = p.col;
    ctx.globalAlpha = 1 - progress;
    ctx.fillRect(
      p.x + p.vx * progress * 30,
      p.y + p.vy * progress * 30 + progress * progress * 40,
      p.s, p.s
    );
  }
  ctx.globalAlpha = 1;
}

// ======================================================
// TYPE 0 — FUD BOT (Drone) sz:10
// ======================================================
function generateFudBotFrames() {
  const cx = 40, cy = 38;

  function draw(ctx, p) {
    // Wings
    for (const s of [-1, 1]) {
      ctx.fillStyle = metalGrad(ctx, cx + s * 17, cy - 4 + p.wy, 12, 5, '#5a7080');
      ctx.beginPath();
      ctx.roundRect(cx + s * 17 - 6, cy - 4 + p.wy, 12, 5, 2);
      ctx.fill();
      ctx.strokeStyle = '#3a4a55'; ctx.lineWidth = 1; ctx.stroke();
    }
    // Body ellipse
    _oval(ctx, cx, cy, 16, 10, '#4a6578');
    // Panel lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy - 4); ctx.lineTo(cx + 10, cy - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 8); ctx.stroke();
    // Antenna
    _limb(ctx, cx, cy - 10, cx, cy - 20 + p.ay, 1.5, '#6a7a8a');
    _glow(ctx, cx, cy - 20 + p.ay, 1.5, '#ff3333', 3);
    // Scanner
    _visor(ctx, cx, cy + 3, 10, 2.5, `rgba(255,60,60,${0.5 + p.sa * 0.5})`, 4);
  }

  const walk = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2;
    walk.push(makeFrame(ctx => draw(ctx, {
      wy: Math.sin(t) * 3, ay: Math.sin(t * 0.5) * 2, sa: 0.5 + Math.sin(t) * 0.3
    })));
  }

  const attack = [];
  for (let i = 0; i < 4; i++) {
    const p = i / 3;
    attack.push(makeFrame(ctx => {
      draw(ctx, { wy: -4, ay: -3, sa: 1 });
      ctx.strokeStyle = `rgba(255,60,60,${1 - p})`;
      ctx.lineWidth = 2 - p;
      ctx.beginPath(); ctx.arc(cx, cy, 8 + p * 28, 0, Math.PI * 2); ctx.stroke();
      if (i > 0) {
        ctx.strokeStyle = `rgba(255,100,100,${0.8 - p})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, 4 + p * 18, 0, Math.PI * 2); ctx.stroke();
      }
    }));
  }

  const hit = [
    makeFrame(ctx => { ctx.translate(3, 2); draw(ctx, { wy: 4, ay: 2, sa: 0.1 }); }),
    makeFrame(ctx => { ctx.translate(1, 1); draw(ctx, { wy: 2, ay: 1, sa: 0.3 }); })
  ];

  const death = [];
  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    death.push(makeFrame(ctx => {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(p * Math.PI * 3); ctx.scale(1 - p * 0.6, 1 - p * 0.6);
      ctx.translate(-cx, -cy); ctx.globalAlpha = 1 - p * 0.4;
      draw(ctx, { wy: p * 10, ay: p * 8, sa: 0.1 });
      ctx.restore();
      for (let j = 0; j < 3; j++) {
        const a = j * 2.09 + p * 2;
        _smoke(ctx, cx + Math.cos(a) * p * 22, cy + Math.sin(a) * p * 22, 2 + p * 5, 0.4 * (1 - p));
      }
    }));
  }

  return {
    walk: { frames: walk, fps: 8, loop: true },
    attack: { frames: attack, fps: 10, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 8, loop: false }
  };
}

// ======================================================
// TYPE 1 — JEET (Berserker Mech) sz:14
// ======================================================
function generateJeetFrames() {
  const cx = 40, cy = 40;

  function draw(ctx, p) {
    // Legs
    _limb(ctx, cx - 7, cy + 8, cx - 7 + p.ll.x, cy + 8 + p.ll.y, 6, '#551010');
    _limb(ctx, cx + 7, cy + 8, cx + 7 + p.lr.x, cy + 8 + p.lr.y, 6, '#551010');
    // Feet
    _circ(ctx, cx - 7 + p.ll.x, cy + 8 + p.ll.y, 3.5, '#440808');
    _circ(ctx, cx + 7 + p.lr.x, cy + 8 + p.lr.y, 3.5, '#440808');
    // Torso
    _body(ctx, cx + (p.lean || 0), cy - 4, 22, 18, '#661414');
    // Shoulder pauldrons
    for (const s of [-1, 1]) {
      _body(ctx, cx + (p.lean || 0) + s * 14, cy - 8, 8, 7, '#771818', 2);
    }
    // Arms
    _limb(ctx, cx + (p.lean || 0) - 14, cy - 6, cx - 14 + p.al.x, cy - 6 + p.al.y, 4, '#882020');
    _limb(ctx, cx + (p.lean || 0) + 14, cy - 6, cx + 14 + p.ar.x, cy - 6 + p.ar.y, 4, '#882020');
    // Fists
    _circ(ctx, cx - 14 + p.al.x, cy - 6 + p.al.y, 3, '#aa2828');
    _circ(ctx, cx + 14 + p.ar.x, cy - 6 + p.ar.y, 3, '#aa2828');
    // Head
    _body(ctx, cx + (p.lean || 0), cy - 17, 10, 9, '#551010', 3);
    // Visor
    _visor(ctx, cx + (p.lean || 0), cy - 15.5, 8, 2, '#ff2222', 5);
    // Piston details on legs
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + 4); ctx.lineTo(cx - 9 + p.ll.x * 0.5, cy + 4 + p.ll.y * 0.6);
    ctx.moveTo(cx + 9, cy + 4); ctx.lineTo(cx + 9 + p.lr.x * 0.5, cy + 4 + p.lr.y * 0.6);
    ctx.stroke();
  }

  const walk = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2;
    walk.push(makeFrame(ctx => draw(ctx, {
      ll: { x: Math.sin(t) * 4, y: 16 + Math.abs(Math.cos(t)) * 2 },
      lr: { x: Math.sin(t + Math.PI) * 4, y: 16 + Math.abs(Math.cos(t + Math.PI)) * 2 },
      al: { x: Math.sin(t + Math.PI) * 3, y: 14 + Math.sin(t) * 2 },
      ar: { x: Math.sin(t) * 3, y: 14 - Math.sin(t) * 2 },
      lean: 0
    })));
  }

  const attack = [];
  const attackPoses = [
    { ll: {x:0,y:16}, lr: {x:0,y:16}, al: {x:-4,y:8}, ar: {x:4,y:8}, lean: -4 }, // wind up
    { ll: {x:-2,y:16}, lr: {x:2,y:14}, al: {x:-6,y:4}, ar: {x:6,y:4}, lean: -6 }, // pull back
    { ll: {x:4,y:16}, lr: {x:-2,y:16}, al: {x:12,y:2}, ar: {x:14,y:-2}, lean: 8 }, // LUNGE
    { ll: {x:3,y:16}, lr: {x:0,y:16}, al: {x:10,y:6}, ar: {x:12,y:4}, lean: 6 }, // impact
    { ll: {x:0,y:16}, lr: {x:0,y:16}, al: {x:2,y:12}, ar: {x:-2,y:12}, lean: 0 }, // recover
  ];
  for (const pose of attackPoses) {
    attack.push(makeFrame(ctx => {
      draw(ctx, pose);
      if (pose.lean >= 6) _spark(ctx, cx + 22, cy - 4, 6, '#ffaa00');
    }));
  }

  const hit = [];
  for (let i = 0; i < 3; i++) {
    const lean = [-5, -3, 0][i];
    hit.push(makeFrame(ctx => draw(ctx, {
      ll: {x:0,y:16}, lr: {x:0,y:16},
      al: {x:-6, y:2 + i * 3}, ar: {x:6, y:2 + i * 3},
      lean: lean
    })));
  }

  const deathDebris = [{x:35,y:30,vx:-2,vy:-3,s:4,col:'#661414'},{x:45,y:30,vx:2,vy:-2,s:3,col:'#882020'},
    {x:38,y:25,vx:-1,vy:-4,s:5,col:'#551010'},{x:42,y:35,vx:1.5,vy:-1,s:3,col:'#771818'}];
  const death = [];
  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    death.push(makeFrame(ctx => {
      ctx.globalAlpha = 1 - p * 0.5;
      if (i < 3) {
        const crouch = i * 4;
        draw(ctx, {
          ll: {x:-2, y:16 - crouch}, lr: {x:2, y:16 - crouch},
          al: {x:-8 + i * 2, y:10 + crouch}, ar: {x:8 - i * 2, y:10 + crouch},
          lean: i * 3
        });
      }
      ctx.globalAlpha = 1;
      if (i >= 2) _debris(ctx, deathDebris, (i - 2) / 2);
      if (i >= 1) _smoke(ctx, cx, cy, 4 + p * 8, 0.3 * (1 - p * 0.5));
    }));
  }

  return {
    walk: { frames: walk, fps: 8, loop: true },
    attack: { frames: attack, fps: 10, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 8, loop: false }
  };
}

// ======================================================
// TYPE 2 — WHALE (Gold Golem) sz:12
// ======================================================
function generateWhaleFrames() {
  const cx = 40, cy = 40;

  function draw(ctx, p) {
    // Legs (short, thick)
    _limb(ctx, cx - 8, cy + 12, cx - 8 + p.ll.x, cy + 12 + p.ll.y, 7, '#7a6a10');
    _limb(ctx, cx + 8, cy + 12, cx + 8 + p.lr.x, cy + 12 + p.lr.y, 7, '#7a6a10');
    // Arms
    _limb(ctx, cx - 16, cy, cx - 16 + p.al.x, cy + p.al.y, 6, '#8a7a18');
    _limb(ctx, cx + 16, cy, cx + 16 + p.ar.x, cy + p.ar.y, 6, '#8a7a18');
    // Fists
    _circ(ctx, cx - 16 + p.al.x, cy + p.al.y, 4, '#9a8a20');
    _circ(ctx, cx + 16 + p.ar.x, cy + p.ar.y, 4, '#9a8a20');
    // Body (large rounded)
    _body(ctx, cx + (p.sway || 0), cy, 28, 24, '#9a8520', 6);
    // BTC Core
    _glow(ctx, cx + (p.sway || 0), cy + 2, 3 + (p.pulse || 0), '#ffd700', 6);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('₿', cx + (p.sway || 0), cy + 5);
    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 7, cy - 6, 4, 4);
    ctx.fillRect(cx + 3, cy - 6, 4, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 6, cy - 5, 2, 2);
    ctx.fillRect(cx + 4, cy - 5, 2, 2);
    // Crown
    const crY = cy - 16 + (p.crY || 0);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(cx - 8, crY + 4); ctx.lineTo(cx - 8, crY); ctx.lineTo(cx - 4, crY + 3);
    ctx.lineTo(cx, crY - 2); ctx.lineTo(cx + 4, crY + 3);
    ctx.lineTo(cx + 8, crY); ctx.lineTo(cx + 8, crY + 4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#aa8800'; ctx.lineWidth = 0.8; ctx.stroke();
    // Crown gems
    _glow(ctx, cx, crY, 1.5, '#ff0000', 2);
  }

  const walk = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 4 * Math.PI * 2;
    walk.push(makeFrame(ctx => draw(ctx, {
      ll: {x: 0, y: 12}, lr: {x: 0, y: 12},
      al: {x: Math.sin(t) * 2, y: 12 + Math.sin(t) * 2},
      ar: {x: -Math.sin(t) * 2, y: 12 - Math.sin(t) * 2},
      sway: Math.sin(t) * 2, crY: Math.abs(Math.sin(t)) * -2,
      pulse: Math.sin(t * 2) * 1
    })));
  }

  const attack = [];
  const atkPoses = [
    { al:{x:-4,y:4}, ar:{x:4,y:4}, sway:0, crY:0 },         // ready
    { al:{x:-6,y:-10}, ar:{x:6,y:-10}, sway:0, crY:-3 },     // arms UP
    { al:{x:-8,y:-16}, ar:{x:8,y:-16}, sway:0, crY:-4 },     // peak
    { al:{x:-2,y:16}, ar:{x:2,y:16}, sway:0, crY:2 },        // SLAM
    { al:{x:0,y:12}, ar:{x:0,y:12}, sway:0, crY:0 },         // recover
  ];
  for (let i = 0; i < 5; i++) {
    const ap = atkPoses[i];
    attack.push(makeFrame(ctx => {
      draw(ctx, { ll:{x:0,y:12}, lr:{x:0,y:12}, al:ap.al, ar:ap.ar, sway:ap.sway, crY:ap.crY, pulse:i===3?3:0 });
      if (i === 3) { // shockwave on slam
        ctx.strokeStyle = 'rgba(255,215,0,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, cy + 24, 25, 8, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy + 24, 32, 11, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }));
  }

  const hit = [
    makeFrame(ctx => { ctx.translate(-2, 0); draw(ctx, { ll:{x:0,y:12}, lr:{x:0,y:12}, al:{x:-4,y:8}, ar:{x:4,y:8}, sway:-3, crY:1 }); }),
    makeFrame(ctx => draw(ctx, { ll:{x:0,y:12}, lr:{x:0,y:12}, al:{x:-2,y:10}, ar:{x:2,y:10}, sway:-1, crY:0 }))
  ];

  const goldChunks = [{x:30,y:35,vx:-3,vy:-4,s:5,col:'#ffd700'},{x:50,y:35,vx:3,vy:-3,s:4,col:'#daa520'},
    {x:40,y:28,vx:0,vy:-5,s:6,col:'#ffd700'},{x:35,y:40,vx:-2,vy:-2,s:3,col:'#aa8800'},
    {x:45,y:30,vx:2,vy:-4,s:4,col:'#ffd700'}];
  const death = [];
  for (let i = 0; i < 6; i++) {
    const p = i / 5;
    death.push(makeFrame(ctx => {
      if (i < 4) {
        ctx.globalAlpha = 1 - p * 0.3;
        draw(ctx, { ll:{x:0,y:12}, lr:{x:0,y:12}, al:{x:-4,y:10}, ar:{x:4,y:10}, sway:0, crY:p*3, pulse:0 });
        // Cracks
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        for (let c = 0; c < Math.min(i + 1, 4); c++) {
          const ax = cx + [-5, 6, -2, 3][c], ay = cy + [-8, -3, 4, 8][c];
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + [4,-3,5,-4][c], ay + [6,5,3,4][c]); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      if (i >= 2) {
        _debris(ctx, goldChunks, (i - 2) / 3);
        if (i === 3) _glow(ctx, cx, cy, 12, '#ffd700', 10);
      }
    }));
  }

  return {
    walk: { frames: walk, fps: 6, loop: true },
    attack: { frames: attack, fps: 8, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 7, loop: false }
  };
}

// ======================================================
// TYPE 3 — MEV BOT (Assassin) sz:16
// ======================================================
function generateMevBotFrames() {
  const cx = 40, cy = 38;

  function draw(ctx, p) {
    // Legs (thin, long)
    _limb(ctx, cx - 5, cy + 10, cx - 5 + p.ll.x, cy + 10 + p.ll.y, 3, '#3a1177');
    _limb(ctx, cx + 5, cy + 10, cx + 5 + p.lr.x, cy + 10 + p.lr.y, 3, '#3a1177');
    // Torso (hourglass - two trapezoids)
    ctx.fillStyle = metalGrad(ctx, cx - 10, cy - 10, 20, 10, '#4a1a88');
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy - 10);
    ctx.lineTo(cx + 5, cy); ctx.lineTo(cx - 5, cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = metalGrad(ctx, cx - 5, cy, 10, 10, '#3a1177');
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
    ctx.lineTo(cx + 10, cy + 10); ctx.lineTo(cx - 10, cy + 10);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#220066'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy - 10);
    ctx.lineTo(cx + 5, cy); ctx.lineTo(cx + 10, cy + 10); ctx.lineTo(cx - 10, cy + 10);
    ctx.lineTo(cx - 5, cy); ctx.closePath(); ctx.stroke();
    // Chrome waist highlight
    ctx.save(); ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy); ctx.stroke();
    ctx.restore();
    // Blade arms
    for (const s of [-1, 1]) {
      const bx = cx + s * (10 + p.blade), by = cy - 4;
      _limb(ctx, cx + s * 10, cy - 6, bx, by + p.bladeY, 3, '#6622cc');
      // Blade tip
      ctx.save();
      ctx.strokeStyle = '#cc00ff'; ctx.lineWidth = 2; ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(bx, by + p.bladeY);
      ctx.lineTo(bx + s * 8, by + p.bladeY - 4);
      ctx.stroke();
      ctx.restore();
    }
    // Head (inverted triangle)
    ctx.fillStyle = metalGrad(ctx, cx - 7, cy - 22, 14, 12, '#4a1a88');
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 22); ctx.lineTo(cx + 7, cy - 22);
    ctx.lineTo(cx, cy - 12); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = '#220066'; ctx.lineWidth = 1; ctx.stroke();
    // Visor
    _visor(ctx, cx, cy - 17, 6, 2, '#cc00ff', 5);
    // Energy line
    if (p.energy) {
      ctx.save(); ctx.strokeStyle = '#cc00ff'; ctx.lineWidth = 1; ctx.globalAlpha = p.energy;
      ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 8); ctx.stroke();
      ctx.restore();
    }
  }

  const walk = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2;
    walk.push(makeFrame(ctx => draw(ctx, {
      ll: {x: Math.sin(t) * 2, y: 14}, lr: {x: Math.sin(t + Math.PI) * 2, y: 14},
      blade: 4 + Math.sin(t) * 2, bladeY: Math.sin(t * 2) * 3,
      energy: 0.2 + Math.sin(t) * 0.15
    })));
  }

  const attack = [];
  for (let i = 0; i < 4; i++) {
    attack.push(makeFrame(ctx => {
      if (i === 0) { // fragment/dissolve
        ctx.globalAlpha = 0.5;
        draw(ctx, { ll:{x:0,y:14}, lr:{x:0,y:14}, blade:4, bladeY:0, energy:0.8 });
        ctx.globalAlpha = 1;
        // Dissolve blocks
        for (let b = 0; b < 8; b++) {
          ctx.fillStyle = '#6622cc';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(cx - 12 + Math.random() * 24, cy - 20 + Math.random() * 40, 3, 3);
        }
        ctx.globalAlpha = 1;
      } else if (i === 1) { // disappeared - flash
        _glow(ctx, cx, cy, 8, '#cc00ff', 10);
      } else if (i === 2) { // reappear + slash
        draw(ctx, { ll:{x:0,y:14}, lr:{x:0,y:14}, blade:12, bladeY:-6, energy:1 });
        // Slash trails
        ctx.save(); ctx.strokeStyle = '#cc00ff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(cx - 20, cy - 10); ctx.lineTo(cx + 20, cy + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 20, cy - 10); ctx.lineTo(cx - 20, cy + 4); ctx.stroke();
        ctx.restore();
      } else { // recover
        draw(ctx, { ll:{x:0,y:14}, lr:{x:0,y:14}, blade:6, bladeY:0, energy:0.4 });
      }
    }));
  }

  const hit = [
    makeFrame(ctx => {
      ctx.translate(-3, 0);
      draw(ctx, { ll:{x:0,y:14}, lr:{x:0,y:14}, blade:2, bladeY:4, energy:0.1 });
      // Static distortion
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = '#cc00ff'; ctx.globalAlpha = 0.3;
        ctx.fillRect(cx - 8 + Math.random() * 16, cy - 16 + Math.random() * 32, 4, 2);
      }
    }),
    makeFrame(ctx => draw(ctx, { ll:{x:0,y:14}, lr:{x:0,y:14}, blade:4, bladeY:2, energy:0.3 }))
  ];

  const death = [];
  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    death.push(makeFrame(ctx => {
      // Pixelation effect
      ctx.globalAlpha = 1 - p * 0.6;
      if (i < 3) draw(ctx, { ll:{x:0,y:14}, lr:{x:0,y:14}, blade:4-i*2, bladeY:i*2, energy:0.5-p*0.5 });
      // Flying fragments
      for (let b = 0; b < 6 + i * 2; b++) {
        ctx.fillStyle = b % 2 === 0 ? '#6622cc' : '#cc00ff';
        ctx.globalAlpha = (1 - p) * 0.7;
        const fx = cx + (Math.random() - 0.5) * (20 + p * 40);
        const fy = cy + (Math.random() - 0.5) * (20 + p * 40);
        ctx.fillRect(fx, fy, 2 + Math.random() * 3, 2 + Math.random() * 3);
      }
      ctx.globalAlpha = 1;
      if (i === 2) _glow(ctx, cx, cy, 10, '#cc00ff', 8);
    }));
  }

  return {
    walk: { frames: walk, fps: 8, loop: true },
    attack: { frames: attack, fps: 8, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 8, loop: false }
  };
}

// ======================================================
// TYPE 4 — SNIPER (Hooded Marksman) sz:10
// ======================================================
function generateSniperFrames() {
  const cx = 40, cy = 40;

  function draw(ctx, p) {
    // Legs
    _limb(ctx, cx - 4, cy + 10, cx - 4 + p.ll.x, cy + 10 + p.ll.y, 3, '#2a3520');
    _limb(ctx, cx + 4, cy + 10, cx + 4 + p.lr.x, cy + 10 + p.lr.y, 3, '#2a3520');
    // Body (hidden under cape)
    _body(ctx, cx, cy, 14, 16, '#3a4a35', 3);
    // Cape (large triangle draping down)
    ctx.fillStyle = metalGrad(ctx, cx - 12, cy - 14, 24, 28, '#3a4a35');
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20); // top of hood
    ctx.lineTo(cx - 14, cy + 8 + (p.cape || 0));
    ctx.lineTo(cx + 10, cy + 8 - (p.cape || 0) * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a2a15'; ctx.lineWidth = 1; ctx.stroke();
    // Cape frayed edges
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = '#4a5a45'; ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 12 + i * 4, cy + 6 + (p.cape || 0) - i);
      ctx.lineTo(cx - 12 + i * 4 + 2, cy + 10 + (p.cape || 0));
      ctx.stroke();
    }
    // Hood shadow
    ctx.fillStyle = radialGrad(ctx, cx, cy - 12, 8, '#0a1008', '#2a3525');
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    // Eyes (burning red in shadow)
    _glow(ctx, cx - 2.5, cy - 13, 1.2, '#ff0000', 3);
    _glow(ctx, cx + 2.5, cy - 13, 1.2, '#ff0000', 3);
    // Rifle
    const rx = p.rifle || 0;
    const ry = p.rifleY || 0;
    _limb(ctx, cx + 4, cy - 2 + ry, cx + 4 + rx, cy - 6 + ry, 3, '#4a5060');
    _limb(ctx, cx + 4 + rx, cy - 6 + ry, cx + 4 + rx + 14, cy - 6 + ry - 1, 2.5, '#3a4050');
    // Scope
    _circ(ctx, cx + 10 + rx, cy - 8 + ry, 2, '#2a3a4a');
    // Muzzle
    if (p.muzzle) {
      _glow(ctx, cx + 18 + rx, cy - 7 + ry, 3, '#ff4400', 8);
      _glow(ctx, cx + 18 + rx, cy - 7 + ry, 1.5, '#ffdd00', 4);
    }
    if (p.scopeGlow) {
      _glow(ctx, cx + 10 + rx, cy - 8 + ry, 2, '#ff0000', 5);
    }
  }

  const walk = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2;
    walk.push(makeFrame(ctx => draw(ctx, {
      ll: {x: Math.sin(t) * 2, y: 12}, lr: {x: Math.sin(t + Math.PI) * 2, y: 12},
      cape: Math.sin(t) * 2, rifle: -4, rifleY: 4 + Math.sin(t) * 1
    })));
  }

  const attack = [];
  const atkPoses = [
    { rifle: 4, rifleY: 0, cape: 0 },        // aim
    { rifle: 10, rifleY: -2, cape: -1, scopeGlow: true },  // scope glow
    { rifle: 10, rifleY: -2, cape: -1, scopeGlow: true },  // hold
    { rifle: 10, rifleY: -2, muzzle: true, cape: 2 },      // FIRE!
    { rifle: 6, rifleY: 2, cape: 3 },                      // recoil
  ];
  for (const ap of atkPoses) {
    attack.push(makeFrame(ctx => draw(ctx, {
      ll: {x:0, y:12}, lr: {x:0, y:12}, ...ap
    })));
  }

  const hit = [
    makeFrame(ctx => { ctx.translate(-3, 0); draw(ctx, { ll:{x:0,y:12}, lr:{x:0,y:12}, cape:4, rifle:-6, rifleY:4 }); }),
    makeFrame(ctx => draw(ctx, { ll:{x:0,y:12}, lr:{x:0,y:12}, cape:2, rifle:-2, rifleY:2 }))
  ];

  const death = [];
  for (let i = 0; i < 4; i++) {
    const p = i / 3;
    death.push(makeFrame(ctx => {
      ctx.globalAlpha = 1 - p * 0.4;
      // Cape collapses
      ctx.fillStyle = metalGrad(ctx, cx - 14, cy - 14, 28, 28, '#3a4a35');
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 14 + p * 10);
      ctx.lineTo(cx + 10, cy - 14 + p * 10);
      ctx.lineTo(cx + 14, cy + 10 + p * 6);
      ctx.lineTo(cx - 14, cy + 10 + p * 6);
      ctx.closePath(); ctx.fill();
      // Rifle falls
      ctx.save(); ctx.translate(cx + 12, cy + p * 15);
      ctx.rotate(p * 0.8);
      _limb(ctx, 0, 0, 14, -1, 2.5, '#3a4050');
      ctx.restore();
      // Fade eyes
      if (p < 0.7) {
        _glow(ctx, cx - 2.5, cy - 13 + p * 8, 1, `rgba(255,0,0,${1-p*1.3})`, 2);
        _glow(ctx, cx + 2.5, cy - 13 + p * 8, 1, `rgba(255,0,0,${1-p*1.3})`, 2);
      }
      ctx.globalAlpha = 1;
    }));
  }

  return {
    walk: { frames: walk, fps: 8, loop: true },
    attack: { frames: attack, fps: 8, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 8, loop: false }
  };
}

// ======================================================
// TYPE 5 — BOMBER (Explosive Sphere) sz:14
// ======================================================
function generateBomberFrames() {
  const cx = 40, cy = 40;

  function draw(ctx, p) {
    const r = 16 + (p.inflate || 0);
    // Sphere body
    ctx.fillStyle = radialGrad(ctx, cx - r * 0.25, cy - r * 0.25, r, lighten('#6a3515', 0.15), darken('#6a3515', 0.3));
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a1a08'; ctx.lineWidth = 1.5; ctx.stroke();
    // Equator band
    ctx.strokeStyle = '#4a2510'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy + 1, r - 1, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    // Spikes (6)
    const spikeRot = p.rot || 0;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + spikeRot;
      const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
      ctx.fillStyle = '#5a3010';
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 8, sy + Math.sin(a) * 8);
      ctx.lineTo(sx + Math.cos(a + 0.4) * 3, sy + Math.sin(a + 0.4) * 3);
      ctx.lineTo(sx + Math.cos(a - 0.4) * 3, sy + Math.sin(a - 0.4) * 3);
      ctx.closePath(); ctx.fill();
    }
    // Core glow
    _glow(ctx, cx, cy, 4 + (p.coreGlow || 0), '#ff8800', 5);
    _glow(ctx, cx, cy, 2, '#ffdd00', 3);
    // Fuse
    if (!p.noFuse) {
      const fuseLen = p.fuseLen || 12;
      ctx.strokeStyle = '#5a4530'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx + 4, cy - r - fuseLen * 0.5, cx + 2, cy - r - fuseLen);
      ctx.stroke();
      // Fuse spark
      if (p.fuseSpark) _spark(ctx, cx + 2, cy - r - fuseLen, 4, '#ffcc00');
    }
  }

  const walk = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 4 * Math.PI * 2;
    walk.push(makeFrame(ctx => {
      ctx.translate(0, Math.abs(Math.sin(t)) * -3);
      draw(ctx, { rot: i * 0.15, fuseSpark: i % 2 === 0, fuseLen: 12, coreGlow: Math.sin(t) });
    }));
  }

  const attack = [];
  for (let i = 0; i < 5; i++) {
    const inflate = [0, 3, 6, 4, 0][i];
    const core = [0, 1, 3, 6, 0][i];
    attack.push(makeFrame(ctx => {
      draw(ctx, { inflate: inflate, coreGlow: core, fuseLen: 12 - i * 2, fuseSpark: true, rot: 0 });
      if (i >= 3) { // Flash
        ctx.fillStyle = `rgba(255,255,255,${i === 3 ? 0.6 : 0.2})`;
        ctx.fillRect(0, 0, _W, _H);
      }
    }));
  }

  const hit = [
    makeFrame(ctx => { ctx.translate(0, 2); draw(ctx, { inflate: -3, rot: 0, coreGlow: 0, fuseLen: 12, fuseSpark: false }); }),
    makeFrame(ctx => draw(ctx, { inflate: 2, rot: 0, coreGlow: 1, fuseLen: 12, fuseSpark: true }))
  ];

  const death = [];
  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    death.push(makeFrame(ctx => {
      if (i === 0) draw(ctx, { inflate: 4, rot: 0, coreGlow: 5, fuseLen: 4, fuseSpark: true });
      else if (i === 1) {
        draw(ctx, { inflate: 8, rot: 0, coreGlow: 8, noFuse: true });
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, 0, _W, _H);
      } else {
        // Explosion ring
        const ep = (i - 2) / 2;
        ctx.strokeStyle = `rgba(255,100,0,${1 - ep})`; ctx.lineWidth = 4 - ep * 3;
        ctx.beginPath(); ctx.arc(cx, cy, 10 + ep * 30, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,200,0,${0.7 - ep * 0.7})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 5 + ep * 20, 0, Math.PI * 2); ctx.stroke();
        // Debris
        for (let d = 0; d < 6; d++) {
          const a = d * Math.PI / 3;
          const dr = 8 + ep * 25;
          ctx.fillStyle = d % 2 === 0 ? '#6a3515' : '#5a3010';
          ctx.globalAlpha = 1 - ep;
          ctx.fillRect(cx + Math.cos(a) * dr - 2, cy + Math.sin(a) * dr - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
        _smoke(ctx, cx, cy, 6 + ep * 12, 0.3 * (1 - ep));
      }
    }));
  }

  return {
    walk: { frames: walk, fps: 6, loop: true },
    attack: { frames: attack, fps: 8, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 10, loop: false }
  };
}

// ======================================================
// TYPE 6 — SHIELD DRONE (Hex Drone) sz:14
// ======================================================
function generateShieldDroneFrames() {
  const cx = 40, cy = 40;

  function draw(ctx, p) {
    // Wing shields
    for (const s of [-1, 1]) {
      const wx = cx + s * (18 + (p.wingSpread || 0));
      ctx.fillStyle = metalGrad(ctx, wx - 6, cy - 8, 12, 16, '#1a5566');
      ctx.beginPath();
      ctx.moveTo(wx, cy - 10); ctx.lineTo(wx + s * 6, cy - 6);
      ctx.lineTo(wx + s * 6, cy + 6); ctx.lineTo(wx, cy + 10);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#0a3040'; ctx.lineWidth = 1; ctx.stroke();
      // Cyan edge glow
      ctx.save(); ctx.strokeStyle = '#00cccc'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.moveTo(wx + s * 6, cy - 6); ctx.lineTo(wx + s * 6, cy + 6); ctx.stroke();
      ctx.restore();
    }
    // Tethers
    ctx.save(); ctx.setLineDash([3, 3]); ctx.lineDashOffset = p.dashOff || 0;
    ctx.strokeStyle = '#00dddd'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * 8, cy);
      ctx.lineTo(cx + s * (16 + (p.wingSpread || 0)), cy); ctx.stroke();
    }
    ctx.restore();
    // Main hex body
    drawHex(ctx, cx, cy, 12);
    ctx.fillStyle = metalGrad(ctx, cx - 12, cy - 12, 24, 24, '#1a5566');
    ctx.fill();
    ctx.strokeStyle = '#0a3040'; ctx.lineWidth = 1.5;
    drawHex(ctx, cx, cy, 12); ctx.stroke();
    // Inner hex detail
    ctx.strokeStyle = '#0a4a5a'; ctx.lineWidth = 0.5;
    drawHex(ctx, cx, cy, 8); ctx.stroke();
    // Core
    const cr = 3 + (p.coreGlow || 0);
    _glow(ctx, cx, cy, cr, '#00ffff', 6);
    _glow(ctx, cx, cy, cr * 0.5, '#ffffff', 3);
    // Hex vertex rivets
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i - Math.PI / 2;
      ctx.fillStyle = '#2a6a7a';
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    // Shield deploy ring (attack)
    if (p.shieldRing) {
      ctx.strokeStyle = `rgba(0,255,255,${p.shieldRing})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 12 + p.shieldRadius, 0, Math.PI * 2); ctx.stroke();
    }
  }

  const walk = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 6 * Math.PI * 2;
    walk.push(makeFrame(ctx => draw(ctx, {
      wingSpread: Math.sin(t) * 3,
      dashOff: -i * 3,
      coreGlow: Math.sin(t * 2) * 1
    })));
  }

  const attack = [];
  for (let i = 0; i < 4; i++) {
    const p = i / 3;
    attack.push(makeFrame(ctx => draw(ctx, {
      wingSpread: 2, dashOff: -i * 4,
      coreGlow: 2 + i,
      shieldRing: 0.8 - p * 0.5,
      shieldRadius: p * 25
    })));
  }

  const hit = [
    makeFrame(ctx => draw(ctx, { wingSpread: -4, dashOff: 0, coreGlow: 0 })),
    makeFrame(ctx => draw(ctx, { wingSpread: -1, dashOff: 0, coreGlow: 1 }))
  ];

  const death = [];
  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    death.push(makeFrame(ctx => {
      ctx.globalAlpha = 1 - p * 0.5;
      // Wings detach
      for (const s of [-1, 1]) {
        const wx = cx + s * (20 + p * 20);
        const wy = cy + p * 15;
        ctx.fillStyle = '#1a5566'; ctx.globalAlpha = (1 - p) * 0.8;
        ctx.fillRect(wx - 4, wy - 6, 8, 12);
      }
      ctx.globalAlpha = 1 - p * 0.5;
      // Body shrinks
      if (i < 4) {
        drawHex(ctx, cx, cy, 12 - p * 6);
        ctx.fillStyle = '#1a5566'; ctx.fill();
      }
      // Core fades
      if (p < 0.8) _glow(ctx, cx, cy, 3 * (1 - p), '#00ffff', 4 * (1 - p));
      ctx.globalAlpha = 1;
      // Sparks
      for (let s = 0; s < 3; s++) {
        const a = s * 2.09 + p * 3;
        _spark(ctx, cx + Math.cos(a) * p * 18, cy + Math.sin(a) * p * 18, 3, '#00ffff');
      }
    }));
  }

  return {
    walk: { frames: walk, fps: 8, loop: true },
    attack: { frames: attack, fps: 10, loop: false },
    hit: { frames: hit, fps: 15, loop: false },
    death: { frames: death, fps: 8, loop: false }
  };
}

// ======================================================
// TYPE 7 — GLITCH (Corrupted Entity) sz:12
// ======================================================
function generateGlitchFrames() {
  const cx = 40, cy = 38;

  function draw(ctx, p) {
    const jx = p.jitter || 0, jy = p.jitterY || 0;
    // Legs (jittery)
    _limb(ctx, cx - 5 + jx, cy + 10, cx - 5 + jx + (p.legStutter || 0), cy + 24, 3, '#3311aa');
    _limb(ctx, cx + 5 + jx, cy + 10, cx + 5 + jx - (p.legStutter || 0), cy + 24, 3, '#3311aa');
    // Body
    _body(ctx, cx + jx, cy + jy, 20, 22, '#4411aa', 3);
    // Corruption blocks (displaced)
    if (p.blocks) {
      for (const b of p.blocks) {
        ctx.fillStyle = b.col || '#6633cc';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(cx + b.x + jx, cy + b.y + jy, b.w, b.h);
        ctx.strokeStyle = '#8855dd'; ctx.lineWidth = 0.5;
        ctx.strokeRect(cx + b.x + jx, cy + b.y + jy, b.w, b.h);
      }
      ctx.globalAlpha = 1;
    }
    // Data band (green horizontal)
    ctx.save();
    ctx.fillStyle = '#00ff44'; ctx.globalAlpha = 0.3;
    ctx.fillRect(cx - 10 + jx, cy + 2 + jy + (p.bandY || 0), 20, 3);
    ctx.globalAlpha = 0.5;
    // Data text
    ctx.font = '4px monospace'; ctx.fillStyle = '#00ff44';
    ctx.fillText('01101', cx - 8 + jx + (p.dataScroll || 0), cy + 5 + jy + (p.bandY || 0));
    ctx.restore();
    // Visor
    _visor(ctx, cx + jx, cy - 5 + jy, 10, 2.5, '#cc00ff', 5);
    // Scanline
    if (p.scanY !== undefined) {
      ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(cx - 10 + jx, cy + p.scanY + jy); ctx.lineTo(cx + 10 + jx, cy + p.scanY + jy); ctx.stroke();
      ctx.restore();
    }
    // Dead pixels
    if (p.deadPx) {
      ctx.fillStyle = '#000';
      for (const dp of p.deadPx) ctx.fillRect(cx + dp.x + jx, cy + dp.y + jy, 2, 2);
    }
    // Purple pixel artifacts around edges
    for (let i = 0; i < (p.artifacts || 0); i++) {
      ctx.fillStyle = i % 2 === 0 ? '#aa00ff' : '#00ff44';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(cx + jx + (Math.random() - 0.5) * 28, cy + jy + (Math.random() - 0.5) * 28, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  const blockSets = [
    [{x:-14,y:-6,w:5,h:4},{x:9,y:2,w:4,h:5}],
    [{x:-12,y:0,w:4,h:3},{x:10,y:-4,w:5,h:3},{x:-8,y:6,w:3,h:4}],
    [{x:-15,y:-2,w:6,h:3},{x:8,y:4,w:4,h:5}],
    [{x:-11,y:3,w:3,h:5},{x:11,y:-6,w:5,h:3},{x:-6,y:-8,w:4,h:3}],
    [{x:-13,y:-4,w:4,h:4},{x:9,y:0,w:5,h:4}],
    [{x:-10,y:2,w:5,h:3},{x:10,y:-2,w:3,h:5},{x:-14,y:-6,w:4,h:3}],
  ];
  const deadPxSets = [
    [{x:-4,y:3},{x:6,y:-7}],
    [{x:-6,y:-3},{x:3,y:5}],
    [{x:-2,y:6},{x:7,y:-4}],
    [{x:-7,y:0},{x:5,y:3}],
    [{x:-3,y:-5},{x:4,y:7}],
    [{x:-5,y:4},{x:6,y:-2}],
  ];

  const walk = [];
  for (let i = 0; i < 6; i++) {
    walk.push(makeFrame(ctx => draw(ctx, {
      jitter: (i % 2) * 2 - 1,
      jitterY: (i % 3 === 0) ? -1 : 0,
      legStutter: (i % 2) * 3,
      blocks: blockSets[i],
      bandY: -4 + i * 1.5,
      dataScroll: i * 3,
      scanY: -10 + i * 3.5,
      deadPx: deadPxSets[i],
      artifacts: 2
    })));
  }

  const attack = [];
  for (let i = 0; i < 4; i++) {
    attack.push(makeFrame(ctx => {
      if (i === 0) { // distort
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1.1, 0.9); ctx.translate(-cx, -cy);
        draw(ctx, { jitter: 3, blocks: blockSets[0], artifacts: 5, scanY: 0 });
        ctx.restore();
      } else if (i === 1) { // fragment explosion
        for (let b = 0; b < 12; b++) {
          const a = b * Math.PI / 6;
          const r = 8 + Math.random() * 15;
          ctx.fillStyle = b % 3 === 0 ? '#cc00ff' : b % 3 === 1 ? '#4411aa' : '#00ff44';
          ctx.globalAlpha = 0.7;
          ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3 + Math.random() * 4, 3 + Math.random() * 4);
        }
        ctx.globalAlpha = 1;
        _glow(ctx, cx, cy, 6, '#aa00ff', 6);
      } else if (i === 2) { // reform
        ctx.globalAlpha = 0.7;
        draw(ctx, { jitter: -2, blocks: blockSets[2], artifacts: 8, scanY: -5 });
        ctx.globalAlpha = 1;
        // Corruption wave
        ctx.strokeStyle = 'rgba(170,0,255,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
      } else { // recover
        draw(ctx, { jitter: 1, blocks: blockSets[3], artifacts: 3, scanY: 2 });
      }
    }));
  }

  const hit = [];
  for (let i = 0; i < 3; i++) {
    hit.push(makeFrame(ctx => {
      draw(ctx, {
        jitter: [5, -4, 1][i], jitterY: [3, -2, 0][i],
        legStutter: 4,
        blocks: blockSets[i],
        artifacts: 6 - i * 2,
        scanY: i * 3
      });
      // Static noise
      for (let n = 0; n < 10 - i * 3; n++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 - i * 0.1})`;
        ctx.fillRect(cx + (Math.random() - 0.5) * 24, cy + (Math.random() - 0.5) * 28, 1, 1);
      }
    }));
  }

  const death = [];
  for (let i = 0; i < 6; i++) {
    const p = i / 5;
    death.push(makeFrame(ctx => {
      if (i < 3) {
        // Decompose into scan lines
        ctx.save();
        for (let line = 0; line < 20; line++) {
          const ly = cy - 12 + line * 1.5;
          const shift = (line % 2 === 0 ? 1 : -1) * p * 15 * (Math.random() + 0.5);
          ctx.fillStyle = line % 3 === 0 ? '#4411aa' : '#6633cc';
          ctx.globalAlpha = 1 - p * 0.5;
          ctx.fillRect(cx - 10 + shift, ly, 20, 1.2);
        }
        ctx.restore();
      }
      if (i >= 2 && i < 5) {
        // Fragment into static
        for (let n = 0; n < 30; n++) {
          const fade = (i - 2) / 2;
          ctx.fillStyle = n % 4 === 0 ? '#cc00ff' : n % 4 === 1 ? '#4411aa' : n % 4 === 2 ? '#00ff44' : '#888';
          ctx.globalAlpha = (1 - fade) * 0.6;
          ctx.fillRect(
            cx + (Math.random() - 0.5) * (20 + fade * 40),
            cy + (Math.random() - 0.5) * (20 + fade * 40),
            1 + Math.random() * 2, 1 + Math.random() * 2
          );
        }
        ctx.globalAlpha = 1;
      }
      if (i === 5) {
        // Final fade - just a few pixels
        for (let n = 0; n < 6; n++) {
          ctx.fillStyle = '#4411aa';
          ctx.globalAlpha = 0.2;
          ctx.fillRect(cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 50, 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    }));
  }

  return {
    walk: { frames: walk, fps: 8, loop: true },
    attack: { frames: attack, fps: 8, loop: false },
    hit: { frames: hit, fps: 12, loop: false },
    death: { frames: death, fps: 7, loop: false }
  };
}

// ======================================================
// ENEMY_ANIMS Generation
// ======================================================
const ENEMY_ANIMS = [];
const ENEMY_GLOW_DEFS = [
  { c: '#ff3333', r: 8 },   // 0: FUD Bot
  { c: '#ff2222', r: 8 },   // 1: Jeet
  { c: '#ffd700', r: 10 },  // 2: Whale
  { c: '#cc00ff', r: 8 },   // 3: MEV Bot
  { c: '#ff0000', r: 6 },   // 4: Sniper
  { c: '#ff5500', r: 10 },  // 5: Bomber
  { c: '#00ffff', r: 8 },   // 6: Shield Drone
  { c: '#aa00ff', r: 8 }    // 7: Glitch
];

(function generateAllEnemyAnims() {
  const generators = [
    generateFudBotFrames, generateJeetFrames, generateWhaleFrames, generateMevBotFrames,
    generateSniperFrames, generateBomberFrames, generateShieldDroneFrames, generateGlitchFrames
  ];
  for (let t = 0; t < 8; t++) {
    const raw = generators[t]();
    const gd = ENEMY_GLOW_DEFS[t];
    ENEMY_ANIMS[t] = {};
    for (const state of ['walk', 'attack', 'hit', 'death']) {
      const src = raw[state];
      ENEMY_ANIMS[t][state] = {
        frames: src.frames.map(c => applyEnemyGlow(c, gd.c, gd.r)),
        fps: src.fps,
        loop: src.loop
      };
    }
  }
})();

// Legacy compatibility
const ENEMY_FRAMES = ENEMY_ANIMS.map(a => a.walk.frames);
const ENEMY_SPRITES = ENEMY_FRAMES.map(f => f[0]);
const ENEMY_COLORS = ['#ff3333', '#ff4444', '#ffd700', '#cc00ff', '#ff0000', '#ff5500', '#00ffff', '#aa00ff'];

// ============ BOSS SPRITES ============
const BOSS_SPRITES = {};

BOSS_SPRITES.loudmouth = createEnhancedSprite(`
......ggggggg......
.....ggggggggg.....
....ggggggggggg....
...gggrrrrrrrggg...
...gggrwwwwwrggg...
...gggrwYwYwrggg...
...gggrwwwwwrggg...
...gggrrrrrrrggg...
....ggggggggggg....
...ggggggggggggg...
..gggYYYYYYYYggg..
..gggYYYYYYYYggg..
..gggYYYYYYYYggg..
...ggggggggggggg...
....ggggggggggg....
.....ggg..ggg......
....ggg....ggg.....
`, { g: '#cc9900', Y: '#ffd700', r: '#ff3333', w: '#ffffff' }, 3, { outline: '#4a3500', glow: '#ffd700', glowRadius: 12 });

BOSS_SPRITES.hashbeast = createEnhancedSprite(`
.....gggggg......
....gggggggg.....
...ggrrggrrgg....
...gggggggggg....
..gggGGGGGGggg...
..gggGGGGGGggg...
.gggggggggggggg..
.ggGGGGGGGGGggg.
.ggGGGGGGGGGggg.
.gggggggggggggg..
..ggggggggggggg..
...gggggggggg....
....ggg..ggg.....
...ggg....ggg....
`, { g: '#2a4a2a', G: '#00ff44', r: '#ff0000' }, 3, { outline: '#0a1a0a', glow: '#00ff44', glowRadius: 10 });

BOSS_SPRITES.spiralking = createEnhancedSprite(`
.....ppppppp.....
....ppppppppp....
...pppwwwwwppp...
...ppppppppppp...
..pppGGGGGGGppp..
..pppGGGGGGGppp..
.ppppppppppppppp.
.pppGGGGGGGGppp.
.ppppppppppppppp.
..ppppppppppppp..
...ppppppppppp...
....ppp..ppp.....
...ppp....ppp....
`, { p: '#5522aa', G: '#aa66ff', w: '#ffffff' }, 3, { outline: '#220066', glow: '#aa66ff', glowRadius: 10 });

BOSS_SPRITES.northstar = createEnhancedSprite(`
......ccccc......
.....ccccccc.....
....cccrrcrrccc..
....ccccccccc....
...cccGGGGGccc...
..ccccGGGGGcccc..
..ccccGGGGGcccc..
..ccccccccccccc..
...ccccccccccc...
....ccccccccc....
.....cc..cc......
....cc....cc.....
`, { c: '#003344', G: '#00ffaa', r: '#ff0000' }, 3, { outline: '#001122', glow: '#00ffaa', glowRadius: 10 });

BOSS_SPRITES.unbanker = createEnhancedSprite(`
.....ggggggg.....
....ggggggggg....
...gggrrgrrgggg..
...ggggggggggg...
..gggGGGGGGGggg..
..gggGGGGGGGggg..
.ggggggggggggggg.
.gggGGGGGGGGggg.
.ggggggggggggggg.
..ggggggggggggg..
...ggggggggggg...
....ggg..ggg.....
...ggg....ggg....
`, { g: '#334455', G: '#ffffff', r: '#ff0000' }, 3, { outline: '#111122', glow: '#ffffff', glowRadius: 8 });

BOSS_SPRITES.vultures = createEnhancedSprite(`
..bbb.......bbb..
..bbbb.....bbbb..
..bbbbb...bbbbb..
...bbbbrrrbbbb...
...bbbYYYYYbbb...
....bbbbbbbbb....
...bbbbbbbbbbb...
..bbbGGGGGGGbbb..
..bbbbbbbbbbbbb..
...bbbbbbbbbbb...
....bbbbbbbbb....
.....bb...bb.....
....bb.....bb....
`, { b: '#6a4400', r: '#ff0000', Y: '#ffff00', G: '#ffd700' }, 3, { outline: '#2a1a00', glow: '#ffaa00', glowRadius: 10 });

BOSS_SPRITES.prophet = createEnhancedSprite(`
.....ggggggg.....
....ggggggggg....
...gggGwGwGggg...
...ggggggggggg...
..gggGGGGGGGggg..
..gggGGGGGGGggg..
.ggggggggggggggg.
.gggGGGGGGGGggg.
.ggggggggggggggg.
..ggggggggggggg..
...ggggggggggg...
....ggg..ggg.....
...ggg....ggg....
`, { g: '#003300', G: '#00ff00', w: '#ffffff' }, 3, { outline: '#001100', glow: '#00ff00', glowRadius: 12 });

BOSS_SPRITES.mathsorcerer = createEnhancedSprite(`
......ppppppp......
.....ppppppppp.....
....pppwwpwwppp....
....ppppppppppp....
...pppGGGGGGGppp...
..ppppGGGGGGGpppp..
..ppppppppppppppp..
..ppppGGGGGGGpppp..
..ppppppppppppppp..
...pppppppppppp....
....pppppppppp.....
.....ppp..ppp......
....ppp....ppp.....
`, { p: '#662288', G: '#cc88ff', w: '#ffffff' }, 3, { outline: '#220044', glow: '#aa66ff', glowRadius: 12 });

BOSS_SPRITES.guardian = createEnhancedSprite(`
.....ggggggggg.....
....ggggggggggg....
...gggYYgYYgggg....
...ggggggggggggg...
..gggGGGGGGGGggg..
..gggGGGGGGGGggg..
.gggggggggggggggg..
.gggGGGGGGGGGggg..
.gggggggggggggggg..
..ggggggggggggggg..
...gggggggggggg....
....gggg..gggg.....
...gggg....gggg....
`, { g: '#555555', G: '#888888', Y: '#ffff00' }, 3, { outline: '#222222', glow: '#ffff00', glowRadius: 10 });

BOSS_SPRITES.emperor = createEnhancedSprite(`
.......ggggggggg.......
......ggggggggggg......
.....gggrrgggrrggg.....
.....ggggggggggggg.....
....gggYYYYYYYYYggg....
...ggggYYYYYYYYYgggg...
...ggggYYYYYYYYYgggg...
..ggggggggggggggggggg..
..ggggYYYYYYYYYYgggg...
       ggggg....ggggg.....
  `, { g: '#aa8800', Y: '#ffd700', r: '#ff0000' }, 3, { outline: '#443300', glow: '#ffd700', glowRadius: 15 });

// ============ AI-GENERATED WEAPON SPRITES ============
// High-quality weapon images loaded from assets/weapons/

const WEAPON_SPRITES = {};
const WEAPON_ICONS = {};

const WEAPON_GLOW = {
  pistol: '#00ffff', crossbow: '#aaddff', smg: '#00ffff',
  shotgun: '#ff5500', redcandle: '#ff2222', axe: '#aaaaaa',
  drones: '#00ffff', plasmaCannon: '#aa33ff', railgun: '#66ccff',
  gatlingSwarm: '#00ff44', dragonBreath: '#ff5500', godCandleBlade: '#00ff44',
  chainLightning: '#ffee00', droneSwarm: '#ffcc00'
};

const WEAPON_IMG_PATHS = {
  pistol: 'assets/weapons/pistol.png',
  crossbow: 'assets/weapons/crossbow.png',
  smg: 'assets/weapons/smg.png',
  shotgun: 'assets/weapons/shotgun.png',
  redcandle: 'assets/weapons/redcandle.png',
  axe: 'assets/weapons/axe.png',
  drones: 'assets/weapons/drones.png',
  plasmaCannon: 'assets/weapons/plasmaCannon.png',
  railgun: 'assets/weapons/railgun.png',
  gatlingSwarm: 'assets/weapons/gatlingSwarm.png',
  dragonBreath: 'assets/weapons/dragonBreath.png',
  godCandleBlade: 'assets/weapons/godCandleBlade.png',
  chainLightning: 'assets/weapons/chainLightning.png',
  droneSwarm: 'assets/weapons/droneSwarm.png'
};

// ── Remove black/white background from weapon images ──
function removeWeaponBg(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  const w = canvas.width, h = canvas.height;
  // Threshold: pixels near black or near white become transparent
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const brightness = (r + g + b) / 3;
    // Near-black background
    if (brightness < 30) {
      d[i + 3] = 0;
    }
    // Near-white background
    else if (r > 225 && g > 225 && b > 225) {
      d[i + 3] = 0;
    }
    // Edge feathering for dark pixels near the threshold
    else if (brightness < 50) {
      d[i + 3] = Math.floor((brightness - 30) / 20 * 255);
    }
    // Edge feathering for light pixels near white
    else if (r > 200 && g > 200 && b > 200) {
      const minC = Math.min(r, g, b);
      if (minC > 200) {
        d[i + 3] = Math.floor((255 - minC) / 55 * 255);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// ── Load weapon images and create sprites ──
function initWeaponSprites() {
  for (const [id, path] of Object.entries(WEAPON_IMG_PATHS)) {
    const glowCol = WEAPON_GLOW[id] || '#ffffff';

    // Create placeholder canvas immediately (avoids crash while loading)
    const sprC = document.createElement('canvas');
    sprC.width = 80; sprC.height = 80;
    WEAPON_SPRITES[id] = sprC;

    // Placeholder icon until image loads
    WEAPON_ICONS[id] = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${glowCol};font-size:24px;">⚔</div>`;

    // Load image and process
    const img = new Image();
    img.onload = function () {
      // Draw onto sprite canvas and remove background
      const ctx = sprC.getContext('2d');
      ctx.clearRect(0, 0, 80, 80);
      ctx.drawImage(img, 0, 0, 80, 80);
      removeWeaponBg(sprC);

      // Create clean icon (128x128 for shop display)
      const iconC = document.createElement('canvas');
      iconC.width = 128; iconC.height = 128;
      const iCtx = iconC.getContext('2d');
      iCtx.drawImage(img, 0, 0, 128, 128);
      removeWeaponBg(iconC);

      // Update icon HTML with cleaned transparent image
      WEAPON_ICONS[id] = `<img src="${iconC.toDataURL()}" style="width:100%; height:100%; object-fit:contain; image-rendering:auto; filter:brightness(1.8) saturate(2.5) contrast(1.2);">`;

      // Sync to WEAPONS so levelup cards & shop get the real pixel art icon
      if (typeof WEAPONS !== 'undefined' && WEAPONS[id]) {
        WEAPONS[id].icon = WEAPON_ICONS[id];
      }
    };
    img.onerror = function () {
      const ctx = sprC.getContext('2d');
      ctx.fillStyle = glowCol;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(10, 10, 60, 60);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 60, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(id, 40, 44);
      console.warn('Weapon image failed to load:', path);
    };
    img.src = path;
  }
}
initWeaponSprites();
/*== OLD PROCEDURAL DRAW FUNCTIONS DISABLED ==
const cx = w / 2, cy = h / 2;
// Barrel
ctx.fillStyle = metalGrad(ctx, cx - 4, cy - 18, 8, 24, '#3a5060');
ctx.beginPath(); ctx.roundRect(cx - 4, cy - 18, 8, 24, 2); ctx.fill();
ctx.strokeStyle = '#1a2a35'; ctx.lineWidth = 0.8; ctx.stroke();
// Body
ctx.fillStyle = metalGrad(ctx, cx - 12, cy + 4, 24, 14, '#4a6578');
ctx.beginPath(); ctx.roundRect(cx - 12, cy + 4, 24, 14, 3); ctx.fill();
ctx.strokeStyle = '#2a3a45'; ctx.lineWidth = 0.8; ctx.stroke();
// Grip
ctx.fillStyle = metalGrad(ctx, cx - 5, cy + 16, 10, 14, '#2a3540');
ctx.beginPath(); ctx.roundRect(cx - 5, cy + 16, 10, 14, [0, 0, 3, 3]); ctx.fill();
// Energy cell (cyan glow)
ctx.save(); ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 6;
ctx.fillStyle = '#00ffff'; ctx.globalAlpha = 0.9;
ctx.fillRect(cx - 8, cy + 8, 16, 4);
ctx.globalAlpha = 0.4; ctx.fillRect(cx - 10, cy + 7, 20, 6);
ctx.restore();
// Muzzle dot
wepGlow(ctx, cx, cy - 18, 4, '#00ffff', 0.5);
drawPanelLine(ctx, cx - 10, cy + 4, cx + 10, cy + 4);
}

// ── CROSSBOW: Tensioned limbs with bolt ──
function drawWep_crossbow(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Limbs
  ctx.save(); ctx.strokeStyle = '#6a7a8a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 22, cy - 12); ctx.quadraticCurveTo(cx - 16, cy, cx - 4, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 22, cy - 12); ctx.quadraticCurveTo(cx + 16, cy, cx + 4, cy); ctx.stroke();
  ctx.restore();
  // String
  ctx.save(); ctx.strokeStyle = '#aabbcc'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(cx - 22, cy - 12); ctx.lineTo(cx, cy + 2); ctx.lineTo(cx + 22, cy - 12); ctx.stroke();
  ctx.restore();
  // Stock
  ctx.fillStyle = metalGrad(ctx, cx - 3, cy - 2, 6, 22, '#3a2a1a');
  ctx.beginPath(); ctx.roundRect(cx - 3, cy - 2, 6, 22, 2); ctx.fill();
  ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 0.6; ctx.stroke();
  // Bolt
  ctx.save(); ctx.strokeStyle = '#ddeeff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx, cy - 16); ctx.stroke();
  ctx.fillStyle = '#eef'; ctx.beginPath(); ctx.moveTo(cx, cy - 18); ctx.lineTo(cx - 3, cy - 14); ctx.lineTo(cx + 3, cy - 14); ctx.fill();
  ctx.restore();
  wepGlow(ctx, cx, cy - 18, 3, '#aaddff', 0.4);
}

// ── SMG: Compact with magazine ──
function drawWep_smg(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Body
  ctx.fillStyle = metalGrad(ctx, cx - 14, cy - 6, 28, 12, '#4a5a6a');
  ctx.beginPath(); ctx.roundRect(cx - 14, cy - 6, 28, 12, 3); ctx.fill();
  ctx.strokeStyle = '#2a3a4a'; ctx.lineWidth = 0.8; ctx.stroke();
  // Barrel
  ctx.fillStyle = metalGrad(ctx, cx + 12, cy - 3, 12, 6, '#3a4a5a');
  ctx.beginPath(); ctx.roundRect(cx + 12, cy - 3, 12, 6, [0, 2, 2, 0]); ctx.fill();
  // Magazine
  ctx.fillStyle = metalGrad(ctx, cx - 6, cy + 4, 8, 12, '#2a3540');
  ctx.beginPath(); ctx.roundRect(cx - 6, cy + 4, 8, 12, [0, 0, 2, 2]); ctx.fill();
  ctx.strokeStyle = '#1a2530'; ctx.lineWidth = 0.5; ctx.stroke();
  // Energy strip
  ctx.save(); ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 3;
  ctx.fillStyle = '#00ffff'; ctx.globalAlpha = 0.7;
  ctx.fillRect(cx - 12, cy - 1, 22, 2); ctx.restore();
  wepGlow(ctx, cx + 24, cy, 3, '#00ffff', 0.4);
  drawPanelLine(ctx, cx - 12, cy + 4, cx + 10, cy + 4);
}

// ── SHOTGUN: Heavy double-barrel ──
function drawWep_shotgun(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  for (const off of [-3, 3]) {
    ctx.fillStyle = metalGrad(ctx, cx - 2, cy - 20 + off, 4, 24, '#4a4a4a');
    ctx.beginPath(); ctx.roundRect(cx - 2, cy - 20 + off, 4, 28, 1); ctx.fill();
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  ctx.fillStyle = metalGrad(ctx, cx - 10, cy + 6, 20, 10, '#5a4a3a');
  ctx.beginPath(); ctx.roundRect(cx - 10, cy + 6, 20, 10, 3); ctx.fill();
  ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle = metalGrad(ctx, cx - 6, cy + 2, 12, 5, '#6a5a4a');
  ctx.beginPath(); ctx.roundRect(cx - 6, cy + 2, 12, 5, 1); ctx.fill();
  ctx.fillStyle = metalGrad(ctx, cx - 5, cy + 14, 10, 12, '#3a2518');
  ctx.beginPath(); ctx.roundRect(cx - 5, cy + 14, 10, 12, [0, 0, 4, 4]); ctx.fill();
  ctx.save(); ctx.shadowColor = '#ff5500'; ctx.shadowBlur = 6; ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ff5500'; ctx.beginPath(); ctx.arc(cx, cy - 20, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── RED CANDLE KATANA ──
function drawWep_redcandle(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.4);
  const bladeGrad = ctx.createLinearGradient(-2, -28, 2, -28);
  bladeGrad.addColorStop(0, '#cc1111'); bladeGrad.addColorStop(0.5, '#ff4444'); bladeGrad.addColorStop(1, '#aa0000');
  ctx.fillStyle = bladeGrad;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(3, -26); ctx.lineTo(2, 6); ctx.lineTo(-2, 6); ctx.lineTo(-3, -26); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = '#ff8888'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 6); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 6; ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ff2222'; ctx.fillRect(-3, -28, 6, 34); ctx.restore();
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.ellipse(0, 8, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#aa8800'; ctx.lineWidth = 0.5; ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#2a1a0a' : '#4a3020';
    ctx.fillRect(-3, 10 + i * 3, 6, 2);
  }
  ctx.restore();
}

// ── THROWING AXE ──
function drawWep_axe(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = metalGrad(ctx, cx - 2, cy - 6, 4, 28, '#5a401a');
  ctx.beginPath(); ctx.roundRect(cx - 2, cy - 6, 4, 28, 1); ctx.fill();
  ctx.strokeStyle = '#3a2510'; ctx.lineWidth = 0.5; ctx.stroke();
  for (const s of [-1, 1]) {
    const headPath = () => { ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.quadraticCurveTo(cx + s * 16, cy - 12, cx + s * 14, cy + 2); ctx.quadraticCurveTo(cx + s * 12, cy + 8, cx, cy + 4); ctx.closePath(); };
    ctx.save(); headPath(); ctx.fillStyle = metalGrad(ctx, cx - 16, cy - 12, 32, 20, '#7a8a9a'); ctx.fill();
    headPath(); ctx.clip(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.2;
    ctx.fillStyle = ctx.createPattern(TEX_CACHE.metalDark, 'repeat'); ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#4a5a6a'; ctx.lineWidth = 0.8; headPath(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx + s * 14, cy - 2); ctx.quadraticCurveTo(cx + s * 15, cy - 8, cx + s * 12, cy - 10); ctx.stroke(); ctx.restore();
  }
}

// ── SUPPORT DRONES ──
function drawWep_drones(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  for (const s of [-1, 1]) {
    ctx.fillStyle = metalGrad(ctx, cx + s * 10, cy - 2, 14, 4, '#2a5566');
    ctx.beginPath(); ctx.roundRect(cx + s * 10, cy - 2, s * 14, 4, 1); ctx.fill();
  }
  drawHex(ctx, cx, cy, 12); ctx.fillStyle = metalGrad(ctx, cx - 12, cy - 12, 24, 24, '#2a5060'); ctx.fill();
  drawHex(ctx, cx, cy, 12);
  ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.15;
  ctx.fillStyle = ctx.createPattern(TEX_CACHE.circuitCyan, 'repeat');
  ctx.fillRect(cx - 14, cy - 14, 28, 28); ctx.restore();
  ctx.strokeStyle = '#00aaaa'; ctx.lineWidth = 1; drawHex(ctx, cx, cy, 12); ctx.stroke();
  ctx.save(); ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 6;
  ctx.fillStyle = radialGrad(ctx, cx, cy, 5, '#ffffff', '#00cccc');
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  for (const s of [-1, 1]) {
    ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#00dddd'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx + s * 18, cy, 6, 2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

// ── PLASMA CANNON ──
function drawWep_plasmaCannon(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save(); ctx.strokeStyle = metalGrad(ctx, cx - 16, cy - 16, 32, 32, '#5a3a7a'); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = '#3a1a5a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.save(); ctx.shadowColor = '#aa33ff'; ctx.shadowBlur = 10; ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#aa33ff'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 5; ctx.globalAlpha = 0.8;
  ctx.fillStyle = radialGrad(ctx, cx, cy, 8, '#eeddff', '#7722cc');
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.strokeStyle = '#cc66ff'; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.4;
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 3, 0, Math.PI); ctx.stroke();
  }
  ctx.restore();
}

// ── RAILGUN ──
function drawWep_railgun(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = metalGrad(ctx, cx - 3, cy - 28, 6, 36, '#4a5a6a');
  ctx.beginPath(); ctx.roundRect(cx - 3, cy - 28, 6, 36, 1); ctx.fill();
  ctx.strokeStyle = '#2a3a4a'; ctx.lineWidth = 0.5; ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.fillStyle = metalGrad(ctx, cx + s * 5, cy - 24, 3, 28, '#3a4a5a');
    ctx.fillRect(cx + s * 5, cy - 24, 3, 28);
    ctx.save(); ctx.shadowColor = '#66ccff'; ctx.shadowBlur = 3; ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#66ccff'; ctx.fillRect(cx + s * 3, cy - 20, s > 0 ? 2 : -2, 20); ctx.restore();
  }
  ctx.fillStyle = metalGrad(ctx, cx - 8, cy + 4, 16, 10, '#3a4a5a');
  ctx.beginPath(); ctx.roundRect(cx - 8, cy + 4, 16, 10, 2); ctx.fill();
  ctx.fillStyle = '#2a3540';
  ctx.beginPath(); ctx.roundRect(cx - 4, cy + 12, 8, 10, [0, 0, 3, 3]); ctx.fill();
  ctx.save(); ctx.shadowColor = '#66ccff'; ctx.shadowBlur = 8;
  ctx.fillStyle = radialGrad(ctx, cx, cy - 28, 5, '#ffffff', '#66ccff');
  ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy - 28, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// ── GATLING SWARM ──
function drawWep_gatlingSwarm(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  for (let i = -1; i <= 1; i++) {
    const bx = cx + i * 5;
    ctx.fillStyle = metalGrad(ctx, bx - 2, cy - 22, 4, 26, '#3a4a3a');
    ctx.beginPath(); ctx.roundRect(bx - 2, cy - 22, 4, 26, 1); ctx.fill();
    ctx.strokeStyle = '#1a2a1a'; ctx.lineWidth = 0.4; ctx.stroke();
    wepGlow(ctx, bx, cy - 22, 3, '#00ff44', 0.3);
  }
  ctx.fillStyle = metalGrad(ctx, cx - 12, cy + 2, 24, 12, '#3a5a3a');
  ctx.beginPath(); ctx.roundRect(cx - 12, cy + 2, 24, 12, 3); ctx.fill();
  ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.save(); ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.arc(cx, cy - 2, 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  wepGlow(ctx, cx, cy + 8, 4, '#00ff44', 0.4);
}

// ── DRAGON'S BREATH ──
function drawWep_dragonBreath(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = metalGrad(ctx, cx - 6, cy - 16, 12, 22, '#5a3a2a');
  ctx.beginPath(); ctx.moveTo(cx - 4, cy + 4); ctx.lineTo(cx - 8, cy - 16); ctx.lineTo(cx + 8, cy - 16); ctx.lineTo(cx + 4, cy + 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.save();
  const fireGrad = ctx.createLinearGradient(cx, cy - 16, cx, cy - 28);
  fireGrad.addColorStop(0, '#ff5500'); fireGrad.addColorStop(0.5, '#ffaa00'); fireGrad.addColorStop(1, 'rgba(255,200,0,0)');
  ctx.fillStyle = fireGrad; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(cx - 10, cy - 16); ctx.quadraticCurveTo(cx, cy - 30, cx + 10, cy - 16); ctx.fill();
  ctx.shadowColor = '#ff5500'; ctx.shadowBlur = 8; ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(cx - 8, cy - 16); ctx.quadraticCurveTo(cx, cy - 26, cx + 8, cy - 16); ctx.fill();
  ctx.restore();
  ctx.fillStyle = metalGrad(ctx, cx - 8, cy + 2, 16, 10, '#4a2a1a');
  ctx.beginPath(); ctx.roundRect(cx - 8, cy + 2, 16, 10, 2); ctx.fill();
  ctx.fillStyle = '#2a1508'; ctx.beginPath(); ctx.roundRect(cx - 4, cy + 10, 8, 10, [0, 0, 3, 3]); ctx.fill();
}

// ── GOD CANDLE BLADE ──
function drawWep_godCandleBlade(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.3);
  const bladeGrad = ctx.createLinearGradient(-3, -32, 3, -32);
  bladeGrad.addColorStop(0, '#00cc33'); bladeGrad.addColorStop(0.5, '#44ff66'); bladeGrad.addColorStop(1, '#00aa22');
  ctx.fillStyle = bladeGrad;
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(5, -28); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.lineTo(-5, -28); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 10; ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#00ff44'; ctx.fillRect(-5, -32, 10, 40); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = '#aaffaa'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, 8); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.ellipse(0, 10, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#aa8800'; ctx.lineWidth = 0.5; ctx.stroke();
  ctx.fillStyle = metalGrad(ctx, -3, 12, 6, 16, '#1a3a1a');
  ctx.fillRect(-3, 12, 6, 16);
  ctx.fillStyle = '#00ff44'; ctx.beginPath(); ctx.arc(0, 30, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── CHAIN LIGHTNING ──
function drawWep_chainLightning(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = metalGrad(ctx, cx - 2, cy - 6, 4, 28, '#5a401a');
  ctx.beginPath(); ctx.roundRect(cx - 2, cy - 6, 4, 28, 1); ctx.fill();
  for (const s of [-1, 1]) {
    const headPath = () => { ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.quadraticCurveTo(cx + s * 16, cy - 12, cx + s * 14, cy + 2); ctx.quadraticCurveTo(cx + s * 12, cy + 8, cx, cy + 4); ctx.closePath(); };
    ctx.save(); headPath(); ctx.fillStyle = metalGrad(ctx, cx - 16, cy - 12, 32, 20, '#7a7a3a'); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = '#5a5a2a'; ctx.lineWidth = 0.8; headPath(); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.strokeStyle = '#ffee00'; ctx.lineWidth = 1.5; ctx.shadowColor = '#ffee00'; ctx.shadowBlur = 5; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(cx - 18, cy - 6); ctx.lineTo(cx - 12, cy); ctx.lineTo(cx - 16, cy + 2); ctx.lineTo(cx - 8, cy + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 18, cy - 6); ctx.lineTo(cx + 12, cy); ctx.lineTo(cx + 16, cy + 2); ctx.lineTo(cx + 8, cy + 6); ctx.stroke();
  ctx.restore();
  wepGlow(ctx, cx, cy - 2, 5, '#ffee00', 0.5);
}

// ── DRONE SWARM ──
function drawWep_droneSwarm(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  for (const s of [-1, 1]) {
    ctx.fillStyle = metalGrad(ctx, cx + s * 10, cy - 2, 14, 4, '#5a4a10');
    ctx.beginPath(); ctx.roundRect(cx + s * 10, cy - 2, s * 14, 4, 1); ctx.fill();
  }
  drawHex(ctx, cx, cy, 13); ctx.fillStyle = metalGrad(ctx, cx - 13, cy - 13, 26, 26, '#5a4a20'); ctx.fill();
  drawHex(ctx, cx, cy, 13);
  ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.15;
  ctx.fillStyle = ctx.createPattern(TEX_CACHE.circuitCyan, 'repeat');
  ctx.fillRect(cx - 15, cy - 15, 30, 30); ctx.restore();
  ctx.strokeStyle = '#ccaa00'; ctx.lineWidth = 1; drawHex(ctx, cx, cy, 13); ctx.stroke();
  ctx.save(); ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 6;
  ctx.fillStyle = radialGrad(ctx, cx, cy, 5, '#ffffee', '#ffaa00');
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  for (const s of [-1, 1]) {
    ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx + s * 20, cy, 6, 2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

// ── WEAPON DRAW FUNCTION MAP ──
const WEAPON_DRAW_FNS = {
  pistol: drawWep_pistol, crossbow: drawWep_crossbow, smg: drawWep_smg,
  shotgun: drawWep_shotgun, redcandle: drawWep_redcandle, axe: drawWep_axe,
  drones: drawWep_drones, plasmaCannon: drawWep_plasmaCannon, railgun: drawWep_railgun,
  gatlingSwarm: drawWep_gatlingSwarm, dragonBreath: drawWep_dragonBreath,
  godCandleBlade: drawWep_godCandleBlade, chainLightning: drawWep_chainLightning,
  droneSwarm: drawWep_droneSwarm
};

function initWeaponSprites() {
  for (const [id, drawFn] of Object.entries(WEAPON_DRAW_FNS)) {
    const glowCol = WEAPON_GLOW[id] || '#ffffff';

    // In-game sprite (80x80)
    const sprC = document.createElement('canvas');
    sprC.width = 80; sprC.height = 80;
    drawFn(sprC.getContext('2d'), 80, 80);
    WEAPON_SPRITES[id] = applyHDBloom(sprC, glowCol, 4);

    // Shop icon (96x96 + bloom)
    const iconC = document.createElement('canvas');
    iconC.width = 96; iconC.height = 96;
    drawFn(iconC.getContext('2d'), 96, 96);
    const bloomed = applyHDBloom(iconC, glowCol, 6);
    WEAPON_ICONS[id] = `<img src="${bloomed.toDataURL()}" style="width:100%; height:100%; object-fit:contain; image-rendering:auto;">`;
  }
}
== END OLD PROCEDURAL DRAW FUNCTIONS ==*/
/*== OLD PIXEL ART CODE DISABLED ==













  .n.................n.
.nm...............mn.
..nm.............mn..
...nm...........mn...
....nm.........mn....
.....nmmmmmmmmmn.....
.......dcdgdcd.......
.......dcdgdcd.......
........ddddd........
.........dhd.........
..........d..........
`,
    // ── SMG: Compact with drum magazine ──
    smg: `
........nnnnnnn....
.......nddddddn...
......nddgggdddn..
.....ndddddddddn..
....ndddddddddn...
.....nddddn........
......nmmn.........
.......nn..........
`,
    // ── SHOTGUN: Heavy double-barrel ──
    shotgun: `
...........nnnnnnnn.
.........nnddddddn..
........nnfffdddddn.
.......nnfffddddddn.
......nnddddddddn...
.....nnddddddn......
......nndhdn.........
.......nndn..........
`,
    // ── RED CANDLE KATANA: Curved blade with tsuba ──
    redcandle: `
.................ww.
................rww..
...............rrw...
..............rrw....
.............rrw.....
............rrw......
...........rrw.......
..........rrw........
.........rrw.........
........rrw..........
.......rrw...........
......mrwm...........
.....mddm...........
......dd.............
.....dd..............
`,
    // ── THROWING AXE: Viking double-head ──
    axe: `
.....sssss...sssss.....
....smmmmssssmmmms.....
...smmm..ssss..mmms....
...sm.....ss.....ms....
..........ss...........
..........dd...........
..........dd...........
..........dd...........
.........dddd..........
`,
    // ── SUPPORT DRONES: Hexagonal body with wings ──
    drones: `
......gggggg......
.....gmmmmmmg.....
....gmdddwddmg....
....gmddwwddmg....
....gmdddwddmg....
.....gmmmmmmg.....
......gggggg......
..gg..........gg..
.gmmg........gmmg.
`,
    // ── PLASMA CANNON: Charged energy sphere ──
    plasmaCannon: `
.......pppppp.......
.....ppddddddpp....
...ppddmmmmmmddpp..
..ppdmwwwwwwwmdpp..
..ppdmwwppwwwmdpp..
..ppdmwwwwwwwmdpp..
...ppddmmmmmmddpp..
.....ppddddddpp....
.......pppppp.......
`,
    // ── RAILGUN: Long energy sniper ──
    railgun: `
............eee........
..........eeeee........
........eeeeeee........
......eeeeeeee.........
....mmeeedddddmm.......
...mddddeddddddm......
..mdddddddddddddm.....
...mmddddddddddm......
.....ndddddddn........
.......ndhdn...........
`,
    // ── GATLING SWARM: Triple rotating barrels ──
    gatlingSwarm: `
.....ddd.ddd.ddd.....
....GdddGdddGddd....
....ddddddddddddd...
...dddddddddddddd...
...dddddmmmdddddd...
....ddddddddddddd...
.....ddddddddddd....
......ndddddddn.....
`,
    // ── DRAGON'S BREATH: Fire-spewing cannon ──
    dragonBreath: `
....fffff..........
...fffoooo.........
..fffoommdddn......
..ffo..myddddn.....
...fo..myydddn.....
....o.mmddddn......
......nddddn.......
.......ndn.........
`,
    // ── GOD CANDLE BLADE: Massive green energy sword ──
    godCandleBlade: `
..................www.
.................GGww.
................GGGw..
...............GGGw...
..............GGGGw...
.............GGGGw....
............GGGGw.....
...........GGGGw......
..........GGGGw.......
.........GGGGw........
........GGGGw.........
.......GGGww..........
......mGGm............
.....mddm.............
......dd...............
.....dd................
`,
    // ── CHAIN LIGHTNING: Electrified axe ──
    chainLightning: `
.....yyyyy...yyyyy.....
....ymmmmyyyyymmmy.....
...ym...myyymy...my....
...y.....yyy......y....
..........yy...........
..........dd...........
..........dd...........
..........dd...........
.........dddd..........
`,
    // ── DRONE SWARM: Advanced golden drone ──
    droneSwarm: `
......cccccc......
.....cdddddddc....
....cdmwwwwwmdcc..
....cdmwwccwmdcc..
....cdmwwwwwmdcc..
.....cdddddddc....
......cccccc......
..cc..........cc..
.cmmcm......cmmc..
`
  };
== END OLD PIXEL ART CODE ==*/
