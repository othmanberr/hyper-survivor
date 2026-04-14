// ============ TOKYO PUNK BACKGROUNDS — DYNAMIC EFFECTS ============
let W = window.innerWidth, H = window.innerHeight;
window.addEventListener('resize', () => { W = window.innerWidth; H = window.innerHeight; });
const TILE_SIZE = 512;
const BG_TILE_CACHE = {};

// ============ IMAGE LOADING ============
const BG_IMG_TILES = {};
const BG_IMG_RAW = {};
const BG_IMG_SRCS = {
  stage0: 'assets/backgrounds/bg_stage1_graveyard.png?v=1',
  stage0full: 'assets/backgrounds/bg_stage1_full.jpg?v=1',
  stage1full: 'assets/backgrounds/bg_stage2_full.jpg?v=1',
  stage2full: 'assets/backgrounds/bg_stage3_full.jpg?v=1',
  stage3full: 'assets/backgrounds/bg_stage4_full.jpg?v=2',
  stage4full: 'assets/backgrounds/bg_stage5_full.jpg?v=1',
  stage5full: 'assets/backgrounds/bg_stage6_full.jpg?v=1',
  stage6full: 'assets/backgrounds/bg_stage7_full.jpg?v=1',
  stage7: 'assets/backgrounds/bg_stage8_tile.png',
  stage8full: 'assets/backgrounds/bg_stage9_full.jpg?v=1',
  stage9full: 'assets/backgrounds/bg_stage10_full.jpg?v=1',
  borderWall: 'assets/backgrounds/bg_border_wall.png?v=1'
};
let bgImgsLoaded = 0;
const BG_IMG_TOTAL = Object.keys(BG_IMG_SRCS).length;

function darkenImage(img, amount) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const cx = c.getContext('2d');
  cx.drawImage(img, 0, 0);
  cx.fillStyle = `rgba(0, 0, 0, ${amount})`;
  cx.fillRect(0, 0, c.width, c.height);
  return c;
}

Object.entries(BG_IMG_SRCS).forEach(([key, src]) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    BG_IMG_RAW[key] = img;
    if (key !== 'main') BG_IMG_TILES[key] = darkenImage(img, 0.25);
    bgImgsLoaded++;
  };
  img.onerror = () => { BG_IMG_TILES[key] = null; bgImgsLoaded++; };
});

// ============ SEEDED RANDOM ============
function _seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// ============ STAGE PALETTES ============
const STAGE_PALETTES = [
  { name: 'Neo Tokyo', accent: '#ff00aa', secondary: '#00ffdd', glow: 'rgba(255,0,170,0.15)' }, // Stage 0
  { name: 'Toxic Jungle', accent: '#00cc44', secondary: '#ffd700', glow: 'rgba(0,204,68,0.15)' }, // Stage 1
  { name: 'Penthouse', accent: '#ff00ff', secondary: '#00ffff', glow: 'rgba(255,0,255,0.15)' }, // Stage 2
  { name: 'Server Core', accent: '#0044ff', secondary: '#00ccff', glow: 'rgba(0,68,255,0.15)' }, // Stage 3
  { name: 'Supercycle Casino', accent: '#ff3366', secondary: '#33ff33', glow: 'rgba(255,51,102,0.15)' }, // Stage 4
  { name: 'Ruja Palace', accent: '#ffd700', secondary: '#333333', glow: 'rgba(255,215,0,0.15)' }, // Stage 5
  { name: 'Frozen Vault', accent: '#aaeeff', secondary: '#ffffff', glow: 'rgba(170,238,255,0.15)' }, // Stage 6
  { name: 'Fake Court', accent: '#ff6600', secondary: '#884400', glow: 'rgba(255,102,0,0.15)' }, // Stage 7
  { name: 'Tropical Matrix', accent: '#00eebb', secondary: '#005577', glow: 'rgba(0,238,187,0.15)' }, // Stage 8
  { name: 'The Citadel', accent: '#ffcc00', secondary: '#000000', glow: 'rgba(255,204,0,0.15)' } // Stage 9
];

// ============ LIGHT SHIMMER — scintillement des lumières ============
// Génère des spots lumineux par stage (positions en % du monde)
const STAGE_LIGHTS = (function () {
  const out = {};
  const P = STAGE_PALETTES;

  // Helper: parse hex color to [r,g,b]
  function hex(c) {
    const v = parseInt(c.replace('#', ''), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  // Helper: generate lights for a stage
  function gen(stage, count, cols, opts) {
    const rng = _seededRand(7777 + stage * 131);
    const lights = [];
    for (let i = 0; i < count; i++) {
      const col = cols[Math.floor(rng() * cols.length)];
      const big = rng() > 0.6;
      lights.push({
        x: 0.08 + rng() * 0.84,
        y: 0.05 + rng() * 0.90,
        rx: big ? 50 + rng() * 60 : 15 + rng() * 25,
        ry: big ? 35 + rng() * 45 : 10 + rng() * 20,
        col: col,
        speed: 0.6 + rng() * 2.0,
        phase: rng() * Math.PI * 2,
        flicker: rng() > 0.55,
        flickerSpeed: 5 + rng() * 10,
        ...(opts || {})
      });
    }
    return lights;
  }

  // Stage 0 — Neo Tokyo: néons roses + cyans
  out[0] = gen(0, 20, [hex(P[0].accent), hex(P[0].secondary), [255, 80, 200], [0, 200, 255]]);
  // Stage 1 — Toxic Jungle: lueurs vertes + dorées
  out[1] = gen(1, 18, [hex(P[1].accent), hex(P[1].secondary), [100, 255, 80], [200, 180, 0]]);
  // Stage 2 — Penthouse: néons magentas + cyans
  out[2] = gen(2, 22, [hex(P[2].accent), hex(P[2].secondary), [255, 100, 255], [0, 220, 255]]);
  // Stage 3 — Server Core: bleus + cyans intenses
  out[3] = gen(3, 25, [hex(P[3].accent), hex(P[3].secondary), [30, 100, 255], [0, 180, 255]]);
  // Stage 4 — Supercycle Casino: rouges + verts néon
  out[4] = gen(4, 22, [hex(P[4].accent), hex(P[4].secondary), [255, 50, 100], [50, 255, 50]]);
  // Stage 5 — Ruja Palace: dorés
  out[5] = gen(5, 16, [hex(P[5].accent), [255, 200, 80], [200, 170, 50]]);
  // Stage 6 — Frozen Vault: bleu glacé + blanc
  out[6] = gen(6, 18, [hex(P[6].accent), [200, 230, 255], [150, 200, 255]]);
  // Stage 7 — Fake Court: oranges
  out[7] = gen(7, 16, [hex(P[7].accent), [255, 140, 40], [200, 100, 20]]);
  // Stage 8 — Tropical Matrix: turquoise
  out[8] = gen(8, 20, [hex(P[8].accent), [0, 255, 200], [0, 180, 150]]);
  // Stage 9 — The Citadel: dorés intenses
  out[9] = gen(9, 18, [hex(P[9].accent), [255, 220, 50], [255, 180, 0]]);

  return out;
})();

function drawLightShimmer(ctx, stage, camX, camY) {
  const lights = STAGE_LIGHTS[stage];
  if (!lights) return;
  const time = typeof G !== 'undefined' ? G.totalTime || 0 : 0;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    const sx = l.x * WORLD_W - camX;
    const sy = l.y * WORLD_H - camY;
    const maxR = Math.max(l.rx, l.ry) * 1.5;

    // Culling
    if (sx + maxR < 0 || sx - maxR > W || sy + maxR < 0 || sy - maxR > H) continue;

    // Pulsation
    let intensity = 0.5 + Math.sin(time * l.speed + l.phase) * 0.35;

    // Flicker (néon qui grésille)
    if (l.flicker) {
      const f = Math.sin(time * l.flickerSpeed + l.phase * 2) * Math.sin(time * l.flickerSpeed * 1.7 + l.phase);
      if (f > 0.8) intensity *= 0.12;
      else if (f > 0.6) intensity *= 0.5;
    }

    const a = 0.07 * intensity;
    const c = l.col;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, maxR);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${(a * 2.5).toFixed(3)})`);
    g.addColorStop(0.25, `rgba(${c[0]},${c[1]},${c[2]},${(a * 1.5).toFixed(3)})`);
    g.addColorStop(0.6, `rgba(${c[0]},${c[1]},${c[2]},${(a * 0.4).toFixed(3)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx, sy, l.rx * 1.5, l.ry * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============ UNIQUE TILES PER STAGE (1-9) ============
function createBGTileForStage(stage) {
  const c = document.createElement('canvas');
  c.width = TILE_SIZE;
  c.height = TILE_SIZE;
  const ctx = c.getContext('2d');
  const S = TILE_SIZE;

  // Base background is always very dark
  ctx.fillStyle = '#030508';
  ctx.fillRect(0, 0, S, S);

  const pal = STAGE_PALETTES[stage] || STAGE_PALETTES[0];

  ctx.globalAlpha = 1;

  switch (stage) {
    case 1: { // Toxic Jungle — ICO Scrapyard 2017
      const r = _seededRand(1000);
      ctx.fillStyle = '#020a04'; ctx.fillRect(0, 0, S, S);

      // Circuit board traces (underlayer)
      ctx.strokeStyle = 'rgba(0,80,20,0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 25; i++) {
        const x1 = Math.floor(r() * S / 16) * 16;
        const y1 = Math.floor(r() * S / 16) * 16;
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (r() > 0.5) {
          const mx = x1 + Math.floor((r() - 0.5) * 12) * 16;
          ctx.lineTo(mx, y1);
          ctx.lineTo(mx, y1 + Math.floor((r() - 0.5) * 12) * 16);
        } else {
          const my = y1 + Math.floor((r() - 0.5) * 12) * 16;
          ctx.lineTo(x1, my);
          ctx.lineTo(x1 + Math.floor((r() - 0.5) * 12) * 16, my);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,120,30,0.3)';
        ctx.fillRect(x1 - 1, y1 - 1, 3, 3);
      }

      // Server rack silhouettes
      for (let i = 0; i < 5; i++) {
        const rx = Math.floor(r() * (S - 50)), ry = Math.floor(r() * (S - 120));
        const rw = 28 + Math.floor(r() * 22), rh = 60 + Math.floor(r() * 80);
        ctx.fillStyle = 'rgba(0,8,2,0.6)';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = 'rgba(0,50,15,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, rw, rh);
        for (let slot = 0; slot < Math.floor(rh / 12); slot++) {
          ctx.fillStyle = 'rgba(0,15,5,0.5)';
          ctx.fillRect(rx + 2, ry + 3 + slot * 12, rw - 4, 9);
          ctx.fillStyle = r() > 0.3 ? `rgba(0,${180 + Math.floor(r() * 75)},50,0.7)` : 'rgba(255,30,0,0.5)';
          ctx.fillRect(rx + rw - 6, ry + 5 + slot * 12, 2, 2);
        }
      }

      // Hanging cables (bezier curves)
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        const sx = r() * S;
        ctx.moveTo(sx, 0);
        ctx.bezierCurveTo(sx + (r() - 0.5) * 180, S * 0.25 + r() * 120, sx + (r() - 0.5) * 180, S * 0.55 + r() * 120, r() * S, S);
        ctx.strokeStyle = `rgba(0,${35 + Math.floor(r() * 70)},12,${0.15 + r() * 0.25})`;
        ctx.lineWidth = 2 + r() * 10;
        ctx.stroke();
      }

      // Toxic puddles with glow
      for (let i = 0; i < 10; i++) {
        const px = r() * S, py = r() * S;
        const prx = 15 + r() * 40, pry = 8 + r() * 20;
        const g = ctx.createRadialGradient(px, py, 0, px, py, prx);
        g.addColorStop(0, 'rgba(0,255,60,0.12)');
        g.addColorStop(0.5, 'rgba(0,180,30,0.05)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(px, py, prx, pry, r() * 0.5, 0, Math.PI * 2); ctx.fill();
      }

      // Toxic spores
      for (let i = 0; i < 70; i++) {
        const spx = r() * S, spy = r() * S, spr = 1 + r() * 6;
        ctx.globalAlpha = 0.15 + r() * 0.35;
        ctx.fillStyle = r() > 0.7 ? '#ffd700' : '#00cc44';
        ctx.beginPath(); ctx.arc(spx, spy, spr, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.04 + r() * 0.06;
        ctx.beginPath(); ctx.arc(spx, spy, spr * 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Metal debris
      for (let i = 0; i < 14; i++) {
        ctx.save(); ctx.translate(r() * S, r() * S); ctx.rotate(r() * Math.PI);
        ctx.globalAlpha = 0.15 + r() * 0.1;
        ctx.fillStyle = r() > 0.5 ? '#2a1a08' : '#1a1a1a';
        ctx.fillRect(0, 0, 15 + r() * 30, 3 + r() * 4);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 2: { // Penthouse / Yacht Club — NFTs
      const r = _seededRand(2000);
      ctx.fillStyle = '#0a020a'; ctx.fillRect(0, 0, S, S);

      // Holographic floor grid
      ctx.lineWidth = 1;
      for (let y = 0; y < S; y += 24) {
        ctx.strokeStyle = y % 96 === 0 ? 'rgba(255,0,255,0.12)' : 'rgba(255,0,255,0.04)';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
      }
      for (let x = 0; x < S; x += 24) {
        ctx.strokeStyle = x % 96 === 0 ? 'rgba(0,255,255,0.12)' : 'rgba(0,255,255,0.04)';
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke();
      }

      // NFT picture frames (golden double-bordered rectangles)
      for (let i = 0; i < 6; i++) {
        const fx = 20 + Math.floor(r() * (S - 100)), fy = 20 + Math.floor(r() * (S - 100));
        const fw = 40 + Math.floor(r() * 50), fh = 40 + Math.floor(r() * 60);
        ctx.strokeStyle = 'rgba(255,200,50,0.35)'; ctx.lineWidth = 3;
        ctx.strokeRect(fx, fy, fw, fh);
        ctx.strokeStyle = 'rgba(255,180,30,0.2)'; ctx.lineWidth = 1;
        ctx.strokeRect(fx + 5, fy + 5, fw - 10, fh - 10);
        ctx.fillStyle = `rgba(${Math.floor(r() * 60)},${Math.floor(r() * 20)},${Math.floor(r() * 60)},0.4)`;
        ctx.fillRect(fx + 6, fy + 6, fw - 12, fh - 12);
        ctx.fillStyle = `rgba(${Math.floor(r() * 255)},0,${Math.floor(r() * 255)},0.15)`;
        ctx.fillRect(fx + 6, fy + 6 + Math.floor(r() * (fh - 14)), fw - 12, 3);
      }

      // Digital vines with diamond leaves
      for (let i = 0; i < 10; i++) {
        const vx = r() * S;
        ctx.beginPath(); ctx.moveTo(vx, 0);
        const cp1x = vx + (r() - 0.5) * 150, cp2x = vx + (r() - 0.5) * 150;
        ctx.bezierCurveTo(cp1x, S * 0.3, cp2x, S * 0.7, r() * S, S);
        ctx.strokeStyle = `rgba(200,0,${150 + Math.floor(r() * 105)},${0.1 + r() * 0.15})`;
        ctx.lineWidth = 1 + r() * 3; ctx.stroke();
        for (let j = 0; j < 3; j++) {
          const t = 0.2 + r() * 0.6;
          const lx = vx + (cp1x - vx) * t + (r() - 0.5) * 30, ly = S * t;
          ctx.fillStyle = `rgba(180,0,255,${0.15 + r() * 0.15})`;
          ctx.beginPath();
          ctx.moveTo(lx, ly - 5); ctx.lineTo(lx + 4, ly); ctx.lineTo(lx, ly + 5); ctx.lineTo(lx - 4, ly);
          ctx.closePath(); ctx.fill();
        }
      }

      // Champagne bubbles
      for (let i = 0; i < 35; i++) {
        const bx = r() * S, by = r() * S, br = 1 + r() * 5;
        ctx.globalAlpha = 0.1 + r() * 0.2;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,200,0.3)';
        ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Broken pixel blocks
      for (let i = 0; i < 20; i++) {
        ctx.globalAlpha = 0.1 + r() * 0.15;
        const cols = ['#ff00ff', '#00ffff', '#ff0066', '#6600ff', '#00ff66'];
        ctx.fillStyle = cols[Math.floor(r() * cols.length)];
        ctx.fillRect(Math.floor(r() * S / 8) * 8, Math.floor(r() * S / 8) * 8, 8 + Math.floor(r() * 3) * 8, 8);
      }
      ctx.globalAlpha = 1;

      // Floor reflections
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.04 + r() * 0.04;
        ctx.fillStyle = r() > 0.5 ? '#ff00ff' : '#00ffff';
        ctx.fillRect(0, Math.floor(r() * S), S, 2 + Math.floor(r() * 6));
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 3: { // Server Core / Penthouses — Influencers
      const r = _seededRand(3000);
      ctx.fillStyle = '#020510'; ctx.fillRect(0, 0, S, S);

      // Skyscraper silhouettes with windows
      for (let i = 0; i < 8; i++) {
        const bx = Math.floor(r() * (S - 60)), by = Math.floor(r() * S * 0.3);
        const bw = 40 + Math.floor(r() * 50), bh = S - by;
        ctx.fillStyle = 'rgba(5,8,20,0.5)';
        ctx.fillRect(bx, by, bw, bh);
        for (let wy = by + 8; wy < by + bh - 8; wy += 12) {
          for (let wx = bx + 5; wx < bx + bw - 5; wx += 10) {
            if (r() > 0.4) {
              ctx.fillStyle = r() > 0.7 ? 'rgba(255,230,140,0.4)' : 'rgba(100,180,255,0.25)';
              ctx.fillRect(wx, wy, 6, 7);
            }
          }
        }
      }

      // Holographic screens
      for (let i = 0; i < 7; i++) {
        const sx = Math.floor(r() * (S - 80)), sy = Math.floor(r() * (S - 50));
        const sw = 50 + Math.floor(r() * 60), sh = 25 + Math.floor(r() * 35);
        const g = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, sw);
        g.addColorStop(0, 'rgba(0,80,255,0.06)'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(sx - 20, sy - 20, sw + 40, sh + 40);
        ctx.fillStyle = 'rgba(0,40,120,0.15)'; ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = 'rgba(0,150,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, sw, sh);
        for (let line = 0; line < 3; line++) {
          ctx.fillStyle = `rgba(0,${120 + Math.floor(r() * 135)},255,0.15)`;
          ctx.fillRect(sx + 4, sy + 4 + line * 8, sw * (0.3 + r() * 0.6), 2);
        }
      }

      // Data cascade (vertical gradient bars)
      for (let i = 0; i < 25; i++) {
        const dx = Math.floor(r() * S), dw = 2 + Math.floor(r() * 6);
        const dy = Math.floor(r() * S), dh = 30 + Math.floor(r() * 120);
        const g = ctx.createLinearGradient(0, dy, 0, dy + dh);
        g.addColorStop(0, 'rgba(0,180,255,0.25)');
        g.addColorStop(0.5, 'rgba(0,100,255,0.1)');
        g.addColorStop(1, 'rgba(0,50,200,0)');
        ctx.fillStyle = g; ctx.fillRect(dx, dy, dw, dh);
      }

      // Light beams (angled triangles)
      for (let i = 0; i < 4; i++) {
        const lx = r() * S;
        ctx.globalAlpha = 0.04 + r() * 0.03;
        ctx.fillStyle = '#4488ff';
        ctx.beginPath(); ctx.moveTo(lx, 0);
        ctx.lineTo(lx - 30 - r() * 40, S); ctx.lineTo(lx + 30 + r() * 40, S);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Notification dots
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = 'rgba(255,40,40,0.4)';
        ctx.beginPath(); ctx.arc(r() * S, r() * S, 2 + r() * 3, 0, Math.PI * 2); ctx.fill();
      }

      // Connection lines
      ctx.strokeStyle = 'rgba(0,120,255,0.08)'; ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath(); ctx.moveTo(r() * S, r() * S); ctx.lineTo(r() * S, r() * S); ctx.stroke();
      }
      break;
    }

    case 4: { // Supercycle Casino — Death Spiral
      const r = _seededRand(4000);
      ctx.fillStyle = '#0d0205'; ctx.fillRect(0, 0, S, S);

      // Diamond carpet pattern
      ctx.globalAlpha = 0.06;
      for (let y = 0; y < S; y += 32) {
        for (let x = 0; x < S; x += 32) {
          ctx.fillStyle = ((x / 32 + y / 32) % 2 === 0) ? '#ff3366' : '#1a0008';
          ctx.beginPath();
          ctx.moveTo(x + 16, y); ctx.lineTo(x + 32, y + 16);
          ctx.lineTo(x + 16, y + 32); ctx.lineTo(x, y + 16);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Roulette arcs
      for (let i = 0; i < 4; i++) {
        const cx = r() * S, cy = r() * S, radius = 40 + r() * 80;
        const segments = 8 + Math.floor(r() * 12);
        for (let seg = 0; seg < segments; seg++) {
          const a1 = (seg / segments) * Math.PI * 2;
          const a2 = ((seg + 0.8) / segments) * Math.PI * 2;
          ctx.beginPath(); ctx.arc(cx, cy, radius, a1, a2);
          ctx.arc(cx, cy, radius * 0.7, a2, a1, true); ctx.closePath();
          ctx.fillStyle = seg % 2 === 0 ? 'rgba(255,51,102,0.12)' : 'rgba(51,255,51,0.08)';
          ctx.fill();
        }
      }

      // Card symbols
      const symbols = ['\u2660', '\u2665', '\u2666', '\u2663'];
      const symCols = ['rgba(200,200,220,0.12)', 'rgba(255,50,80,0.15)', 'rgba(255,50,80,0.12)', 'rgba(200,200,220,0.12)'];
      for (let i = 0; i < 25; i++) {
        const si = Math.floor(r() * 4);
        ctx.fillStyle = symCols[si];
        ctx.font = `${14 + Math.floor(r() * 20)}px serif`;
        ctx.fillText(symbols[si], r() * S, r() * S);
      }

      // Neon border rectangles
      for (let i = 0; i < 6; i++) {
        const nx = Math.floor(r() * (S - 60)), ny = Math.floor(r() * (S - 40));
        const nw = 30 + Math.floor(r() * 50), nh = 20 + Math.floor(r() * 30);
        const col = r() > 0.5 ? 'rgba(255,51,102,' : 'rgba(51,255,51,';
        ctx.strokeStyle = col + '0.08)'; ctx.lineWidth = 8; ctx.strokeRect(nx, ny, nw, nh);
        ctx.strokeStyle = col + '0.25)'; ctx.lineWidth = 2; ctx.strokeRect(nx, ny, nw, nh);
      }

      // Casino chips
      for (let i = 0; i < 10; i++) {
        const cx = r() * S, cy = r() * S, cr = 8 + r() * 12;
        ctx.globalAlpha = 0.2 + r() * 0.15;
        ctx.strokeStyle = r() > 0.5 ? '#ff3366' : '#33ff33';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, cr * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - cr * 0.4, cy); ctx.lineTo(cx + cr * 0.4, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - cr * 0.4); ctx.lineTo(cx, cy + cr * 0.4); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Subtle neon border
      ctx.strokeStyle = 'rgba(255,51,102,0.06)'; ctx.lineWidth = 15; ctx.strokeRect(0, 0, S, S);
      break;
    }

    case 5: { // Ruja Palace — OneCoin, gold/void
      const r = _seededRand(5000);
      ctx.fillStyle = '#050400'; ctx.fillRect(0, 0, S, S);

      // Marble tile grid with veins
      ctx.strokeStyle = 'rgba(80,70,40,0.08)'; ctx.lineWidth = 1;
      for (let y = 0; y < S; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke(); }
      for (let x = 0; x < S; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(60,50,25,0.06)';
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        let vx = r() * S, vy = r() * S; ctx.moveTo(vx, vy);
        for (let j = 0; j < 6; j++) { vx += (r() - 0.5) * 80; vy += (r() - 0.5) * 80; ctx.lineTo(vx, vy); }
        ctx.stroke();
      }

      // Ornate columns
      for (let i = 0; i < 5; i++) {
        const cx = Math.floor(r() * (S - 30)), colW = 14 + Math.floor(r() * 10);
        ctx.strokeStyle = 'rgba(200,170,50,0.2)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + colW, 0); ctx.lineTo(cx + colW, S); ctx.stroke();
        ctx.fillStyle = 'rgba(200,170,50,0.15)';
        const capY = Math.floor(r() * 40);
        ctx.fillRect(cx - 4, capY, colW + 8, 6);
        ctx.fillRect(cx - 2, capY + 6, colW + 4, 4);
        const baseY = S - 10 - Math.floor(r() * 30);
        ctx.fillRect(cx - 4, baseY, colW + 8, 6);
      }

      // Filigree arabesques
      ctx.strokeStyle = 'rgba(200,170,50,0.1)'; ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const fx = r() * S, fy = r() * S, fr = 20 + r() * 40;
        ctx.beginPath(); ctx.arc(fx, fy, fr, r() * Math.PI, r() * Math.PI + Math.PI * (0.5 + r())); ctx.stroke();
        ctx.beginPath(); ctx.arc(fx, fy, fr * 0.7, r() * Math.PI, r() * Math.PI + Math.PI * (0.5 + r())); ctx.stroke();
      }

      // Chandeliers
      for (let i = 0; i < 6; i++) {
        const chx = r() * S, chy = r() * S * 0.4;
        ctx.strokeStyle = 'rgba(180,150,40,0.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(chx, 0); ctx.lineTo(chx, chy); ctx.stroke();
        for (let l = 0; l < 8; l++) {
          ctx.globalAlpha = 0.2 + r() * 0.3;
          ctx.fillStyle = '#ffd700';
          ctx.beginPath(); ctx.arc(chx + (r() - 0.5) * 20, chy + (r() - 0.5) * 15, 1 + r() * 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Golden diamonds with highlights
      for (let y = 32; y < S; y += 64) {
        for (let x = 32; x < S; x += 64) {
          if (r() > 0.5) continue;
          const ds = 8 + r() * 10;
          ctx.globalAlpha = 0.3 + r() * 0.2;
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.moveTo(x, y - ds); ctx.lineTo(x + ds, y); ctx.lineTo(x, y + ds); ctx.lineTo(x - ds, y);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,200,0.3)';
          ctx.beginPath();
          ctx.moveTo(x, y - ds * 0.6); ctx.lineTo(x + ds * 0.3, y);
          ctx.lineTo(x, y + ds * 0.2); ctx.lineTo(x - ds * 0.3, y - ds * 0.2);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Vault doors
      for (let i = 0; i < 2; i++) {
        const vx = r() * S, vy = r() * S, vr = 25 + r() * 30;
        ctx.strokeStyle = 'rgba(180,150,40,0.15)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(vx, vy, vr, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(vx - vr * 0.5, vy); ctx.lineTo(vx + vr * 0.5, vy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx, vy - vr * 0.5); ctx.lineTo(vx, vy + vr * 0.5); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(vx, vy, vr * 0.6, 0, Math.PI * 2); ctx.stroke();
      }
      break;
    }

    case 6: { // Frozen Vault — Celsius, ice
      const r = _seededRand(6000);
      ctx.fillStyle = '#050a10'; ctx.fillRect(0, 0, S, S);

      // Ice mist at bottom
      const mistG = ctx.createLinearGradient(0, S * 0.7, 0, S);
      mistG.addColorStop(0, 'transparent');
      mistG.addColorStop(1, 'rgba(120,180,220,0.06)');
      ctx.fillStyle = mistG; ctx.fillRect(0, S * 0.7, S, S * 0.3);

      // Cracked surface (white line network)
      ctx.strokeStyle = 'rgba(180,220,255,0.1)'; ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        let cx = r() * S, cy = r() * S;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        for (let b = 0; b < 3 + Math.floor(r() * 4); b++) {
          cx += (r() - 0.5) * 80; cy += (r() - 0.5) * 80; ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        for (let b = 0; b < 2; b++) {
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + (r() - 0.5) * 40, cy + (r() - 0.5) * 40); ctx.stroke();
        }
      }

      // Stalactites from top
      for (let i = 0; i < 18; i++) {
        const sx = r() * S, sLen = 20 + r() * 60, sW = 4 + r() * 12;
        ctx.globalAlpha = 0.15 + r() * 0.2;
        ctx.fillStyle = r() > 0.5 ? '#8cc8e0' : '#6aaccc';
        ctx.beginPath();
        ctx.moveTo(sx - sW / 2, 0); ctx.lineTo(sx + sW / 2, 0);
        ctx.lineTo(sx + (r() - 0.5) * 4, sLen); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Ice crystals (faceted pentagons)
      for (let i = 0; i < 40; i++) {
        const ix = r() * S, iy = r() * S, ir = 5 + r() * 20;
        ctx.globalAlpha = 0.12 + r() * 0.15;
        ctx.fillStyle = r() > 0.3 ? '#aaeeff' : '#ddf4ff';
        ctx.beginPath();
        ctx.moveTo(ix, iy - ir);
        ctx.lineTo(ix + ir * 0.5, iy - ir * 0.2);
        ctx.lineTo(ix + ir * 0.4, iy + ir * 0.6);
        ctx.lineTo(ix - ir * 0.4, iy + ir * 0.6);
        ctx.lineTo(ix - ir * 0.5, iy - ir * 0.2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(220,240,255,0.2)'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(ix - ir * 0.3, iy - ir * 0.1);
        ctx.lineTo(ix + ir * 0.3, iy + ir * 0.3); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Frost branches (simple fractal)
      const _drawFrost = (x, y, angle, len, depth) => {
        if (depth <= 0 || len < 3) return;
        const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len;
        ctx.globalAlpha = 0.08 + depth * 0.04;
        ctx.strokeStyle = '#c8e8ff'; ctx.lineWidth = depth * 0.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        _drawFrost(ex, ey, angle - 0.5 - r() * 0.3, len * 0.65, depth - 1);
        _drawFrost(ex, ey, angle + 0.5 + r() * 0.3, len * 0.65, depth - 1);
      };
      for (let i = 0; i < 8; i++) {
        _drawFrost(r() * S, r() * S, -Math.PI / 2 + (r() - 0.5), 20 + r() * 30, 3);
      }
      ctx.globalAlpha = 1;

      // Frozen coins
      ctx.textAlign = 'center';
      for (let i = 0; i < 6; i++) {
        const cx = r() * S, cy = r() * S, cr = 8 + r() * 10;
        ctx.strokeStyle = 'rgba(150,210,240,0.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(120,180,210,0.2)';
        ctx.font = `${Math.floor(cr * 1.2)}px monospace`;
        ctx.fillText('$', cx, cy + cr * 0.35);
      }
      ctx.textAlign = 'start';

      // Snowflakes (6-pointed stars)
      for (let i = 0; i < 20; i++) {
        const fx = r() * S, fy = r() * S, fr = 2 + r() * 5;
        ctx.globalAlpha = 0.15 + r() * 0.2;
        ctx.strokeStyle = '#ddeeff'; ctx.lineWidth = 0.5;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(fx, fy);
          ctx.lineTo(fx + Math.cos(angle) * fr, fy + Math.sin(angle) * fr); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 7: { // Fake Court — Craig Wright, tribunal
      const r = _seededRand(7000);
      ctx.fillStyle = '#0f0502'; ctx.fillRect(0, 0, S, S);

      // Wood plank floor (improved)
      for (let y = 0; y < S; y += 28) {
        ctx.fillStyle = `rgba(26,${10 + Math.floor(r() * 8)},${4 + Math.floor(r() * 4)},${0.5 + r() * 0.3})`;
        ctx.fillRect(0, y + 2, S, 24);
        ctx.strokeStyle = `rgba(40,20,8,${0.02 + r() * 0.03})`; ctx.lineWidth = 0.5;
        for (let g = 0; g < 3; g++) {
          const gy = y + 4 + r() * 18;
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(S, gy + (r() - 0.5) * 3); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(5,2,0,0.4)'; ctx.fillRect(0, y, S, 2);
      }

      // Scattered documents
      for (let i = 0; i < 12; i++) {
        ctx.save(); ctx.translate(r() * S, r() * S); ctx.rotate((r() - 0.5) * 0.8);
        const dw = 18 + r() * 25, dh = 22 + r() * 30;
        ctx.globalAlpha = 0.12 + r() * 0.08;
        ctx.fillStyle = r() > 0.3 ? '#e8dcc8' : '#f0e8d8';
        ctx.fillRect(0, 0, dw, dh);
        ctx.fillStyle = 'rgba(40,30,20,0.2)';
        for (let line = 0; line < 4; line++) ctx.fillRect(2, 3 + line * 5, dw * (0.4 + r() * 0.5), 1);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Scales of justice
      for (let i = 0; i < 2; i++) {
        const jx = r() * S, jy = r() * S;
        ctx.strokeStyle = 'rgba(180,140,60,0.12)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(jx, jy - 30); ctx.lineTo(jx, jy + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(jx - 25, jy - 25); ctx.lineTo(jx + 25, jy - 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(jx - 25, jy - 25); ctx.lineTo(jx - 30, jy - 10); ctx.lineTo(jx - 20, jy - 10); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(jx + 25, jy - 25); ctx.lineTo(jx + 30, jy - 10); ctx.lineTo(jx + 20, jy - 10); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(jx - 12, jy + 30); ctx.lineTo(jx + 12, jy + 30); ctx.stroke();
      }

      // Flames
      for (let i = 0; i < 30; i++) {
        const fx = r() * S, fy = S * 0.5 + r() * S * 0.5, fSize = 3 + r() * 10;
        ctx.globalAlpha = 0.06 + r() * 0.06;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize * 2);
        fg.addColorStop(0, 'rgba(255,100,0,0.2)'); fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(fx, fy, fSize * 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.3 + r() * 0.3;
        ctx.fillStyle = r() > 0.5 ? '#ff6600' : '#ff4400';
        ctx.beginPath(); ctx.arc(fx, fy, fSize, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,100,0.6)';
        ctx.beginPath(); ctx.arc(fx, fy, fSize * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Official stamps
      for (let i = 0; i < 5; i++) {
        const sx = r() * S, sy = r() * S, sr = 10 + r() * 12;
        ctx.globalAlpha = 0.1 + r() * 0.08;
        ctx.strokeStyle = '#cc4400'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sx, sy, sr * 0.75, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Stacked books
      for (let i = 0; i < 4; i++) {
        const bx = Math.floor(r() * (S - 30)), by = Math.floor(r() * (S - 50));
        const bookColors = ['#552200', '#003344', '#440022', '#224400', '#332200'];
        for (let b = 0; b < 3 + Math.floor(r() * 3); b++) {
          ctx.globalAlpha = 0.2 + r() * 0.1;
          ctx.fillStyle = bookColors[Math.floor(r() * bookColors.length)];
          ctx.fillRect(bx, by + b * 6, 20 + r() * 15, 5);
        }
      }
      ctx.globalAlpha = 1;

      // Floating ash
      for (let i = 0; i < 40; i++) {
        ctx.globalAlpha = 0.1 + r() * 0.15;
        ctx.fillStyle = r() > 0.6 ? '#888' : '#aa6633';
        ctx.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 8: { // Tropical Matrix — Bahamas, FTX
      const r = _seededRand(8000);
      ctx.fillStyle = '#020d11'; ctx.fillRect(0, 0, S, S);

      // Night sky stars (top portion)
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = 0.1 + r() * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(r() * S, r() * S * 0.5, 0.5 + r() * 2, 0.5 + r() * 2);
      }
      ctx.globalAlpha = 1;

      // Ocean waves (multi-layered)
      for (let layer = 0; layer < 5; layer++) {
        const layerY = S * 0.3 + layer * 40;
        ctx.strokeStyle = `rgba(0,${180 + layer * 15},${180 + layer * 10},${0.08 + layer * 0.02})`;
        ctx.lineWidth = 2 + layer;
        ctx.beginPath();
        for (let x = 0; x <= S; x += 8) {
          const y = layerY + Math.sin(x * 0.02 + layer * 1.5) * (8 + layer * 3) + Math.sin(x * 0.05 + layer * 0.7) * 3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Sand texture (bottom portion)
      for (let i = 0; i < 200; i++) {
        const sandY = S * 0.75 + r() * S * 0.25;
        ctx.globalAlpha = 0.05 + r() * 0.08 * ((sandY - S * 0.75) / (S * 0.25));
        ctx.fillStyle = r() > 0.5 ? '#c2a878' : '#a89060';
        ctx.fillRect(r() * S, sandY, 1 + r() * 2, 1 + r() * 2);
      }
      ctx.globalAlpha = 1;

      // Palm tree silhouettes
      for (let i = 0; i < 5; i++) {
        const px = r() * S, pBase = S * 0.6 + r() * S * 0.2;
        const pTop = pBase - 80 - r() * 60;
        ctx.strokeStyle = 'rgba(10,30,20,0.4)'; ctx.lineWidth = 4 + r() * 3;
        ctx.beginPath(); ctx.moveTo(px, pBase);
        ctx.quadraticCurveTo(px + (r() - 0.5) * 30, (pBase + pTop) / 2, px + (r() - 0.5) * 15, pTop);
        ctx.stroke();
        const topX = px + (r() - 0.5) * 15;
        ctx.strokeStyle = 'rgba(0,40,20,0.3)'; ctx.lineWidth = 2;
        for (let f = 0; f < 6; f++) {
          const fAngle = (f / 6) * Math.PI * 2, fLen = 25 + r() * 30;
          ctx.beginPath(); ctx.moveTo(topX, pTop);
          ctx.quadraticCurveTo(topX + Math.cos(fAngle) * fLen * 0.6, pTop + Math.sin(fAngle) * fLen * 0.3 - 10,
            topX + Math.cos(fAngle) * fLen, pTop + Math.sin(fAngle) * fLen * 0.5 + 10);
          ctx.stroke();
        }
      }

      // Data streams (vertical cyan)
      for (let i = 0; i < 15; i++) {
        const dx = r() * S, dy = r() * S, dh = 30 + r() * 100;
        ctx.globalAlpha = 0.08 + r() * 0.1;
        const dg = ctx.createLinearGradient(0, dy, 0, dy + dh);
        dg.addColorStop(0, 'rgba(0,238,187,0.3)'); dg.addColorStop(1, 'transparent');
        ctx.fillStyle = dg; ctx.fillRect(dx, dy, 2 + r() * 3, dh);
      }
      ctx.globalAlpha = 1;

      // Hidden server racks
      for (let i = 0; i < 3; i++) {
        const sx = Math.floor(r() * (S - 35)), sy = S * 0.5 + Math.floor(r() * S * 0.3);
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#0a1a1a';
        ctx.fillRect(sx, sy, 25 + r() * 15, 35 + r() * 25);
        for (let led = 0; led < 3; led++) {
          ctx.fillStyle = 'rgba(0,255,100,0.3)';
          ctx.fillRect(sx + 3, sy + 5 + led * 10, 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      // Corrupted holograms
      for (let i = 0; i < 12; i++) {
        ctx.globalAlpha = 0.08 + r() * 0.1;
        const cols = ['#00eebb', '#ff0066', '#0088ff', '#ff8800'];
        ctx.fillStyle = cols[Math.floor(r() * cols.length)];
        ctx.fillRect(Math.floor(r() * S / 8) * 8, Math.floor(r() * S / 8) * 8, 8 + Math.floor(r() * 4) * 8, 4 + Math.floor(r() * 2) * 4);
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 9: { // The Citadel — CZ, Binance, orbital station
      const r = _seededRand(9000);
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, S, S);

      // Nebula background
      const nebX = S * 0.3 + r() * S * 0.4, nebY = S * 0.3 + r() * S * 0.4;
      const nebG = ctx.createRadialGradient(nebX, nebY, 0, nebX, nebY, S * 0.5);
      nebG.addColorStop(0, 'rgba(40,10,60,0.12)');
      nebG.addColorStop(0.5, 'rgba(15,5,40,0.06)');
      nebG.addColorStop(1, 'transparent');
      ctx.fillStyle = nebG; ctx.fillRect(0, 0, S, S);

      // Station hull panels with rivets
      for (let i = 0; i < 8; i++) {
        const px = Math.floor(r() * (S - 80)), py = Math.floor(r() * (S - 60));
        const pw = 50 + Math.floor(r() * 70), ph = 30 + Math.floor(r() * 50);
        ctx.fillStyle = `rgba(${10 + Math.floor(r() * 8)},${10 + Math.floor(r() * 8)},${12 + Math.floor(r() * 8)},0.4)`;
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = 'rgba(80,80,90,0.2)'; ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(100,100,110,0.3)';
        const pad = 5;
        ctx.beginPath(); ctx.arc(px + pad, py + pad, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + pw - pad, py + pad, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + pad, py + ph - pad, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + pw - pad, py + ph - pad, 1.5, 0, Math.PI * 2); ctx.fill();
      }

      // Hazard stripes (improved)
      ctx.globalAlpha = 0.05;
      for (let i = -S; i < S * 2; i += 48) {
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + 20, 0); ctx.lineTo(i - S + 20, S); ctx.lineTo(i - S, S);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Cosmic stars (varied)
      for (let i = 0; i < 80; i++) {
        const sx = r() * S, sy = r() * S;
        const sSize = r() < 0.1 ? 2 + r() * 2 : 0.5 + r() * 1.5;
        ctx.globalAlpha = 0.2 + r() * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, sSize, sSize);
        if (r() > 0.85) {
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = r() > 0.5 ? '#aaccff' : '#ffddaa';
          ctx.beginPath(); ctx.arc(sx, sy, sSize + 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Orbital arcs
      for (let i = 0; i < 5; i++) {
        const ox = S * 0.3 + r() * S * 0.4, oy = S * 0.3 + r() * S * 0.4;
        const or = 50 + r() * 120, startA = r() * Math.PI * 2;
        const arcLen = Math.PI * (0.3 + r() * 0.8);
        ctx.strokeStyle = `rgba(${100 + Math.floor(r() * 100)},${100 + Math.floor(r() * 100)},${150 + Math.floor(r() * 105)},0.08)`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ox, oy, or, startA, startA + arcLen); ctx.stroke();
        const satA = startA + arcLen * r();
        ctx.fillStyle = 'rgba(255,200,50,0.3)';
        ctx.beginPath(); ctx.arc(ox + Math.cos(satA) * or, oy + Math.sin(satA) * or, 2, 0, Math.PI * 2); ctx.fill();
      }

      // Binance-style diamond logos
      for (let i = 0; i < 3; i++) {
        const lx = r() * S, ly = r() * S, ls = 10 + r() * 15;
        ctx.globalAlpha = 0.1 + r() * 0.1;
        ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, ly - ls); ctx.lineTo(lx + ls, ly);
        ctx.lineTo(lx, ly + ls); ctx.lineTo(lx - ls, ly);
        ctx.closePath(); ctx.stroke();
        const is = ls * 0.4;
        ctx.beginPath();
        ctx.moveTo(lx, ly - is); ctx.lineTo(lx + is, ly);
        ctx.lineTo(lx, ly + is); ctx.lineTo(lx - is, ly);
        ctx.closePath(); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Energy lightning
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(255,204,0,${0.08 + r() * 0.1})`;
        ctx.lineWidth = 1 + r();
        ctx.beginPath();
        let lx = r() * S, ly = r() * S;
        ctx.moveTo(lx, ly);
        for (let seg = 0; seg < 4 + Math.floor(r() * 4); seg++) {
          lx += (r() - 0.5) * 50; ly += 10 + r() * 30;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }

      // Yellow border glow
      ctx.strokeStyle = 'rgba(255,204,0,0.15)'; ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, S, S);
      break;
    }

    default: // Fallback generic matrix
      ctx.globalAlpha = 0.1;
      for (let y = 0; y < S; y += 24) { ctx.fillStyle = y % 48 === 0 ? '#1a2535' : '#10151f'; ctx.fillRect(0, y, S, 1); }
      for (let x = 0; x < S; x += 64) { ctx.fillStyle = '#0f1520'; ctx.fillRect(x, 0, 1, S); }
  }

  // Common dirt/grid overlay for all procedural tiles
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < S; y += 4) { ctx.fillStyle = '#000'; ctx.fillRect(0, y, S, 2); }

  ctx.globalAlpha = 1;
  return c;
}

function getBGTile(stage) {
  if (BG_TILE_CACHE[stage]) return BG_TILE_CACHE[stage];
  BG_TILE_CACHE[stage] = createBGTileForStage(stage);
  return BG_TILE_CACHE[stage];
}

// ============ DYNAMIC NEON GLOW SPOTS ============
// These are positioned where the neon signs are in the bg_tokyo image
// Positions are in world-space (0..WORLD_W, 0..WORLD_H = 2560x1440)
const NEON_SIGNS = [];
(function () {
  const rng = _seededRand(4242);
  const neonData = [
    // Top edge — buildings
    { x: 0.08, y: 0.04, col: [255, 0, 200], rx: 120, ry: 60, speed: 1.2 },
    { x: 0.22, y: 0.06, col: [0, 255, 220], rx: 100, ry: 50, speed: 0.8 },
    { x: 0.42, y: 0.03, col: [255, 180, 0], rx: 90, ry: 45, speed: 1.5 },
    { x: 0.58, y: 0.05, col: [255, 50, 180], rx: 110, ry: 55, speed: 1.0 },
    { x: 0.78, y: 0.04, col: [0, 255, 200], rx: 130, ry: 65, speed: 0.9 },
    { x: 0.92, y: 0.06, col: [255, 100, 0], rx: 100, ry: 50, speed: 1.3 },
    // Bottom edge
    { x: 0.10, y: 0.94, col: [0, 220, 255], rx: 110, ry: 55, speed: 1.1 },
    { x: 0.30, y: 0.96, col: [255, 0, 180], rx: 120, ry: 60, speed: 0.7 },
    { x: 0.50, y: 0.95, col: [255, 200, 0], rx: 90, ry: 50, speed: 1.4 },
    { x: 0.70, y: 0.93, col: [0, 255, 180], rx: 100, ry: 50, speed: 1.0 },
    { x: 0.88, y: 0.95, col: [255, 80, 200], rx: 130, ry: 65, speed: 0.85 },
    // Left edge
    { x: 0.04, y: 0.20, col: [255, 50, 200], rx: 60, ry: 100, speed: 1.2 },
    { x: 0.05, y: 0.40, col: [0, 255, 220], rx: 55, ry: 110, speed: 0.9 },
    { x: 0.03, y: 0.60, col: [255, 140, 0], rx: 65, ry: 120, speed: 1.1 },
    { x: 0.06, y: 0.80, col: [0, 200, 255], rx: 50, ry: 90, speed: 1.3 },
    // Right edge
    { x: 0.95, y: 0.18, col: [0, 255, 200], rx: 60, ry: 100, speed: 0.8 },
    { x: 0.96, y: 0.38, col: [255, 0, 180], rx: 55, ry: 110, speed: 1.4 },
    { x: 0.94, y: 0.58, col: [255, 180, 50], rx: 65, ry: 120, speed: 1.0 },
    { x: 0.97, y: 0.78, col: [0, 255, 150], rx: 50, ry: 90, speed: 0.7 },
    // Corner glows
    { x: 0.06, y: 0.06, col: [255, 0, 180], rx: 140, ry: 140, speed: 0.6 },
    { x: 0.94, y: 0.06, col: [0, 255, 220], rx: 140, ry: 140, speed: 0.5 },
    { x: 0.06, y: 0.94, col: [0, 220, 255], rx: 140, ry: 140, speed: 0.7 },
    { x: 0.94, y: 0.94, col: [255, 180, 0], rx: 140, ry: 140, speed: 0.55 },
  ];
  neonData.forEach(n => {
    NEON_SIGNS.push({
      x: n.x * WORLD_W, y: n.y * WORLD_H,
      rx: n.rx, ry: n.ry,
      col: n.col, speed: n.speed,
      phase: rng() * Math.PI * 2,
      flicker: rng() > 0.7, // some signs flicker
      flickerSpeed: 3 + rng() * 8,
    });
  });
})();

function _drawNeonGlows(ctx, camX, camY) {
  const time = typeof G !== 'undefined' ? G.totalTime || 0 : 0;
  ctx.globalCompositeOperation = 'screen';
  for (const n of NEON_SIGNS) {
    const sx = n.x - camX, sy = n.y - camY;
    if (sx + n.rx * 2 < 0 || sx - n.rx * 2 > W || sy + n.ry * 2 < 0 || sy - n.ry * 2 > H) continue;

    // Pulse intensity
    let intensity = 0.5 + Math.sin(time * n.speed + n.phase) * 0.3;

    // Flicker effect for some signs
    if (n.flicker) {
      const flick = Math.sin(time * n.flickerSpeed) * Math.sin(time * n.flickerSpeed * 1.7);
      if (flick > 0.8) intensity *= 0.15; // brief dark flicker
    }

    const alpha = 0.08 * intensity;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, n.rx * 1.5);
    g.addColorStop(0, `rgba(${n.col[0]}, ${n.col[1]}, ${n.col[2]}, ${alpha * 2})`);
    g.addColorStop(0.3, `rgba(${n.col[0]}, ${n.col[1]}, ${n.col[2]}, ${alpha})`);
    g.addColorStop(0.7, `rgba(${n.col[0]}, ${n.col[1]}, ${n.col[2]}, ${alpha * 0.3})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(sx, sy, n.rx * 1.5, n.ry * 1.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ============ ANIMATED STEAM/FOG ============
const STEAM_VENTS = [];
(function () {
  const rng = _seededRand(7777);
  // Steam mostly along building edges
  for (let i = 0; i < 25; i++) {
    const edge = Math.floor(rng() * 4);
    let x, y;
    if (edge === 0) { x = rng() * WORLD_W; y = rng() * WORLD_H * 0.12; } // top
    else if (edge === 1) { x = rng() * WORLD_W; y = WORLD_H * 0.88 + rng() * WORLD_H * 0.12; } // bottom
    else if (edge === 2) { x = rng() * WORLD_W * 0.12; y = rng() * WORLD_H; } // left
    else { x = WORLD_W * 0.88 + rng() * WORLD_W * 0.12; y = rng() * WORLD_H; } // right
    STEAM_VENTS.push({
      x, y, size: 40 + rng() * 100,
      speed: 0.5 + rng() * 1.5, phase: rng() * Math.PI * 2,
      alpha: 0.04 + rng() * 0.06
    });
  }
})();

function _drawSteam(ctx, camX, camY) {
  const time = typeof G !== 'undefined' ? G.totalTime || 0 : 0;
  for (const s of STEAM_VENTS) {
    const driftX = Math.sin(time * s.speed * 0.3 + s.phase) * 25;
    const driftY = Math.cos(time * s.speed * 0.2 + s.phase) * 15 - time * 3 % s.size;
    const sx = s.x + driftX - camX, sy = s.y + driftY - camY;
    if (sx + s.size < -20 || sx - s.size > W + 20 || sy + s.size < -20 || sy - s.size > H + 20) continue;

    const pulse = 0.7 + Math.sin(time * s.speed + s.phase) * 0.3;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * pulse);
    g.addColorStop(0, `rgba(180, 200, 220, ${s.alpha * pulse})`);
    g.addColorStop(0.4, `rgba(160, 180, 200, ${s.alpha * pulse * 0.4})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, s.size * pulse, 0, Math.PI * 2); ctx.fill();
  }
}

// ============ NEON GROUND REFLECTIONS ============
const NEON_REFLECTIONS = [];
(function () {
  const rng = _seededRand(3333);
  const cols = [[255, 0, 200], [0, 255, 220], [255, 180, 0], [0, 200, 255], [255, 80, 180], [0, 255, 150]];
  for (let i = 0; i < 20; i++) {
    NEON_REFLECTIONS.push({
      x: 200 + rng() * (WORLD_W - 400),
      y: 200 + rng() * (WORLD_H - 400),
      rx: 40 + rng() * 80, ry: 20 + rng() * 40,
      col: cols[Math.floor(rng() * cols.length)],
      intensity: 0.03 + rng() * 0.04,
      pulse: rng() * Math.PI * 2,
    });
  }
})();

function _drawNeonReflections(ctx, camX, camY) {
  const time = typeof G !== 'undefined' ? G.totalTime || 0 : 0;
  for (const r of NEON_REFLECTIONS) {
    const sx = r.x - camX, sy = r.y - camY;
    if (sx + r.rx < 0 || sx - r.rx > W || sy + r.ry < 0 || sy - r.ry > H) continue;

    const pulse = 1 + Math.sin(time * 1.2 + r.pulse) * 0.2;
    const alpha = r.intensity * pulse;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r.rx);
    g.addColorStop(0, `rgba(${r.col[0]}, ${r.col[1]}, ${r.col[2]}, ${alpha})`);
    g.addColorStop(0.6, `rgba(${r.col[0]}, ${r.col[1]}, ${r.col[2]}, ${alpha * 0.3})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(sx, sy, r.rx, r.ry, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// ============ PUDDLES WITH ANIMATED RIPPLES ============
const WORLD_PUDDLES = [];
const PUDDLE_RIPPLES = [];
(function () {
  const rng = _seededRand(8888);
  const cols = [[255, 0, 200], [0, 255, 220], [0, 180, 255], [255, 150, 0], [120, 80, 255]];
  for (let i = 0; i < 30; i++) {
    WORLD_PUDDLES.push({
      x: 250 + rng() * (WORLD_W - 500), y: 250 + rng() * (WORLD_H - 500),
      rx: 20 + rng() * 50, ry: 12 + rng() * 30,
      angle: (rng() - 0.5) * 0.4,
      col: cols[Math.floor(rng() * cols.length)],
      depth: 0.4 + rng() * 0.6,
    });
  }
})();

function _updateRipples(dt) {
  if (Math.random() > 0.5) return;
  const p = WORLD_PUDDLES[Math.floor(Math.random() * WORLD_PUDDLES.length)];
  const a = Math.random() * Math.PI * 2, d = Math.random() * 0.7;
  PUDDLE_RIPPLES.push({
    x: p.x + Math.cos(a) * p.rx * d, y: p.y + Math.sin(a) * p.ry * d,
    r: 0, maxR: 4 + Math.random() * 10, life: 0.4 + Math.random() * 0.3, maxLife: 0.4 + Math.random() * 0.3, col: p.col
  });
  for (let i = PUDDLE_RIPPLES.length - 1; i >= 0; i--) {
    PUDDLE_RIPPLES[i].life -= dt;
    PUDDLE_RIPPLES[i].r = PUDDLE_RIPPLES[i].maxR * (1 - PUDDLE_RIPPLES[i].life / PUDDLE_RIPPLES[i].maxLife);
    if (PUDDLE_RIPPLES[i].life <= 0) PUDDLE_RIPPLES.splice(i, 1);
  }
  while (PUDDLE_RIPPLES.length > 50) PUDDLE_RIPPLES.shift();
}

function _drawPuddles(ctx, camX, camY) {
  _updateRipples(0.016);
  for (const p of WORLD_PUDDLES) {
    const sx = p.x - camX, sy = p.y - camY;
    if (sx + p.rx < -5 || sx - p.rx > W + 5 || sy + p.ry < -5 || sy - p.ry > H + 5) continue;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.angle);
    ctx.fillStyle = `rgba(2, 3, 10, ${p.depth * 0.4})`;
    ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-p.rx * 0.1, -p.ry * 0.15, 0, 0, 0, p.rx * 0.8);
    g.addColorStop(0, `rgba(${p.col[0]}, ${p.col[1]}, ${p.col[2]}, ${0.15 * p.depth})`);
    g.addColorStop(0.5, `rgba(${p.col[0]}, ${p.col[1]}, ${p.col[2]}, ${0.04 * p.depth})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.05 * p.depth})`;
    ctx.beginPath(); ctx.ellipse(-p.rx * 0.2, -p.ry * 0.25, p.rx * 0.08, p.ry * 0.05, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  for (const rp of PUDDLE_RIPPLES) {
    const sx = rp.x - camX, sy = rp.y - camY;
    if (sx < -15 || sx > W + 15 || sy < -15 || sy > H + 15) continue;
    const t = rp.life / rp.maxLife;
    ctx.strokeStyle = `rgba(200,230,255,${t * 0.2})`; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(sx, sy, rp.r, 0, Math.PI * 2); ctx.stroke();
  }
}

// ============ EDGE BLEND + BUILDING SHADOWS ============
function _drawEdgeBlend(ctx, camX, camY) {
  const fade = 50;
  const e = [[-camY, 'y', 1], [WORLD_H - camY, 'y', -1], [-camX, 'x', 1], [WORLD_W - camX, 'x', -1]];
  for (const [pos, axis, dir] of e) {
    if (axis === 'y') {
      if (pos < -fade || pos > H + fade) continue;
      const g = ctx.createLinearGradient(0, pos - (dir > 0 ? 0 : fade), 0, pos + (dir > 0 ? fade : 0));
      g.addColorStop(dir > 0 ? 0 : 1, 'rgba(3,5,10,0.85)'); g.addColorStop(dir > 0 ? 1 : 0, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, Math.max(0, pos - fade), W, fade * 2);
    } else {
      if (pos < -fade || pos > W + fade) continue;
      const g = ctx.createLinearGradient(pos - (dir > 0 ? 0 : fade), 0, pos + (dir > 0 ? fade : 0), 0);
      g.addColorStop(dir > 0 ? 0 : 1, 'rgba(3,5,10,0.85)'); g.addColorStop(dir > 0 ? 1 : 0, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(Math.max(0, pos - fade), 0, fade * 2, H);
    }
  }
}

// ============ BORDER TILES ============
const BORDER_SIZE = 512;
function _drawStoreBorders(ctx, camX, camY) {
  const tiles = [BG_IMG_TILES.stage0, BG_IMG_TILES.stage0];
  if (!tiles[0] && !tiles[1]) return;
  const bS = BORDER_SIZE;
  _fillBR(ctx, camX, camY, -bS * 2, -bS * 2, WORLD_W + bS * 4, bS * 2, tiles);
  _fillBR(ctx, camX, camY, -bS * 2, WORLD_H, WORLD_W + bS * 4, bS * 2, tiles);
  _fillBR(ctx, camX, camY, -bS * 2, 0, bS * 2, WORLD_H, tiles);
  _fillBR(ctx, camX, camY, WORLD_W, 0, bS * 2, WORLD_H, tiles);
}
function _fillBR(ctx, camX, camY, rX, rY, rW, rH, tiles) {
  const s = BORDER_SIZE;
  const sx = Math.floor(rX / s), sy = Math.floor(rY / s), ex = Math.ceil((rX + rW) / s), ey = Math.ceil((rY + rH) / s);
  for (let tx = sx; tx <= ex; tx++) {
    for (let ty = sy; ty <= ey; ty++) {
      const wx = tx * s, wy = ty * s, dx = wx - camX, dy = wy - camY;
      if (dx + s < 0 || dx > W || dy + s < 0 || dy > H) continue;
      const t = tiles[((tx % 2) + 2) % 2 + (((ty % 2) + 2) % 2)] || tiles[0] || tiles[1];
      if (!t) continue;
      ctx.save(); ctx.translate(dx + s / 2, dy + s / 2);
      if ((tx + ty) % 3 === 0) ctx.scale(-1, 1); if ((tx * 3 + ty) % 5 === 0) ctx.scale(1, -1);
      ctx.drawImage(t, -s / 2, -s / 2, s, s); ctx.restore();
    }
  }
}

// ============ CLEAN FLOOR COLORS PER STAGE ============
const STAGE_FLOOR = [
  { base: '#101420', grid: 'rgba(255,0,170,0.12)', line: 'rgba(255,0,170,0.22)', accent: '#ff00aa' },   // 0 Neo Tokyo
  { base: '#0e1610', grid: 'rgba(0,204,68,0.12)',   line: 'rgba(0,204,68,0.22)',   accent: '#00cc44' },   // 1 Toxic Jungle
  { base: '#160e1a', grid: 'rgba(255,0,255,0.12)',  line: 'rgba(255,0,255,0.22)',  accent: '#ff00ff' },   // 2 Penthouse
  { base: '#0e1220', grid: 'rgba(0,100,255,0.12)',  line: 'rgba(0,100,255,0.22)',  accent: '#0066ff' },   // 3 Server Core
  { base: '#1a0e12', grid: 'rgba(255,51,102,0.12)', line: 'rgba(255,51,102,0.22)', accent: '#ff3366' },   // 4 Casino
  { base: '#1a1610', grid: 'rgba(255,215,0,0.12)',  line: 'rgba(255,215,0,0.22)',  accent: '#ffd700' },   // 5 Ruja Palace
  { base: '#101820', grid: 'rgba(170,238,255,0.12)',line: 'rgba(170,238,255,0.22)',accent: '#aaeeff' },   // 6 Frozen Vault
  { base: '#1a140c', grid: 'rgba(255,120,20,0.12)', line: 'rgba(255,120,20,0.22)', accent: '#ff6600' },   // 7 Fake Court
  { base: '#0e1a18', grid: 'rgba(0,238,187,0.12)',  line: 'rgba(0,238,187,0.22)',  accent: '#00eebb' },   // 8 Tropical Matrix
  { base: '#18140c', grid: 'rgba(255,204,0,0.12)',  line: 'rgba(255,204,0,0.22)',  accent: '#ffcc00' },   // 9 The Citadel
];

// Pre-render clean floor tile per stage (cached)
const _FLOOR_CACHE = {};
function _getFloorTile(stage) {
  if (_FLOOR_CACHE[stage]) return _FLOOR_CACHE[stage];
  const fl = STAGE_FLOOR[stage] || STAGE_FLOOR[0];
  const sz = 128; // small tile, repeats cleanly
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const cx = c.getContext('2d');

  // Dark base
  cx.fillStyle = fl.base;
  cx.fillRect(0, 0, sz, sz);

  // Major grid cells (64px squares)
  cx.strokeStyle = fl.line;
  cx.lineWidth = 1;
  for (let i = 0; i <= sz; i += 64) {
    cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i, sz); cx.stroke();
    cx.beginPath(); cx.moveTo(0, i); cx.lineTo(sz, i); cx.stroke();
  }

  // Minor sub-grid (32px)
  cx.strokeStyle = fl.grid;
  cx.lineWidth = 0.5;
  for (let i = 0; i <= sz; i += 32) {
    if (i % 64 === 0) continue; // skip major lines
    cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i, sz); cx.stroke();
    cx.beginPath(); cx.moveTo(0, i); cx.lineTo(sz, i); cx.stroke();
  }

  // Subtle noise texture
  const seed = stage * 7 + 13;
  for (let i = 0; i < 50; i++) {
    const rx = ((seed * (i + 1) * 137) % sz);
    const ry = ((seed * (i + 1) * 251) % sz);
    cx.fillStyle = fl.grid;
    cx.fillRect(rx, ry, 1, 1);
  }

  _FLOOR_CACHE[stage] = c;
  return c;
}

// ============ FULL BG KEY MAPPING ============
const _STAGE_BG_KEY = [
  'stage0full', 'stage1full', 'stage2full', 'stage3full', 'stage4full',
  'stage5full', 'stage6full', null, 'stage8full', 'stage9full'
];

// ============ MAIN DRAW ============
function drawBGTiled(ctx, stage, camX, camY) {
  const fl = STAGE_FLOOR[stage] || STAGE_FLOOR[0];

  // Fill with floor base color (fallback for areas outside background)
  ctx.fillStyle = fl.base;
  ctx.fillRect(0, 0, W, H);

  // 1) Draw original 4K background stretched to world size — FULL, no filter
  const bgKey = _STAGE_BG_KEY[stage];
  const bgImg = bgKey ? BG_IMG_RAW[bgKey] : null;
  if (bgImg) {
    const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
    const fitScale = Math.max(WORLD_W / iw, WORLD_H / ih);
    const drawW = iw * fitScale, drawH = ih * fitScale;
    const offX = (WORLD_W - drawW) / 2, offY = (WORLD_H - drawH) / 2;
    const sx = (camX - offX) / fitScale, sy = (camY - offY) / fitScale;
    const sw = W / fitScale, sh = H / fitScale;
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, W, H);
  }

  // V1 visual cleanup: keep background raw, no dark veil/grid overlay on playfield.

  // Fade to black at world edges
  _drawEdgeBlend(ctx, camX, camY);
}

// ============ PLAYABLE AREA BORDER — PIXEL ART WALLS ============
function drawPlayAreaBorder(ctx, stage, camX, camY) {
  return; // Border walls disabled — background veil handles the visual separation
  const wallImg = BG_IMG_RAW['borderWall'];
  if (!wallImg) return; // not loaded yet

  // The border wall image is exactly WORLD_W × WORLD_H (2560×1440)
  // with pixel art walls around the playable area and black/transparent elsewhere.
  // Draw it in world coordinates, camera-offset.
  const iw = wallImg.naturalWidth, ih = wallImg.naturalHeight;

  // Source rect from camera position (same logic as full images)
  const fitScale = Math.max(WORLD_W / iw, WORLD_H / ih);
  const drawW = iw * fitScale, drawH = ih * fitScale;
  const offX = (WORLD_W - drawW) / 2, offY = (WORLD_H - drawH) / 2;
  const sx = (camX - offX) / fitScale, sy = (camY - offY) / fitScale;
  const sw = W / fitScale, sh = H / fitScale;

  ctx.save();
  ctx.imageSmoothingEnabled = false; // keep pixel art crisp
  ctx.drawImage(wallImg, sx, sy, sw, sh, 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.restore();
}

// ============ STAGE 0 ============
function _drawStage0(ctx, camX, camY) {
  _drawEdgeBlend(ctx, camX, camY);
}

// ============ CINEMATIC RAIN ============
const rainDrops = [], rainSplashes = [];
const RAIN_COUNT = 400, RAIN_WIND = -0.2;
for (let i = 0; i < RAIN_COUNT; i++) {
  rainDrops.push({ x: Math.random() * (W + 200) - 100, y: Math.random() * (H + 100) - 50, speed: 9 + Math.random() * 12, length: 14 + Math.random() * 35, alpha: 0.06 + Math.random() * 0.18, thickness: 0.4 + Math.random() * 1.0, layer: Math.random() });
}
function updateRain() {
  for (const r of rainDrops) { const ls = 0.4 + r.layer * 0.6; r.y += r.speed * ls; r.x += r.speed * RAIN_WIND * ls; if (r.y > H + 30) { r.y = -r.length - Math.random() * 60; r.x = Math.random() * (W + 200) - 100; if (Math.random() < 0.12) rainSplashes.push({ x: r.x, y: r.y + r.length, life: 0.12 + Math.random() * 0.08, maxLife: 0.12 + Math.random() * 0.08, size: 2 + Math.random() * 3 }); } if (r.x < -60) r.x = W + 60; if (r.x > W + 60) r.x = -60; }
  for (let i = rainSplashes.length - 1; i >= 0; i--) { rainSplashes[i].life -= 0.016; if (rainSplashes[i].life <= 0) rainSplashes.splice(i, 1); }
}
function drawRain(ctx) {
  for (const r of rainDrops) { const la = 0.3 + r.layer * 0.7, ll = r.length * (0.4 + r.layer * 0.6), a = r.alpha * la; ctx.strokeStyle = `rgba(160,200,255,${a})`; ctx.lineWidth = r.thickness * (0.4 + r.layer * 0.6); ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + ll * RAIN_WIND, r.y + ll); ctx.stroke(); if (r.layer > 0.75) { ctx.strokeStyle = `rgba(220,240,255,${a * 0.35})`; ctx.lineWidth = r.thickness * 0.25; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + ll * RAIN_WIND, r.y + ll); ctx.stroke(); } }
  for (const sp of rainSplashes) { const t = sp.life / sp.maxLife, a = t * 0.35, sz = sp.size * (1 - t * 0.4); ctx.strokeStyle = `rgba(180,220,255,${a})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x - sz, sp.y - sz * 1.8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x + sz, sp.y - sz * 1.8); ctx.stroke(); }
  ctx.fillStyle = 'rgba(10,15,30,0.02)'; ctx.fillRect(0, 0, W, H);
}

// ============ FLOATING PRICES ============
const floatingPrices = [];
for (let i = 0; i < 30; i++) { floatingPrices.push({ x: Math.random() * W, y: Math.random() * H, speed: 0.3 + Math.random() * 0.5, text: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 50).toFixed(1) + '%', isGreen: Math.random() > 0.45, alpha: 0.03 + Math.random() * 0.05, size: 8 + Math.floor(Math.random() * 6) }); }
function updateFloatingPrices() { for (const p of floatingPrices) { p.y -= p.speed; if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; p.text = (Math.random() > 0.45 ? '+' : '-') + (Math.random() * 50).toFixed(1) + '%'; p.isGreen = p.text[0] === '+'; } } }
function drawFloatingPrices(ctx) { ctx.save(); ctx.textAlign = 'center'; for (const p of floatingPrices) { ctx.globalAlpha = p.alpha; ctx.font = `600 ${p.size}px 'JetBrains Mono',monospace`; ctx.fillStyle = p.isGreen ? '#00ff88' : '#ff4444'; ctx.fillText(p.text, p.x, p.y); } ctx.restore(); }

// Legacy
function getFloorTile(v) { return null; }
function getBG(s) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); drawBGTiled(x, s, 0, 0); return c; }
