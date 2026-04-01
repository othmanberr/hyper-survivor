import Phaser from 'phaser';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';
import { preloadEnemies, createEnemyAnimations, spawnEnemy } from '../entities/Enemy.js';
import Prop from '../entities/Prop.js';
import Loot from '../entities/Loot.js';
import { LEVELS_CONFIG, getLevelById, getLevelByIndex, getTotalLevels, isLastLevel } from '../config/Levels.js';
import { BOSS_CONFIG, getBossConfig } from '../config/BossConfig.js';
import AudioManager from '../managers/AudioManager.js';
import { ENVIRONMENT_PACKS, getEnvironmentPack } from '../config/EnvironmentConfig.js';
// Nouveaux managers modulaires
import VFXManager from '../managers/VFXManager.js';
import WaveManager from '../managers/WaveManager.js';
import BossManager from '../managers/BossManager.js';
import CombatManager from '../managers/CombatManager.js';


export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    // Récupérer l'index du niveau depuis data (1-based)
    // Si levelIndex n'est pas fourni, utiliser 1 par défaut
    const levelIndex = data?.levelIndex || data?.stageLevel || 1;
    this.levelIndex = levelIndex;
    this.levelConfig = getLevelById(levelIndex);

    if (!this.levelConfig) {
      console.error(`[LEVEL] Configuration introuvable pour levelIndex: ${levelIndex}`);
      this.levelConfig = LEVELS_CONFIG[0]; // Fallback sur le premier niveau
      this.levelIndex = 1;
    }

    // Largeur du niveau (plus longue pour permettre d'avancer entre chaque vague)
    // 3200 était trop court (on atteignait la fin vers la vague 6)
    this.worldWidth = 8000;

    console.log(`[LEVEL] Initialisation Level ${this.levelIndex}: ${this.levelConfig.title}`);
    console.log(`[LEVEL] Config: BossHP=${this.levelConfig.bossHP}, EnemiesCount=${this.levelConfig.enemiesCount}`);
  }

  preload() {
    // Charger les backgrounds panoramiques référencés dans Levels.js
    const loadedBgKeys = new Set();
    LEVELS_CONFIG.forEach((level) => {
      if (level.bgKey && level.bgPath && !loadedBgKeys.has(level.bgKey)) {
        this.load.image(level.bgKey, level.bgPath);
        loadedBgKeys.add(level.bgKey);
      }
    });

    // Charger les couches parallax pour le niveau actuel
    if (this.levelConfig && this.levelConfig.envKey) {
      const envPack = getEnvironmentPack(this.levelConfig.envKey);
      if (envPack && envPack.layers) {
        console.log(`[PARALLAX PRELOAD] Chargement des couches pour envKey: ${this.levelConfig.envKey}`);
        envPack.layers.forEach((layer) => {
          if (layer.path && !this.textures.exists(layer.key)) {
            console.log(`[PARALLAX PRELOAD] Chargement: ${layer.key} depuis ${layer.path}`);
            this.load.image(layer.key, layer.path);
          } else if (this.textures.exists(layer.key)) {
            console.log(`[PARALLAX PRELOAD] Texture déjà chargée: ${layer.key}`);
          }
        });
      } else {
        console.warn(`[PARALLAX PRELOAD] Pas de pack d'environnement trouvé pour envKey: ${this.levelConfig.envKey}`);
      }
    }

    // Fallback générique
    this.load.image('bg-stage', 'backgrounds/bg.png');

    // Texture de sol pour la route
    // Stage 1 : Texture isométrique spécifique
    if (this.levelIndex === 1) {
      // Charger la texture isométrique pour le stage 1
      this.load.image('ground_stage1_tex', 'backgrounds/ground_stage1.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 1: ground_stage1_tex`);
    }
    // Stage 2 : Texture isométrique spécifique
    else if (this.levelIndex === 2) {
      // Charger la texture isométrique pour le stage 2
      this.load.image('ground_stage2_tex', 'backgrounds/ground_stage2.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 2: ground_stage2_tex`);
    }
    // Stage 4 : Texture isométrique spécifique
    else if (this.levelIndex === 4) {
      // Charger la texture isométrique pour le stage 4
      this.load.image('ground_stage4_tex', 'backgrounds/ground_stage4.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 4: ground_stage4_tex`);
    }
    // Stage 5 : Texture isométrique spécifique
    else if (this.levelIndex === 5) {
      // Charger la texture isométrique pour le stage 5
      this.load.image('ground_stage5_tex', 'backgrounds/ground_stage5.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 5: ground_stage5_tex`);
    }
    // Stage 6 : Texture isométrique spécifique
    else if (this.levelIndex === 6) {
      // Charger la texture isométrique pour le stage 6
      this.load.image('ground_stage6_tex', 'backgrounds/ground_stage6.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 6: ground_stage6_tex`);
    }
    // Stage 7 : Texture isométrique spécifique
    else if (this.levelIndex === 7) {
      // Charger la texture isométrique pour le stage 7
      this.load.image('ground_stage7_tex', 'backgrounds/ground_stage7.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 7: ground_stage7_tex`);
    }
    // Stage 8 : Texture isométrique spécifique
    else if (this.levelIndex === 8) {
      // Charger la texture isométrique pour le stage 8
      this.load.image('ground_stage8_tex', 'backgrounds/ground_stage8.jpg');
      console.log(`[ROAD] Chargement de la texture isométrique pour Stage 8: ground_stage8_tex`);
    }
    else {
      // Autres stages : Texture de briques
      const brickPaths = [
        'textures/brick.png', // Emplacement recommandé
        'textures/brick-wall.png',
        'textures/wall-brick.png',
        'textures/bricks.png',
        'Environments/Caves/Base/layers/walls.png',
        'road/brick.png',
        'road/brick-texture.png',
        'props/brick.png',
        'props/brick-wall.png',
      ];
      this.load.image('road-brick-texture', brickPaths[0]);
    }

    // Chargement des sons via AudioManager
    AudioManager.preload(this);

    // Chargement des 4 sprites de pneu en feu (fichiers séparés)
    // Format : props/tire/tire_1.png, tire_2.png, tire_3.png, tire_4.png
    for (let i = 1; i <= 4; i++) {
      const key = `tire-burning-${i}`;
      const path = `props/tire/tire_${i}.png`;
      this.load.image(key, path);
      console.log(`[PROP] Chargement: ${key} -> ${path}`);
    }

    // Chargement des sprites de loot (pièces d'or et cœurs 3D)
    // Cœurs depuis Warped Lava Items
    for (let i = 1; i <= 4; i++) {
      const heartKey = `loot-heart-${i}`;
      const heartPath = `Items, VFX and Props/Warped Lava Items/Sprites/heart/heart-${i}.png`;
      this.load.image(heartKey, heartPath);
      console.log(`[LOOT] Chargement: ${heartKey} -> ${heartPath}`);

      // Écouter les erreurs de chargement
      this.load.on('loaderror', (file) => {
        if (file.key === heartKey) {
          console.error(`[LOOT] ✗ ERREUR: Impossible de charger ${heartKey}`);
          console.error(`[LOOT] Chemin tenté: ${file.url}`);
        }
      });
    }

    // Pièces d'or depuis Warped Lava Items/Sprites/orb/ (6 frames pour rotation 3D)
    // Les orb sont de vraies pièces d'or qui tournent
    for (let i = 1; i <= 6; i++) {
      const goldKey = `loot-gold-${i}`;
      const goldPath = `Items, VFX and Props/Warped Lava Items/Sprites/orb/orb-${i}.png`;
      this.load.image(goldKey, goldPath);
      console.log(`[LOOT] Chargement: ${goldKey} -> ${goldPath}`);

      // Écouter les erreurs de chargement
      this.load.on('loaderror', (file) => {
        if (file.key === goldKey) {
          console.error(`[LOOT] ✗ ERREUR: Impossible de charger ${goldKey}`);
          console.error(`[LOOT] Chemin tenté: ${file.url}`);
        }
      });
    }

    Player.preload(this);
    preloadEnemies(this);
  }

  create() {
    this.worldWidth = 3200; // Largeur fixe pour l'instant
    this.score = 0;

    // SYSTÈME DE VAGUES SIMPLIFIÉ (Data-Driven)
    this.currentWave = 0; // Vague actuelle (0 = pas commencé)
    // TEMPORAIRE : 1 vague d'ennemis + 1 vague BOSS pour aller vite jusqu'au boss
    this.totalWaves = 2;
    this.enemiesKilled = 0; // Compteur d'ennemis tués
    this.enemiesToKill = this.levelConfig.enemiesCount || 5; // Nombre d'ennemis à tuer avant le boss
    this.enemies = this.physics.add.group();

    // Vérifier si les textures de pneu sont chargées, sinon générer un fallback
    if (this.textures.exists('tire-burning-1')) {
      console.log('[PROP] Textures de pneu chargées avec succès');
    } else if (!this.textures.exists('prop-crate')) {
      console.warn('[PROP] Textures de pneu non trouvées, génération d\'une texture de fallback (caisse)');
      this._generatePropTexture();
    } else {
      console.log('[PROP] Utilisation des textures de caisses (fallback)');
    }

    // Vérifier si les textures de loot sont chargées
    if (this.textures.exists('loot-heart-1')) {
      console.log('[LOOT] ✓ Textures de cœur 3D chargées avec succès');
    } else {
      console.warn('[LOOT] ✗ Textures de cœur 3D non trouvées');
    }

    if (this.textures.exists('loot-gold-1')) {
      console.log('[LOOT] ✓ Textures de pièce d\'or 3D chargées avec succès');
    } else {
      console.warn('[LOOT] ✗ Textures de pièce d\'or 3D non trouvées');
    }

    this.props = this.physics.add.group(); // Groupe pour les props destructibles
    this.lootGroup = this.physics.add.group(); // Groupe pour le loot
    this.boss = null;
    this.bossActive = false;
    this.isWaveActive = false; // Verrouillage : empêche de sauter les vagues pendant le spawn
    this.isTransitioning = false; // Flag pour empêcher les transitions multiples

    // LOGIQUE D'AVANCÉE ENTRE LES VAGUES
    this.isWaitingForAdvance = false; // Quand true, on attend que le joueur avance vers la droite
    this.waveAdvanceTargetX = null;   // Position X à atteindre pour déclencher la prochaine vague
    this.goArrow = null;              // Indicateur "GO →" à l'écran

    // Découpage du niveau en segments (pour avancer un peu à chaque vague)
    this.playerStartX = null;         // Sera défini après la création du joueur
    this.stageEndMargin = 400;        // Marge à droite avant la fin du monde
    this.waveSegmentLength = null;    // Largeur approximative d'un segment de vague
    this.currentRightLimitX = null;   // Limite maximale de déplacement du joueur pour la vague courante

    console.log(`[LEVEL] Configuration chargée: ${this.levelConfig.title}`);
    console.log(`[LEVEL] Vagues: ${this.totalWaves}, Ennemis à tuer: ${this.enemiesToKill}, Boss HP: ${this.levelConfig.bossHP}`);

    // FLAGS DE JEU
    this.gameStarted = false;
    this.isGamePaused = false; // Flag de pause (freeze complet)
    this.gameOverActive = false;

    // TIMER ARCADE (99 secondes)
    this.gameTimer = 99; // Timer initial à 99 secondes
    this.timerEvent = null; // Référence à l'événement de timer
    this.timerTicking = false; // Flag pour éviter les sons multiples

    // SLOW-MOTION pour les finishers
    this.slowMotionActive = false;
    this.slowMotionTimer = null;

    // AUDIO MANAGER
    this.audioManager = new AudioManager(this);
    this.audioManager.init();

    // MANAGERS MODULAIRES
    this.vfxManager = new VFXManager(this);
    this.combatManager = new CombatManager(this);
    this.waveManager = new WaveManager(this);
    this.bossManager = new BossManager(this);
    this.bossManager.init();


    // CRÉATION DU MONDE
    this._createBackground();
    this._createForegroundElements(); // Éléments de premier plan (poteaux, lampadaires)

    this.physics.world.setBounds(0, 0, this.worldWidth, this.scale.height);

    // ANIMATIONS
    // Générer les sprites manquants depuis le sprite de base (si nécessaire)
    Player.generateMissingSprites(this);

    Player.createAnimations(this);
    createEnemyAnimations(this);

    // JOUEUR
    // Position initiale : X=160, Y sera ajusté par _alignSpriteToGround dans la nouvelle zone (60%)
    this.player = new Player(this, 160, this.scale.height * 0.8); // Position temporaire, sera ajustée
    this.player.setDepth(5);
    this._alignSpriteToGround(this.player);

    // Enregistrer la position de départ du joueur pour le découpage des segments
    this.playerStartX = this.player.x;

    // Calculer la longueur d'un segment de vague pour occuper tout le niveau
    const endX = this.worldWidth - this.stageEndMargin;
    const usableWidth = Math.max(endX - this.playerStartX, 1000);
    this.waveSegmentLength = usableWidth / this.totalWaves;

    // Limite initiale de déplacement vers la droite (première vague)
    this.currentRightLimitX = this.playerStartX + this.waveSegmentLength;

    // CONTRÔLES
    this.cursors = this.input.keyboard.createCursorKeys();
    this.actionKeys = this.input.keyboard.addKeys({
      punch: Phaser.Input.Keyboard.KeyCodes.J,
      kick: Phaser.Input.Keyboard.KeyCodes.K,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT, // Dash avec Shift
    });

    // CAMÉRA
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.scale.height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // COLLISIONS
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.enemies,
      this._handlePlayerHitEnemy,
      null,
      this
    );

    // Collision physique : Joueur <-> Props (bloque le passage)
    this.physics.add.collider(this.player, this.props, null, null, this);

    // Overlap : Attaque du joueur <-> Props (pour casser les caisses)
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.props,
      this._handlePlayerHitProp,
      null,
      this
    );

    // Overlap : Joueur <-> Loot (collecte automatique)
    this.physics.add.overlap(
      this.player,
      this.lootGroup,
      this._handlePlayerCollectLoot,
      null,
      this
    );

    // HUD
    this.hud = new HUD(this);
    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    this.hud.updateScore(this.score);
    // Afficher le nom du niveau dans le HUD
    this.hud.updateWave(0, this.totalWaves, `STAGE ${this.levelIndex}: ${this.levelConfig.title}`);

    // ÉVÉNEMENTS
    this.events.on('player-health-changed', ({ current, max }) => {
      this.hud.updateHealth(current, max);
    });

    this.events.once('player-dead', () => {
      this._handleGameOver();
    });

    // ÉVÉNEMENT COMBO pour l'UI flottante
    this.events.on('player-combo-hit', ({ comboCount, isFinisher }) => {
      // L'UI sera gérée dans _handlePlayerHitEnemy quand l'ennemi est touché
    });

    // Créer un groupe pour les textes flottants de combo
    this.comboTexts = [];

    // Groupe pour les projectiles des boss
    this.bossProjectiles = this.physics.add.group();

    // UI
    this._createUI();

    // Le jeu démarre en pause, attend le bouton Start
    // PAS de physics.pause() ici - on laisse la physique active
  }

  _createBackground() {
    // NETTOYAGE COMPLET : Détruire toutes les anciennes couches parallax
    if (this.parallaxLayers && Array.isArray(this.parallaxLayers)) {
      this.parallaxLayers.forEach((layer) => {
        if (layer && typeof layer.destroy === 'function') {
          layer.destroy();
        }
      });
    }
    this.parallaxLayers = [];

    // NETTOYAGE : Détruire aussi l'ancienne image de fond si elle existe
    if (this.bgImage && typeof this.bgImage.destroy === 'function') {
      this.bgImage.destroy();
      this.bgImage = null;
    }

    // Récupérer le pack d'environnement pour le niveau actuel
    const envKey = this.levelConfig?.envKey;
    const envPack = envKey ? getEnvironmentPack(envKey) : null;

    console.log(`[PARALLAX] envKey: ${envKey}, envPack:`, envPack);

    // NOUVELLES PROPORTIONS : 40% décor en haut, 60% route en bas
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.scale.height;
    const worldWidth = this.worldWidth || 8000;

    // Calculer les nouvelles dimensions
    const bgHeight = screenHeight * 0.4; // 40% pour le décor
    const roadHeight = screenHeight * 0.6; // 60% pour la route
    const roadTopY = bgHeight; // Position Y du haut de la route (40% de l'écran)

    // Si on a un pack d'environnement avec des couches parallax, les utiliser
    if (envPack && envPack.layers && envPack.layers.length > 0) {
      // Définir la couleur de fond de base
      this.cameras.main.setBackgroundColor(envPack.baseColor || 0x000000);

      let layersCreated = 0;
      const createdKeys = new Set(); // Pour éviter les doublons

      // Créer TOUTES les couches parallax - SUPERPOSITION pour l'effet parallaxe
      // Chaque couche est ÉTIRÉE verticalement pour occuper exactement 40% de l'écran
      envPack.layers.forEach((layerConfig) => {
        // Vérifier que cette texture n'a pas déjà été créée (éviter les doublons)
        if (createdKeys.has(layerConfig.key)) {
          console.warn(`[PARALLAX] Texture ${layerConfig.key} déjà créée, skip pour éviter duplication`);
          return;
        }

        if (!this.textures.exists(layerConfig.key)) {
          console.warn(`[PARALLAX] Texture manquante: ${layerConfig.key}, skip`);
          return;
        }

        // Récupérer les dimensions originales de l'image
        const texture = this.textures.get(layerConfig.key);
        const sourceImage = texture ? texture.getSourceImage() : null;
        const imgOriginalWidth = sourceImage ? sourceImage.width : worldWidth;
        const imgOriginalHeight = sourceImage ? sourceImage.height : bgHeight;

        // Créer un tileSprite qui se répète HORIZONTALEMENT pour couvrir toute la largeur du monde
        // La hauteur est fixée à EXACTEMENT bgHeight (40% de l'écran) - ÉTIRÉE verticalement
        const layer = this.add.tileSprite(0, 0, worldWidth, bgHeight, layerConfig.key);
        createdKeys.add(layerConfig.key); // Marquer comme créée

        // FORCER L'ORIGINE à (0, 0) - Ancré en haut à gauche
        layer.setOrigin(0, 0);

        // FORCER LA POSITION : (0, 0) pour tous les calques (zone décor en haut)
        layer.setPosition(0, 0);

        // FORCER LA TAILLE D'AFFICHAGE : Largeur = worldWidth (répétition horizontale), Hauteur = bgHeight (40%, ÉTIRÉE)
        // setDisplaySize force l'étirement vertical sans répétition
        layer.setDisplaySize(worldWidth, bgHeight);

        // Vérification finale : S'assurer que les propriétés sont bien définies
        layer.displayWidth = worldWidth;
        layer.displayHeight = bgHeight;

        // IMPORTANT : Calculer le scale vertical pour forcer l'étirement (pas de répétition)
        // Si l'image originale est plus petite que bgHeight, on doit l'étirer
        const scaleY = bgHeight / imgOriginalHeight;
        if (scaleY > 1) {
          // L'image doit être étirée verticalement
          layer.setTileScale(1, scaleY); // Scale horizontal = 1 (répétition normale), Scale vertical = étirement
        }

        // Appliquer le facteur de parallaxe (le défilement horizontal fonctionne toujours)
        layer.setScrollFactor(layerConfig.parallax || 0.5, 1);
        layer.setDepth(layerConfig.depth || -10);

        // Appliquer les effets visuels optionnels (tint, alpha, blendMode)
        if (layerConfig.tint !== undefined) {
          layer.setTint(layerConfig.tint);
        }
        if (layerConfig.alpha !== undefined) {
          layer.setAlpha(layerConfig.alpha);
        }
        if (layerConfig.blendMode !== undefined) {
          layer.setBlendMode(layerConfig.blendMode);
        }

        this.parallaxLayers.push(layer);
        layersCreated++;
        console.log(`[PARALLAX] Couche créée: ${layerConfig.key} - Taille: ${worldWidth}x${bgHeight} (40% étiré verticalement, répétition horizontale)`);
      });

      console.log(`[PARALLAX] ${layersCreated} couches parallax créées et superposées (toutes étirées verticalement à 40%)`);

      // Utiliser la largeur du monde définie dans init() ou une valeur par défaut
      this.worldWidth = this.worldWidth || 8000;

      // Effets visuels spécifiques au stage 8 (MILITARY BASE - Lava Area)
      if (this.levelIndex === 8 && envPack && envPack.layers) {
        this._createStage8AmbientEffects(screenHeight, worldWidth, roadTopY);
      }
    } else {
      console.warn(`[PARALLAX] Pas de pack d'environnement trouvé pour envKey: ${envKey}, utilisation du fallback`);
      // Fallback : utiliser l'image de fond simple
      const bgKey = this.levelConfig?.bgKey || 'bg-stage';
      const finalBgKey = this.textures.exists(bgKey) ? bgKey : 'bg-stage';

      // Utiliser tileSprite pour répéter horizontalement sur toute la largeur du monde
      const texture = this.textures.get(finalBgKey);
      const sourceImage = texture ? texture.getSourceImage() : null;
      const imgOriginalWidth = sourceImage ? sourceImage.width : screenWidth;
      const imgOriginalHeight = sourceImage ? sourceImage.height : screenHeight;
      const imgAspectRatio = imgOriginalWidth / imgOriginalHeight;

      // Calculer la hauteur d'affichage en préservant le ratio d'aspect
      let displayHeight = bgHeight;

      // Créer un tileSprite qui se répète horizontalement pour couvrir toute la largeur du monde
      const bg = this.add.tileSprite(0, 0, worldWidth, displayHeight, finalBgKey);
      bg.setOrigin(0, 0); // Ancré en haut à gauche
      bg.setPosition(0, 0); // Position absolue en haut
      bg.setDepth(0);
      bg.setScrollFactor(1, 1);

      // Le tileSprite couvre automatiquement toute la largeur worldWidth
      // La hauteur est fixée à displayHeight (40% de l'écran)
      // La répétition se fait uniquement horizontalement, pas verticalement
      bg.displayWidth = worldWidth;
      bg.displayHeight = displayHeight;

      this.bgImage = bg;
      this.worldWidth = worldWidth || 8000;
    }

    // Créer la route en 2.5D (60% inférieur de l'écran)
    this._createRoad2_5D(worldWidth, roadHeight, roadTopY, screenHeight, envPack);

    // Mise à jour des limites de mouvement pour la nouvelle zone jouable (60%)
    this.roadHeight = roadHeight;
    this.roadTopBoundary = roadTopY + 8; // Limite supérieure jouable (début de la route + marge)
    this.roadBottomBoundary = screenHeight - 4; // Limite inférieure (bas de l'écran - marge)
    this.groundY = this.roadBottomBoundary - 12; // Position par défaut des pieds (près du bas de la route)

    console.log(`[ROAD] Nouvelle zone jouable: ${roadHeight}px (60% de l'écran)`);
    console.log(`[ROAD] roadTopBoundary: ${this.roadTopBoundary}, roadBottomBoundary: ${this.roadBottomBoundary}`);
    console.log(`[ROAD] groundY: ${this.groundY}`);

    this.physics.world.setBounds(0, 0, this.worldWidth, this.scale.height);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.scale.height);
  }

  _createRoad2_5D(worldWidth, roadHeight, roadTopY, screenHeight, envPack) {
    // Nettoyer l'ancienne route si elle existe
    if (this.roadContainer) {
      this.roadContainer.destroy();
    }
    if (this.road) {
      this.road.destroy();
    }

    // Créer un container pour tous les éléments de la route
    this.roadContainer = this.add.container(0, 0);
    this.roadContainer.setDepth(1);
    this.roadContainer.setScrollFactor(1, 1);

    // Récupérer la couleur de base du background pour harmoniser
    const bgBaseColor = envPack?.baseColor || 0x000000;

    // Extraire les composantes RGB du background
    const bgR = (bgBaseColor >> 16) & 0xFF;
    const bgG = (bgBaseColor >> 8) & 0xFF;
    const bgB = bgBaseColor & 0xFF;

    // Calculer les couleurs de la route en harmonie avec le background
    const roadBaseR = Math.min(255, bgR + 40);
    const roadBaseG = Math.min(255, bgG + 40);
    const roadBaseB = Math.min(255, bgB + 40);
    const roadBaseColor = (roadBaseR << 16) | (roadBaseG << 8) | roadBaseB;

    // Couleurs dérivées pour la profondeur 3D
    const roadDarkR = Math.max(0, bgR + 15);
    const roadDarkG = Math.max(0, bgG + 15);
    const roadDarkB = Math.max(0, bgB + 15);
    const roadDarkColor = (roadDarkR << 16) | (roadDarkG << 8) | roadDarkB;

    const roadLightR = Math.min(255, bgR + 70);
    const roadLightG = Math.min(255, bgG + 70);
    const roadLightB = Math.min(255, bgB + 70);
    const roadLightColor = (roadLightR << 16) | (roadLightG << 8) | roadLightB;

    // Couleur des lignes selon l'environnement
    const envKey = this.levelConfig?.envKey;
    let lineColor = 0xffff00;
    if (envKey === 'cyber_city' || envKey === 'night_city') {
      lineColor = 0x00ffff;
    } else if (envKey === 'casino_city') {
      lineColor = 0xffd700;
    }

    // Fond de la route : Utiliser la texture appropriée selon le stage
    let roadBase;
    let roadTextureKey = null;

    // Stage 1 : Texture isométrique spécifique avec améliorations visuelles
    if (this.levelIndex === 1 && this.textures.exists('ground_stage1_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage1_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage1_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 1 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées cyberpunk sur la route
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : cyan/bleu pour environnement cyberpunk
      const cyberLineColor = 0x00ffff; // Cyan brillant
      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, cyberLineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Stage 2 : Texture isométrique spécifique avec améliorations visuelles
    else if (this.levelIndex === 2 && this.textures.exists('ground_stage2_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage2_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage2_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 2 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées adaptées à l'environnement du Stage 2
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : adaptée à l'environnement (vert/toxique pour Toxic Factory)
      const envKey = this.levelConfig?.envKey;
      let lineColor = 0x00ff00; // Vert par défaut pour Toxic Factory
      if (envKey === 'cyber_city' || envKey === 'night_city') {
        lineColor = 0x00ffff; // Cyan
      } else if (envKey === 'casino_city') {
        lineColor = 0xffd700; // Or
      }

      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Stage 4 : Texture isométrique spécifique avec améliorations visuelles
    else if (this.levelIndex === 4 && this.textures.exists('ground_stage4_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage4_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage4_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 4 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées adaptées à l'environnement du Stage 4
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : adaptée à l'environnement (Cyber Metro)
      const envKey = this.levelConfig?.envKey;
      let lineColor = 0x00ffff; // Cyan par défaut pour Cyber Metro
      if (envKey === 'cyber_city' || envKey === 'night_city') {
        lineColor = 0x00ffff; // Cyan
      } else if (envKey === 'casino_city') {
        lineColor = 0xffd700; // Or
      } else if (envKey === 'sewers') {
        lineColor = 0x00ff00; // Vert
      }

      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Stage 5 : Texture isométrique spécifique avec améliorations visuelles
    else if (this.levelIndex === 5 && this.textures.exists('ground_stage5_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage5_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage5_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 5 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées adaptées à l'environnement du Stage 5
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : adaptée à l'environnement (The Bridge)
      const envKey = this.levelConfig?.envKey;
      let lineColor = 0xffd700; // Or par défaut pour The Bridge
      if (envKey === 'cyber_city' || envKey === 'night_city') {
        lineColor = 0x00ffff; // Cyan
      } else if (envKey === 'casino_city') {
        lineColor = 0xffd700; // Or
      } else if (envKey === 'sewers') {
        lineColor = 0x00ff00; // Vert
      }

      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Stage 6 : Texture isométrique spécifique avec améliorations visuelles
    else if (this.levelIndex === 6 && this.textures.exists('ground_stage6_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage6_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage6_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 6 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées adaptées à l'environnement du Stage 6
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : adaptée à l'environnement
      const envKey = this.levelConfig?.envKey;
      let lineColor = 0x00ffff; // Cyan par défaut
      if (envKey === 'cyber_city' || envKey === 'night_city') {
        lineColor = 0x00ffff; // Cyan
      } else if (envKey === 'casino_city') {
        lineColor = 0xffd700; // Or
      } else if (envKey === 'sewers') {
        lineColor = 0x00ff00; // Vert
      }

      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Stage 7 : Texture isométrique spécifique avec améliorations visuelles
    else if (this.levelIndex === 7 && this.textures.exists('ground_stage7_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage7_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage7_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 7 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées adaptées à l'environnement du Stage 7
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : adaptée à l'environnement
      const envKey = this.levelConfig?.envKey;
      let lineColor = 0x00ffff; // Cyan par défaut
      if (envKey === 'cyber_city' || envKey === 'night_city') {
        lineColor = 0x00ffff; // Cyan
      } else if (envKey === 'casino_city') {
        lineColor = 0xffd700; // Or
      } else if (envKey === 'sewers') {
        lineColor = 0x00ff00; // Vert
      }

      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Stage 8 : Texture isométrique spécifique avec améliorations visuelles
    else if (this.levelIndex === 8 && this.textures.exists('ground_stage8_tex')) {
      // Utiliser la hauteur réelle de la zone jouable (roadHeight) au lieu d'une valeur fixe
      // La texture sera adaptée à la bande de route réelle
      roadBase = this.add.tileSprite(0, screenHeight, worldWidth, roadHeight, 'ground_stage8_tex');
      roadBase.setOrigin(0, 1); // Ancrage en bas à gauche
      roadBase.setDepth(1); // Derrière les personnages, devant le ciel
      roadBase.setScrollFactor(1, 1);

      // Amélioration : Ajuster la qualité de rendu pour un meilleur affichage
      roadBase.setTint(0xffffff); // Pas de teinte, couleurs naturelles

      // Adapter la texture à la hauteur de la zone jouable
      // On récupère la hauteur originale de la texture pour calculer l'échelle
      const texture = this.textures.get('ground_stage8_tex');
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          // Répétition horizontale normale, étirement vertical pour s'adapter à roadHeight
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
          console.log(`[ROAD] Texture adaptée: hauteur originale=${sourceImage.height}px, zone jouable=${roadHeight}px, scaleY=${tileScaleY.toFixed(2)}`);
        }
      }

      console.log('[ROAD] ✓ Texture isométrique appliquée au Stage 8 (adaptée à la zone jouable)');

      // AMÉLIORATION : Ajouter des lignes pointillées adaptées à l'environnement du Stage 8
      const roadGraphics = this.add.graphics();
      roadGraphics.setDepth(1.1); // Juste au-dessus de la route
      roadGraphics.setScrollFactor(1, 1);

      // Couleur des lignes : adaptée à l'environnement
      const envKey = this.levelConfig?.envKey;
      let lineColor = 0x00ffff; // Cyan par défaut
      if (envKey === 'cyber_city' || envKey === 'night_city') {
        lineColor = 0x00ffff; // Cyan
      } else if (envKey === 'casino_city') {
        lineColor = 0xffd700; // Or
      } else if (envKey === 'sewers') {
        lineColor = 0x00ff00; // Vert
      }

      const lineAlpha = 0.8;
      const lineThickness = 2;
      const dashLength = 20;
      const dashGap = 15;

      // Calculer le nombre de lignes pointillées à dessiner (adapté à roadHeight)
      const numLines = 3; // 3 lignes pour un effet de route
      const roadCenterY = screenHeight - (roadHeight / 2);
      const lineSpacing = roadHeight / (numLines + 1);

      // Dessiner les lignes pointillées horizontales
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const lineY = screenHeight - roadHeight + (lineSpacing * (lineIndex + 1));

        // Dessiner la ligne pointillée
        roadGraphics.lineStyle(lineThickness, lineColor, lineAlpha);
        let currentX = 0;
        let isDash = true;

        while (currentX < worldWidth) {
          if (isDash) {
            roadGraphics.beginPath();
            roadGraphics.moveTo(currentX, lineY);
            roadGraphics.lineTo(currentX + dashLength, lineY);
            roadGraphics.strokePath();
            currentX += dashLength;
          } else {
            currentX += dashGap;
          }
          isDash = !isDash;
        }
      }

      // AMÉLIORATION : Ajouter un léger effet de brillance/reflet sur la route
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(1.05);
      glowGraphics.setScrollFactor(1, 1);

      // Ligne de brillance subtile au centre de la route
      glowGraphics.lineStyle(1, 0xffffff, 0.15);
      const glowY = screenHeight - (roadHeight / 2);
      glowGraphics.beginPath();
      glowGraphics.moveTo(0, glowY);
      glowGraphics.lineTo(worldWidth, glowY);
      glowGraphics.strokePath();

      // Ajouter les graphics à la route pour qu'ils soient détruits ensemble
      this.roadContainer.add(roadGraphics);
      this.roadContainer.add(glowGraphics);

      console.log('[ROAD] ✓ Améliorations visuelles ajoutées (lignes pointillées, brillance)');
    }
    // Autres stages : Texture de briques
    else if (this.levelIndex !== 1 && this.levelIndex !== 2 && this.levelIndex !== 4 && this.levelIndex !== 5 && this.levelIndex !== 6 && this.levelIndex !== 7 && this.levelIndex !== 8 && this.textures.exists('road-brick-texture')) {
      roadTextureKey = 'road-brick-texture';
      roadBase = this.add.tileSprite(0, roadTopY, worldWidth, roadHeight, roadTextureKey);
      roadBase.setOrigin(0, 0);
      roadBase.setDepth(1);
      roadBase.setScrollFactor(1, 1);

      // Ajuster l'échelle de la tuile pour un bon rendu
      const texture = this.textures.get(roadTextureKey);
      if (texture) {
        const sourceImage = texture.getSourceImage();
        if (sourceImage) {
          const tileScaleX = 1; // Répétition horizontale normale
          const tileScaleY = roadHeight / sourceImage.height; // Étirer verticalement pour remplir la hauteur
          roadBase.setTileScale(tileScaleX, tileScaleY);
        }
      }
      console.log('[ROAD] ✓ Texture de briques appliquée');
    } else {
      // Fallback : rectangle coloré
      roadBase = this.add.rectangle(0, screenHeight, worldWidth, roadHeight, roadBaseColor);
      roadBase.setOrigin(0, 1);
      roadBase.setDepth(1);
      roadBase.setScrollFactor(1, 1);
      if (this.levelIndex === 1) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage1.jpg');
      } else if (this.levelIndex === 2) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage2.jpg');
      } else if (this.levelIndex === 4) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage4.jpg');
      } else if (this.levelIndex === 5) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage5.jpg');
      } else if (this.levelIndex === 6) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage6.jpg');
      } else if (this.levelIndex === 7) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage7.jpg');
      } else if (this.levelIndex === 8) {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture isométrique non trouvée)');
        console.log('[ROAD] Placez l\'image dans: assets/backgrounds/ground_stage8.jpg');
      } else {
        console.log('[ROAD] ⚠ Utilisation du fallback coloré (texture de briques non trouvée)');
        console.log('[ROAD] Placez l\'image de briques dans: assets/textures/brick.png');
      }
    }
    this.roadContainer.add(roadBase);
    this.road = roadBase;

    // GRAPHICS POUR LA ROUTE 3D (uniquement pour les stages autres que le Stage 1, 2, 4, 5, 6, 7 et 8)
    // Les Stages 1, 2, 4, 5, 6, 7 et 8 utilisent leur propre texture isométrique avec leurs propres graphics déjà créés
    if ((this.levelIndex === 1 && this.textures.exists('ground_stage1_tex')) ||
      (this.levelIndex === 2 && this.textures.exists('ground_stage2_tex')) ||
      (this.levelIndex === 4 && this.textures.exists('ground_stage4_tex')) ||
      (this.levelIndex === 5 && this.textures.exists('ground_stage5_tex')) ||
      (this.levelIndex === 6 && this.textures.exists('ground_stage6_tex')) ||
      (this.levelIndex === 7 && this.textures.exists('ground_stage7_tex')) ||
      (this.levelIndex === 8 && this.textures.exists('ground_stage8_tex'))) {
      // La route du Stage 1, 2, 4, 5, 6, 7 ou 8 est complète, on sort de la fonction
      return;
    }

    // GRAPHICS POUR LA ROUTE 3D (pour les autres stages)
    const roadGraphics = this.add.graphics();

    // POINT DE FUITE (au-dessus de la route)
    const vanishingPointY = roadTopY - 150;
    const vanishingPointX = worldWidth / 2;

    // PAVÉS EN PERSPECTIVE 3D (plaques de route qui convergent)
    const tileHeight = 30; // Hauteur de chaque pavé
    const numTiles = Math.ceil(roadHeight / tileHeight);

    for (let i = 0; i < numTiles; i++) {
      const y = roadTopY + (i * tileHeight);
      const progress = i / numTiles; // 0 (près) à 1 (loin)

      // Largeur du pavé diminue avec la distance (perspective)
      const tileWidth = worldWidth * (1 - progress * 0.4);
      const tileX = (worldWidth - tileWidth) / 2;

      // Couleur plus foncée au loin (profondeur)
      const tileAlpha = 0.6 + (progress * 0.3);
      const tileColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(roadLightColor),
        Phaser.Display.Color.ValueToColor(roadDarkColor),
        100,
        progress * 100
      );
      const finalColor = Phaser.Display.Color.GetColor(tileColor.r, tileColor.g, tileColor.b);

      // Dessiner le pavé avec ombre pour effet 3D
      roadGraphics.fillStyle(finalColor, tileAlpha);
      roadGraphics.fillRect(tileX, y, tileWidth, tileHeight);

      // Ombre en bas du pavé (effet de relief)
      roadGraphics.fillStyle(roadDarkColor, 0.4);
      roadGraphics.fillRect(tileX, y + tileHeight - 2, tileWidth, 2);

      // Ligne de séparation entre les pavés (plus visible au loin)
      roadGraphics.lineStyle(1, roadDarkColor, 0.3 + (progress * 0.2));
      roadGraphics.beginPath();
      roadGraphics.moveTo(tileX, y);
      roadGraphics.lineTo(tileX + tileWidth, y);
      roadGraphics.strokePath();
    }

    // LIGNES DE PERSPECTIVE (convergent vers le point de fuite)
    const numPerspectiveLines = 8;
    for (let i = 0; i <= numPerspectiveLines; i++) {
      const progress = i / numPerspectiveLines;
      const y = roadTopY + (roadHeight * progress);

      // Calculer les points de la ligne qui convergent vers le point de fuite
      const topWidth = worldWidth * (1 - progress * 0.35);
      const topX = (worldWidth - topWidth) / 2;
      const topY = roadTopY;

      const bottomWidth = worldWidth * (1 - (progress + 0.1) * 0.35);
      const bottomX = (worldWidth - bottomWidth) / 2;
      const bottomY = Math.min(screenHeight, y + 5);

      // Ligne de perspective
      roadGraphics.lineStyle(1, roadDarkColor, 0.2 + (progress * 0.3));
      roadGraphics.beginPath();
      roadGraphics.moveTo(topX, topY);
      roadGraphics.lineTo(bottomX, bottomY);
      roadGraphics.strokePath();

      // Ligne symétrique de l'autre côté
      roadGraphics.beginPath();
      roadGraphics.moveTo(worldWidth - topX, topY);
      roadGraphics.lineTo(worldWidth - bottomX, bottomY);
      roadGraphics.strokePath();
    }

    // LIGNE CENTRALE POINTILLÉE EN PERSPECTIVE
    const centerLineY = roadTopY + (roadHeight * 0.5);
    const dashLength = 25;
    const gapLength = 20;

    for (let x = 0; x < worldWidth; x += dashLength + gapLength) {
      // Calculer la largeur du trait selon la position (perspective)
      const progress = x / worldWidth;
      const dashWidth = dashLength * (1 - progress * 0.2);

      roadGraphics.lineStyle(2, lineColor, 0.7);
      roadGraphics.beginPath();
      roadGraphics.moveTo(x, centerLineY);
      roadGraphics.lineTo(Math.min(x + dashWidth, worldWidth), centerLineY);
      roadGraphics.strokePath();
    }

    // BORDURES DE LA ROUTE AVEC OMBRE 3D
    roadGraphics.lineStyle(4, roadDarkColor, 0.8);
    roadGraphics.beginPath();
    roadGraphics.moveTo(0, roadTopY);
    roadGraphics.lineTo(0, screenHeight);
    roadGraphics.strokePath();

    roadGraphics.beginPath();
    roadGraphics.moveTo(worldWidth, roadTopY);
    roadGraphics.lineTo(worldWidth, screenHeight);
    roadGraphics.strokePath();

    // Ombre intérieure des bordures (effet de relief)
    roadGraphics.lineStyle(2, 0x000000, 0.3);
    roadGraphics.beginPath();
    roadGraphics.moveTo(2, roadTopY);
    roadGraphics.lineTo(2, screenHeight);
    roadGraphics.strokePath();

    roadGraphics.beginPath();
    roadGraphics.moveTo(worldWidth - 2, roadTopY);
    roadGraphics.lineTo(worldWidth - 2, screenHeight);
    roadGraphics.strokePath();

    roadGraphics.setDepth(1);
    roadGraphics.setScrollFactor(1, 1);
    this.roadContainer.add(roadGraphics);

    // Ajouter des détails 3D
    this._addRoadDetails3D(worldWidth, roadHeight, roadTopY, screenHeight, envPack, lineColor, roadBaseColor, vanishingPointY);

    console.log(`[ROAD] Route 3D améliorée créée avec perspective réaliste`);
  }

  /**
   * Crée des éléments de premier plan (foreground) qui passent devant le joueur
   * Style Streets of Rage : poteaux, lampadaires, panneaux pour effet de profondeur
   */
  _createForegroundElements() {
    // Groupe pour stocker tous les éléments de premier plan
    this.foregroundElements = [];

    const screenHeight = this.scale.height;
    const roadTopY = screenHeight * 0.4; // Début de la route (40% de l'écran)
    const roadBottomY = screenHeight; // Fin de la route (bas de l'écran)

    // Espacement entre les éléments (tous les 200-300 pixels)
    const spacing = Phaser.Math.Between(200, 300);
    const numElements = Math.floor(this.worldWidth / spacing);

    console.log(`[FOREGROUND] Création de ${numElements} éléments de premier plan`);

    for (let i = 0; i < numElements; i++) {
      const x = i * spacing + Phaser.Math.Between(50, 150);
      // Probabilités : 40% lampadaire, 25% panneau, 20% barrière, 15% poteau simple
      const rand = Phaser.Math.Between(0, 99);
      let elementType;
      if (rand < 40) {
        elementType = 0; // Lampadaire (le plus fréquent)
      } else if (rand < 65) {
        elementType = 1; // Panneau
      } else if (rand < 85) {
        elementType = 2; // Barrière
      } else {
        elementType = 3; // Poteau simple
      }

      let element = null;

      switch (elementType) {
        case 0: // Poteau lumineux (lampadaire)
          element = this._createLightPole(x, roadTopY, roadBottomY);
          break;
        case 1: // Panneau de signalisation
          element = this._createSign(x, roadTopY);
          break;
        case 2: // Barrière
          element = this._createBarrier(x, roadTopY);
          break;
        case 3: // Poteau simple
          element = this._createSimplePole(x, roadTopY, roadBottomY);
          break;
      }

      if (element) {
        // IMPORTANT : ScrollFactor > 1 pour qu'ils passent DEVANT le joueur (effet de profondeur)
        // Plus le scrollFactor est élevé, plus vite ils se déplacent (effet de premier plan)
        element.setScrollFactor(1.5, 1); // 1.5x plus rapide que le joueur

        // Z-SORTING : La depth sera mise à jour dynamiquement dans update() selon la position Y
        // On stocke juste la référence Y pour le calcul
        if (!element.poleY) {
          element.poleY = roadTopY + ((roadBottomY - roadTopY) / 2); // Position Y par défaut
        }

        this.foregroundElements.push(element);
      }
    }

    console.log(`[FOREGROUND] ${this.foregroundElements.length} éléments créés`);
  }

  /**
   * Crée un poteau lumineux (lampadaire) - DESIGN PREMIUM
   */
  _createLightPole(x, roadTopY, roadBottomY) {
    const graphics = this.add.graphics();
    const poleWidth = 12; // Plus large pour plus de présence
    const poleHeight = roadBottomY - roadTopY;
    const lightY = roadTopY + 32; // Position de la lumière

    // BASE DU POTEAU (cône avec détail)
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - poleWidth / 2 - 2, roadTopY, poleWidth + 4, 18);
    graphics.fillStyle(0x222222);
    graphics.fillRect(x - poleWidth / 2 - 1, roadTopY, poleWidth + 2, 12);

    // POTEAU PRINCIPAL (métal avec dégradé)
    // Ombre gauche
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - poleWidth / 2, roadTopY + 18, poleWidth / 3, poleHeight - 18);
    // Centre (métal)
    graphics.fillStyle(0x555555);
    graphics.fillRect(x - poleWidth / 2 + poleWidth / 3, roadTopY + 18, poleWidth / 3, poleHeight - 18);
    // Reflet droit (lumière)
    graphics.fillStyle(0x777777, 0.7);
    graphics.fillRect(x - poleWidth / 2 + (poleWidth * 2 / 3), roadTopY + 18, poleWidth / 3, poleHeight - 18);

    // JOINTURE (détail métallique)
    graphics.fillStyle(0x444444);
    graphics.fillRect(x - poleWidth / 2 - 1, lightY - 8, poleWidth + 2, 3);

    // SUPPORT DE LA LUMIÈRE (bras avec détail)
    const armLength = 24;
    // Ombre du bras
    graphics.fillStyle(0x333333);
    graphics.fillRect(x, lightY - 6, armLength, 5);
    // Bras principal
    graphics.fillStyle(0x444444);
    graphics.fillRect(x, lightY - 5, armLength, 4);
    // Reflet sur le bras
    graphics.fillStyle(0x666666, 0.6);
    graphics.fillRect(x, lightY - 4, armLength, 2);

    // LUMIÈRE (multi-couches avec halo réaliste)
    // Halo extérieur (très large, très transparent)
    graphics.fillStyle(0xffaa00, 0.15);
    graphics.fillCircle(x + armLength, lightY, 25);

    // Halo moyen
    graphics.fillStyle(0xffaa00, 0.3);
    graphics.fillCircle(x + armLength, lightY, 20);

    // Lumière principale (orange)
    graphics.fillStyle(0xff8800, 0.9);
    graphics.fillCircle(x + armLength, lightY, 16);

    // Lumière intérieure (jaune)
    graphics.fillStyle(0xffff00, 0.95);
    graphics.fillCircle(x + armLength, lightY, 12);

    // Centre blanc (brillant)
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(x + armLength, lightY, 7);

    // Reflet sur la lumière (point lumineux)
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(x + armLength - 3, lightY - 3, 3);

    // OMBRES PORTÉES (plus réalistes)
    // Ombre du poteau (ellipse allongée)
    graphics.fillStyle(0x000000, 0.5);
    graphics.fillEllipse(x, roadBottomY, poleWidth * 3, 15);

    // Ombre de la lumière (cercle allongé)
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(x + armLength, roadBottomY, 35, 10);

    // Stocker la position Y pour le Z-sorting
    graphics.poleY = roadTopY + (poleHeight / 2);

    return graphics;
  }

  /**
   * Crée un panneau de signalisation - DESIGN PREMIUM
   */
  _createSign(x, roadTopY) {
    const graphics = this.add.graphics();
    const signWidth = 55; // Plus large
    const signHeight = 45; // Plus haut
    const signY = roadTopY + 12;

    // BASE DU POTEAU (cône)
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - 4, roadTopY, 8, 10);

    // POTEAU DU PANNEAU (avec dégradé)
    graphics.fillStyle(0x444444);
    graphics.fillRect(x - 3, roadTopY + 10, 6, 28);
    graphics.fillStyle(0x666666, 0.5);
    graphics.fillRect(x - 2, roadTopY + 10, 2, 28);

    // PANNEAU PRINCIPAL (avec ombre portée 3D)
    const signColor = Phaser.Math.Between(0, 1) === 0 ? 0xff0000 : 0xffaa00;

    // Ombre portée (effet 3D)
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillRect(x - signWidth / 2 + 3, signY + 3, signWidth, signHeight);

    // Panneau principal
    graphics.fillStyle(signColor, 0.98);
    graphics.fillRect(x - signWidth / 2, signY, signWidth, signHeight);

    // Bordure noire épaisse
    graphics.lineStyle(4, 0x000000);
    graphics.strokeRect(x - signWidth / 2, signY, signWidth, signHeight);

    // Bordure intérieure blanche (détail)
    graphics.lineStyle(2, 0xffffff, 0.6);
    graphics.strokeRect(x - signWidth / 2 + 4, signY + 4, signWidth - 8, signHeight - 8);

    // SYMBOLE SUR LE PANNEAU (plus détaillé)
    graphics.lineStyle(5, 0xffffff);
    const symbolType = Phaser.Math.Between(0, 2);
    if (symbolType === 0) {
      // Flèche vers le haut (triple flèche)
      graphics.beginPath();
      graphics.moveTo(x, signY + 12);
      graphics.lineTo(x - 14, signY + 32);
      graphics.lineTo(x - 8, signY + 32);
      graphics.lineTo(x, signY + 25);
      graphics.lineTo(x + 8, signY + 32);
      graphics.lineTo(x + 14, signY + 32);
      graphics.closePath();
      graphics.fillPath();
    } else if (symbolType === 1) {
      // X épais
      graphics.lineStyle(6, 0xffffff);
      graphics.lineBetween(x - 14, signY + 8, x + 14, signY + 37);
      graphics.lineBetween(x + 14, signY + 8, x - 14, signY + 37);
    } else {
      // STOP (barre horizontale épaisse)
      graphics.lineStyle(8, 0xffffff);
      graphics.lineBetween(x - 18, signY + 20, x + 18, signY + 20);
      // Texte "STOP" simplifié (lignes)
      graphics.lineStyle(3, 0xffffff);
      graphics.lineBetween(x - 10, signY + 12, x + 10, signY + 12);
      graphics.lineBetween(x - 10, signY + 28, x + 10, signY + 28);
    }

    // REFLET SUR LE PANNEAU (détail métallique)
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillRect(x - signWidth / 2 + 2, signY + 2, signWidth - 4, 8);

    // OMBRE PORTÉE (ellipse réaliste)
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillEllipse(x, roadTopY + 35, signWidth * 0.9, 10);

    // Stocker la position Y pour le Z-sorting
    graphics.poleY = signY + (signHeight / 2);

    return graphics;
  }

  /**
   * Crée une barrière - DESIGN PREMIUM
   */
  _createBarrier(x, roadTopY) {
    const graphics = this.add.graphics();
    const barrierWidth = 90; // Plus large
    const barrierHeight = 35; // Plus haute
    const barrierY = roadTopY + 6;

    // POTEAUX DE LA BARRIÈRE (avec détail)
    // Ombre des poteaux
    graphics.fillStyle(0x222222);
    graphics.fillRect(x - barrierWidth / 2 - 5, roadTopY + 1, 10, 28);
    graphics.fillRect(x + barrierWidth / 2 - 5, roadTopY + 1, 10, 28);

    // Poteaux principaux (métal)
    graphics.fillStyle(0x444444);
    graphics.fillRect(x - barrierWidth / 2 - 4, roadTopY, 8, 28);
    graphics.fillRect(x + barrierWidth / 2 - 4, roadTopY, 8, 28);

    // Reflet métallique sur les poteaux
    graphics.fillStyle(0x666666, 0.6);
    graphics.fillRect(x - barrierWidth / 2 - 3, roadTopY, 3, 28);
    graphics.fillRect(x + barrierWidth / 2 + 1, roadTopY, 3, 28);

    // BASE DES POTEAUX (cônes)
    graphics.fillStyle(0x222222);
    graphics.fillRect(x - barrierWidth / 2 - 7, roadTopY, 14, 8);
    graphics.fillRect(x + barrierWidth / 2 - 7, roadTopY, 14, 8);

    // BARRE HORIZONTALE PRINCIPALE (rouge et blanc alternés avec ombre)
    for (let i = 0; i < 5; i++) {
      const segmentX = x - barrierWidth / 2 + (i * barrierWidth / 5);
      const color = i % 2 === 0 ? 0xff0000 : 0xffffff;

      // Ombre du segment
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRect(segmentX + 1, barrierY + 1, barrierWidth / 5, 12);

      // Segment principal
      graphics.fillStyle(color, 0.98);
      graphics.fillRect(segmentX, barrierY, barrierWidth / 5, 12);

      // Bordure noire entre les segments
      graphics.lineStyle(2, 0x000000);
      graphics.strokeRect(segmentX, barrierY, barrierWidth / 5, 12);

      // Reflet sur les segments blancs
      if (color === 0xffffff) {
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(segmentX + 1, barrierY + 1, barrierWidth / 5 - 2, 4);
      }
    }

    // BARRE SUPÉRIEURE (détail)
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - barrierWidth / 2 - 2, barrierY - 3, barrierWidth + 4, 3);

    // OMBRE PORTÉE (ellipse réaliste)
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillEllipse(x, roadTopY + 22, barrierWidth + 10, 8);

    // Stocker la position Y pour le Z-sorting
    graphics.poleY = barrierY + (barrierHeight / 2);

    return graphics;
  }

  /**
   * Crée un poteau simple - DESIGN PREMIUM
   */
  _createSimplePole(x, roadTopY, roadBottomY) {
    const graphics = this.add.graphics();
    const poleWidth = 10; // Plus large
    const poleHeight = roadBottomY - roadTopY;

    // BASE DU POTEAU (cône avec détail)
    graphics.fillStyle(0x222222);
    graphics.fillRect(x - poleWidth / 2 - 1, roadTopY, poleWidth + 2, 16);
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - poleWidth / 2, roadTopY, poleWidth, 14);

    // POTEAU PRINCIPAL (métal avec dégradé réaliste)
    // Ombre gauche
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - poleWidth / 2, roadTopY + 16, poleWidth / 3, poleHeight - 16);
    // Centre (métal)
    graphics.fillStyle(0x444444);
    graphics.fillRect(x - poleWidth / 2 + poleWidth / 3, roadTopY + 16, poleWidth / 3, poleHeight - 16);
    // Reflet droit (lumière)
    graphics.fillStyle(0x666666, 0.7);
    graphics.fillRect(x - poleWidth / 2 + (poleWidth * 2 / 3), roadTopY + 16, poleWidth / 3, poleHeight - 16);

    // JOINTURES MÉTALLIQUES (détails)
    graphics.fillStyle(0x555555);
    graphics.fillRect(x - poleWidth / 2 - 1, roadTopY + 16, poleWidth + 2, 2);
    graphics.fillRect(x - poleWidth / 2 - 1, roadTopY + poleHeight / 2, poleWidth + 2, 2);

    // CAPUCHON SUPÉRIEUR (détail)
    graphics.fillStyle(0x333333);
    graphics.fillRect(x - poleWidth / 2 - 2, roadTopY + 14, poleWidth + 4, 4);

    // OMBRE PORTÉE (ellipse allongée)
    graphics.fillStyle(0x000000, 0.45);
    graphics.fillEllipse(x, roadBottomY, poleWidth * 2.5, 12);

    // Stocker la position Y pour le Z-sorting
    graphics.poleY = roadTopY + (poleHeight / 2);

    return graphics;
  }

  /**
   * Crée des effets ambiants spécifiques au Stage 8 (MILITARY BASE - Lava Area)
   */
  _createStage8AmbientEffects(screenHeight, worldWidth, roadTopY) {
    if (!this.levelIndex || this.levelIndex !== 8) return;

    const bgHeight = screenHeight * 0.4;
    const lavaGlowY = roadTopY - bgHeight * 0.3; // Position de la lave dans le background

    // 1. EFFET DE LUEUR DE LAVE (couche animée)
    const lavaGlowGraphics = this.add.graphics();
    lavaGlowGraphics.setDepth(-7);
    lavaGlowGraphics.setScrollFactor(0.4, 1);

    // Créer plusieurs points de lueur animés
    const glowPoints = [];
    const numGlows = Math.floor(worldWidth / 400);

    for (let i = 0; i < numGlows; i++) {
      const x = i * 400 + Phaser.Math.Between(0, 200);
      glowPoints.push({
        x,
        baseAlpha: Phaser.Math.FloatBetween(0.3, 0.6),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2)
      });
    }

    // Fonction pour dessiner les lueurs
    const drawLavaGlows = () => {
      lavaGlowGraphics.clear();
      const time = this.time.now * 0.001;

      glowPoints.forEach((point) => {
        const alpha = point.baseAlpha + Math.sin(time * 2 + point.phase) * 0.2;
        const radius = 60 + Math.sin(time * 1.5 + point.phase) * 20;

        lavaGlowGraphics.fillStyle(0xff4400, Math.max(0, Math.min(1, alpha)));
        lavaGlowGraphics.fillCircle(point.x, lavaGlowY, radius);

        // Cœur plus brillant
        lavaGlowGraphics.fillStyle(0xffff00, alpha * 0.6);
        lavaGlowGraphics.fillCircle(point.x, lavaGlowY, radius * 0.4);
      });
    };

    // Dessiner initialement
    drawLavaGlows();

    // Mettre à jour à chaque frame
    this.time.addEvent({
      delay: 50,
      callback: drawLavaGlows,
      loop: true
    });

    // 2. PARTICULES DE FUMÉE/SCORIES (effet subtil)
    this.stage8Particles = this.add.particles(0, lavaGlowY, null, {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      speed: { min: 10, max: 30 },
      angle: { min: 260, max: 280 },
      lifespan: 3000,
      frequency: 200,
      tint: [0x442222, 0x663333, 0x221111],
      emitZone: { type: 'edge', source: new Phaser.Geom.Rectangle(0, 0, worldWidth, 10), quantity: 1 }
    });
    this.stage8Particles.setDepth(-6);
    this.stage8Particles.setScrollFactor(0.35, 1);

    // 3. LIGNES DE LUMIÈRE MILITAIRES (effet de structure)
    const structureLines = this.add.graphics();
    structureLines.setDepth(-8);
    structureLines.setScrollFactor(0.3, 1);
    structureLines.lineStyle(1, 0xff6600, 0.3);

    // Dessiner des lignes verticales pour simuler des structures
    for (let i = 0; i < worldWidth; i += 300) {
      const x = i + Phaser.Math.Between(-50, 50);
      const startY = roadTopY - bgHeight * 0.5;
      const endY = roadTopY - bgHeight * 0.1;

      structureLines.beginPath();
      structureLines.moveTo(x, startY);
      structureLines.lineTo(x, endY);
      structureLines.strokePath();
    }

    // 4. BRILLANCE AMBIANTE (overlay léger)
    const ambientOverlay = this.add.rectangle(0, 0, worldWidth, bgHeight, 0xff4400);
    ambientOverlay.setOrigin(0, 0);
    ambientOverlay.setAlpha(0.05);
    ambientOverlay.setDepth(-11);
    ambientOverlay.setScrollFactor(0.02, 1);
    ambientOverlay.setBlendMode(Phaser.BlendModes.ADD);

    console.log('[STAGE8] ✓ Effets ambiants créés (lueur de lave, particules, structures lumineuses)');
  }

  _updateForegroundDepth() {
    if (!this.foregroundElements || !this.player) return;

    const screenHeight = this.scale.height;
    const roadTopY = screenHeight * 0.4;
    const roadBottomY = screenHeight;

    // Depth du joueur basée sur sa position Y
    // Plus le Y est grand (bas = proche), plus la depth est élevée (devant)
    // Plus le Y est petit (haut = loin), plus la depth est faible (derrière)
    const playerY = this.player.y;
    const playerDepth = 50 + Math.floor((playerY - roadTopY) / (roadBottomY - roadTopY) * 100);
    this.player.setDepth(playerDepth);

    // Mettre à jour la depth de chaque élément de premier plan
    this.foregroundElements.forEach((element) => {
      if (!element || !element.active) return;

      // Utiliser la position Y stockée ou la position actuelle
      const elementY = element.poleY || element.y || (roadTopY + (roadBottomY - roadTopY) / 2);

      // Calculer la depth de l'élément (même logique que le joueur)
      const elementDepth = 50 + Math.floor((elementY - roadTopY) / (roadBottomY - roadTopY) * 100);

      // Si le joueur est plus bas (plus proche) que l'élément, le joueur passe devant
      // Si le joueur est plus haut (plus loin) que l'élément, l'élément passe devant
      if (playerY > elementY) {
        // Joueur plus bas = devant l'élément
        element.setDepth(elementDepth - 1); // L'élément est derrière
      } else {
        // Joueur plus haut = derrière l'élément
        element.setDepth(elementDepth + 1); // L'élément est devant
      }
    });
  }

  _addRoadDetails3D(worldWidth, roadHeight, roadTopY, screenHeight, envPack, accentColor, baseColor, vanishingPointY) {
    const envKey = this.levelConfig?.envKey;
    const detailsGraphics = this.add.graphics();

    // FLÈCHES DIRECTIONNELLES EN PERSPECTIVE 3D
    const markingCount = Math.floor(worldWidth / 400);
    for (let i = 0; i < markingCount; i++) {
      const x = (i * 400) + 200;
      const y = roadTopY + (roadHeight * 0.4);

      // Calculer la taille de la flèche selon la distance (perspective)
      const progress = x / worldWidth;
      const arrowSize = 20 * (1 - progress * 0.3);

      // Flèche directionnelle avec ombre 3D
      detailsGraphics.fillStyle(accentColor, 0.5);
      detailsGraphics.beginPath();
      detailsGraphics.moveTo(x - arrowSize, y);
      detailsGraphics.lineTo(x, y - arrowSize * 0.6);
      detailsGraphics.lineTo(x + arrowSize, y);
      detailsGraphics.closePath();
      detailsGraphics.fillPath();

      // Ombre de la flèche
      detailsGraphics.fillStyle(0x000000, 0.2);
      detailsGraphics.beginPath();
      detailsGraphics.moveTo(x - arrowSize, y + 1);
      detailsGraphics.lineTo(x, y - arrowSize * 0.6 + 1);
      detailsGraphics.lineTo(x + arrowSize, y + 1);
      detailsGraphics.closePath();
      detailsGraphics.fillPath();
    }

    // PAVÉS INDIVIDUELS EN PERSPECTIVE (lignes de séparation verticales)
    const tileSpacing = 150;
    const numVerticalLines = Math.floor(worldWidth / tileSpacing);
    for (let i = 1; i < numVerticalLines; i++) {
      const x = i * tileSpacing;
      const progress = x / worldWidth;

      // Ligne verticale qui converge vers le point de fuite
      const topY = roadTopY;
      const bottomY = screenHeight;
      const topWidth = 0;
      const bottomWidth = 0;

      // Calculer la position selon la perspective
      const lineX = x;

      detailsGraphics.lineStyle(1, baseColor, 0.15 + (progress * 0.1));
      detailsGraphics.beginPath();
      detailsGraphics.moveTo(lineX, topY);
      detailsGraphics.lineTo(lineX, bottomY);
      detailsGraphics.strokePath();
    }

    // IMPERFECTIONS RÉALISTES (taches, usure) avec profondeur
    const imperfectionCount = Math.floor(worldWidth / 500);
    for (let i = 0; i < imperfectionCount; i++) {
      const x = (i * 500) + Math.random() * 200;
      const y = roadTopY + Math.random() * roadHeight;
      const progress = x / worldWidth;
      const size = (5 + Math.random() * 10) * (1 - progress * 0.2);

      // Tache avec ombre
      detailsGraphics.fillStyle(0x000000, 0.15);
      detailsGraphics.fillCircle(x, y, size);
      detailsGraphics.fillStyle(baseColor, 0.1);
      detailsGraphics.fillCircle(x - 1, y - 1, size * 0.7);
    }

    // DÉTAILS SPÉCIFIQUES SELON L'ENVIRONNEMENT (en 3D)
    switch (envKey) {
      case 'night_city':
        // Reflets de néon sur la route avec perspective
        for (let i = 0; i < Math.floor(worldWidth / 600); i++) {
          const x = (i * 600) + Math.random() * 200;
          const y = roadTopY + roadHeight * 0.7;
          const progress = x / worldWidth;
          const width = 50 * (1 - progress * 0.3);

          detailsGraphics.fillStyle(0x00aaff, 0.25);
          detailsGraphics.fillEllipse(x, y, width, 6);

          // Reflet lumineux
          detailsGraphics.fillStyle(0x88ddff, 0.15);
          detailsGraphics.fillEllipse(x, y - 1, width * 0.6, 3);
        }
        break;
      case 'cyber_city':
        // Lignes néon au sol en perspective
        for (let i = 0; i < Math.floor(worldWidth / 300); i++) {
          const x = (i * 300) + 150;
          const y = roadTopY + roadHeight * 0.5;
          const progress = x / worldWidth;
          const length = 60 * (1 - progress * 0.2);

          detailsGraphics.lineStyle(2, 0x00ffff, 0.4);
          detailsGraphics.beginPath();
          detailsGraphics.moveTo(x - length / 2, y);
          detailsGraphics.lineTo(x + length / 2, y);
          detailsGraphics.strokePath();

          // Lueur
          detailsGraphics.lineStyle(1, 0x88ffff, 0.2);
          detailsGraphics.beginPath();
          detailsGraphics.moveTo(x - length / 2, y);
          detailsGraphics.lineTo(x + length / 2, y);
          detailsGraphics.strokePath();
        }
        break;
      case 'sewers':
        // Grilles d'égout en perspective 3D
        for (let i = 0; i < Math.floor(worldWidth / 700); i++) {
          const x = (i * 700) + 350;
          const y = roadTopY + roadHeight * 0.8;
          const progress = x / worldWidth;
          const size = 35 * (1 - progress * 0.2);

          // Grille avec ombre
          detailsGraphics.fillStyle(0x1a1a1a, 0.7);
          detailsGraphics.fillRect(x - size / 2, y - size / 2, size, size);

          detailsGraphics.lineStyle(2, 0x2a2a2a, 0.8);
          detailsGraphics.strokeRect(x - size / 2, y - size / 2, size, size);

          // Grille interne
          detailsGraphics.lineStyle(1, 0x2a2a2a, 0.6);
          const gridLines = 3;
          for (let j = 1; j < gridLines; j++) {
            const offset = (size / gridLines) * j;
            detailsGraphics.beginPath();
            detailsGraphics.moveTo(x - size / 2, y - size / 2 + offset);
            detailsGraphics.lineTo(x + size / 2, y - size / 2 + offset);
            detailsGraphics.strokePath();
            detailsGraphics.beginPath();
            detailsGraphics.moveTo(x - size / 2 + offset, y - size / 2);
            detailsGraphics.lineTo(x - size / 2 + offset, y + size / 2);
            detailsGraphics.strokePath();
          }

          // Ombre sous la grille
          detailsGraphics.fillStyle(0x000000, 0.3);
          detailsGraphics.fillRect(x - size / 2 + 2, y + size / 2, size, 3);
        }
        break;
      case 'casino_city':
        // Motifs étoiles en perspective 3D
        for (let i = 0; i < Math.floor(worldWidth / 500); i++) {
          const x = (i * 500) + 250;
          const y = roadTopY + roadHeight * 0.6;
          const progress = x / worldWidth;
          const starSize = 10 * (1 - progress * 0.3);

          // Étoile avec ombre
          detailsGraphics.fillStyle(0xffd700, 0.5);
          detailsGraphics.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * starSize;
            const py = y + Math.sin(angle) * starSize;
            if (j === 0) detailsGraphics.moveTo(px, py);
            else detailsGraphics.lineTo(px, py);
          }
          detailsGraphics.closePath();
          detailsGraphics.fillPath();

          // Ombre de l'étoile
          detailsGraphics.fillStyle(0x000000, 0.2);
          detailsGraphics.beginPath();
          for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * starSize;
            const py = y + 1 + Math.sin(angle) * starSize;
            if (j === 0) detailsGraphics.moveTo(px, py);
            else detailsGraphics.lineTo(px, py);
          }
          detailsGraphics.closePath();
          detailsGraphics.fillPath();
        }
        break;
    }

    detailsGraphics.setDepth(1.1);
    detailsGraphics.setScrollFactor(1, 1);
    this.roadContainer.add(detailsGraphics);
  }

  _createParticleTexture() {
    // Créer une texture simple pour les particules (carré blanc)
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 4, 4);
    graphics.generateTexture('particle', 4, 4);
    graphics.destroy();
  }

  _createUI() {
    // Bouton Start
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.startButton = this.add.text(centerX, centerY, 'START GAME\n(Press ENTER)', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setDepth(1000); // Très haut pour être au-dessus de tout
    this.startButton.setScrollFactor(0);
    this.startButton.setInteractive({ useHandCursor: true });

    // Click sur le bouton
    this.startButton.on('pointerdown', () => {
      this._startGame();
    });

    // Support touche Entrée pour démarrer
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.enterKey.on('down', () => {
      if (!this.gameStarted) {
        this._startGame();
      }
    });

    // Bouton Pause
    const pauseX = this.cameras.main.width - 60;
    const pauseY = 30;

    this.pauseButton = this.add.text(pauseX, pauseY, '⏸', {
      fontSize: '32px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    this.pauseButton.setOrigin(0.5);
    this.pauseButton.setDepth(100);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.setVisible(false);

    this.pauseButton.on('pointerdown', () => {
      this._togglePause();
    });
  }

  _startGame() {
    if (this.gameStarted) return;

    this.gameStarted = true;
    this.startButton.destroy();
    this.pauseButton.setVisible(true);

    // Initialiser le timer arcade
    this.gameTimer = 99;
    if (this.hud && this.hud.updateTimer) {
      this.hud.updateTimer(this.gameTimer);
    }

    // Démarrer le timer (décrémente chaque seconde)
    this.timerEvent = this.time.addEvent({
      delay: 1000, // 1 seconde
      callback: this._updateTimer,
      callbackScope: this,
      loop: true
    });

    // Lancer la musique de fond
    if (this.audioManager && typeof this.audioManager.playBGM === 'function') {
      this.audioManager.playBGM();
    }

    // Démarrer la première vague avec transition
    this.currentWave = 1;
    this.enemiesKilled = 0;
    this._triggerWaveTransition(1);
  }

  _updateTimer() {
    if (!this.gameStarted || this.isGamePaused || this.gameOverActive) return;

    this.gameTimer--;

    // Mettre à jour l'affichage
    if (this.hud && this.hud.updateTimer) {
      this.hud.updateTimer(this.gameTimer);
    }

    // Son de tic-tac si moins de 10 secondes
    if (this.gameTimer <= 10 && this.gameTimer > 0) {
      if (!this.timerTicking) {
        this.timerTicking = true;
      }
      // Jouer un son de tic-tac (si disponible)
      if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
        // Utiliser un son existant ou créer un son simple
        try {
          this.audioManager.playSFX('hit'); // Fallback sur hit si pas de son de timer
        } catch (e) {
          // Ignorer si le son n'existe pas
        }
      }
    }

    // Game Over si timer atteint 0
    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      if (this.hud && this.hud.updateTimer) {
        this.hud.updateTimer(0);
      }
      // Tuer le joueur (game over)
      if (this.player && !this.gameOverActive) {
        this.player.health = 0;
        this._handleGameOver();
      }
    }
  }

  _togglePause() {
    if (!this.gameStarted || this.gameOverActive) return;

    this.isGamePaused = !this.isGamePaused;

    if (this.isGamePaused) {
      // PAUSE : Freeze complet du jeu
      this.pauseButton.setText('▶');

      // Pause de la physique
      this.physics.pause();

      // FREEZE MANUEL DES ENNEMIS
      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active) {
          // Figer l'animation
          if (enemy.anims && enemy.anims.isPlaying) {
            enemy.anims.pause();
          }
          // Désactiver les collisions
          if (enemy.body) {
            enemy.body.checkCollision.none = true;
          }
          // Flag de pause
          enemy.isPaused = true;
          // Arrêter le mouvement
          enemy.setVelocity(0, 0);
        }
      });

      // FREEZE DU BOSS
      if (this.boss && this.boss.active) {
        if (this.boss.anims && this.boss.anims.isPlaying) {
          this.boss.anims.pause();
        }
        if (this.boss.body) {
          this.boss.body.checkCollision.none = true;
        }
        this.boss.isPaused = true;
        this.boss.setVelocity(0, 0);
      }

      // FREEZE DU JOUEUR
      if (this.player && this.player.active) {
        if (this.player.anims && this.player.anims.isPlaying) {
          this.player.anims.pause();
        }
        if (this.player.body) {
          this.player.body.checkCollision.none = true;
        }
        this.player.isPaused = true;
        this.player.setVelocity(0, 0);

        // Figer aussi le sprite de l'arme si équipée
        if (this.player.weaponSprite && this.player.weaponSprite.active) {
          // L'arme reste visible mais ne bouge plus (géré par la pause de la scène)
        }
      }

      console.log('[PAUSE] Jeu figé');
    } else {
      // RESUME : Reprendre le jeu
      this.pauseButton.setText('⏸');

      // Reprendre la physique
      this.physics.resume();

      // REPRENDRE LES ENNEMIS
      this.enemies.children.iterate((enemy) => {
        if (enemy && enemy.active) {
          // Reprendre l'animation
          if (enemy.anims && enemy.anims.isPaused) {
            enemy.anims.resume();
          }
          // Réactiver les collisions
          if (enemy.body) {
            enemy.body.checkCollision.none = false;
          }
          // Retirer le flag de pause
          enemy.isPaused = false;
        }
      });

      // REPRENDRE LE BOSS
      if (this.boss && this.boss.active) {
        if (this.boss.anims && this.boss.anims.isPaused) {
          this.boss.anims.resume();
        }
        if (this.boss.body) {
          this.boss.body.checkCollision.none = false;
        }
        this.boss.isPaused = false;
      }

      // REPRENDRE LE JOUEUR
      if (this.player && this.player.active) {
        if (this.player.anims && this.player.anims.isPaused) {
          this.player.anims.resume();
        }
        if (this.player.body) {
          this.player.body.checkCollision.none = false;
        }
        this.player.isPaused = false;
      }

      console.log('[PAUSE] Jeu repris');
    }
  }

  _triggerWaveTransition(waveNum) {
    // Empêcher les transitions multiples
    if (this.isTransitioning) {
      console.log('[TRANSITION] Transition déjà en cours, ignorée');
      return;
    }

    this.isTransitioning = true;
    this.isWaveActive = false; // Verrouiller pendant la transition

    const centerX = this.cameras.main.width / 2;
    const centerY = this.scale.height / 2;

    // Vérifier si c'est la vague de boss (dernière vague)
    const isBossWave = waveNum >= this.totalWaves;

    if (isBossWave) {
      // ANIMATION BOSS : "WARNING !!" + "BOSS DETECTED"
      console.log(`[TRANSITION] Animation BOSS pour la vague ${waveNum}`);

      // Texte principal "WARNING !!"
      const warningText = this.add.text(centerX, centerY - 40, 'WARNING !!', {
        fontSize: '80px',
        fontFamily: 'monospace',
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
        fontWeight: 'bold'
      });
      warningText.setOrigin(0.5);
      warningText.setDepth(300);
      warningText.setScrollFactor(0);
      warningText.setAlpha(0);

      // Sous-titre "BOSS DETECTED"
      const bossText = this.add.text(centerX, centerY + 60, 'BOSS DETECTED', {
        fontSize: '48px',
        fontFamily: 'monospace',
        fill: '#ff3333',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        fontWeight: 'bold'
      });
      bossText.setOrigin(0.5);
      bossText.setDepth(300);
      bossText.setScrollFactor(0);
      bossText.setAlpha(0);

      // Animation : Fade in + Clignotement + Shake
      this.tweens.add({
        targets: [warningText, bossText],
        alpha: 1,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          // Clignotement rapide (flash)
          this.tweens.add({
            targets: [warningText, bossText],
            alpha: { from: 1, to: 0.3 },
            duration: 100,
            repeat: 5,
            yoyo: true,
            ease: 'Power2'
          });
        }
      });

      // Tremblement de caméra (shake)
      this.cameras.main.shake(2000, 0.02);

      // Après 3 secondes, lancer le boss
      this.time.delayedCall(3000, () => {
        warningText.destroy();
        bossText.destroy();
        this.isTransitioning = false;
        this._startWave(waveNum);
      });

    } else {
      // ANIMATION VAGUE NORMALE : "WAVE [X]"
      console.log(`[TRANSITION] Animation normale pour la vague ${waveNum}`);

      const waveText = this.add.text(centerX, centerY, `WAVE ${waveNum}`, {
        fontSize: '80px',
        fontFamily: 'monospace',
        fill: '#00ffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
        fontWeight: 'bold'
      });
      waveText.setOrigin(0.5);
      waveText.setDepth(300);
      waveText.setScrollFactor(0);
      waveText.setScale(0); // Commencer à scale 0

      // Animation : Zoom In brutal (Ease.Back.Out) puis fade out
      this.tweens.add({
        targets: waveText,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Maintenir le texte visible pendant 1.5 secondes
          this.time.delayedCall(1500, () => {
            // Fade out
            this.tweens.add({
              targets: waveText,
              alpha: 0,
              duration: 500,
              ease: 'Power2',
              onComplete: () => {
                waveText.destroy();
                this.isTransitioning = false;
                this._startWave(waveNum);
              }
            });
          });
        }
      });
    }
  }

  _startWave(waveNum) {
    // waveNum est le numéro de vague (1-based)
    console.log(`[WAVE] Level ${this.levelIndex} - Démarrage vague ${waveNum}/${this.totalWaves}`);

    // VERROUILLAGE : Empêcher la détection de victoire pendant le spawn
    this.isWaveActive = false;
    console.log(`[WAVE] Verrouillage activé (isWaveActive = false) pour la vague ${waveNum}`);

    this.hud.updateWave(waveNum, this.totalWaves, `STAGE ${this.levelIndex}: ${this.levelConfig.title}`);

    // Mettre à jour la limite de déplacement du joueur pour cette vague
    if (this.waveSegmentLength && this.playerStartX !== null) {
      const targetMaxX = this.playerStartX + this.waveSegmentLength * waveNum;
      this.currentRightLimitX = Phaser.Math.Clamp(
        targetMaxX,
        this.playerStartX + 200,
        this.worldWidth - this.stageEndMargin
      );
      console.log(`[WAVE] Limite X pour la vague ${waveNum}: ${Math.floor(this.currentRightLimitX)}`);
    }

    // Vérifier si c'est la dernière vague (boss)
    if (waveNum >= this.totalWaves) {
      // VAGUE BOSS - CINÉMATIQUE pour tous les boss
      this.startFinalBossCutscene();
    } else {
      // VAGUE D'ENNEMIS
      this._spawnWaveEnemies();
    }
  }

  _spawnWaveEnemies() {
    // Calculer le nombre d'ennemis pour cette vague
    // Répartir enemiesToKill sur toutes les vagues (sauf la dernière qui est le boss)
    const enemiesPerWave = Math.ceil(this.enemiesToKill / (this.totalWaves - 1));
    // Types d'ennemis par défaut (la nouvelle config n'a plus cette propriété)
    const enemyTypes = ['punk']; // Par défaut, on utilise les punks

    console.log(`[WAVE] Spawn de ${enemiesPerWave} ennemis (types: ${enemyTypes.join(', ')})`);

    // Spawner 3 props destructibles aléatoirement (légèrement devant le joueur)
    const propCount = 3;
    for (let i = 0; i < propCount; i++) {
      const propSpawnBaseX = Phaser.Math.Clamp(this.player.x + 200, 300, this.worldWidth - 400);
      const propX = Phaser.Math.Between(propSpawnBaseX, propSpawnBaseX + 250);
      const propY = Phaser.Math.Between(this.scale.height * 0.4, this.scale.height * 0.8);

      this.time.delayedCall(i * 200, () => {
        const prop = new Prop(this, propX, propY, 'crate');
        this.props.add(prop);
        this._alignSpriteToGround(prop);
        console.log(`[PROP] Caisse spawnée à (${propX}, ${propY})`);
      });
    }

    let spawnedCount = 0;

    for (let i = 0; i < enemiesPerWave; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

      // Faire apparaître les ennemis sur la DROITE de la caméra (hors écran)
      const cameraRight = this.cameras.main.scrollX + this.cameras.main.width;
      const spawnBaseX = Phaser.Math.Clamp(cameraRight + 80, 400, this.worldWidth - 50);
      const x = spawnBaseX + i * 60;

      // Les ennemis apparaissent posés sur la route
      const y = this.groundY;

      this.time.delayedCall(i * 500, () => {
        const enemy = spawnEnemy(this, type, x, y);
        if (enemy) {
          enemy.setDepth(5);
          this._alignSpriteToGround(enemy);
          this._clampSpriteToRoad(enemy);
          this.enemies.add(enemy);
          spawnedCount++;

          console.log(`[ENEMY] Spawné: ${type} (IA: ${enemy.aiType}) à (${x}, ${y})`);

          enemy.on('enemy-dead', () => {
            this.enemies.remove(enemy);
            this.enemiesKilled++;
            this.addScore(120);
            console.log(`[ENEMY] Ennemis tués: ${this.enemiesKilled}/${this.enemiesToKill}`);
          });

          // DÉVERROUILLAGE : Après le dernier spawn, activer la détection de victoire
          if (spawnedCount === enemiesPerWave) {
            this.isWaveActive = true;
            console.log(`[WAVE] Tous les ennemis spawnés (${spawnedCount}/${enemiesPerWave}), verrouillage désactivé (isWaveActive = true)`);
          }
        } else {
          console.error(`[ENEMY] Échec du spawn pour type: ${type}`);
        }
      });
    }
  }

  /**
   * CINÉMATIQUE BOSS : Séquence scriptée avant chaque boss
   */
  startFinalBossCutscene() {
    const bossConfig = getBossConfig(this.levelIndex);
    const bossName = bossConfig?.name || this.levelConfig?.bossName || 'BOSS';
    console.log(`[CUTSCENE] Démarrage de la cinématique pour ${bossName}`);

    // ÉTAPE 1 : FREEZE - Le joueur perd le contrôle
    this.input.enabled = false; // Désactiver les contrôles
    if (this.player) {
      this.player.setVelocityX(0);
      this.player.setVelocityY(0);
      this.player.playAction('idle', true);
      this.player.isLocked = true;
    }

    // Couper la musique
    if (this.audioManager && typeof this.audioManager.stopBGM === 'function') {
      this.audioManager.stopBGM();
    }

    // ÉTAPE 2 : ALERTE - Son d'alarme + clignotement rouge
    this.time.delayedCall(500, () => {
      // Son d'alarme (si disponible)
      if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
        // this.audioManager.playSFX('alarm'); // À implémenter si le son existe
      }

      // Rectangle rouge pour le clignotement
      const redOverlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0xff0000,
        0
      );
      redOverlay.setDepth(200);
      redOverlay.setScrollFactor(0);

      // Animation de clignotement
      this.tweens.add({
        targets: redOverlay,
        alpha: { from: 0, to: 0.3 },
        duration: 200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          redOverlay.destroy();
        }
      });

      // Texte d'alerte
      const warningText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        'WARNING: WHALE ALERT',
        {
          fontSize: '48px',
          fontFamily: 'monospace',
          color: '#ff0000',
          stroke: '#000000',
          strokeThickness: 6,
        }
      )
        .setOrigin(0.5, 0.5)
        .setDepth(201)
        .setScrollFactor(0)
        .setAlpha(0);

      // Animation du texte
      this.tweens.add({
        targets: warningText,
        alpha: { from: 0, to: 1 },
        duration: 300,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          warningText.destroy();
        }
      });

      // ÉTAPE 3 : ENTRÉE DU BOSS - Pan caméra + chute du ciel
      this.time.delayedCall(1500, () => {
        // Calculer la position du boss (à droite du joueur)
        const bossX = this.player ? this.player.x + 400 : 800;
        const bossYStart = -200; // Commence au-dessus de l'écran
        const bossYEnd = this.groundY ?? (this.scale.height - 120); // Atterrit au sol

        // Pan de la caméra vers la droite pour révéler le boss
        const camStartX = this.cameras.main.scrollX;
        const camTargetX = bossX - this.scale.width / 2;

        this.tweens.add({
          targets: this.cameras.main,
          scrollX: camTargetX,
          duration: 2000,
          ease: 'Power2.easeInOut',
          onComplete: () => {
            // Spawner le boss (invisible pour l'instant)
            this.bossActive = true;
            const bossConfig = getBossConfig(this.levelIndex);
            const playerIdleKey = Player.frameKey('idle', 1);

            // Créer le boss hors écran (en haut)
            this.boss = this.physics.add.sprite(bossX, bossYStart, playerIdleKey);
            this.boss.setScale(bossConfig.scale || 4);
            this.boss.setTint(bossConfig.tint || 0xF3BA2F);
            this.boss.setDepth(100);
            this.boss.setVisible(true);
            this.boss.setActive(true);

            // Stats du boss
            this.boss.health = bossConfig.hp || this.levelConfig.bossHP;
            this.boss.maxHealth = bossConfig.hp || this.levelConfig.bossHP;
            this.boss.isDead = false;
            this.boss.isLocked = true; // Empêcher le boss de bouger pendant la cinématique

            // Animation de chute
            this.tweens.add({
              targets: this.boss,
              y: bossYEnd,
              duration: 800,
              ease: 'Power3.easeIn',
              onComplete: () => {
                // Atterrissage lourd : Screen Shake + Particules
                this._applyScreenShake(30);
                this._spawnHitParticles(this.boss.x, this.boss.y, true);

                // Son d'impact (si disponible)
                // if (this.audioManager) this.audioManager.playSFX('boss_land');

                // ÉTAPE 4 : DIALOGUE
                this.time.delayedCall(500, () => {
                  // Dialogues spécifiques selon le boss
                  const dialogues = {
                    10: "Funds are SAFU...\nBut YOU are not.",
                    9: "Backdoor? What backdoor?\nI'm just... optimizing.",
                    8: "KYC required!\nCode is NOT law here!",
                    7: "The house always wins.\nYou're just a statistic.",
                    6: "I hunt wicks.\nYou're my next target.",
                    5: "Stable? Always.\nUntil it's not.",
                    4: "Original code?\nWhy code when you can fork?",
                    3: "50x leverage?\nWhat could go wrong?",
                    2: "Vesting? I print faster\nthan you can count.",
                    1: "Supercycle incoming!\nTrust me, bro.",
                  };
                  const dialogueContent = dialogues[this.levelIndex] || "You've reached the end.\nNow face me!";

                  // Bulle de texte au-dessus du boss
                  const dialogueText = this.add.text(
                    this.boss.x,
                    this.boss.y - 100,
                    dialogueContent,
                    {
                      fontSize: '24px',
                      fontFamily: 'monospace',
                      color: '#ffffff',
                      stroke: '#000000',
                      strokeThickness: 4,
                      align: 'center',
                      backgroundColor: '#000000',
                      padding: { x: 15, y: 10 }
                    }
                  )
                    .setOrigin(0.5, 0.5)
                    .setDepth(202)
                    .setScrollFactor(1, 1);

                  // Attendre 3 secondes
                  this.time.delayedCall(3000, () => {
                    dialogueText.destroy();

                    // ÉTAPE 5 : REPRISE
                    // Caméra revient sur le joueur (ou dézoome)
                    const finalCamX = (this.player.x + this.boss.x) / 2 - this.scale.width / 2;
                    this.tweens.add({
                      targets: this.cameras.main,
                      scrollX: finalCamX,
                      duration: 1500,
                      ease: 'Power2.easeInOut',
                      onComplete: () => {
                        // Texte "FIGHT!"
                        const fightText = this.add.text(
                          this.scale.width / 2,
                          this.scale.height / 2,
                          'FIGHT!',
                          {
                            fontSize: '72px',
                            fontFamily: 'monospace',
                            color: '#ff0000',
                            stroke: '#000000',
                            strokeThickness: 8,
                          }
                        )
                          .setOrigin(0.5, 0.5)
                          .setDepth(203)
                          .setScrollFactor(0)
                          .setAlpha(0)
                          .setScale(0.5);

                        // Animation du texte
                        this.tweens.add({
                          targets: fightText,
                          alpha: { from: 0, to: 1 },
                          scale: { from: 0.5, to: 1.5 },
                          duration: 400,
                          ease: 'Back.easeOut',
                          yoyo: true,
                          onComplete: () => {
                            fightText.destroy();

                            // Finaliser le spawn du boss
                            this._finalizeBossSpawn();

                            // Relancer la musique de boss
                            if (this.audioManager && typeof this.audioManager.playBGM === 'function') {
                              this.audioManager.playBGM();
                            }

                            // Rendre les contrôles au joueur
                            this.input.enabled = true;
                            if (this.player) {
                              this.player.isLocked = false;
                            }
                            if (this.boss) {
                              this.boss.isLocked = false;
                            }

                            // Activer la vague
                            this.isWaveActive = true;

                            console.log('[CUTSCENE] Cinématique terminée, combat commencé!');
                          }
                        });
                      }
                    });
                  });
                });
              }
            });
          }
        });
      });
    });
  }

  /**
   * Finalise le spawn du boss après la cinématique (initialise les collisions, etc.)
   */
  _finalizeBossSpawn() {
    if (!this.boss) return;

    const bossConfig = getBossConfig(this.levelIndex);

    // Initialiser les propriétés du boss
    this.boss.lastAttackTime = 0;
    this.boss.attackCooldown = bossConfig.attackRate || 2000;
    this.boss.isAttacking = false;
    this.boss.attackState = 'idle';
    this.boss.aiType = bossConfig.aiType || 'UBER';
    this.boss.speed = bossConfig.speed || 180;
    this.boss.damage = 20;
    this.boss.attackRange = 100;
    this.boss.knockbackResist = bossConfig.knockbackResist || false;

    // Initialiser les variables d'IA
    this.boss.lastDashTime = 0;
    this.boss.isDashing = false;
    this.boss.lastShotTime = 0;
    this.boss.lastBombTime = 0;
    this.boss.lastJumpTime = 0;
    this.boss.lastSummonTime = 0;
    this.boss.randomDirection = { x: 0, y: 0 };
    this.boss.randomTimer = 0;
    this.boss.uberPhase = 0;
    this.boss.uberTimer = 0;
    this.boss.isCharging = false;
    this.boss.dashTarget = { x: 0, y: 0 };
    this.boss.lastFired = 0;

    // HITBOX D'ATTAQUE
    this.boss.attackHitbox = this.add.zone(this.boss.x, this.boss.y, 100, 100);
    this.physics.add.existing(this.boss.attackHitbox);
    this.boss.attackHitbox.body.setAllowGravity(false);
    this.boss.attackHitbox.body.enable = false;
    this.boss.attackHitbox.setData('type', 'boss-attack');

    // Animation idle
    this.boss.play(Player.animKey('idle'), true);

    // PHYSIQUE
    if (this.boss.body) {
      const realWidth = this.boss.width;
      const realHeight = this.boss.height;
      const hitboxWidth = realWidth * 0.2;
      const hitboxHeight = realHeight * 0.2;
      this.boss.body.setSize(hitboxWidth, hitboxHeight);
      const offsetX = (realWidth - hitboxWidth) / 2;
      const offsetY = (realHeight - hitboxHeight) / 2;
      this.boss.body.setOffset(offsetX, offsetY);
      this.boss.body.enable = true;
      this.boss.body.setImmovable(false);
      this.boss.body.setCollideWorldBounds(true);
      this.boss.body.setGravityY(0);
    }

    // Collisions
    if (this.player) {
      this.physics.add.collider(this.player, this.boss, this._handleBossTouchPlayer, null, this);
    }

    if (this.player && this.player.attackHitbox) {
      this.physics.add.overlap(
        this.player.attackHitbox,
        this.boss,
        this._handlePlayerHitBoss,
        null,
        this
      );
    }

    if (this.player && this.boss.attackHitbox) {
      this.physics.add.overlap(
        this.boss.attackHitbox,
        this.player,
        this._handleBossAttackHitPlayer,
        null,
        this
      );
    }

    // Méthode takeDamage (copiée de _spawnBoss)
    this.boss.takeDamage = (amount, sourceX = null) => {
      if (this.boss.isDead) return;

      this.boss.health -= amount;
      console.log(`[BOSS] Dégâts: ${amount}, PV: ${this.boss.health}`);

      if (sourceX !== null && this.boss.body) {
        const knockDir = this.boss.x < sourceX ? -1 : 1;
        const knockbackForce = 100;
        this.boss.body.setVelocityX(knockDir * -knockbackForce);

        this.time.addEvent({
          delay: 20,
          repeat: 5,
          callback: () => {
            if (this.boss && !this.boss.isDead && this.boss.body) {
              this.boss.body.setVelocityX(this.boss.body.velocity.x * 0.7);
            }
          }
        });
      }

      // Flash rouge
      let flashCount = 0;
      const flashTimer = this.time.addEvent({
        delay: 50,
        repeat: 4,
        callback: () => {
          if (this.boss && !this.boss.isDead) {
            flashCount++;
            if (flashCount % 2 === 0) {
              this.boss.setTint(0xff3333);
            } else {
              const bossConfig = getBossConfig(this.levelIndex);
              this.boss.setTint(bossConfig ? bossConfig.tint : 0xF3BA2F);
            }
            if (flashCount >= 4) {
              const bossConfig = getBossConfig(this.levelIndex);
              this.boss.setTint(bossConfig ? bossConfig.tint : 0xF3BA2F);
              flashTimer.destroy();
            }
          } else {
            flashTimer.destroy();
          }
        }
      });

      // Mettre à jour la barre de vie
      if (this.hud) {
        this.hud.updateBossHealth(this.boss.health, this.boss.maxHealth);
      }

      if (this.boss.health <= 0) {
        this.boss.isDead = true;
        this.bossActive = false;
        this._handleStageClear();
        if (this.hud) {
          this.hud.hideBossHealth();
        }
        this.boss.destroy();
        this.boss = null;
      }
    };

    // Afficher la barre de vie
    if (this.hud) {
      const bossName = bossConfig?.name || this.levelConfig?.bossName || 'GENERAL ZHAO';
      this.hud.showBossHealth(this.boss.health, this.boss.maxHealth, bossName);
    }

    console.log('[BOSS] Boss finalisé après cinématique!');
  }

  _spawnBoss(bossHP) {
    console.log('========================================');
    console.log(`[BOSS] SPAWN BOSS (HP: ${bossHP})`);
    console.log('========================================');

    this.bossActive = true;

    // Récupérer les données du boss depuis BOSS_CONFIG
    const bossConfig = getBossConfig(this.levelIndex);
    console.log(`[BOSS] Configuration du boss:`, bossConfig);

    // Position : Même hauteur Y que le joueur pour qu'ils soient sur le même plan
    const bossX = this.player ? this.player.x + 200 : 600; // À droite du joueur
    const bossY = this.groundY ?? (this.scale.height - 120); // Posé sur le sol

    // IMAGE DE SECOURS : Utiliser l'image 'idle1' du joueur
    const playerIdleKey = Player.frameKey('idle', 1); // 'player-idle-1'
    console.log(`[BOSS] Utilisation de l'image: ${playerIdleKey}`);

    // Créer le boss manuellement
    this.boss = this.physics.add.sprite(bossX, bossY, playerIdleKey);

    if (!this.boss) {
      console.error('[BOSS] ÉCHEC: Impossible de créer le sprite!');
      return;
    }

    // VISUEL de base depuis BOSS_CONFIG
    this.boss.setScale(bossConfig.scale || 4);
    this.boss.setTint(bossConfig.tint || 0xff0000);
    this.boss.setDepth(100);
    this.boss.setVisible(true);
    this.boss.setActive(true);

    // Position
    this.boss.x = bossX;
    this.boss.y = bossY;
    this._alignSpriteToGround(this.boss);
    this._clampSpriteToRoad(this.boss);

    // Stats depuis BOSS_CONFIG (priorité sur bossHP passé en paramètre)
    this.boss.health = bossConfig.hp || bossHP;
    this.boss.maxHealth = bossConfig.hp || bossHP;
    this.boss.isDead = false;
    this.boss.lastAttackTime = 0;
    this.boss.attackCooldown = bossConfig.attackRate || 2000;
    this.boss.isAttacking = false;
    this.boss.attackState = 'idle';

    // Configuration de l'IA depuis BOSS_CONFIG (IMPORTANT: garder la casse originale)
    this.boss.aiType = bossConfig.aiType || 'CHASER';
    this.boss.speed = bossConfig.speed || 50;
    this.boss.damage = 20; // Dégâts par défaut
    this.boss.attackRange = 100;
    this.boss.knockbackResist = bossConfig.knockbackResist || false;

    // Log pour debug
    console.log(`[BOSS] Configuration appliquée:`, {
      name: bossConfig.name,
      aiType: this.boss.aiType,
      hp: this.boss.health,
      speed: this.boss.speed,
      scale: bossConfig.scale,
      tint: bossConfig.tint.toString(16)
    });

    // Initialiser les variables d'IA spécifiques
    this.boss.lastDashTime = 0;
    this.boss.isDashing = false;
    this.boss.lastShotTime = 0;
    this.boss.lastBombTime = 0;
    this.boss.lastJumpTime = 0;
    this.boss.lastSummonTime = 0;
    this.boss.randomDirection = { x: 0, y: 0 };
    this.boss.randomTimer = 0;
    this.boss.uberPhase = 0; // Pour UBER boss
    this.boss.uberTimer = 0;
    this.boss.isCharging = false; // Pour SHOOTER (charge avant de tirer)
    this.boss.dashTarget = { x: 0, y: 0 }; // Pour DASHER (position cible)
    this.boss.lastFired = 0; // Pour SHOOTER (timer de tir)

    // HITBOX D'ATTAQUE DU BOSS
    this.boss.attackHitbox = this.add.zone(this.boss.x, this.boss.y, 100, 100);
    this.physics.add.existing(this.boss.attackHitbox);
    this.boss.attackHitbox.body.setAllowGravity(false);
    this.boss.attackHitbox.body.enable = false; // Désactivée par défaut
    this.boss.attackHitbox.setData('type', 'boss-attack');

    // Animation initiale : idle
    this.boss.play(Player.animKey('idle'), true);

    // PHYSIQUE - HITBOX RÉDUITE (seulement le tronc)
    if (this.boss.body) {
      // Après setScale(4), la taille réelle est width * 4 et height * 4
      // On veut une hitbox très petite (0.2 de la taille) pour que seule la zone centrale soit touchable
      const realWidth = this.boss.width; // Largeur réelle après scale
      const realHeight = this.boss.height; // Hauteur réelle après scale

      // Hitbox réduite à 20% de la taille (seulement le tronc)
      const hitboxWidth = realWidth * 0.2;
      const hitboxHeight = realHeight * 0.2;

      this.boss.body.setSize(hitboxWidth, hitboxHeight);

      // Centrer la hitbox sur le sprite
      const offsetX = (realWidth - hitboxWidth) / 2;
      const offsetY = (realHeight - hitboxHeight) / 2;
      this.boss.body.setOffset(offsetX, offsetY);

      this.boss.body.enable = true;
      this.boss.body.setImmovable(false); // Permettre au boss de bouger
      this.boss.body.setCollideWorldBounds(true);
      this.boss.body.setGravityY(0); // Pas de gravité en mode 2.5D

      console.log(`[BOSS] Hitbox ajustée: ${Math.floor(hitboxWidth)}x${Math.floor(hitboxHeight)} (offset: ${Math.floor(offsetX)}, ${Math.floor(offsetY)})`);
    }

    // Collisions
    if (this.player) {
      // Collision physique : Si le boss touche le joueur, dégâts + knockback
      this.physics.add.collider(this.player, this.boss, this._handleBossTouchPlayer, null, this);
    }

    if (this.player && this.player.attackHitbox) {
      this.physics.add.overlap(
        this.player.attackHitbox,
        this.boss,
        this._handlePlayerHitBoss,
        null,
        this
      );
    }

    // Overlap entre la hitbox d'attaque du boss et le joueur
    if (this.player && this.boss.attackHitbox) {
      this.physics.add.overlap(
        this.boss.attackHitbox,
        this.player,
        this._handleBossAttackHitPlayer,
        null,
        this
      );
    }

    // Méthode takeDamage pour le boss
    this.boss.takeDamage = (amount, sourceX = null) => {
      if (this.boss.isDead) return;

      this.boss.health -= amount;
      console.log(`[BOSS] Dégâts: ${amount}, PV: ${this.boss.health}`);

      // TANK : Ignore le knockback (ne recule pas quand il est touché dans handleHit)
      if (this.boss.aiType === 'TANK' && this.boss.knockbackResist) {
        // Pas de knockback, juste les dégâts
      } else if (sourceX !== null && this.boss.body) {
        // Knockback normal pour les autres types
        const knockDir = this.boss.x < sourceX ? -1 : 1;
        const knockbackForce = 100;
        this.boss.body.setVelocityX(knockDir * -knockbackForce);

        // Réduire progressivement le knockback
        this.time.addEvent({
          delay: 20,
          repeat: 5,
          callback: () => {
            if (this.boss && !this.boss.isDead && this.boss.body) {
              this.boss.body.setVelocityX(this.boss.body.velocity.x * 0.7);
            }
          }
        });
      }

      // Flash rouge avec clignotement
      let flashCount = 0;
      const flashTimer = this.time.addEvent({
        delay: 50,
        repeat: 4,
        callback: () => {
          if (this.boss && !this.boss.isDead) {
            flashCount++;
            if (flashCount % 2 === 0) {
              this.boss.setTint(0xff3333);
            } else {
              const bossConfig = getBossConfig(this.levelIndex);
              this.boss.setTint(bossConfig ? bossConfig.tint : 0xff0000);
            }
            if (flashCount >= 4) {
              const bossConfig = getBossConfig(this.levelIndex);
              this.boss.setTint(bossConfig ? bossConfig.tint : 0xff0000);
              flashTimer.destroy();
            }
          } else {
            flashTimer.destroy();
          }
        }
      });

      // Mettre à jour la barre de vie
      if (this.hud) {
        this.hud.updateBossHealth(this.boss.health, this.boss.maxHealth);
      }

      if (this.boss.health <= 0) {
        this.boss.isDead = true;
        this.bossActive = false;
        this._handleStageClear();
        if (this.hud) {
          this.hud.hideBossHealth();
        }
        this.boss.destroy();
        this.boss = null;
      }
    };

    // Afficher la barre de vie
    if (this.hud) {
      // Afficher la barre de vie du boss avec son nom
      const bossName = bossConfig?.name || this.levelConfig?.bossName || 'BOSS';
      this.hud.showBossHealth(this.boss.health, this.boss.maxHealth, bossName);
    }

    console.log('[BOSS] Boss spawné avec succès!');
    console.log('========================================');
  }

  /**
   * Prépare l'avancée vers la droite avant de lancer la prochaine vague.
   * Affiche un gros "GO →" et fixe une position X minimale à atteindre.
   */
  _prepareAdvanceToNextWave() {
    if (!this.player) return;

    // Ne pas configurer deux fois
    if (this.isWaitingForAdvance) return;

    this.isWaitingForAdvance = true;

    // Calculer une cible basée sur le découpage en segments
    if (this.waveSegmentLength && this.playerStartX !== null) {
      const nextSegmentIndex = this.currentWave; // on vient de terminer currentWave, on prépare la suivante
      const idealTarget = this.playerStartX + this.waveSegmentLength * nextSegmentIndex;
      this.waveAdvanceTargetX = Phaser.Math.Clamp(
        idealTarget,
        this.player.x + 100,
        this.worldWidth - this.stageEndMargin
      );
    } else {
      // Fallback : avancer d'au moins 400px
      const targetOffset = 400;
      this.waveAdvanceTargetX = Phaser.Math.Clamp(
        this.player.x + targetOffset,
        this.player.x + 100,
        this.worldWidth - this.stageEndMargin
      );
    }

    console.log(`[WAVE] Vague terminée, avancer jusqu'à x >= ${this.waveAdvanceTargetX} pour lancer la suivante`);

    this._showGoArrow();
  }

  /**
   * Affiche un indicateur "GO →" fixe sur l'écran (HUD).
   */
  _showGoArrow() {
    // Détruire l'ancien si besoin
    if (this.goArrow) {
      this.goArrow.destroy();
      this.goArrow = null;
    }

    const cam = this.cameras.main;
    const centerY = cam.height * 0.35;
    const x = cam.width - 120;

    // Conteneur pour le texte + flèche
    const container = this.add.container(x, centerY);
    container.setScrollFactor(0);
    container.setDepth(500);

    const text = this.add.text(0, 0, 'GO', {
      fontSize: '40px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'right',
    });
    text.setOrigin(1, 0.5);

    const arrow = this.add.text(10, 0, '➜', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    });
    arrow.setOrigin(0, 0.5);

    container.add([text, arrow]);

    // Petite animation de va-et-vient pour attirer l'œil
    this.tweens.add({
      targets: container,
      x: x + 20,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.goArrow = container;
  }

  _updateBossAI(time) {
    if (!this.boss || !this.player || this.boss.isDead || this.boss.isAttacking) {
      if (this.boss && this.boss.isAttacking) {
        this.boss.body.setVelocity(0, 0);
      }
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.boss.x,
      this.boss.y,
      this.player.x,
      this.player.y
    );

    // BOSS_CONFIG utilise des majuscules, donc on garde la casse originale
    const aiType = (this.boss.aiType || 'CHASER').toUpperCase();
    this.boss.setFlipX(this.player.x < this.boss.x);

    switch (aiType) {
      case 'CHASER':
        this._updateBossChaser(distance, time);
        break;
      case 'SHOOTER':
        this._updateBossShooter(distance, time);
        break;
      case 'TANK':
        this._updateBossTank(distance, time);
        break;
      case 'DASHER':
        this._updateBossDasher(distance, time);
        break;
      case 'TURRET':
        this._updateBossTurret(distance, time);
        break;
      case 'BOMBER':
        this._updateBossBomber(distance, time);
        break;
      case 'JUMPER':
        this._updateBossJumper(distance, time);
        break;
      case 'RANDOM':
        this._updateBossRandom(distance, time);
        break;
      case 'SUMMONER':
        this._updateBossSummoner(distance, time);
        break;
      case 'UBER':
        this._updateBossUber(distance, time);
        break;
      default:
        console.warn(`[BOSS AI] Type inconnu: ${aiType}, utilisation de CHASER par défaut`);
        this._updateBossChaser(distance, time);
    }
  }

  _alignSpriteToGround(sprite) {
    if (!sprite || typeof this.groundY !== 'number') {
      return;
    }

    const originY = sprite.originY ?? 0.5;
    const displayHeight = sprite.displayHeight || sprite.height || 0;
    const bottomOffset = displayHeight * (1 - originY);
    const targetY = this.groundY - bottomOffset;

    sprite.setY(targetY);

    if (sprite.body && typeof sprite.body.reset === 'function') {
      sprite.body.reset(sprite.x, sprite.y);
    }

    this._clampSpriteToRoad(sprite);
  }

  _clampSpriteToRoad(sprite) {
    // NE PAS utiliser cette fonction pour le joueur (géré directement dans update)
    // Utilisée seulement pour les ennemis et props
    if (
      !sprite ||
      typeof this.roadTopBoundary !== 'number' ||
      typeof this.roadBottomBoundary !== 'number'
    ) {
      return;
    }

    const originY = sprite.originY ?? 0.5;
    const displayHeight = sprite.displayHeight || sprite.height || 0;
    const bottomOffset = displayHeight * (1 - originY);

    const minBottom = this.roadTopBoundary + 4;
    let maxBottom = this.roadBottomBoundary;

    if (sprite instanceof Prop) {
      maxBottom -= 2;
    }

    const currentBottom = sprite.y + bottomOffset;

    // Clamping simple : seulement si vraiment sorti
    if (currentBottom < minBottom) {
      const targetY = (minBottom - bottomOffset);
      sprite.setY(targetY);
      if (sprite.body && sprite.body.velocity && sprite.body.velocity.y < 0) {
        sprite.body.setVelocityY(0);
      }
    } else if (currentBottom > maxBottom) {
      const targetY = (maxBottom - bottomOffset);
      sprite.setY(targetY);
      if (sprite.body && sprite.body.velocity && sprite.body.velocity.y > 0) {
        sprite.body.setVelocityY(0);
      }
    }

    this._updateSpriteDepth(sprite);
  }

  _updateSpriteDepth(sprite) {
    if (!sprite) return;
    const baseDepth = 50;
    sprite.setDepth(baseDepth + sprite.y);
  }

  _updateBossChaser(distance, time) {
    // CHASER : Fonce sur le joueur et attaque activement
    const attackRange = this.boss.attackRange || 100;
    const canAttack = time >= this.boss.lastAttackTime + this.boss.attackCooldown;

    // Si le boss est en train d'attaquer, ne rien faire
    if (this.boss.isAttacking) {
      this.boss.body.setVelocity(0, 0);
      return;
    }

    // SI (distance < attackRange ET cooldown terminé ET pas déjà en train d'attaquer) : ATTAQUER
    if (distance < attackRange && canAttack && !this.boss.isAttacking) {
      this._bossPerformAttack(time);
    }
    // SINON SI (pas en train d'attaquer) : CHASSER
    else if (!this.boss.isAttacking) {
      // Continuer de chasser le joueur
      this.physics.moveToObject(this.boss, this.player, this.boss.speed || 50);
      if (this.boss.attackState !== 'walking') {
        this.boss.attackState = 'walking';
        this.boss.play(Player.animKey('walk'), true);
        // Maintenir le tint et le scale
        const bossConfig = getBossConfig(this.levelIndex);
        if (bossConfig) {
          this.boss.setTint(bossConfig.tint || 0xff0000);
          this.boss.setScale(bossConfig.scale || 4);
        }
      }
    }
  }

  _updateBossShooter(distance, time) {
    // SHOOTER : Essaie de garder une distance de 350px avec le joueur
    const idealDistance = 350;
    const minDistance = 300; // Si distance < 300 : Recule
    const maxDistance = 400; // Si distance > 400 : Avance doucement

    // Ne pas bloquer le mouvement pendant la charge (le boss peut bouger et tirer)

    // MOUVEMENT selon la distance
    if (distance < minDistance) {
      // Trop proche : RECULER (fuir le joueur)
      const dirX = this.player.x < this.boss.x ? 1 : -1;
      const dirY = this.player.y < this.boss.y ? 1 : -1;
      this.boss.body.setVelocity(
        dirX * (this.boss.speed || 120) * 0.8,
        dirY * (this.boss.speed || 120) * 0.6
      );
      if (this.boss.attackState !== 'walking') {
        this.boss.attackState = 'walking';
        this.boss.play(Player.animKey('walk'), true);
      }
    } else if (distance > maxDistance) {
      // Trop loin : AVANCER doucement
      this.physics.moveToObject(this.boss, this.player, (this.boss.speed || 120) * 0.5);
      if (this.boss.attackState !== 'walking') {
        this.boss.attackState = 'walking';
        this.boss.play(Player.animKey('walk'), true);
      }
    } else {
      // Distance idéale (300-400) : RESTE SUR PLACE
      this.boss.body.setVelocity(0, 0);
      if (this.boss.attackState !== 'idle') {
        this.boss.attackState = 'idle';
        this.boss.play(Player.animKey('idle'), true);
      }
    }

    // ATTAQUE : Toutes les 2 secondes (lastFired), lance un Projectile vers le joueur
    if (!this.boss.lastFired) this.boss.lastFired = 0;

    if (time >= this.boss.lastFired + 2000) {
      this._bossFireProjectile(this.player);
      this.boss.lastFired = time;
    }
  }

  _bossShooterChargeAndFire(time) {
    if (!this.boss || this.boss.isDead) return;

    // S'arrêter
    this.boss.body.setVelocity(0, 0);
    this.boss.isCharging = true;

    // Clignoter en jaune (charge)
    let flashCount = 0;
    const maxFlashes = 6;
    const flashInterval = 100;

    const flashTimer = this.time.addEvent({
      delay: flashInterval,
      repeat: maxFlashes - 1,
      callback: () => {
        if (this.boss && !this.boss.isDead) {
          flashCount++;
          if (flashCount % 2 === 0) {
            this.boss.setTint(0xffff00); // Jaune
          } else {
            const bossConfig = getBossConfig(this.levelIndex);
            this.boss.setTint(bossConfig ? bossConfig.tint : 0xff0000);
          }

          if (flashCount >= maxFlashes) {
            // Tirer le projectile
            this._bossFireProjectile(this.player);
            this.boss.isCharging = false;
            const bossConfig = getBossConfig(this.levelIndex);
            this.boss.setTint(bossConfig ? bossConfig.tint : 0xff0000);
            flashTimer.destroy();
          }
        } else {
          flashTimer.destroy();
        }
      }
    });
  }

  _updateBossTank(distance, time) {
    // TANK : Avance très lentement (speed = 20). Ne s'arrête jamais. Pas de coup spécial, c'est un rouleau compresseur.
    // Physique : this.body.setImmovable(true) (Il ne recule pas quand on le tape)
    if (!this.boss.body.immovable || this.boss.knockbackResist) {
      this.boss.body.setImmovable(true);
    }

    // Avance TOUJOURS vers le joueur (ne s'arrête jamais) avec vitesse très lente
    const tankSpeed = 20; // Vitesse fixe très lente
    this.physics.moveToObject(this.boss, this.player, tankSpeed);

    if (this.boss.attackState !== 'walking') {
      this.boss.attackState = 'walking';
      this.boss.play(Player.animKey('walk'), true);
    }

    // Pas d'attaque spéciale, juste avance et fait des dégâts par contact
  }

  _updateBossDasher(distance, time) {
    // DASHER : Reste immobile 1 seconde, puis fait un Dash violent (vitesse 600) vers la dernière position connue du joueur, puis s'arrête. Répète.
    const dashCooldown = 3000; // 1 seconde d'immobilité + 2 secondes de cooldown
    const dashSpeed = 600;

    if (!this.boss.lastDashTime) this.boss.lastDashTime = 0;
    if (!this.boss.isDashing) this.boss.isDashing = false;
    if (!this.boss.dashTarget) this.boss.dashTarget = { x: 0, y: 0 };

    // Phase 1 : Immobile pendant 1 seconde
    const waitTime = 1000;
    if (!this.boss.isDashing && time >= this.boss.lastDashTime + waitTime && time < this.boss.lastDashTime + dashCooldown) {
      // Rester immobile
      this.boss.body.setVelocity(0, 0);
      if (this.boss.attackState !== 'idle') {
        this.boss.attackState = 'idle';
        this.boss.play(Player.animKey('idle'), true);
      }
    }

    // Phase 2 : Dash violent vers la dernière position connue
    if (!this.boss.isDashing && time >= this.boss.lastDashTime + dashCooldown) {
      // Sauvegarder la position actuelle du joueur
      this.boss.dashTarget.x = this.player.x;
      this.boss.dashTarget.y = this.player.y;

      // Lancer le dash
      this.boss.isDashing = true;
      this.boss.lastDashTime = time;

      // Dash ultra rapide vers cette position
      this.physics.moveTo(this.boss, this.boss.dashTarget.x, this.boss.dashTarget.y, dashSpeed);

      if (this.boss.attackState !== 'walking') {
        this.boss.attackState = 'walking';
        this.boss.play(Player.animKey('walk'), true);
      }

      // Arrêter le dash après avoir atteint la position ou après 500ms
      this.time.delayedCall(500, () => {
        if (this.boss && !this.boss.isDead) {
          this.boss.isDashing = false;
          this.boss.body.setVelocity(0, 0);
          // Redémarrer le cycle
          this.boss.lastDashTime = this.time.now;
        }
      });
    }
  }

  _updateBossTurret(distance, time) {
    // TURRET : Ne bouge pas, tire dans 3 directions
    this.boss.body.setVelocity(0, 0);

    if (this.boss.attackState !== 'idle') {
      this.boss.attackState = 'idle';
      this.boss.play(Player.animKey('idle'), true);
    }

    // Tir en éventail (3 directions) toutes les X secondes
    if (time >= this.boss.lastShotTime + this.boss.attackCooldown) {
      this._bossFireTurretProjectiles(3);
      this.boss.lastShotTime = time;
    }
  }

  _updateBossBomber(distance, time) {
    // BOMBER : Reste au centre. Toutes les 2s, fait apparaître un sprite de danger rouge au sol sous le joueur, qui fait des dégâts après 0.5s
    this.boss.body.setVelocity(0, 0);

    if (this.boss.attackState !== 'idle') {
      this.boss.attackState = 'idle';
      this.boss.play(Player.animKey('idle'), true);
    }

    // Lancer une bombe toutes les 2 secondes
    if (time >= this.boss.lastBombTime + this.boss.attackCooldown) {
      this._bossDropBomb();
      this.boss.lastBombTime = time;
    }
  }

  _updateBossJumper(distance, time) {
    // JUMPER : Saute partout
    const jumpCooldown = this.boss.attackCooldown || 2000;

    if (this.boss.isAttacking) {
      this.boss.body.setVelocity(0, 0);
      return;
    }

    // Faire un saut toutes les X secondes
    if (time >= this.boss.lastJumpTime + jumpCooldown) {
      this._bossJump();
      this.boss.lastJumpTime = time;
    }

    // Sinon, mouvement normal vers le joueur
    if (!this.boss.isAttacking) {
      this.physics.moveToObject(this.boss, this.player, this.boss.speed || 200);
      if (this.boss.attackState !== 'walking') {
        this.boss.attackState = 'walking';
        this.boss.play(Player.animKey('walk'), true);
      }
    }
  }

  _updateBossRandom(distance, time) {
    // RANDOM : Mouvements erratiques
    const changeDirectionTime = 1000; // Change de direction toutes les secondes

    if (this.boss.isAttacking) {
      this.boss.body.setVelocity(0, 0);
      return;
    }

    // Changer de direction aléatoirement
    if (time >= this.boss.randomTimer + changeDirectionTime) {
      const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
      this.boss.randomDirection.x = Math.cos(angle);
      this.boss.randomDirection.y = Math.sin(angle);
      this.boss.randomTimer = time;
    }

    // Se déplacer dans la direction aléatoire
    const speed = this.boss.speed || 100;
    this.boss.body.setVelocity(
      this.boss.randomDirection.x * speed,
      this.boss.randomDirection.y * speed * 0.8
    );

    if (this.boss.attackState !== 'walking') {
      this.boss.attackState = 'walking';
      this.boss.play(Player.animKey('walk'), true);
    }

    // Attaquer de temps en temps
    const attackRange = this.boss.attackRange || 100;
    const canAttack = time >= this.boss.lastAttackTime + this.boss.attackCooldown;
    if (distance < attackRange && canAttack && !this.boss.isAttacking) {
      this._bossPerformAttack(time);
    }
  }

  _updateBossSummoner(distance, time) {
    // SUMMONER : Invoque des gardes
    const summonCooldown = this.boss.attackCooldown || 5000;

    if (this.boss.isAttacking) {
      this.boss.body.setVelocity(0, 0);
      return;
    }

    // Invoquer des gardes toutes les X secondes
    if (time >= this.boss.lastSummonTime + summonCooldown) {
      this._bossSummonGuards();
      this.boss.lastSummonTime = time;
    }

    // Mouvement normal vers le joueur
    if (!this.boss.isAttacking) {
      this.physics.moveToObject(this.boss, this.player, this.boss.speed || 50);
      if (this.boss.attackState !== 'walking') {
        this.boss.attackState = 'walking';
        this.boss.play(Player.animKey('walk'), true);
      }
    }
  }

  _updateBossUber(distance, time) {
    // UBER : Mélange Chaser + Shooter + Dash
    const phaseDuration = 5000; // Change de phase toutes les 5 secondes

    // Changer de phase
    if (time >= this.boss.uberTimer + phaseDuration) {
      this.boss.uberPhase = (this.boss.uberPhase + 1) % 3; // 0: Chaser, 1: Shooter, 2: Dash
      this.boss.uberTimer = time;
    }

    // Exécuter la phase actuelle
    switch (this.boss.uberPhase) {
      case 0: // CHASER
        this._updateBossChaser(distance, time);
        break;
      case 1: // SHOOTER
        this._updateBossShooter(distance, time);
        break;
      case 2: // DASHER
        this._updateBossDasher(distance, time);
        break;
    }
  }

  _bossFireProjectile(target) {
    // Méthode fireProjectile(target) : Crée un projectile (sprite simple tinté en vert) vers la cible
    if (!target) target = this.player;

    const dx = target.x - this.boss.x;
    const dy = target.y - this.boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const directionX = dx / dist;
    const directionY = dy / dist;

    // Créer un projectile (utilise une texture simple comme 'particle' ou rectangle tinté en vert)
    // Vérifier si la texture 'particle' existe, sinon créer un rectangle
    let projectile;
    if (this.textures.exists('particle')) {
      projectile = this.physics.add.sprite(this.boss.x, this.boss.y, 'particle');
      projectile.setTint(0x00ff00); // Vert
      projectile.setScale(2);
    } else {
      // Créer un rectangle vert comme fallback
      projectile = this.add.rectangle(this.boss.x, this.boss.y, 16, 16, 0x00ff00);
      this.physics.add.existing(projectile);
    }

    projectile.body.setAllowGravity(false);
    projectile.setDepth(3);

    // Ajouter au groupe de projectiles
    if (this.bossProjectiles) {
      this.bossProjectiles.add(projectile);
    }

    const speed = 400;
    projectile.body.setVelocity(directionX * speed, directionY * speed);

    // Détruire après 3 secondes
    this.time.delayedCall(3000, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });

    // Collision avec le joueur : Si le projectile touche le joueur, le joueur perd des PV et le projectile se détruit
    this.physics.add.overlap(
      projectile,
      this.player,
      (proj, player) => {
        if (player && !player.invulnerable) {
          const damage = this.boss.damage || 20;
          player.takeDamage(damage);
          console.log('[BOSS] Projectile touché! Dégâts:', damage);
          this._applyScreenShake(10);
          this._spawnHitParticles(player.x, player.y, false);
        }
        if (proj && proj.active) {
          proj.destroy();
        }
      },
      null,
      this
    );
  }

  _bossFireSimpleProjectile() {
    // Alias pour compatibilité
    this._bossFireProjectile(this.player);
  }

  _bossFireTurretProjectiles(count) {
    // Tire dans plusieurs directions (éventail)
    const angleSpread = 360 / count; // Répartir sur 360 degrés

    for (let i = 0; i < count; i++) {
      const angle = (i * angleSpread) * (Math.PI / 180);
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);

      const projectile = this.add.rectangle(this.boss.x, this.boss.y, 12, 12, 0xff0000);
      this.physics.add.existing(projectile);
      projectile.body.setAllowGravity(false);
      projectile.setDepth(3);

      const speed = 400;
      projectile.body.setVelocity(directionX * speed, directionY * speed);

      this.time.delayedCall(3000, () => {
        if (projectile && projectile.active) {
          projectile.destroy();
        }
      });

      this.physics.add.overlap(
        projectile,
        this.player,
        (proj, player) => {
          if (player && !player.invulnerable) {
            player.takeDamage(this.boss.damage || 20);
          }
          if (proj && proj.active) {
            proj.destroy();
          }
        },
        null,
        this
      );
    }
  }

  _bossDropBomb() {
    // Fait apparaître un sprite de danger rouge au sol sous le joueur
    const bombX = this.player.x;
    const bombY = this.player.y;

    // Zone de danger (rouge, clignotant)
    const dangerZone = this.add.circle(bombX, bombY, 60, 0xff0000, 0.5);
    dangerZone.setDepth(5);

    // Animation de clignotement
    this.tweens.add({
      targets: dangerZone,
      alpha: { from: 0.5, to: 1 },
      scale: { from: 0.8, to: 1.2 },
      duration: 500,
      repeat: 1,
      yoyo: true,
      onComplete: () => {
        // Après 0.5s, faire des dégâts
        if (this.player && !this.player.invulnerable) {
          const distance = Phaser.Math.Distance.Between(bombX, bombY, this.player.x, this.player.y);
          if (distance <= 60) {
            this.player.takeDamage(this.boss.damage || 20);
            this._applyScreenShake(15);
            this._spawnHitParticles(bombX, bombY, true);
          }
        }

        // Explosion visuelle
        const explosion = this.add.circle(bombX, bombY, 80, 0xff6600, 0.8);
        explosion.setDepth(5);
        this.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => explosion.destroy()
        });

        dangerZone.destroy();
      }
    });
  }

  _bossJump() {
    // Fait un saut vers le joueur
    if (this.boss.isAttacking) return;

    this.boss.isAttacking = true;

    const targetX = this.player.x;
    const targetY = this.player.y;
    const jumpHeight = 150;
    const jumpDuration = 600;

    // Animation de saut (arc)
    this.tweens.add({
      targets: this.boss,
      x: targetX,
      y: targetY - jumpHeight,
      duration: jumpDuration / 2,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: this.boss,
          y: targetY,
          duration: jumpDuration / 2,
          ease: 'Power2',
          onComplete: () => {
            this.boss.isAttacking = false;

            // Dégâts si le joueur est proche à l'atterrissage
            const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
            if (distance <= 80 && this.player && !this.player.invulnerable) {
              this.player.takeDamage(this.boss.damage || 20);
              this._applyScreenShake(20);
            }
          }
        });
      }
    });
  }

  _bossSummonGuards() {
    // Invoque 2 gardes (ennemis normaux) autour du boss
    const guardCount = 2;
    const spawnRadius = 150;

    for (let i = 0; i < guardCount; i++) {
      const angle = (i * 360 / guardCount) * (Math.PI / 180);
      const spawnX = this.boss.x + Math.cos(angle) * spawnRadius;
      const spawnY = this.boss.y + Math.sin(angle) * spawnRadius;

      // Spawn un ennemi punk (type basique)
      const guard = spawnEnemy(this, 'punk', spawnX, spawnY);
      if (guard && this.enemies) {
        guard.setDepth(5);
        this._alignSpriteToGround(guard);
        this._clampSpriteToRoad(guard);
        this.enemies.add(guard);
      }
    }

    console.log('[BOSS] Gardes invoqués!');
  }

  _bossFireFanProjectiles() {
    if (!this.boss.config || !this.boss.config.projectile) return;

    const projectileCount = this.boss.projectileCount || 5;
    const angleSpread = 60;

    const dx = this.player.x - this.boss.x;
    const dy = this.player.y - this.boss.y;
    const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const startAngle = baseAngle - (angleSpread * (projectileCount - 1)) / 2;

    for (let i = 0; i < projectileCount; i++) {
      const angle = (startAngle + i * angleSpread) * (Math.PI / 180);
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);

      const projectile = this.add.rectangle(this.boss.x, this.boss.y, 12, 12, 0xff0000);
      this.physics.add.existing(projectile);
      projectile.body.setAllowGravity(false);
      projectile.setDepth(3);

      const speed = this.boss.config.projectile.speed || 400;
      projectile.body.setVelocity(directionX * speed, directionY * speed);

      this.time.delayedCall(3000, () => {
        if (projectile && projectile.active) {
          projectile.destroy();
        }
      });

      this.physics.add.overlap(
        projectile,
        this.player,
        (proj, player) => {
          if (player && !player.invulnerable) {
            player.takeDamage(this.boss.config.projectile.damage || this.boss.damage);
          }
          if (proj && proj.active) {
            proj.destroy();
          }
        },
        null,
        this
      );
    }
  }

  _nextWave() {
    // Passer à la vague suivante
    this.currentWave += 1;

    if (this.currentWave > this.totalWaves) {
      // Toutes les vagues sont terminées (y compris le boss)
      console.log(`[LEVEL] Toutes les vagues terminées pour le Level ${this.levelIndex}!`);
      this._handleStageClear();
      return;
    }

    // Lancer la transition de vague (au lieu de spawner directement)
    this._triggerWaveTransition(this.currentWave);
  }

  _handlePlayerHitEnemy(playerHitbox, enemy) {
    // ========================================
    // SÉCURITÉ ABSOLUE : Vérifications critiques
    // ========================================

    // 1. Si l'ennemi est déjà mort ou buggé, on arrête tout
    if (!enemy || !enemy.active || enemy.isDead) return;

    // 2. Vérifier que le body existe et est actif
    if (!enemy.body || !enemy.body.enable) return;

    // 3. Flag anti-spam : Si l'ennemi est déjà en train d'être touché, on ignore
    if (enemy.isHit) return;

    // 4. Vérifier que le joueur existe et est valide
    if (!this.player || !this.player.active || !this.player.body) return;

    // 5. Vérifier si l'attaque est active
    if (!this.player.attackState || !this.player.attackState.active) return;

    // 6. Vérifier que la hitbox existe
    if (!playerHitbox || !playerHitbox.active) return;

    // ========================================
    // MARQUER L'ENNEMI COMME TOUCHÉ (anti-spam)
    // ========================================
    enemy.isHit = true;

    // Réinitialiser le flag après un court délai (pour permettre un nouveau hit)
    const resetTimer = this.time.delayedCall(300, () => {
      if (enemy && enemy.active && !enemy.isDead) {
        enemy.isHit = false;
      }
    });

    // Stocker le timer pour pouvoir le nettoyer si l'ennemi meurt
    if (!enemy._hitResetTimer) {
      enemy._hitResetTimer = resetTimer;
    } else {
      // Si un timer existe déjà, le détruire et le remplacer
      if (enemy._hitResetTimer && enemy._hitResetTimer.destroy) {
        enemy._hitResetTimer.destroy();
      }
      enemy._hitResetTimer = resetTimer;
    }

    // ========================================
    // LOGIQUE DE COMBAT
    // ========================================

    try {
      // Son : Punch (attaque du joueur)
      if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
        this.audioManager.playSFX('punch');
      }

      // SYSTÈME DE COMBO AMÉLIORÉ : Calculer les dégâts selon le combo
      const comboCount = this.player.comboCount || 1;
      const isFinisher = comboCount >= 3;

      // Calculer le multiplicateur de combo (plus généreux)
      const comboMultiplier = 1 + (comboCount - 1) * 0.6; // 1x, 1.6x, 2.2x, 2.8x...

      // Bonus de dégâts pour les finishers
      const finisherBonus = isFinisher ? 2 : 0;

      // SYSTÈME D'ARME : Vérifier si le joueur a une arme équipée
      let baseDamage = isFinisher ? (3 + finisherBonus) : 1; // Dégâts de base avec bonus finisher
      let weaponBonus = 0;

      // Bonus de dégâts progressif selon le combo
      const comboDamageBonus = Math.floor((comboCount - 1) * 0.5);

      if (this.player.currentWeapon && this.player.weaponDurability > 0) {
        // Utiliser les dégâts de l'arme
        weaponBonus = this.player.currentWeapon.damage;

        // Décrémenter la durabilité
        this.player.weaponDurability--;

        // Mettre à jour l'indicateur d'arme dans le HUD
        if (this.hud && this.hud.updateWeapon && this.player.currentWeapon) {
          this.hud.updateWeapon(this.player.currentWeapon, this.player.weaponDurability, this.player.currentWeapon.maxDurability);
        }

        // Vérifier si l'arme est cassée
        if (this.player.weaponDurability <= 0) {
          this._unequipWeapon(this.player);
        }
      }

      const damage = Math.floor((baseDamage + weaponBonus + comboDamageBonus) * comboMultiplier);
      const knockbackMultiplier = isFinisher ? 4 : (1 + comboCount * 0.3); // Knockback progressif

      // Appliquer les dégâts (avec vérification supplémentaire)
      if (enemy.takeDamage && typeof enemy.takeDamage === 'function' && enemy.active && !enemy.isDead) {
        enemy.takeDamage(damage, this.player.x);
      }

      // Son : Hit (ennemi touché)
      if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
        this.audioManager.playSFX('hit');
      }

      // KNOCKBACK selon le combo (seulement si l'ennemi est toujours actif)
      if (enemy.body && enemy.body.enable && isFinisher && !enemy.isDead) {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && isFinite(distance)) {
          const knockbackForce = 400 * knockbackMultiplier; // Force de base x3 pour finisher
          enemy.body.setVelocity(
            (dx / distance) * knockbackForce,
            (dy / distance) * knockbackForce
          );
        }
      }

      // Score selon le combo (avec multiplicateur)
      const baseScore = 120;
      const score = Math.floor(baseScore * comboMultiplier);

      // Ajouter de la rage selon le combo
      const rageGain = this.player.rageGainPerHit + (comboCount > 1 ? this.player.rageGainPerCombo * (comboCount - 1) : 0);
      this.player.addRage(rageGain);
      this.addScore(score);

      // VFX : Hit Stop, Screen Shake, Particules (seulement si l'ennemi est toujours valide)
      if (enemy.active && !enemy.isDead) {
        const hitStopDuration = isFinisher ? 200 : (50 + comboCount * 10);
        this._applyHitStop(hitStopDuration);
        this._applyScreenShake(isFinisher ? 20 : (5 + comboCount * 2));
        this._spawnHitParticles(enemy.x, enemy.y, isFinisher);

        // SLOW-MOTION sur les finishers
        if (isFinisher && !this.slowMotionActive) {
          this._activateSlowMotion(300); // 300ms de slow-mo
        }

        // UI FLOTTANTE : Afficher le texte de combo
        const comboTexts = {
          1: 'HIT!',
          2: 'DOUBLE!',
          3: 'TRIPLE!',
          4: 'COMBO!',
          5: 'MEGA!',
        };
        const comboText = comboTexts[comboCount] || `${comboCount}x COMBO!`;
        this._showComboText(enemy.x, enemy.y - 50, comboText, isFinisher);

        // Afficher le combo dans le HUD
        if (this.hud && this.hud.showCombo) {
          this.hud.showCombo(comboCount, comboMultiplier);
        }
      }
    } catch (error) {
      // Gestion d'erreur : Si quelque chose plante, on log et on continue
      console.error('[GAME] Erreur dans _handlePlayerHitEnemy:', error);
      // Réinitialiser le flag en cas d'erreur
      if (enemy && enemy.active) {
        enemy.isHit = false;
      }
    }
  }

  _handlePlayerHitBoss(playerHitbox, boss) {
    // ========================================
    // SÉCURITÉ ABSOLUE : Vérifications critiques
    // ========================================

    // 1. Si le boss est déjà mort ou buggé, on arrête tout
    if (!boss || !boss.active || boss.isDead) return;

    // 2. Vérifier que le body existe et est actif
    if (!boss.body || !boss.body.enable) return;

    // 3. Flag anti-spam : Si le boss est déjà en train d'être touché, on ignore
    if (boss.isHit) return;

    // 4. Vérifier que le joueur existe et est valide
    if (!this.player || !this.player.active || !this.player.body) return;

    // 5. Vérifier si l'attaque est active
    if (!this.player.attackState || !this.player.attackState.active) return;

    // 6. Vérifier que la hitbox existe
    if (!playerHitbox || !playerHitbox.active) return;

    // ========================================
    // MARQUER LE BOSS COMME TOUCHÉ (anti-spam)
    // ========================================
    boss.isHit = true;

    // Réinitialiser le flag après un court délai (pour permettre un nouveau hit)
    this.time.delayedCall(300, () => {
      if (boss && boss.active && !boss.isDead) {
        boss.isHit = false;
      }
    });

    // ========================================
    // LOGIQUE DE COMBAT
    // ========================================

    try {
      // Calculer le combo pour le boss aussi
      const comboCount = this.player.comboCount || 1;
      const isFinisher = comboCount === 3;

      // SYSTÈME D'ARME : Vérifier si le joueur a une arme équipée
      let baseDamage = isFinisher ? (3 + finisherBonus) : 1; // Dégâts de base avec bonus finisher
      let weaponBonus = 0;

      // Bonus de dégâts progressif selon le combo
      const comboDamageBonus = Math.floor((comboCount - 1) * 0.5);

      if (this.player.currentWeapon && this.player.weaponDurability > 0) {
        // Utiliser les dégâts de l'arme
        weaponBonus = this.player.currentWeapon.damage;

        // Décrémenter la durabilité
        this.player.weaponDurability--;

        // Mettre à jour l'indicateur d'arme dans le HUD
        if (this.hud && this.hud.updateWeapon && this.player.currentWeapon) {
          this.hud.updateWeapon(this.player.currentWeapon, this.player.weaponDurability, this.player.currentWeapon.maxDurability);
        }

        // Vérifier si l'arme est cassée
        if (this.player.weaponDurability <= 0) {
          this._unequipWeapon(this.player);
        }
      }

      const damage = Math.floor((baseDamage + weaponBonus + comboDamageBonus) * comboMultiplier);

      // Appliquer les dégâts (avec vérification supplémentaire)
      if (boss.takeDamage && typeof boss.takeDamage === 'function') {
        boss.takeDamage(damage, this.player.x);
      }

      // RÉACTIONS VISUELLES ET PHYSIQUES (seulement si le boss est toujours valide)
      if (boss.active && !boss.isDead) {
        // Shake du boss
        this.tweens.add({
          targets: boss,
          x: boss.x + Phaser.Math.Between(-8, 8),
          y: boss.y + Phaser.Math.Between(-8, 8),
          duration: 100,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            if (boss && !boss.isDead && boss.active) {
              // Restaurer position si nécessaire
            }
          }
        });

        // Particules d'impact
        this._spawnHitParticles(boss.x, boss.y, isFinisher);

        // Screen shake
        this._applyScreenShake(isFinisher ? 10 : 5);

        // Hit stop
        const hitStopDuration = isFinisher ? 100 : 30;
        this._applyHitStop(hitStopDuration);

        // Texte de combo amélioré
        const comboTexts = {
          1: 'HIT!',
          2: 'DOUBLE!',
          3: 'TRIPLE!',
          4: 'COMBO!',
          5: 'MEGA!',
        };
        const comboText = comboTexts[comboCount] || `${comboCount}x COMBO!`;
        this._showComboText(boss.x, boss.y - 80, comboText, isFinisher);

        // Slow-motion sur les finishers de boss aussi
        if (isFinisher && !this.slowMotionActive) {
          this._activateSlowMotion(400); // Plus long pour les boss
        }
      }
    } catch (error) {
      // Gestion d'erreur : Si quelque chose plante, on log et on continue
      console.error('[GAME] Erreur dans _handlePlayerHitBoss:', error);
      // Réinitialiser le flag en cas d'erreur
      if (boss && boss.active) {
        boss.isHit = false;
      }
    }
  }

  _handlePlayerHitProp(playerHitbox, prop) {
    // ========================================
    // SÉCURITÉ ABSOLUE : Vérifications critiques
    // ========================================

    // 1. Si la prop est déjà morte ou buggée, on arrête tout
    if (!prop || !prop.active || prop.isDead) return;

    // 2. Vérifier que le body existe et est actif
    if (!prop.body || !prop.body.enable) return;

    // 3. Flag anti-spam : Si la prop est déjà en train d'être touchée, on ignore
    if (prop.isTakingDamage) return;

    // 4. Vérifier que le joueur existe et est valide
    if (!this.player || !this.player.active || !this.player.body) return;

    // 5. Vérifier si l'attaque est active (utiliser hasActiveHitbox pour plus de fiabilité)
    if (!this.player.hasActiveHitbox || !this.player.hasActiveHitbox()) {
      // Fallback : vérifier attackState
      if (!this.player.attackState || !this.player.attackState.active) return;
    }

    // 6. Vérifier que la hitbox existe
    if (!playerHitbox || !playerHitbox.active) return;

    // 7. Vérifier que la scène existe
    if (!prop.scene || !prop.scene.scene) return;

    // ========================================
    // LOGIQUE DE COMBAT
    // ========================================

    try {
      console.log(`[PROP] Prop touchée! PV: ${prop.health}/${prop.maxHealth}`);

      // Appliquer les dégâts au prop (avec vérification supplémentaire)
      if (prop.takeDamage && typeof prop.takeDamage === 'function' && prop.active && !prop.isDead) {
        prop.takeDamage(1);
        console.log(`[PROP] Dégâts appliqués! Nouveaux PV: ${prop.health}`);
      } else {
        console.warn('[PROP] takeDamage non disponible ou prop invalide');
      }

      // VFX léger pour les props (seulement si la prop est toujours valide)
      if (prop.active && !prop.isDead) {
        this._applyScreenShake(2);
      }
    } catch (error) {
      // Gestion d'erreur : Si quelque chose plante, on log et on continue
      console.error('[GAME] Erreur dans _handlePlayerHitProp:', error);
    }
  }

  /**
   * SPAWN LOOT SÉCURISÉ : Crée un cercle simple au lieu d'un sprite complexe
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  spawnLoot(x, y) {
    // SÉCURITÉ ABSOLUE : Vérifications critiques
    if (!this || !this.scene) return;
    if (!isFinite(x) || !isFinite(y)) return;
    if (!this.lootGroup) {
      console.warn('[GAME] lootGroup n\'existe pas, création...');
      this.lootGroup = this.physics.add.group();
    }

    try {
      // Probabilité : Arme (10%), Soin (27%), Or (63%)
      const rand = Math.random();
      let lootType;

      if (rand < 0.1) {
        lootType = 'WEAPON';
      } else if (rand < 0.37) {
        lootType = 'HEART';
      } else {
        lootType = 'GOLD';
      }

      // UTILISER LA CLASSE LOOT avec les sprites 3D
      const loot = new Loot(this, x, y, lootType);
      if (!loot) {
        console.error('[GAME] Impossible de créer le loot');
        return;
      }

      // AJOUTER AU GROUPE (avec protection)
      try {
        if (this.lootGroup) {
          this.lootGroup.add(loot);
        }
      } catch (error) {
        console.error('[GAME] Erreur dans l\'ajout au groupe:', error);
      }

      this._clampSpriteToRoad(loot);

      console.log(`[GAME] Loot spawné: ${lootType} à (${x}, ${y})`);

    } catch (error) {
      console.error('[GAME] Erreur critique dans spawnLoot:', error);
      // Le jeu continue même si le loot ne spawn pas
    }
  }

  _handlePlayerCollectLoot(player, loot) {
    // SÉCURITÉ : Vérifications critiques
    if (!loot || !loot.active) return;

    // Si c'est une instance de Loot, utiliser sa méthode collect()
    if (loot instanceof Loot) {
      if (loot.collected) return;
      loot.collect();
      return;
    }

    // Ancien système avec cercles (fallback pour compatibilité)
    if (loot.getData && loot.getData('collected')) return;

    // Marquer comme collecté
    if (loot.setData) {
      loot.setData('collected', true);
    }

    const lootType = (loot.getData && loot.getData('type')) || (loot.type) || 'GOLD';

    try {
      // GESTION SELON LE TYPE
      if (lootType === 'HEART') {
        // Soin : +20 HP
        if (this.player && this.player.health < this.player.maxHealth) {
          this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
          this.events.emit('player-health-changed', {
            current: this.player.health,
            max: this.player.maxHealth
          });
        }
      } else if (lootType === 'GOLD') {
        // Or : +100 score
        this.addScore(100);
      } else if (lootType === 'WEAPON') {
        // Arme : Équiper
        this._equipWeapon(this.player);
      }

      // Feedback visuel
      this._applyScreenShake(1);

      // Animation de collecte (disparaît vers le haut)
      this.tweens.add({
        targets: loot,
        y: loot.y - 50,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (loot && loot.active) {
            loot.destroy();
          }
        }
      });

    } catch (error) {
      console.error('[GAME] Erreur dans _handlePlayerCollectLoot:', error);
      // Détruire le loot même en cas d'erreur
      if (loot && loot.active) {
        loot.destroy();
      }
    }
  }

  _equipWeapon(player) {
    if (!player) return;

    // Équiper l'arme
    player.currentWeapon = {
      damage: 20,
      maxDurability: 5,
      spriteKey: 'pipe'
    };
    player.weaponDurability = 5;

    // Mettre à jour l'indicateur d'arme dans le HUD
    if (this.hud && this.hud.updateWeapon) {
      this.hud.updateWeapon(player.currentWeapon, player.weaponDurability, player.currentWeapon.maxDurability);
    }

    // Créer le sprite visuel de l'arme (barre grise près de la main)
    if (player.weaponSprite) {
      player.weaponSprite.destroy();
    }

    // Créer une texture simple pour l'arme équipée
    const graphics = this.add.graphics();
    graphics.fillStyle(0x888888); // Gris métal
    graphics.fillRect(0, 0, 20, 4); // Tuyau horizontal
    graphics.fillStyle(0x666666); // Gris foncé
    graphics.fillRect(2, 0, 4, 4); // Manche
    graphics.generateTexture('weapon-equipped', 20, 4);
    graphics.destroy();

    // Créer le sprite de l'arme
    player.weaponSprite = this.add.image(player.x, player.y, 'weapon-equipped');
    player.weaponSprite.setDepth(2); // Au-dessus du joueur
    player.weaponSprite.setOrigin(0.5, 0.5);
    player.weaponSprite.setScale(1.2);

    console.log('[WEAPON] Arme équipée! Dégâts: +20, Durabilité: 5');
  }

  _unequipWeapon(player) {
    if (!player) return;

    // Supprimer le sprite visuel
    if (player.weaponSprite) {
      player.weaponSprite.destroy();
      player.weaponSprite = null;
    }

    // Réinitialiser les propriétés
    player.currentWeapon = null;
    player.weaponDurability = 0;

    // Mettre à jour l'indicateur d'arme dans le HUD
    if (this.hud && this.hud.updateWeapon) {
      this.hud.updateWeapon(null, 0, 0);
    }

    console.log('[WEAPON] Arme cassée! Retour aux attaques de base.');
  }

  _handleBossTouchPlayer(player, boss) {
    // Quand le boss touche physiquement le joueur : dégâts + knockback
    if (boss.isDead || !player || player.invulnerable) return;

    // Vérifier le cooldown pour éviter les dégâts répétés
    const now = this.time.now;
    if (!boss.lastTouchTime) boss.lastTouchTime = 0;

    if (now >= boss.lastTouchTime + 500) { // 0.5 seconde entre les touches
      boss.lastTouchTime = now;

      // Dégâts au joueur
      player.takeDamage(5);
      console.log('[BOSS] Touche le joueur! Dégâts appliqués');

      // KNOCKBACK : Repousser le joueur
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Normaliser la direction
        const knockbackForce = 200;
        const knockbackX = (dx / distance) * knockbackForce;
        const knockbackY = (dy / distance) * knockbackForce;

        // Appliquer le knockback
        if (player.body) {
          player.body.setVelocity(knockbackX, knockbackY);

          // Réduire progressivement le knockback
          this.time.delayedCall(200, () => {
            if (player && player.body) {
              player.body.setVelocityX(player.body.velocity.x * 0.5);
              player.body.setVelocityY(player.body.velocity.y * 0.5);
            }
          });
        }
      }
    }
  }

  _handleBossAttackHitPlayer(bossHitbox, player) {
    // Quand la hitbox d'attaque du boss touche le joueur
    if (!this.boss || this.boss.isDead || !player || player.invulnerable) return;

    // Vérifier que le boss est bien en train d'attaquer
    if (!this.boss.isAttacking) return;

    // Dégâts au joueur
    player.takeDamage(15);
    console.log('[BOSS] Coup de poing! Joueur touché (15 dégâts)');

    // KNOCKBACK : Repousser le joueur
    const dx = player.x - this.boss.x;
    const dy = player.y - this.boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && player.body) {
      const knockbackForce = 300;
      const knockbackX = (dx / distance) * knockbackForce;
      const knockbackY = (dy / distance) * knockbackForce;

      player.body.setVelocity(knockbackX, knockbackY);

      // Réduire progressivement le knockback
      this.time.delayedCall(300, () => {
        if (player && player.body) {
          player.body.setVelocityX(player.body.velocity.x * 0.5);
          player.body.setVelocityY(player.body.velocity.y * 0.5);
        }
      });
    }

    // Désactiver la hitbox après avoir touché (pour éviter les hits multiples)
    if (this.boss.attackHitbox && this.boss.attackHitbox.body) {
      this.boss.attackHitbox.body.enable = false;
    }
  }

  _bossPerformAttack(time) {
    if (!this.boss || !this.player || this.boss.isDead || this.boss.isAttacking) {
      return;
    }

    console.log('[BOSS] 🥊 Début de l\'attaque active!');

    // Mettre à jour le cooldown
    this.boss.lastAttackTime = time;
    this.boss.isAttacking = true;
    this.boss.attackState = 'attacking';

    // ARRÊTER LE MOUVEMENT
    this.boss.body.setVelocity(0, 0);

    // Jouer l'animation punch
    this.boss.play(Player.animKey('punch'), true);
    // Maintenir le tint et le scale pendant l'attaque
    const bossConfig = getBossConfig(this.levelIndex);
    if (bossConfig) {
      this.boss.setTint(bossConfig.tint || 0xff0000);
      this.boss.setScale(bossConfig.scale || 4);
    }

    // DÉGÂTS : Au milieu de l'animation (via un delayedCall de 200ms)
    this.time.delayedCall(200, () => {
      if (!this.boss || !this.player || this.boss.isDead || !this.boss.isAttacking) {
        return;
      }

      // Créer une Zone de Dégâts devant le boss
      const direction = this.boss.flipX ? -1 : 1;
      const attackZoneX = this.boss.x + direction * 80; // Devant le boss
      const attackZoneY = this.boss.y;
      const attackZoneWidth = 120;
      const attackZoneHeight = 100;

      // Créer une zone temporaire pour détecter le joueur
      const attackZone = this.add.zone(attackZoneX, attackZoneY, attackZoneWidth, attackZoneHeight);
      this.physics.add.existing(attackZone);
      attackZone.body.setAllowGravity(false);

      // Vérifier si le joueur est dans cette zone
      const playerInZone = Phaser.Geom.Rectangle.Contains(
        new Phaser.Geom.Rectangle(
          attackZoneX - attackZoneWidth / 2,
          attackZoneY - attackZoneHeight / 2,
          attackZoneWidth,
          attackZoneHeight
        ),
        this.player.x,
        this.player.y
      );

      if (playerInZone && this.player && !this.player.invulnerable) {
        console.log('[BOSS] 💥 Coup de poing réussi! Joueur touché!');

        // DÉGÂTS
        const damage = this.boss.damage || 20;
        this.player.takeDamage(damage);

        // GROS KNOCKBACK : Projeter le joueur en arrière
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && this.player.body) {
          const knockbackForce = 400; // Force de knockback importante
          const knockbackX = (dx / distance) * knockbackForce;
          const knockbackY = (dy / distance) * knockbackForce * 0.8;

          this.player.body.setVelocity(knockbackX, knockbackY);

          // Réduire progressivement le knockback
          this.time.addEvent({
            delay: 50,
            repeat: 8,
            callback: () => {
              if (this.player && this.player.body) {
                this.player.body.setVelocity(
                  this.player.body.velocity.x * 0.7,
                  this.player.body.velocity.y * 0.7
                );
              }
            }
          });
        }

        // SCREEN SHAKE : Faire trembler la caméra
        this._applyScreenShake(20); // Shake intense pour un coup de boss

        // VFX : Particules d'impact
        this._spawnHitParticles(this.player.x, this.player.y, true);

        // Hit Stop
        this._applyHitStop(100);
      }

      // Détruire la zone temporaire
      attackZone.destroy();
    });

    // Écouter la fin de l'animation
    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.boss && !this.boss.isDead) {
        this.boss.isAttacking = false;
        this.boss.attackState = 'idle';
        this.boss.play(Player.animKey('idle'), true);
        // Maintenir le tint et le scale
        const bossConfig = getBossConfig(this.levelIndex);
        if (bossConfig) {
          this.boss.setTint(bossConfig.tint || 0xff0000);
          this.boss.setScale(bossConfig.scale || 4);
        }
      }
    });

    // Fallback : Remettre isAttacking à false après 1 seconde (cooldown)
    this.time.delayedCall(1000, () => {
      if (this.boss && !this.boss.isDead) {
        this.boss.isAttacking = false;
        this.boss.attackState = 'idle';
      }
    });
  }

  // Alias pour compatibilité (ancienne méthode)
  _bossStartAttack(time) {
    this._bossPerformAttack(time);
  }

  update(time) {
    // Si le jeu n'a pas commencé ou est en pause, ne pas mettre à jour
    if (!this.gameStarted || this.isGamePaused) {
      return;
    }

    // Z-SORTING : Mettre à jour la depth de tous les éléments selon leur position Y
    this._updateForegroundDepth();

    // Vérifier le Game Over
    if (this.player && this.player.health <= 0 && !this.gameOverActive) {
      this._handleGameOver();
      return;
    }

    if (!this.player || this.gameOverActive) {
      return;
    }

    // Mettre à jour les couches parallax (tileSprite pour répétition horizontale)
    // Le setScrollFactor gère déjà le déplacement parallaxe automatiquement
    // Les couches avec scrollFactor plus petit (0.1) bougent plus lentement que celles avec scrollFactor plus grand (0.5)
    // Les tileSprite se répètent horizontalement pour couvrir toute la largeur du monde (pas de répétition verticale)
    // Pas besoin de mise à jour manuelle, Phaser gère le défilement via scrollFactor

    // CRITIQUE : Toujours appeler player.update() à chaque frame
    this.player.update(this.cursors, this.actionKeys, time);
    // Clamping seulement si vraiment sorti (pas à chaque frame pour éviter le tremblement)
    if (this.player && this.player.body) {
      const originY = this.player.originY ?? 0.5;
      const displayHeight = this.player.displayHeight || this.player.height || 0;
      const bottomOffset = displayHeight * (1 - originY);
      const currentBottom = this.player.y + bottomOffset;

      if (typeof this.roadTopBoundary === 'number' && typeof this.roadBottomBoundary === 'number') {
        const minBottom = this.roadTopBoundary + 4;
        const maxBottom = this.roadBottomBoundary;

        // CORRECTION URGENTE : Clamping seulement si vraiment sorti
        if (currentBottom < minBottom) {
          // Sorti en haut : forcer la descente
          const targetY = (minBottom - bottomOffset);
          this.player.setY(targetY);
          if (this.player.body && this.player.body.velocity && this.player.body.velocity.y < 0) {
            this.player.body.setVelocityY(0);
          }
        } else if (currentBottom > maxBottom) {
          // Sorti en bas : forcer la remontée
          const targetY = (maxBottom - bottomOffset);
          this.player.setY(targetY);
          if (this.player.body && this.player.body.velocity && this.player.body.velocity.y > 0) {
            this.player.body.setVelocityY(0);
          }
        }
        // Si dans les limites, on ne touche à rien (pas de clamping)
      }
    }

    // Mettre à jour la position du sprite de l'arme si équipée
    if (this.player.weaponSprite && this.player.weaponSprite.active) {
      // Positionner l'arme près de la main du joueur (légèrement à droite)
      const offsetX = this.player.flipX ? -25 : 25; // À droite si regarde à droite, à gauche si regarde à gauche
      const offsetY = -10; // Légèrement au-dessus
      this.player.weaponSprite.x = this.player.x + offsetX;
      this.player.weaponSprite.y = this.player.y + offsetY;
      this.player.weaponSprite.setFlipX(this.player.flipX);
    }

    // LOGIQUE D'AVANCÉE ENTRE LES VAGUES
    if (this.isWaitingForAdvance && this.player) {
      if (this.waveAdvanceTargetX !== null && this.player.x >= this.waveAdvanceTargetX) {
        console.log(
          `[WAVE] Joueur a atteint x=${this.player.x} (target: ${this.waveAdvanceTargetX}), lancement vague suivante`
        );
        this.isWaitingForAdvance = false;
        this.waveAdvanceTargetX = null;

        if (this.goArrow) {
          this.goArrow.destroy();
          this.goArrow = null;
        }

        // Lancer la vague suivante via la transition habituelle
        if (!this.isTransitioning) {
          this._nextWave();
        }
      }
    }

    // Mettre à jour les ennemis
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      if (enemy.update && typeof enemy.update === 'function') {
        enemy.update(this.player, time);
        this._clampSpriteToRoad(enemy);
      }
    });

    // Mettre à jour les props (pour s'assurer qu'elles ne bougent pas)
    this.props.children.iterate((prop) => {
      if (!prop || !prop.active) return;
      if (prop.update && typeof prop.update === 'function') {
        prop.update();
      }
    });

    // IA DU BOSS : Utilise les types d'IA depuis la config
    if (this.boss && this.boss.active && !this.boss.isDead) {
      if (this.boss.body && this.player && this.player.active) {
        this._updateBossAI(time);

        // Synchroniser la hitbox d'attaque avec la position du boss
        if (this.boss.attackHitbox) {
          const direction = this.boss.flipX ? -1 : 1;
          this.boss.attackHitbox.x = this.boss.x + direction * 80;
          this.boss.attackHitbox.y = this.boss.y;
        }
      }
    }

    // Vérifier si toutes les vagues sont terminées
    // Pour les vagues normales : vérifier si tous les ennemis sont morts
    // Pour le boss : vérifier si le boss est mort (géré dans takeDamage)
    if (!this.bossActive && this.enemies.countActive() === 0 && this.isWaveActive) {
      // Une vague vient de se terminer (tous les ennemis sont morts)
      this.isWaveActive = false;

      // Vérifier si on a tué assez d'ennemis pour débloquer la vague suivante / le boss
      if (this.enemiesKilled >= this.enemiesToKill) {
        console.log(
          `[WAVE] ${this.enemiesKilled} ennemis tués (objectif: ${this.enemiesToKill}), attente d'avancée du joueur`
        );

        // Au lieu de lancer directement la vague suivante, on demande au joueur d'avancer
        if (!this.isTransitioning) {
          this._prepareAdvanceToNextWave();
        }
      } else if (this.currentWave < this.totalWaves) {
        // Objectif pas encore atteint : respawn d'une nouvelle vague d'ennemis
        console.log(
          `[WAVE] Tous les ennemis éliminés, mais objectif non atteint (${this.enemiesKilled}/${this.enemiesToKill}), respawn`
        );
        this._spawnWaveEnemies();
      }
    }
  }

  addScore(value) {
    this.score += value;
    this.hud.updateScore(this.score);
  }

  _handleGameOver() {
    if (this.gameOverActive) return;
    this.gameOverActive = true;

    // Arrêter le timer
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }

    // SEULE pause de physique : Game Over
    this.physics.pause();

    // Afficher "GAME OVER"
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const gameOverText = this.add.text(centerX, centerY, 'GAME OVER\nPRESS R TO RESTART', {
      fontSize: '64px',
      fontFamily: 'monospace',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(200);
    gameOverText.setScrollFactor(0);

    // Touche R pour redémarrer
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });
  }

  _handleStageClear() {
    console.log(`[LEVEL] Level ${this.levelIndex} terminé!`);

    // Sauvegarder la progression
    localStorage.setItem('metalSlugHyper_currentLevel', this.levelIndex.toString());

    // Débloquer le niveau suivant dans la carte
    const nextLevel = this.levelIndex + 1;
    this._unlockNextStage(nextLevel);

    const centerX = this.cameras.main.width / 2;
    const centerY = this.scale.height / 2;

    // Vérifier si c'est le dernier niveau
    const isLastLevelFlag = this.levelIndex >= getTotalLevels();

    const clearText = this.add.text(centerX, centerY - 60, isLastLevelFlag ? 'GAME COMPLETE!' : 'STAGE CLEAR!', {
      fontSize: '96px',
      fontFamily: 'monospace',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 12,
      align: 'center'
    });
    clearText.setOrigin(0.5);
    clearText.setDepth(200);
    clearText.setScrollFactor(0);

    // Bouton pour retourner à la carte des niveaux
    const backToMapButton = this.add.text(centerX, centerY + 80, 'RETURN TO MAP', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fill: '#00ffff',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    backToMapButton.setOrigin(0.5);
    backToMapButton.setDepth(201);
    backToMapButton.setScrollFactor(0);
    backToMapButton.setInteractive({ useHandCursor: true });

    // Animation de pulsation pour le bouton
    this.tweens.add({
      targets: backToMapButton,
      alpha: { from: 0.8, to: 1.0 },
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Interaction au survol
    backToMapButton.on('pointerover', () => {
      backToMapButton.setFill('#ffffff');
      backToMapButton.setScale(1.1);
    });

    backToMapButton.on('pointerout', () => {
      backToMapButton.setFill('#00ffff');
      backToMapButton.setScale(1.0);
    });

    // Clic sur le bouton : retourner à la carte
    backToMapButton.on('pointerdown', () => {
      console.log(`[LEVEL] Retour à la carte des niveaux`);

      // Fondu au noir
      this.cameras.main.fadeOut(500, 0, 0, 0);

      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MapScene');
      });
    });
  }

  _unlockNextStage(stageLevel) {
    // Débloquer le niveau suivant dans localStorage
    const currentMax = this._getMaxLevelReached();
    if (stageLevel > currentMax) {
      localStorage.setItem('metalSlugHyper_maxLevelReached', stageLevel.toString());
      console.log(`[STAGE] Nouveau niveau débloqué: ${stageLevel}`);
    }
  }

  _getMaxLevelReached() {
    // PROVISOIRE : Ouvrir tous les stages
    return 10; // Tous les stages sont débloqués
    // const saved = localStorage.getItem('metalSlugHyper_maxLevelReached');
    // return saved ? parseInt(saved, 10) : 1;
  }

  // ========================================
  // PROPS - GÉNÉRATION DE TEXTURE
  // ========================================

  /**
   * Découpe la sprite sheet de pneu en 4 frames individuelles
   * Format attendu : Grille 2x2 (2 colonnes, 2 lignes)
   * Ordre : Haut-Gauche (1), Haut-Droite (2), Bas-Gauche (3), Bas-Droite (4)
   */
  _splitTireSheet() {
    if (!this.textures.exists('tire-burning-sheet')) {
      console.warn('[PROP] Sprite sheet tire-burning-sheet non trouvée');
      return;
    }

    const sourceTexture = this.textures.get('tire-burning-sheet');
    const sourceImage = sourceTexture.source[0].image;
    const sourceWidth = sourceImage.width;
    const sourceHeight = sourceImage.height;

    // Calculer la taille de chaque frame (grille 2x2)
    const frameWidth = Math.floor(sourceWidth / 2);
    const frameHeight = Math.floor(sourceHeight / 2);

    console.log(`[PROP] Découpage sprite sheet: ${sourceWidth}x${sourceHeight} -> 4 frames de ${frameWidth}x${frameHeight}`);

    // Découper en 4 frames en utilisant des canvas temporaires
    // Frame 1 : Haut-Gauche (0, 0)
    // Frame 2 : Haut-Droite (1, 0)
    // Frame 3 : Bas-Gauche (0, 1)
    // Frame 4 : Bas-Droite (1, 1)
    const framePositions = [
      { x: 0, y: 0, index: 1 }, // Haut-Gauche
      { x: 1, y: 0, index: 2 }, // Haut-Droite
      { x: 0, y: 1, index: 3 }, // Bas-Gauche
      { x: 1, y: 1, index: 4 }, // Bas-Droite
    ];

    framePositions.forEach(({ x, y, index }) => {
      const key = `tire-burning-${index}`;
      const frameX = x * frameWidth;
      const frameY = y * frameHeight;

      // Créer un canvas temporaire pour extraire la frame
      const canvas = document.createElement('canvas');
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');

      // Dessiner la région de la sprite sheet sur le canvas
      ctx.drawImage(
        sourceImage,
        frameX, frameY, frameWidth, frameHeight, // Source (région à copier)
        0, 0, frameWidth, frameHeight // Destination (canvas)
      );

      // Créer la texture à partir du canvas
      this.textures.addCanvas(key, canvas);

      console.log(`[PROP] Frame ${index} créée: ${key} (${frameX}, ${frameY}, ${frameWidth}x${frameHeight})`);
    });

    console.log('[PROP] Sprite sheet découpée avec succès en 4 frames');
  }

  /**
   * Génère la texture de la caisse (pixel art bois, type Metal Slug)
   */
  _generatePropTexture() {
    // Vérifier si la texture existe déjà
    if (this.textures && this.textures.exists('prop-crate')) {
      console.log('[PROP] Texture prop-crate déjà générée');
      return; // Texture déjà générée
    }

    // Dimensions de la caisse (pixel art carré)
    const size = 32;
    const border = 2;

    const graphics = this.add.graphics();
    graphics.clear();

    // Couleurs bois
    const darkWood = 0x4a2b0f;
    const midWood = 0x7a4a1f;
    const lightWood = 0xa86830;

    // Fond
    graphics.fillStyle(midWood);
    graphics.fillRect(0, 0, size, size);

    // Bordure extérieure sombre
    graphics.lineStyle(border, darkWood);
    graphics.strokeRect(0, 0, size, size);

    // Cadre intérieur plus clair (donne un effet de profondeur)
    graphics.lineStyle(1, lightWood);
    graphics.strokeRect(border + 1, border + 1, size - (border + 1) * 2, size - (border + 1) * 2);

    // Planches verticales
    graphics.lineStyle(2, lightWood);
    graphics.beginPath();
    graphics.moveTo(size * 0.33, border + 2);
    graphics.lineTo(size * 0.33, size - border - 2);
    graphics.moveTo(size * 0.66, border + 2);
    graphics.lineTo(size * 0.66, size - border - 2);
    graphics.strokePath();

    // Renforts diagonaux (croix)
    graphics.lineStyle(2, darkWood);
    graphics.beginPath();
    graphics.moveTo(border + 2, border + 2);
    graphics.lineTo(size - border - 2, size - border - 2);
    graphics.moveTo(size - border - 2, border + 2);
    graphics.lineTo(border + 2, size - border - 2);
    graphics.strokePath();

    // Générer la texture finale
    graphics.generateTexture('prop-crate', size, size);
    graphics.destroy();

    console.log('[PROP] Texture prop-crate générée avec succès (taille', size, 'x', size, ')');
  }

  // ========================================
  // VFX & GAME FEEL - DÉLÉGATION AU VFX MANAGER
  // ========================================

  _applyHitStop(duration) {
    if (this.vfxManager) {
      this.vfxManager.applyHitStop(duration);
    }
  }

  _activateSlowMotion(duration) {
    if (this.vfxManager) {
      this.vfxManager.activateSlowMotion(duration);
    }
  }

  _applyScreenShake(intensity) {
    if (this.vfxManager) {
      this.vfxManager.applyScreenShake(intensity);
    }
  }

  _spawnHitParticles(x, y, isFinisher) {
    if (this.vfxManager) {
      this.vfxManager.spawnHitParticles(x, y, isFinisher);
    }
  }

  _showComboText(x, y, text, isFinisher) {
    if (this.vfxManager) {
      this.vfxManager.showComboText(x, y, text, isFinisher);
    }
  }
}
