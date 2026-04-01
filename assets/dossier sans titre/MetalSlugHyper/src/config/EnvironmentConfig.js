// Mapping des packs d'environnements -> listes de couches parallax
// Chaque couche est une image (tileSprite) avec un facteur de parallaxe

export const ENVIRONMENT_PACKS = {
  night_city: {
    baseColor: 0x000008,
    layers: [
      { key: 'env-night-sky', path: 'Environments/Night City/Layers/back.png', depth: -12, parallax: 0.02, repeatX: true, stretch: true, tint: 0x001122 },
      { key: 'env-night-far', path: 'Environments/Night City/Layers/far.png', depth: -11, parallax: 0.1, repeatX: true, tint: 0x223344, alpha: 0.9 },
      { key: 'env-night-mid', path: 'Environments/Night City/Layers/middle.png', depth: -10, parallax: 0.25, repeatX: true, align: 'bottom', tint: 0x445566 },
      { key: 'env-night-near', path: 'Environments/Night City/Layers/near.png', depth: -9, parallax: 0.45, repeatX: true, align: 'bottom', tint: 0x99aabb }
    ]
  },
  sewers: {
    baseColor: 0x030508,
    layers: [
      { key: 'env-sewers-back', path: 'Environments/Sewers Environment/Layers/back.png', depth: -12, parallax: 0.02, repeatX: true, stretch: true, tint: 0x0a0f15 },
      { key: 'env-sewers-mid', path: 'Environments/Sewers Environment/Layers/middle.png', depth: -11, parallax: 0.15, repeatX: true, tint: 0x2a3542 },
      { key: 'env-sewers-toxic', path: 'Environments/Sewers Environment/Layers/back.png', depth: -10.5, parallax: 0.25, repeatX: true, stretch: true, tint: 0x00ff44, alpha: 0.25, blendMode: 'ADD' },
      { key: 'env-sewers-front', path: 'Environments/Sewers Environment/Layers/front.png', depth: -9, parallax: 0.4, repeatX: true, tint: 0x4a5562 }
    ]
  },
  cyber_city: {
    baseColor: 0x050610,
    layers: [
      { key: 'env-cyber-back', path: 'Environments/cyberpunk-street-files/city skyline/Layers/back.png', depth: -12, parallax: 0.02, repeatX: true, stretch: true, tint: 0x0a0f20 },
      { key: 'env-cyber-buildings', path: 'Environments/cyberpunk-street-files/city skyline/Layers/buildings.png', depth: -11, parallax: 0.18, repeatX: true, align: 'bottom', tint: 0x2a2f40 },
      { key: 'env-cyber-neon', path: 'Environments/cyberpunk-street-files/city skyline/Layers/buildings.png', depth: -10.5, parallax: 0.25, repeatX: true, align: 'bottom', tint: 0x00ffff, alpha: 0.2, blendMode: 'ADD' },
      { key: 'env-cyber-front', path: 'Environments/cyberpunk-street-files/city skyline/Layers/front.png', depth: -9, parallax: 0.45, repeatX: true, align: 'bottom', tint: 0x4a4f60 }
    ]
  },
  docks: {
    baseColor: 0x020408,
    layers: [
      { key: 'env-docks-back', path: 'Environments/Streets Of Fight/Docks Stage/Layers/back.png', depth: -12, parallax: 0.02, repeatX: true, stretch: true, tint: 0x0a0e12 },
      { key: 'env-docks-mid', path: 'Environments/Streets Of Fight/Docks Stage/Layers/back.png', depth: -11, parallax: 0.15, repeatX: true, stretch: true, tint: 0x1a1e22, alpha: 0.6 },
      { key: 'env-docks-water', path: 'Environments/Streets Of Fight/Docks Stage/Layers/back.png', depth: -9.5, parallax: 0.35, repeatX: true, stretch: true, tint: 0x0044ff, alpha: 0.15, blendMode: 'ADD' },
      { key: 'env-docks-front', path: 'Environments/Streets Of Fight/Docks Stage/Layers/front.png', depth: -9, parallax: 0.5, repeatX: true, align: 'bottom', tint: 0x2a2e32 }
    ]
  },
  pink_skyline: {
    baseColor: 0x020010,
    layers: [
      { key: 'env-pink-sky', path: 'Environments/PinkSkyline/Layers/sky.png', depth: -12, parallax: 0.01, repeatX: true, stretch: true, tint: 0x220033 },
      { key: 'env-pink-far', path: 'Environments/PinkSkyline/Layers/far-buildings.png', depth: -11, parallax: 0.1, repeatX: true, align: 'bottom', tint: 0x660099 },
      { key: 'env-pink-mid', path: 'Environments/PinkSkyline/Layers/middle-buildings.png', depth: -10, parallax: 0.25, repeatX: true, align: 'bottom', tint: 0x8800bb },
      { key: 'env-pink-near', path: 'Environments/PinkSkyline/Layers/near-buildings.png', depth: -9, parallax: 0.5, repeatX: true, align: 'bottom', tint: 0xaa00dd }
    ]
  },
  casino_city: {
    baseColor: 0x030010,
    layers: [
      { key: 'env-casino-sky', path: 'Environments/Casino City/Layers/sky.png', depth: -12, parallax: 0.01, repeatX: true, stretch: true, tint: 0x110033 },
      { key: 'env-casino-far', path: 'Environments/Casino City/Layers/far-buildings.png', depth: -11, parallax: 0.08, repeatX: true, align: 'bottom', tint: 0x330055 },
      { key: 'env-casino-middle', path: 'Environments/Casino City/Layers/middle1.png', depth: -10, parallax: 0.2, repeatX: true, align: 'bottom', tint: 0x440066 },
      { key: 'env-casino-props', path: 'Environments/Casino City/Layers/props1.png', depth: -8, parallax: 0.55, repeatX: true, align: 'bottom', tint: 0x660088 }
    ]
  },
  mech_factory: {
    baseColor: 0x050208,
    layers: [
      { key: 'env-mech-bg', path: 'Environments/Megabot Environments/Lava Area/Layers/bg.png', depth: -12, parallax: 0.02, repeatX: true, stretch: true, tint: 0x220811 },
      { key: 'env-mech-station-bg', path: 'Environments/Megabot Environments/City Stage Files/Layers/bg.png', depth: -11, parallax: 0.08, repeatX: true, stretch: true, alpha: 0.6, tint: 0x331111 },
      { key: 'env-mech-lava-glow', path: 'Environments/Megabot Environments/Lava Area/Layers/bg.png', depth: -10, parallax: 0.28, repeatX: true, stretch: true, alpha: 0.3, tint: 0xff3300, blendMode: 'ADD' },
      { key: 'env-mech-tiles', path: 'Environments/Megabot Environments/Lava Area/Layers/tileset.png', depth: -9, parallax: 0.5, repeatX: true, align: 'bottom', tint: 0xcc6622 }
    ]
  },
  synth_sunset: {
    baseColor: 0x050208,
    layers: [
      { key: 'env-synth-sky', path: 'Environments/Synth Cites/Backgrounds/Sunset/sky.png', depth: -12, parallax: 0.01, repeatX: true, stretch: true, tint: 0x1a0d22 },
      { key: 'env-synth-sun', path: 'Environments/Synth Cites/Backgrounds/Sunset/sun.png', depth: -11, parallax: 0.05, repeatX: true, tint: 0xff6600, alpha: 0.9 },
      { key: 'env-synth-far', path: 'Environments/Synth Cites/Backgrounds/Sunset/far-buildings.png', depth: -10, parallax: 0.2, repeatX: true, align: 'bottom', tint: 0x663344 },
      { key: 'env-synth-near', path: 'Environments/Synth Cites/Backgrounds/Sunset/near-buildings.png', depth: -9, parallax: 0.45, repeatX: true, align: 'bottom', tint: 0x884455 }
    ]
  },
  mech_station: {
    baseColor: 0x020408,
    layers: [
      { key: 'env-station-bg', path: 'Environments/Megabot Environments/City Stage Files/Layers/bg.png', depth: -12, parallax: 0.03, repeatX: true, stretch: true, tint: 0x0a0e12 },
      { key: 'env-station-structures', path: 'Environments/Megabot Environments/City Stage Files/Layers/tileset.png', depth: -10, parallax: 0.3, repeatX: true, align: 'bottom', tint: 0x2a2e32, alpha: 0.8 },
      { key: 'env-station-neon', path: 'Environments/Megabot Environments/City Stage Files/Layers/bg.png', depth: -9.5, parallax: 0.35, repeatX: true, stretch: true, tint: 0x00ffff, alpha: 0.2, blendMode: 'ADD' },
      { key: 'env-station-tiles', path: 'Environments/Megabot Environments/City Stage Files/Layers/tileset.png', depth: -8, parallax: 0.55, repeatX: true, align: 'bottom', tint: 0x3a3e42 }
    ]
  }
};

export function getEnvironmentPack(key) {
  return ENVIRONMENT_PACKS[key] || null;
}

