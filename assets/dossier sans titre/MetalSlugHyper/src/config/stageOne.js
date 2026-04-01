const stageOne = {
  key: 'stage-1',
  title: 'Stage 1 — Neon Pier Ambush',
  background: '/BackgroundStage1.png',
  music: '/audio/stage1-theme.ogg',
  worldWidth: 3200,
  waves: [
    {
      label: 'Dock Patrol',
      enemies: [
        { type: 'punk', spawnX: 420, delay: 0 },
        { type: 'elite', spawnX: 650, delay: 400 },
        { type: 'punk', spawnX: 900, delay: 800 },
      ],
    },
    {
      label: 'Back Alley Rush',
      enemies: [
        { type: 'elite', spawnX: 1300, delay: 0 },
        { type: 'punk', spawnX: 1500, delay: 250 },
        { type: 'elite', spawnX: 1750, delay: 500 },
        { type: 'punk', spawnX: 1950, delay: 900 },
      ],
    },
    {
      label: 'Final Boss',
      enemies: [], // Pas d'ennemis normaux, le boss sera spawné séparément
    },
  ],
  boss: {
    type: 'tako',
    spawnX: 2850,
    health: 750,
  },
};

export default stageOne;

