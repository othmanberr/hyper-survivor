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
    name: 'Crossbow', icon: '🏹', desc: 'Heavy piercing bolts',
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

  // #5 Red Candle Katana → evolves into God Candle Blade
  redcandle: {
    name: 'Red Candle Katana', icon: '🖍️', desc: 'Red sweeping blade',
    dmg: 40, cd: 0.4, type: 'melee', area: 110, cost: 100,
    vis: 'red_slash', evolvesTo: 'godCandleBlade'
  },

  // #6 Axe → evolves into Chain Lightning Axe
  axe: {
    name: 'Throwing Axe', icon: '🪓', desc: 'Spinning axe that bounces',
    dmg: 55, cd: 1.2, type: 'bounce', spd: 380, bounces: 3, cost: 100,
    vis: 'spinning_axe', evolvesTo: 'chainLightning'
  },

  // #7 Support Drones → evolves into Drone Swarm
  drones: {
    name: 'Support Drones', icon: '🛸', desc: 'Orbiting defensive drones',
    dmg: 25, cd: 0.1, type: 'orbital', cnt: 2, orbitSpeed: 2.5, orbitRadius: 70, cost: 120,
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

// Shop upgrade items
const UPGRADES = [
  { name: 'SPEED+', icon: ICO.speed, desc: '+10 Movement Speed', cost: 120, apply: () => { P.spd += 10; } },
  { name: 'ARMOR+', icon: ICO.armor, desc: '+1 Damage Reduction', cost: 150, apply: () => { P.armor += 1; } },
  { name: 'CRIT+', icon: ICO.crit, desc: '+2% Crit Chance', cost: 180, apply: () => { P.crit += 2; } },
  { name: 'HP+', icon: ICO.hp, desc: '+20 Max HP & Heal', cost: 200, apply: () => { P.maxHp += 20; P.hp += 20; } },
  { name: 'MAGNET+', icon: ICO.magnet, desc: '+25 Pickup Range', cost: 100, apply: () => { P.magnetRange += 25; } },
  { name: 'ATK SPD+', icon: ICO.atkspd, desc: '+5% Fire Rate', cost: 250, apply: () => { P.cdMult *= 0.95; } },
  { name: 'REGEN+', icon: ICO.heal, desc: 'Heal 1 HP / sec', cost: 300, apply: () => { if (!P.regen) P.regen = 0; P.regen += 1; } }
];

const HEALS = [];
