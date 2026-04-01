// Configuration Data-Driven pour les 10 Stages du jeu
// Chaque stage définit ses propres paramètres de gameplay et de narration

export const LEVELS_CONFIG = [
  {
    id: 1,
    name: 'NEON SLUMS',
    bgTint: 0xffffff, // Blanc (jour)
    backgroundKey: 'bg_city',
    enemies: ['punk'],
    bossHP: 10,
    enemiesToKill: 5,
    waves: 10,
    storyTitle: 'CHAPITRE 1: L\'INVASION',
    storyText: 'Les rues de la Ville Basse sont envahies par les bots de l\'Empire. Jeff doit nettoyer les quartiers pour rétablir l\'ordre. Les premiers ennemis sont des punks corrompus par la propagande centralisée. Le combat commence ici.',
    storyImageKey: 'bg_city'
  },
  {
    id: 2,
    name: 'TOXIC FACTORY',
    bgTint: 0x8888ff, // Nuit (bleu/violet)
    backgroundKey: 'bg_factory',
    enemies: ['punk'],
    bossHP: 20,
    enemiesToKill: 8,
    waves: 10,
    storyTitle: 'CHAPITRE 2: L\'USINE TOXIQUE',
    storyText: 'Les punks se sont réfugiés dans une ancienne usine abandonnée. L\'air est saturé de FUD toxique. Jeff doit pénétrer dans les entrailles de cette forteresse pour éliminer les agents de l\'Empire qui y ont établi leur base.',
    storyImageKey: 'bg_factory'
  },
  {
    id: 3,
    name: 'CYBER CORE',
    bgTint: 0xff8888, // Rouge (danger)
    backgroundKey: 'bg_core',
    enemies: ['punk'],
    bossHP: 30,
    enemiesToKill: 12,
    waves: 10,
    storyTitle: 'CHAPITRE 3: LE CŒUR CYBER',
    storyText: 'Au centre du réseau, le Cœur Cyber bat au rythme des transactions. L\'Empire tente de le corrompre avec de fausses données. Jeff doit protéger l\'intégrité du système avant qu\'il ne soit trop tard.',
    storyImageKey: 'bg_core'
  },
  {
    id: 4,
    name: 'DATA STREAM',
    bgTint: 0x88ff88, // Vert (cyber)
    backgroundKey: 'bg_stream',
    enemies: ['punk', 'elite'],
    bossHP: 40,
    enemiesToKill: 15,
    waves: 10,
    storyTitle: 'CHAPITRE 4: LE FLUX DE DONNÉES',
    storyText: 'Les données circulent dans un flux vertigineux. Les élites de l\'Empire interceptent chaque transaction pour les manipuler. Jeff doit naviguer dans ce torrent numérique et éliminer les intercepteurs.',
    storyImageKey: 'bg_stream'
  },
  {
    id: 5,
    name: 'NEON DISTRICT',
    bgTint: 0xffff88, // Jaune (électrique)
    backgroundKey: 'bg_district',
    enemies: ['punk', 'elite'],
    bossHP: 50,
    enemiesToKill: 18,
    waves: 10,
    storyTitle: 'CHAPITRE 5: LE QUARTIER NEON',
    storyText: 'Le Quartier Neon brille de mille feux, mais sous les lumières se cachent les agents les plus dangereux de l\'Empire. Jeff doit traverser cette zone hostile où chaque coin de rue peut cacher une embuscade.',
    storyImageKey: 'bg_district'
  },
  {
    id: 6,
    name: 'SHADOW ZONE',
    bgTint: 0x444444, // Sombre (nuit profonde)
    backgroundKey: 'bg_shadow',
    enemies: ['punk', 'elite', 'sniper'],
    bossHP: 60,
    enemiesToKill: 20,
    waves: 10,
    storyTitle: 'CHAPITRE 6: LA ZONE D\'OMBRE',
    storyText: 'Dans les profondeurs du réseau, une zone d\'ombre abrite les snipers de l\'Empire. Ils tirent depuis les ténèbres, invisibles et mortels. Jeff doit évoluer dans cette obscurité totale pour les démasquer.',
    storyImageKey: 'bg_shadow'
  },
  {
    id: 7,
    name: 'PLASMA GATES',
    bgTint: 0xff88ff, // Magenta (énergie)
    backgroundKey: 'bg_gates',
    enemies: ['punk', 'elite', 'sniper'],
    bossHP: 70,
    enemiesToKill: 22,
    waves: 10,
    storyTitle: 'CHAPITRE 7: LES PORTES PLASMA',
    storyText: 'Les Portes Plasma protègent l\'accès aux niveaux supérieurs du réseau. L\'énergie qui les alimente est instable et mortelle. Jeff doit traverser ces barrières énergétiques pour progresser vers le cœur de l\'Empire.',
    storyImageKey: 'bg_gates'
  },
  {
    id: 8,
    name: 'QUANTUM LAB',
    bgTint: 0x88ffff, // Cyan (scientifique)
    backgroundKey: 'bg_lab',
    enemies: ['punk', 'elite', 'sniper', 'tank'],
    bossHP: 80,
    enemiesToKill: 25,
    waves: 10,
    storyTitle: 'CHAPITRE 8: LE LABORATOIRE QUANTUM',
    storyText: 'Dans ce laboratoire, l\'Empire développe des armes quantiques capables de déstabiliser Hyperliquid. Les tanks lourds gardent les installations. Jeff doit infiltrer ce sanctuaire scientifique et détruire les prototypes.',
    storyImageKey: 'bg_lab'
  },
  {
    id: 9,
    name: 'FINAL FORTRESS',
    bgTint: 0xff0000, // Rouge sang (final)
    backgroundKey: 'bg_fortress',
    enemies: ['punk', 'elite', 'sniper', 'tank'],
    bossHP: 100,
    enemiesToKill: 30,
    waves: 10,
    storyTitle: 'CHAPITRE 9: LA FORTERESSE FINALE',
    storyText: 'La dernière forteresse de l\'Empire se dresse devant Jeff. Les défenses sont maximales, les gardes sont les plus redoutables. C\'est ici que se joue l\'avenir d\'Hyperliquid. Le combat final approche.',
    storyImageKey: 'bg_fortress'
  },
  {
    id: 10,
    name: 'HYPERLIQUID CORE',
    bgTint: 0xffd700, // Or (ultime)
    backgroundKey: 'bg_citadel',
    enemies: ['punk', 'elite', 'sniper', 'tank'],
    bossHP: 150,
    enemiesToKill: 35,
    waves: 10,
    storyTitle: 'CHAPITRE 10: LA CITADELLE',
    storyText: 'Le bureau du PDG de l\'Empire. Le cœur même de la centralisation. Jeff affronte le maître de l\'oppression dans un combat épique. La liberté d\'Hyperliquid dépend de cette ultime confrontation.',
    storyImageKey: 'bg_citadel'
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
