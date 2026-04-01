// Configuration de tous les stages du jeu
// 10 Stages, chacun avec 10 Vagues

export const STAGES = [
  {
    id: 1,
    name: 'Neon Slums',
    assets: 'bg.png',
    colorTint: 0xffffff, // Blanc (normal)
    worldWidth: 3200,
    waves: [
      { enemies: 3, types: ['punk', 'elite'] },
      { enemies: 4, types: ['punk', 'elite', 'sniper'] },
      { enemies: 4, types: ['punk', 'elite', 'tank'] },
      { enemies: 5, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 5, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 50 }
    ]
  },
  {
    id: 2,
    name: 'Toxic Factory',
    assets: 'bg.png',
    colorTint: 0xaaccff, // Bleu clair (ambiance toxique)
    worldWidth: 3600,
    waves: [
      { enemies: 4, types: ['punk', 'elite', 'sniper'] },
      { enemies: 5, types: ['punk', 'elite', 'tank'] },
      { enemies: 5, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 60 }
    ]
  },
  {
    id: 3,
    name: 'Cyber District',
    assets: 'bg.png',
    colorTint: 0xffaacc, // Rose/Magenta (cyberpunk)
    worldWidth: 4000,
    waves: [
      { enemies: 5, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 70 }
    ]
  },
  {
    id: 4,
    name: 'Underground Tunnels',
    assets: 'bg.png',
    colorTint: 0x666666, // Gris foncé (souterrain)
    worldWidth: 3800,
    waves: [
      { enemies: 6, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 80 }
    ]
  },
  {
    id: 5,
    name: 'Sky Bridge',
    assets: 'bg.png',
    colorTint: 0xccffcc, // Vert clair (ciel)
    worldWidth: 4200,
    waves: [
      { enemies: 7, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 90 }
    ]
  },
  {
    id: 6,
    name: 'Industrial Complex',
    assets: 'bg.png',
    colorTint: 0xffccaa, // Orange (industriel)
    worldWidth: 4500,
    waves: [
      { enemies: 8, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 100 }
    ]
  },
  {
    id: 7,
    name: 'Abandoned Mall',
    assets: 'bg.png',
    colorTint: 0xffffaa, // Jaune (mall abandonné)
    worldWidth: 4800,
    waves: [
      { enemies: 9, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 14, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 110 }
    ]
  },
  {
    id: 8,
    name: 'Corporate Tower',
    assets: 'bg.png',
    colorTint: 0xaaaaff, // Bleu (corporate)
    worldWidth: 5000,
    waves: [
      { enemies: 10, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 14, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 15, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 120 }
    ]
  },
  {
    id: 9,
    name: 'Rooftop Battle',
    assets: 'bg.png',
    colorTint: 0xffaaaa, // Rouge clair (bataille finale)
    worldWidth: 5200,
    waves: [
      { enemies: 11, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 14, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 14, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 15, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 16, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 130 }
    ]
  },
  {
    id: 10,
    name: 'Final Showdown',
    assets: 'bg.png',
    colorTint: 0xff0000, // Rouge sang (final)
    worldWidth: 6000,
    waves: [
      { enemies: 12, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 13, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 14, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 14, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 15, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 15, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 16, types: ['punk', 'elite', 'sniper', 'tank'] },
      { enemies: 17, types: ['punk', 'elite', 'sniper', 'tank'] },
      { isBoss: true, bossHealth: 150 }
    ]
  }
];

// Fonction utilitaire pour obtenir un stage par son ID
export function getStageById(stageId) {
  return STAGES.find(stage => stage.id === stageId) || STAGES[0];
}

// Fonction pour obtenir le stage actuel depuis localStorage
export function getCurrentStage() {
  const saved = localStorage.getItem('metalSlugHyper_currentStage');
  return saved ? parseInt(saved, 10) : 1;
}

// Fonction pour sauvegarder le stage actuel
export function saveCurrentStage(stageId) {
  localStorage.setItem('metalSlugHyper_currentStage', stageId.toString());
}

// Fonction pour réinitialiser la progression
export function resetProgress() {
  localStorage.removeItem('metalSlugHyper_currentStage');
}

