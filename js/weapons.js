// ============ SVG ICONS (shared across all files) ============
const ICO = {
  hp: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12.5L1.5 7C0 5.5 0.3 2.8 2.8 2C4.2 1.5 5.8 2.3 7 3.8C8.2 2.3 9.8 1.5 11.2 2C13.7 2.8 14 5.5 12.5 7L7 12.5Z" fill="#ff4757"/></svg>',
  armor: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3.5V7C2 10.2 4.3 12.3 7 13C9.7 12.3 12 10.2 12 7V3.5L7 1Z" fill="#00cec9" fill-opacity="0.85"/></svg>',
  speed: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3L7 7L2 11" stroke="#2ed573" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 3L12 7L7 11" stroke="#2ed573" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  atkspd: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 0.5L3 7H7L5.5 13.5L11 7H7L8.5 0.5Z" fill="#ffa502"/></svg>',
  magnet: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1V7.5C3 9.7 4.8 11.5 7 11.5C9.2 11.5 11 9.7 11 7.5V1H9V7.5C9 8.6 8.1 9.5 7 9.5C5.9 9.5 5 8.6 5 7.5V1H3Z" fill="#a29bfe"/><rect x="2.5" y="1" width="3" height="2" rx="0.3" fill="#ff6b6b"/><rect x="8.5" y="1" width="3" height="2" rx="0.3" fill="#4834d4"/></svg>',
  gold: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" fill="#fdcb6e"/><circle cx="7" cy="7" r="4" fill="none" stroke="#f39c12" stroke-width="0.8"/><path d="M7 4V4.8M7 9.2V10M5.2 5.8C5.2 5 5.9 4.5 7 4.5C8.1 4.5 8.8 5 8.8 5.8C8.8 6.5 8 6.8 7 6.8C6 6.8 5.2 7.2 5.2 8C5.2 8.8 5.9 9.5 7 9.5C8.1 9.5 8.8 8.8 8.8 8" stroke="#805500" stroke-width="0.9" stroke-linecap="round"/></svg>',
  trophy: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 1H10V5C10 7.2 8.7 8.5 7 8.5C5.3 8.5 4 7.2 4 5V1Z" fill="#fdcb6e"/><path d="M4 3H2C2 5 2.8 6 4 6" stroke="#fdcb6e" stroke-width="1.2" stroke-linecap="round"/><path d="M10 3H12C12 5 11.2 6 10 6" stroke="#fdcb6e" stroke-width="1.2" stroke-linecap="round"/><rect x="6" y="8.5" width="2" height="2" fill="#fdcb6e"/><rect x="4.5" y="10.5" width="5" height="1.5" rx="0.5" fill="#fdcb6e"/></svg>',
  medal1: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="9" r="5" fill="#fdcb6e"/><circle cx="8" cy="9" r="3.5" fill="none" stroke="#f39c12" stroke-width="0.8"/><text x="8" y="11.5" text-anchor="middle" fill="#805500" font-size="7" font-weight="bold" font-family="Exo 2">1</text><path d="M6 1L8 4L10 1" fill="#ff4757"/></svg>',
  medal2: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="9" r="5" fill="#c0c0c0"/><circle cx="8" cy="9" r="3.5" fill="none" stroke="#888" stroke-width="0.8"/><text x="8" y="11.5" text-anchor="middle" fill="#555" font-size="7" font-weight="bold" font-family="Exo 2">2</text><path d="M6 1L8 4L10 1" fill="#4834d4"/></svg>',
  medal3: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="9" r="5" fill="#cd7f32"/><circle cx="8" cy="9" r="3.5" fill="none" stroke="#8B5A2B" stroke-width="0.8"/><text x="8" y="11.5" text-anchor="middle" fill="#5C3310" font-size="7" font-weight="bold" font-family="Exo 2">3</text><path d="M6 1L8 4L10 1" fill="#00cec9"/></svg>',
  crit: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="4.5" fill="none" stroke="#ff6b6b" stroke-width="1.2"/><circle cx="7" cy="7" r="1.5" fill="#ff6b6b"/><line x1="7" y1="0.5" x2="7" y2="3.5" stroke="#ff6b6b" stroke-width="1"/><line x1="7" y1="10.5" x2="7" y2="13.5" stroke="#ff6b6b" stroke-width="1"/><line x1="0.5" y1="7" x2="3.5" y2="7" stroke="#ff6b6b" stroke-width="1"/><line x1="10.5" y1="7" x2="13.5" y2="7" stroke="#ff6b6b" stroke-width="1"/></svg>',
  dodge: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.2 8.6C3.3 5.2 6 3.4 10.4 3.2" stroke="#7ce8ff" stroke-width="1.4" stroke-linecap="round"/><path d="M8.6 1.8L11.4 3.2L9.8 5.8" stroke="#7ce8ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4.1" cy="10.1" r="2" fill="#7ce8ff" fill-opacity="0.22" stroke="#7ce8ff" stroke-width="1"/></svg>',
  knockback: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7H8.5" stroke="#ffb347" stroke-width="1.6" stroke-linecap="round"/><path d="M6.5 4.5L9.5 7L6.5 9.5" stroke="#ffb347" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.4 3.2L12.2 4.7M10.8 6.8H13M10.4 10.8L12.2 9.3" stroke="#ff7f50" stroke-width="1.1" stroke-linecap="round"/></svg>',
  heal: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="5" y="1" width="4" height="12" rx="1" fill="#2ed573"/><rect x="1" y="5" width="12" height="4" rx="1" fill="#2ed573"/></svg>',
  power: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L3 7H6L5 12L11 6H8L9 2H7Z" fill="#ff6b6b"/><path d="M5 5L7 2V5" fill="#ff4757" opacity="0.5"/></svg>',
};

// ============ SVG WEAPON ICONS (fallbacks, overridden by sprites.js pixel art) ============
const _WI = (svg) => `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
const _WEAPON_SVG = {
  // Base weapons
  pistol: _WI('<rect x="8" y="12" width="16" height="8" rx="2" fill="#6c5ce7"/><rect x="20" y="10" width="4" height="4" rx="1" fill="#a29bfe"/><rect x="12" y="18" width="4" height="6" rx="1" fill="#4834d4"/><circle cx="22" cy="14" r="1.5" fill="#00cec9"/>'),
  crossbow: _WI('<path d="M10 8L22 16L10 24" fill="none" stroke="#00cec9" stroke-width="2" stroke-linejoin="round"/><line x1="14" y1="16" x2="26" y2="16" stroke="#f1f2f6" stroke-width="2" stroke-linecap="round"/><path d="M14 12V20" stroke="#00cec9" stroke-width="1.5"/>'),
  smg: _WI('<rect x="4" y="13" width="20" height="6" rx="1.5" fill="#ffa502"/><rect x="22" y="11" width="6" height="3" rx="1" fill="#e67e22"/><rect x="10" y="18" width="3" height="5" rx="0.8" fill="#cc8400"/><rect x="6" y="11" width="4" height="3" rx="0.5" fill="#e67e22"/><circle cx="25" cy="12.5" r="1" fill="#fdcb6e"/>'),
  shotgun: _WI('<rect x="3" y="14" width="22" height="4" rx="1" fill="#c0392b"/><rect x="3" y="13" width="22" height="2" rx="0.5" fill="#e74c3c"/><rect x="12" y="17" width="3" height="5" rx="0.8" fill="#962d22"/><rect x="24" y="13" width="5" height="6" rx="1" fill="#e74c3c"/><circle cx="26.5" cy="14" r="0.8" fill="#2c3e50"/><circle cx="26.5" cy="17" r="0.8" fill="#2c3e50"/>'),
  flamethrower: _WI('<rect x="4" y="13" width="16" height="6" rx="2" fill="#4b5563"/><rect x="18" y="11" width="6" height="10" rx="2" fill="#f97316"/><rect x="10" y="18" width="3" height="6" rx="1" fill="#6b7280"/><path d="M24 12C27 12 29 14 29 16C29 18 27 20 24 20C25.5 18.8 26.4 17.5 26.4 16C26.4 14.5 25.5 13.2 24 12Z\" fill=\"#fb923c\"/><path d=\"M23.5 13.3C25.5 13.5 27 14.5 27 16C27 17.5 25.5 18.5 23.5 18.7C24.7 17.9 25.3 17 25.3 16C25.3 15 24.7 14.1 23.5 13.3Z\" fill=\"#fde68a\"/>'),
  firewallLauncher: _WI('<rect x="4" y="13" width="15" height="6" rx="2" fill="#475569"/><rect x="17" y="10" width="8" height="12" rx="2" fill="#ea580c"/><rect x="10" y="18" width="3" height="6" rx="1" fill="#64748b"/><path d="M25 10L28 13L25 16L29 18L25 22" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="16" r="2" fill="#fde68a"/>'),
  grenadeLauncher: _WI('<rect x="4" y="13" width="16" height="6" rx="2" fill="#334155"/><rect x="18" y="11" width="8" height="10" rx="2" fill="#84cc16"/><rect x="10" y="18" width="3" height="6" rx="1" fill="#64748b"/><circle cx="25" cy="16" r="4" fill="#65a30d"/><path d="M25 10.5V8.5" stroke="#d9f99d" stroke-width="1.5" stroke-linecap="round"/><circle cx="25" cy="16" r="1.3" fill="#ecfccb"/>'),
  redcandle: _WI('<line x1="16" y1="4" x2="16" y2="28" stroke="#ff4757" stroke-width="2.5" stroke-linecap="round"/><rect x="13" y="14" width="6" height="4" rx="1" fill="#c0392b"/><path d="M14 14L12 11L16 12L20 11L18 14" fill="#ff6b81"/><line x1="16" y1="4" x2="16" y2="12" stroke="#ff6b6b" stroke-width="1.5" stroke-linecap="round"/>'),
  axe: _WI('<line x1="16" y1="6" x2="16" y2="28" stroke="#8B7355" stroke-width="2" stroke-linecap="round"/><path d="M16 6C16 6 10 8 8 12C6 16 10 18 16 14" fill="#a29bfe"/><path d="M16 6C16 6 22 8 24 12C26 16 22 18 16 14" fill="#6c5ce7"/>'),
  drones: _WI('<ellipse cx="16" cy="16" rx="10" ry="10" fill="none" stroke="#4834d4" stroke-width="0.8" stroke-dasharray="3 3"/><rect x="5" y="13" width="6" height="6" rx="2" fill="#6c5ce7"/><rect x="21" y="13" width="6" height="6" rx="2" fill="#6c5ce7"/><circle cx="8" cy="16" r="1.5" fill="#00cec9"/><circle cx="24" cy="16" r="1.5" fill="#00cec9"/>'),
  // Evolutions
  plasmaCannon: _WI('<rect x="6" y="11" width="18" height="10" rx="3" fill="#6c5ce7"/><circle cx="22" cy="16" r="4" fill="#a29bfe"/><circle cx="22" cy="16" r="2" fill="#00cec9"/><rect x="4" y="14" width="4" height="4" rx="1" fill="#4834d4"/><path d="M26 14L30 12V20L26 18" fill="#00cec9" opacity="0.7"/>'),
  railgun: _WI('<rect x="2" y="13" width="24" height="6" rx="2" fill="#2d3436"/><rect x="24" y="11" width="6" height="10" rx="1.5" fill="#00cec9"/><line x1="27" y1="11" x2="27" y2="21" stroke="#0be8e0" stroke-width="1.5"/><rect x="6" y="15" width="14" height="2" fill="#00cec9" opacity="0.5"/><circle cx="27" cy="16" r="2" fill="#0be8e0"/>'),
  gatlingSwarm: _WI('<rect x="6" y="10" width="16" height="3" rx="1" fill="#ffa502"/><rect x="6" y="14" width="16" height="3" rx="1" fill="#e67e22"/><rect x="6" y="18" width="16" height="3" rx="1" fill="#cc8400"/><rect x="22" y="9" width="6" height="14" rx="2" fill="#ffa502"/><circle cx="9" cy="11.5" r="1" fill="#fdcb6e"/><circle cx="9" cy="15.5" r="1" fill="#fdcb6e"/><circle cx="9" cy="19.5" r="1" fill="#fdcb6e"/>'),
  dragonBreath: _WI('<path d="M8 10C12 6 20 6 24 10L26 16L24 22C20 26 12 26 8 22L6 16L8 10Z" fill="#e74c3c" opacity="0.8"/><path d="M10 12C13 9 19 9 22 12L23.5 16L22 20C19 23 13 23 10 20L8.5 16L10 12Z" fill="#ff6b6b" opacity="0.6"/><circle cx="16" cy="16" r="3" fill="#fdcb6e"/><circle cx="16" cy="16" r="1.5" fill="#fff" opacity="0.8"/>'),
  godCandleBlade: _WI('<line x1="16" y1="2" x2="16" y2="30" stroke="#2ed573" stroke-width="3" stroke-linecap="round"/><line x1="16" y1="2" x2="16" y2="30" stroke="#7bed9f" stroke-width="1.5" stroke-linecap="round"/><rect x="12" y="15" width="8" height="4" rx="1" fill="#1e8449"/><path d="M13 15L10 12L16 13L22 12L19 15" fill="#2ed573"/>'),
  chainLightning: _WI('<line x1="16" y1="6" x2="16" y2="26" stroke="#8B7355" stroke-width="2" stroke-linecap="round"/><path d="M16 6C16 6 10 8 8 12C6 16 10 18 16 14" fill="#00cec9"/><path d="M16 6C16 6 22 8 24 12C26 16 22 18 16 14" fill="#0097e6"/><path d="M6 8L10 12L7 14L12 18" stroke="#fdcb6e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'),
  droneSwarm: _WI('<ellipse cx="16" cy="16" rx="12" ry="12" fill="none" stroke="#6c5ce7" stroke-width="0.6" stroke-dasharray="2 2"/><rect x="3" y="13" width="5" height="5" rx="1.5" fill="#6c5ce7"/><rect x="24" y="13" width="5" height="5" rx="1.5" fill="#6c5ce7"/><rect x="13" y="3" width="5" height="5" rx="1.5" fill="#6c5ce7"/><rect x="13" y="24" width="5" height="5" rx="1.5" fill="#6c5ce7"/><rect x="6" y="22" width="5" height="5" rx="1.5" fill="#6c5ce7"/><circle cx="5.5" cy="15.5" r="1" fill="#00cec9"/><circle cx="26.5" cy="15.5" r="1" fill="#00cec9"/><circle cx="15.5" cy="5.5" r="1" fill="#00cec9"/><circle cx="15.5" cy="26.5" r="1" fill="#00cec9"/><circle cx="8.5" cy="24.5" r="1" fill="#00cec9"/>'),
};

// ============ WEAPON DEFINITIONS — 7 BASE + 7 EVOLUTIONS ============

const WEAPONS = {
  // ─────────── BASE ARSENAL ───────────

  // #1 Pistol → evolves into Plasma Cannon
  pistol: {
    name: 'Cyber Blaster', icon: '🦾', desc: 'Reliable sidearm',
    dmg: 20, cd: 0.4, type: 'proj', spd: 650, pierce: 1, cost: 0,
    vis: 'pistol_bullet', evolvesTo: 'plasmaCannon'
  },

  // #2 Crossbow → evolves into Railgun
  crossbow: {
    name: 'Rail Spiker', icon: '🏹', desc: 'Heavy piercing spikes',
    dmg: 45, cd: 0.9, type: 'proj', spd: 800, pierce: 4, cost: 80,
    vis: 'bolt', evolvesTo: 'railgun'
  },

  // #3 SMG → evolves into Gatling Swarm
  smg: {
    name: 'SMG', icon: '🔩', desc: 'Rapid-fire spray',
    dmg: 12, cd: 0.12, type: 'proj', spd: 600, cnt: 1, spread: 0.1, cost: 90,
    vis: 'smg_bullet', evolvesTo: 'gatlingSwarm'
  },

  // #4 Shotgun → evolves into Dragon's Breath
  shotgun: {
    name: 'Shotgun', icon: '🧨', desc: 'Close-range scatter',
    dmg: 15, cd: 0.8, type: 'proj', spd: 550, cnt: 5, spread: 0.25, cost: 80,
    vis: 'pellet', evolvesTo: 'dragonBreath'
  },

  // #5 Flamethrower — short cone with burn DOT
  flamethrower: {
    name: 'Flamethrower', icon: '🔥', desc: 'Short-range fire cone that ignites enemies',
    dmg: 6, cd: 0.16, type: 'proj', spd: 360, cnt: 7, spread: 0.15, cost: 110,
    pierce: 2, hitKb: 0.55, burnDmg: 7, burnDuration: 1.8, lifeTime: 0.34,
    vis: 'fire_pellet'
  },

  // #6 Firewall Launcher — burning zone denial
  firewallLauncher: {
    name: 'Firewall Launcher', icon: '🧯', desc: 'Launches burning denial zones',
    dmg: 18, cd: 1.05, type: 'puddle', area: 96, duration: 4.2, cost: 115,
    deployDistance: 170, deploySpread: 56,
    burnDmg: 8, burnDuration: 1.4, vis: 'fire_pellet'
  },

  // #7 Grenade Launcher — delayed splash burst
  grenadeLauncher: {
    name: 'Grenade Launcher', icon: '💣', desc: 'Arcing grenades with splash damage',
    dmg: 46, cd: 1.15, type: 'grenade', spd: 330, cost: 125,
    explodeArea: 92, hitKb: 3.4, lifeTime: 0.82, gravity: 760,
    vis: 'pellet'
  },

  // #8 Mono Katana → evolves into God Candle Blade
  redcandle: {
    name: 'Mono Katana', icon: '🖍️', desc: 'Fast arc blade for close pressure',
    dmg: 40, cd: 0.4, type: 'melee', area: 110, cost: 100,
    vis: 'red_slash', evolvesTo: 'godCandleBlade'
  },

  // #9 Axe → evolves into Chain Lightning Axe
  axe: {
    name: 'Throwing Axe', icon: '🪓', desc: 'Spinning axe that bounces',
    dmg: 55, cd: 1.2, type: 'bounce', spd: 380, bounces: 3, cost: 100,
    vis: 'spinning_axe', evolvesTo: 'chainLightning'
  },

  // Legacy: removed from normal pickup/shop pool, kept for compatibility
  drones: {
    name: 'Support Drones', icon: '🛸', desc: 'Orbiting defensive drones',
    dmg: 25, cd: 0.1, type: 'orbital', cnt: 2, orbitSpeed: 2.5, orbitRadius: 70, cost: 120,
    hidden: true,
    vis: 'drone_laser', evolvesTo: 'droneSwarm'
  },

  // ─────────── EVOLUTIONS (Lv8 required) ───────────

  // Pistol → Plasma Cannon: homing explosive projectiles
  plasmaCannon: {
    name: 'Plasma Cannon', icon: '🔮', desc: 'Homing plasma that explodes on impact',
    dmg: 55, cd: 0.35, type: 'homing', spd: 500, pierce: 1, homingStr: 6,
    explodeArea: 80, isEvolution: true, cost: 0,
    vis: 'plasma_bolt'
  },

  // Crossbow → Railgun: infinite pierce beam with trail
  railgun: {
    name: 'Railgun', icon: '⚡', desc: 'Infinite-pierce hyper beam',
    dmg: 120, cd: 1.2, type: 'proj', spd: 1500, pierce: 999,
    isEvolution: true, cost: 0,
    vis: 'railgun_beam'
  },

  // SMG → Gatling Swarm: 3-way rapid fire auto-target
  gatlingSwarm: {
    name: 'Gatling Swarm', icon: '🌀', desc: '3-way rapid auto-targeting fire',
    dmg: 18, cd: 0.07, type: 'proj', spd: 700, cnt: 3, spread: 0.3,
    isEvolution: true, cost: 0,
    vis: 'smg_bullet'
  },

  // Shotgun → Dragon's Breath: fire cone + burn DOT
  dragonBreath: {
    name: "Dragon's Breath", icon: '🐉', desc: 'Incendiary cone with burn damage',
    dmg: 25, cd: 0.6, type: 'proj', spd: 450, cnt: 8, spread: 0.4,
    burnDmg: 5, burnDuration: 2, isEvolution: true, cost: 0,
    vis: 'fire_pellet'
  },

  // Red Candle → God Candle Blade: massive beam + melee combo
  godCandleBlade: {
    name: 'God Candle Blade', icon: '🗡️', desc: 'Green beam slash with massive range',
    dmg: 90, cd: 0.35, type: 'melee', area: 180,
    isEvolution: true, cost: 0,
    vis: 'god_slash'
  },

  // Axe → Chain Lightning: bounces + chains electricity
  chainLightning: {
    name: 'Chain Lightning', icon: '⛓️‍💥', desc: 'Bouncing axe chains lightning to nearby enemies',
    dmg: 70, cd: 0.9, type: 'bounce', spd: 420, bounces: 6,
    chainDmg: 30, chainRange: 150, isEvolution: true, cost: 0,
    vis: 'lightning_axe'
  },

  // Drones → Drone Swarm: more drones, faster, laser grid
  droneSwarm: {
    name: 'Drone Swarm', icon: '🛰️', desc: '5 drones with laser grid',
    dmg: 40, cd: 0.08, type: 'orbital', cnt: 5, orbitSpeed: 3.5, orbitRadius: 100,
    isEvolution: true, cost: 0,
    vis: 'drone_laser'
  }
};

// Apply SVG icons as defaults (replaces emoji placeholders)
for (const k in WEAPONS) {
  if (_WEAPON_SVG[k]) WEAPONS[k].icon = _WEAPON_SVG[k];
}
// sprites.js pixel art will override these later via img.onload in initWeaponSprites()

const WEAPON_LEVEL_TONES = [
  { color: '#9ca3af', glow: 'rgba(156, 163, 175, 0.28)' },
  { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.28)' },
  { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.3)' },
  { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.32)' },
  { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.34)' },
  { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.36)' },
  { color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.38)' },
  { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.44)' }
];

function getWeaponLevelTone(level) {
  const idx = Math.max(0, Math.min(WEAPON_LEVEL_TONES.length - 1, (level | 0) - 1));
  return WEAPON_LEVEL_TONES[idx];
}

function renderWeaponLevelTag(level, extraClass) {
  const tone = getWeaponLevelTone(level);
  const cls = extraClass ? ` ${extraClass}` : '';
  return `<span class="weapon-level-chip${cls}" style="color:${tone.color};border-color:${tone.glow};box-shadow:inset 0 0 0 1px rgba(255,255,255,0.05),0 0 12px ${tone.glow};text-shadow:0 0 10px ${tone.glow};">Lv${level}</span>`;
}

function renderWeaponLevelInline(level, extraClass) {
  const tone = getWeaponLevelTone(level);
  const cls = extraClass ? ` ${extraClass}` : '';
  return `<span class="weapon-level-inline${cls}" style="color:${tone.color};text-shadow:0 0 10px ${tone.glow};">Lv${level}</span>`;
}

function getWeaponRuntimeStats(weaponId, level) {
  const def = WEAPONS[weaponId];
  if (!def) return null;
  const lvl = Math.max(1, level | 0);
  const gain = lvl - 1;
  const stats = {
    ...def,
    id: weaponId,
    level: lvl,
    cnt: def.cnt || 1,
    spread: def.spread || 0,
    pierce: def.pierce || 1,
    burnDmg: def.burnDmg || 0,
    burnDuration: def.burnDuration || 0,
    bounces: def.bounces || 0,
    explodeArea: def.explodeArea || 0,
    orbitRadius: def.orbitRadius || 0,
    orbitSpeed: def.orbitSpeed || 0,
    hitKb: def.hitKb || 0,
    homingStr: def.homingStr || 0,
    slashCount: def.slashCount || 1,
    slashArc: def.slashArc || Math.PI * 0.5,
    hitInterval: def.hitInterval || 0.5,
    lifeTime: def.lifeTime || 0,
  };
  if (gain <= 0) return stats;

  switch (weaponId) {
    case 'pistol':
      stats.dmg *= 1 + gain * 0.14;
      stats.cd *= Math.pow(0.96, gain);
      stats.pierce += (lvl >= 4 ? 1 : 0) + (lvl >= 7 ? 1 : 0);
      stats.spd += gain * 18;
      break;
    case 'crossbow':
      stats.dmg *= 1 + gain * 0.18;
      stats.pierce += Math.floor((lvl - 1) / 2);
      stats.spd += gain * 35;
      stats.hitKb = Math.max(stats.hitKb, 2.6) + gain * 0.28;
      break;
    case 'smg':
      stats.dmg *= 1 + gain * 0.09;
      stats.cd *= Math.pow(0.95, gain);
      stats.cnt += (lvl >= 4 ? 1 : 0) + (lvl >= 7 ? 1 : 0);
      stats.spread = Math.max(0.05, stats.spread - gain * 0.006);
      stats.spd += gain * 16;
      break;
    case 'shotgun':
      stats.dmg *= 1 + gain * 0.12;
      stats.cnt += (lvl >= 3 ? 1 : 0) + (lvl >= 6 ? 1 : 0);
      stats.spread = Math.max(0.14, stats.spread - gain * 0.015);
      stats.hitKb = Math.max(stats.hitKb, 2.4) + gain * 0.35;
      break;
    case 'flamethrower':
      stats.dmg *= 1 + gain * 0.08;
      stats.cnt += (lvl >= 3 ? 1 : 0) + (lvl >= 6 ? 1 : 0);
      stats.spread += gain * 0.008;
      stats.lifeTime += gain * 0.02;
      stats.burnDmg += gain * 1.25;
      stats.burnDuration += gain * 0.12;
      stats.pierce += lvl >= 5 ? 1 : 0;
      break;
    case 'firewallLauncher':
      stats.dmg *= 1 + gain * 0.11;
      stats.area += gain * 9;
      stats.cd *= Math.pow(0.97, gain);
      stats.duration += gain * 0.22;
      stats.burnDmg += gain * 1.2;
      stats.burnDuration += gain * 0.08;
      break;
    case 'grenadeLauncher':
      stats.dmg *= 1 + gain * 0.13;
      stats.cd *= Math.pow(0.975, gain);
      stats.explodeArea += gain * 6;
      stats.spd += gain * 12;
      stats.hitKb = Math.max(stats.hitKb, 3.4) + gain * 0.24;
      stats.cnt += lvl >= 5 ? 1 : 0;
      break;
    case 'redcandle':
      stats.dmg *= 1 + gain * 0.14;
      stats.area += gain * 14;
      stats.cd *= Math.pow(0.975, gain);
      stats.slashCount += lvl >= 5 ? 1 : 0;
      if (lvl >= 7) stats.slashArc = Math.PI * 0.58;
      break;
    case 'axe':
      stats.dmg *= 1 + gain * 0.13;
      stats.bounces += Math.floor((lvl - 1) / 2);
      stats.spd += gain * 18;
      stats.cnt += lvl >= 6 ? 1 : 0;
      stats.hitKb = Math.max(stats.hitKb, 4.8) + gain * 0.25;
      break;
    case 'drones':
      stats.dmg *= 1 + gain * 0.1;
      stats.cnt += (lvl >= 3 ? 1 : 0) + (lvl >= 6 ? 1 : 0);
      stats.orbitRadius += gain * 8;
      stats.orbitSpeed += gain * 0.16;
      stats.hitInterval = Math.max(0.22, 0.5 - gain * 0.04);
      break;
    case 'plasmaCannon':
      stats.dmg *= 1 + gain * 0.14;
      stats.cd *= Math.pow(0.98, gain);
      stats.homingStr += gain * 0.6;
      stats.explodeArea += gain * 5;
      break;
    case 'railgun':
      stats.dmg *= 1 + gain * 0.18;
      stats.cd *= Math.pow(0.97, gain);
      stats.spd += gain * 50;
      break;
    case 'gatlingSwarm':
      stats.dmg *= 1 + gain * 0.09;
      stats.cd *= Math.pow(0.95, gain);
      stats.cnt += (lvl >= 4 ? 1 : 0) + (lvl >= 7 ? 1 : 0);
      stats.spread = Math.max(0.16, stats.spread - gain * 0.015);
      break;
    case 'dragonBreath':
      stats.dmg *= 1 + gain * 0.1;
      stats.cnt += lvl >= 4 ? 1 : 0;
      stats.spread += gain * 0.01;
      stats.lifeTime += gain * 0.02;
      stats.burnDmg += gain * 1.5;
      stats.burnDuration += gain * 0.15;
      break;
    case 'godCandleBlade':
      stats.dmg *= 1 + gain * 0.15;
      stats.area += gain * 16;
      stats.cd *= Math.pow(0.975, gain);
      stats.slashCount = 2 + (lvl >= 6 ? 1 : 0);
      stats.slashArc = Math.PI * 0.62;
      break;
    case 'chainLightning':
      stats.dmg *= 1 + gain * 0.12;
      stats.bounces += gain;
      stats.spd += gain * 16;
      stats.cnt += lvl >= 5 ? 1 : 0;
      break;
    case 'droneSwarm':
      stats.dmg *= 1 + gain * 0.1;
      stats.cnt += (lvl >= 4 ? 1 : 0) + (lvl >= 7 ? 1 : 0);
      stats.orbitRadius += gain * 9;
      stats.orbitSpeed += gain * 0.18;
      stats.hitInterval = Math.max(0.16, 0.36 - gain * 0.03);
      break;
    default:
      stats.dmg *= 1 + gain * 0.12;
      break;
  }

  return stats;
}

function getWeaponUpgradeSummary(weaponId, fromLevel, toLevel) {
  const before = getWeaponRuntimeStats(weaponId, fromLevel || 1);
  const after = getWeaponRuntimeStats(weaponId, toLevel || ((fromLevel || 1) + 1));
  if (!before || !after) return '+power';
  const changes = [];

  const pushChange = (label, prev, next, format, eps) => {
    const precision = eps == null ? 0.001 : eps;
    if (!Number.isFinite(prev) || !Number.isFinite(next)) return;
    if (Math.abs(next - prev) <= precision) return;
    changes.push(`${label} ${format(prev)}→${format(next)}`);
  };

  pushChange('DMG', before.dmg, after.dmg, (v) => `${Math.round(v)}`, 0.49);
  pushChange('RATE', 1 / Math.max(0.0001, before.cd), 1 / Math.max(0.0001, after.cd), (v) => `${v.toFixed(1)}/s`, 0.04);
  pushChange('COUNT', before.cnt || 1, after.cnt || 1, (v) => `${v | 0}`, 0);
  pushChange('PIERCE', before.pierce || 1, after.pierce || 1, (v) => `${v | 0}`, 0);
  pushChange('AREA', before.area || 0, after.area || 0, (v) => `${Math.round(v)}`, 0.9);
  pushChange('BURN', before.burnDmg || 0, after.burnDmg || 0, (v) => `${Math.round(v)}/s`, 0.49);
  pushChange('BOUNCE', before.bounces || 0, after.bounces || 0, (v) => `${v | 0}`, 0);
  pushChange('ORBIT', before.orbitRadius || 0, after.orbitRadius || 0, (v) => `${Math.round(v)}`, 0.9);
  pushChange('BLAST', before.explodeArea || 0, after.explodeArea || 0, (v) => `${Math.round(v)}`, 0.9);
  pushChange('HITS', before.slashCount || 1, after.slashCount || 1, (v) => `${v | 0}`, 0);

  return changes.slice(0, 3).join(' • ') || '+power';
}

const HEALS = [];

window.getWeaponLevelTone = getWeaponLevelTone;
window.renderWeaponLevelTag = renderWeaponLevelTag;
window.renderWeaponLevelInline = renderWeaponLevelInline;
window.getWeaponRuntimeStats = getWeaponRuntimeStats;
window.getWeaponUpgradeSummary = getWeaponUpgradeSummary;
