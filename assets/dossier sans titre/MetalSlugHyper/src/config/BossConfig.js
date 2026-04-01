// Configuration des 10 Boss avec leurs comportements uniques
export const BOSS_CONFIG = {
  1: { // MURAD (The Pamper)
    name: "THE PAMPER",
    hp: 15,
    speed: 120, // Rapide et fuyard
    scale: 2.5,
    tint: 0x00ff00, // Vert
    aiType: "SHOOTER", // Fuit et tire
    attackRate: 2000,
    auraColor: 0x00ff88,
    auraIntensity: 0.25,
    badgeText: "PAMPER"
  },
  2: { // LIQUIDATOR (VC)
    name: "THE LIQUIDATOR",
    hp: 30,
    speed: 40, // Très lent
    scale: 4,
    tint: 0x8800ff, // Violet
    aiType: "TANK", // Ne recule pas, fonce tout droit
    knockbackResist: true,
    auraColor: 0x5500aa,
    auraIntensity: 0.35,
    badgeText: "VC"
  },
  3: { // INSOLVENT BROS
    name: "INSOLVENT BRO",
    hp: 25,
    speed: 150, // Très agressif
    scale: 3,
    tint: 0x8B4513, // Marron
    aiType: "CHASER", // Colle le joueur
    attackRate: 1000,
    auraColor: 0xff8800,
    auraIntensity: 0.3,
    badgeText: "REKT"
  },
  4: { // SUN (Copy-Cat)
    name: "COPY-CAT SUN",
    hp: 30,
    speed: 300, // Ultra rapide
    scale: 2.5,
    tint: 0xCCCCCC, // Argent
    aiType: "DASHER", // Fait des dashs traversants
    attackRate: 3000,
    auraColor: 0x00ffff,
    auraIntensity: 0.25,
    badgeText: "FORK"
  },
  5: { // DO KWON (Stable)
    name: "STABLE KWON",
    hp: 40,
    speed: 0, // Immobile
    scale: 3,
    tint: 0xFF0000, // Rouge
    aiType: "BOMBER", // Fait tomber des trucs du ciel
    attackRate: 1500,
    auraColor: 0xff4444,
    auraIntensity: 0.3,
    badgeText: "DE-PEG"
  },
  6: { // HAYES (Ninja)
    name: "ARTHUR THE REKT",
    hp: 35,
    speed: 200,
    scale: 2.5,
    tint: 0x000088, // Bleu Nuit
    aiType: "JUMPER", // Saute partout
    attackRate: 2000,
    auraColor: 0x00aaff,
    auraIntensity: 0.3,
    badgeText: "WICK"
  },
  7: { // CAROLINE (Casino)
    name: "QUEEN CAROLINE",
    hp: 45,
    speed: 100,
    scale: 3,
    tint: 0xFFD700, // Or
    aiType: "RANDOM", // Mouvements erratiques
    attackRate: 1000,
    auraColor: 0xffe066,
    auraIntensity: 0.35,
    badgeText: "CASINO"
  },
  8: { // DEFI PRINCE
    name: "THE DEFI PRINCE",
    hp: 50,
    speed: 50,
    scale: 3,
    tint: 0xFFFFFF, // Blanc
    aiType: "SUMMONER", // Invoque des gardes
    attackRate: 5000,
    auraColor: 0x99e0ff,
    auraIntensity: 0.3,
    badgeText: "DEFI"
  },
  9: { // SBF (Backdoor)
    name: "SAM EFFECTIVE",
    hp: 60,
    speed: 0, // Assis
    scale: 3.5,
    tint: 0x333333, // Gris
    aiType: "TURRET", // Tire dans 3 directions
    attackRate: 1200,
    auraColor: 0xaa66ff,
    auraIntensity: 0.35,
    badgeText: "BACKDOOR"
  },
  10: { // CZ (Final)
    name: "GENERAL ZHAO",
    hp: 100,
    speed: 180,
    scale: 4,
    tint: 0xF3BA2F, // Jaune Binance
    aiType: "UBER", // Mélange Chaser + Shooter + Dash
    attackRate: 1500,
    auraColor: 0xfff200,
    auraIntensity: 0.4,
    badgeText: "FINAL"
  }
};

// Fonction utilitaire pour obtenir la config d'un boss
export function getBossConfig(levelId) {
  return BOSS_CONFIG[levelId] || BOSS_CONFIG[1];
}

