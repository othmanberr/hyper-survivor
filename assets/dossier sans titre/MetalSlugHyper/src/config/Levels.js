// Configuration Data-Driven pour les 10 Stages du jeu
// Chaque stage définit ses propres paramètres de gameplay et de narration

export const LEVELS_CONFIG = [
  {
    id: 1,
    title: "NEON SLUMS",
    bgKey: "bg_neon_slums",
    bgPath: "Environments/Night City/preview.png",
    envKey: "night_city",
    storyKey: "story_stage1",
    storyTitle: "CHAPTER 1: THE CULT",
    storyText: "The streets are drowning in rain. MURAD, the guru, stands atop a pile of worthless tokens, preaching his 'Supercycle'. He promises eternal wealth but sells only vaporware. Jeff must silence this loudspeaker before the Rug Pull begins.",
    bossName: "THE PAMPER",
    enemiesCount: 5,
    bossHP: 10
  },
  {
    id: 2,
    title: "TOXIC FACTORY",
    bgKey: "bg_toxic_factory",
    bgPath: "Environments/Sewers Environment/preview-environment.png",
    envKey: "sewers",
    storyKey: "story_stage2",
    storyTitle: "CHAPTER 2: EXTRACTION",
    storyText: "The Vesting Factory. This is the territory of THE LIQUIDATOR, a predatory VC. He is printing tokens faster than the network can handle. The green sludge is the liquefied dreams of retail. Shut down the printer.",
    bossName: "THE LIQUIDATOR",
    enemiesCount: 8,
    bossHP: 15
  },
  {
    id: 3,
    title: "DARKPOOL SEWERS",
    bgKey: "bg_darkpool",
    bgPath: "Environments/Sewers Environment/preview-environment.png",
    envKey: "sewers",
    storyKey: "story_stage3",
    storyTitle: "CHAPTER 3: INSOLVENCY",
    storyText: "Deep in the Darkpools, THE INSOLVENT BROS are hiding bad debt. They gambled with 50x Leverage and got Rekt. Now they throw everything they have to avoid the Margin Call.",
    bossName: "INSOLVENT BROS",
    enemiesCount: 10,
    bossHP: 20
  },
  {
    id: 4,
    title: "CYBER METRO",
    bgKey: "bg_cyber_metro",
    bgPath: "Environments/cyberpunk-street-files/city skyline/preview.png",
    envKey: "cyber_city",
    storyKey: "story_stage4",
    storyTitle: "CHAPTER 4: THE CLONE",
    storyText: "COPY-CAT SUN has hijacked the train. He possesses no original code; he only knows how to Fork. He wants to clone Hyperliquid. Derail him before he launches his scam.",
    bossName: "COPY-CAT SUN",
    enemiesCount: 12,
    bossHP: 25
  },
  {
    id: 5,
    title: "THE BRIDGE",
    bgKey: "bg_bridge",
    bgPath: "Environments/Streets Of Fight/Docks Stage/Preview.png",
    envKey: "docks",
    storyKey: "story_stage5",
    storyTitle: "CHAPTER 5: DE-PEG",
    storyText: "STABLE KWON screams 'DEPLOYING CAPITAL!' at the storm. He claims the bridge is stable, but it's a Death Spiral. Cross the abyss before the value hits Zero.",
    bossName: "STABLE KWON",
    enemiesCount: 15,
    bossHP: 30
  },
  {
    id: 6,
    title: "ROOFTOPS",
    bgKey: "bg_rooftops",
    bgPath: "Environments/PinkSkyline/Layers/near-buildings.png",
    envKey: "pink_skyline",
    storyKey: "story_stage6",
    storyTitle: "CHAPTER 6: WICK HUNTER",
    storyText: "On the rooftops, ARTHUR THE REKT awaits. He attacks with unpredictable Liquidation Wicks. In this high-altitude duel, a single slip means total account termination.",
    bossName: "ARTHUR THE REKT",
    enemiesCount: 15,
    bossHP: 35
  },
  {
    id: 7,
    title: "HIGH CASINO",
    bgKey: "bg_casino",
    bgPath: "Environments/Casino City/Preview/trees.png",
    envKey: "casino_city",
    storyKey: "story_stage7",
    storyTitle: "CHAPTER 7: THE HOUSE",
    storyText: "QUEEN CAROLINE plays dice with customer funds. She uses 'Infinite Money Glitches' and mathematical models to justify theft. Prove to her that pain is a certainty.",
    bossName: "QUEEN CAROLINE",
    enemiesCount: 18,
    bossHP: 40
  },
  {
    id: 8,
    title: "MILITARY BASE",
    bgKey: "bg_military",
    bgPath: "Environments/Megabot Environments/Lava Area/Previews/Level-preview.png",
    envKey: "mech_factory",
    storyKey: "story_stage8",
    storyTitle: "CHAPTER 8: REGULATION",
    storyText: "THE DEFI PRINCE shields himself with laws and tanks. He demands KYC before you can pass. Jeff's answer is simple: Code is Law, and your laws are deprecated.",
    bossName: "THE DEFI PRINCE",
    enemiesCount: 20,
    bossHP: 45
  },
  {
    id: 9,
    title: "THE ASCENT",
    bgKey: "bg_ascent",
    bgPath: "Environments/Synth Cites/Previews/sunset.png",
    envKey: "synth_sunset",
    storyKey: "story_stage9",
    storyTitle: "CHAPTER 9: BACKDOOR",
    storyText: "SAM THE EFFECTIVE blocks the final ascent. He installed a secret Backdoor to siphon billions while playing video games. Time to unplug his controller. Permanently.",
    bossName: "SAM THE EFFECTIVE",
    enemiesCount: 25,
    bossHP: 50
  },
  {
    id: 10,
    title: "THE CITADEL",
    bgKey: "bg_citadel",
    bgPath: "Environments/Megabot Environments/City Stage Files/preview.png",
    envKey: "mech_station",
    storyKey: "story_stage10",
    storyTitle: "FINAL: THE THRONE",
    storyText: "GENERAL ZHAO controls the order books. He whispers 'Funds are SAFU', but he holds the keys. This is the final battle: Custody vs Freedom. ATTACK.",
    bossName: "GENERAL ZHAO",
    enemiesCount: 0,
    bossHP: 100
  }
];

// Fonctions utilitaires
export function getLevelById(id) {
  return LEVELS_CONFIG.find(level => level.id === id);
}

export function getLevelByIndex(index) {
  return LEVELS_CONFIG[index] || null;
}

export function getTotalLevels() {
  return LEVELS_CONFIG.length;
}

export function isLastLevel(levelId) {
  return levelId >= LEVELS_CONFIG.length;
}
