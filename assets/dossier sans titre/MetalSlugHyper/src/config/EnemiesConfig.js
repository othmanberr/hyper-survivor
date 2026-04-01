// Configuration des Boss uniques pour chaque niveau
// Mappé par level ID (1-10)

export const BOSS_DATA = {
  1: {
    name: "THE PAMPER",
    tint: 0xff00ff, // Magenta/Violet
    hp: 10,
    aiType: 'chaser', // Fonce sur le joueur
    scale: 3,
    speed: 80,
    damage: 15,
    attackCooldown: 1500
  },
  2: {
    name: "THE LIQUIDATOR",
    tint: 0x00ff00, // Vert toxique
    hp: 15,
    aiType: 'shooter', // Reste à distance et tire
    scale: 3.2,
    speed: 60,
    damage: 18,
    attackCooldown: 2000,
    attackRange: 300
  },
  3: {
    name: "INSOLVENT BROS",
    tint: 0x8b4513, // Marron (dette)
    hp: 20,
    aiType: 'tank', // Lent, immunisé au knockback
    scale: 3.5,
    speed: 40,
    damage: 22,
    attackCooldown: 2500
  },
  4: {
    name: "COPY-CAT SUN",
    tint: 0xffff00, // Jaune (fork)
    hp: 25,
    aiType: 'dasher', // Pointes de vitesse brusques
    scale: 3.3,
    speed: 100,
    damage: 20,
    attackCooldown: 1800,
    dashSpeed: 250,
    dashCooldown: 3000
  },
  5: {
    name: "STABLE KWON",
    tint: 0xff6600, // Orange (dépegging)
    hp: 30,
    aiType: 'tank', // Très résistant
    scale: 3.8,
    speed: 35,
    damage: 25,
    attackCooldown: 2800
  },
  6: {
    name: "ARTHUR THE REKT",
    tint: 0x0000ff, // Bleu (volatilité)
    hp: 35,
    aiType: 'dasher', // Mouvements imprévisibles
    scale: 3.6,
    speed: 110,
    damage: 22,
    attackCooldown: 1600,
    dashSpeed: 300,
    dashCooldown: 2500
  },
  7: {
    name: "QUEEN CAROLINE",
    tint: 0xffd700, // Or (casino)
    hp: 40,
    aiType: 'shooter', // Garde distance, tire en éventail
    scale: 3.7,
    speed: 70,
    damage: 24,
    attackCooldown: 2200,
    attackRange: 350,
    projectileCount: 3 // Tire 3 projectiles en éventail
  },
  8: {
    name: "THE DEFI PRINCE",
    tint: 0x808080, // Gris (régulation)
    hp: 45,
    aiType: 'tank', // Très résistant, lent
    scale: 4,
    speed: 30,
    damage: 28,
    attackCooldown: 3000
  },
  9: {
    name: "SAM THE EFFECTIVE",
    tint: 0x00ffff, // Cyan (backdoor)
    hp: 50,
    aiType: 'dasher', // Très rapide, esquive
    scale: 3.5,
    speed: 120,
    damage: 26,
    attackCooldown: 1400,
    dashSpeed: 350,
    dashCooldown: 2000
  },
  10: {
    name: "GENERAL ZHAO",
    tint: 0xffd700, // Or (final boss)
    hp: 100,
    aiType: 'turret', // Ne bouge pas, tire en éventail
    scale: 4.5,
    speed: 0, // Immobile
    damage: 30,
    attackCooldown: 1800,
    attackRange: 400,
    projectileCount: 5 // Tire 5 projectiles en éventail
  }
};

// Fonction utilitaire pour obtenir les données d'un boss par level ID
export function getBossData(levelId) {
  return BOSS_DATA[levelId] || BOSS_DATA[1]; // Fallback sur le premier boss
}

