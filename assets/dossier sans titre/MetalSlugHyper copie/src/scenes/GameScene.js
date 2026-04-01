import Phaser from 'phaser';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';
import { preloadEnemies, createEnemyAnimations, spawnEnemy } from '../entities/Enemy.js';
import Prop from '../entities/Prop.js';
import { LEVELS_CONFIG, getLevelById, getLevelByIndex, getTotalLevels, isLastLevel } from '../config/Levels.js';

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
    
    this.worldWidth = 3200; // Largeur fixe pour l'instant
    
    console.log(`[LEVEL] Initialisation Level ${this.levelIndex}: ${this.levelConfig.name}`);
    console.log(`[LEVEL] Config: BossHP=${this.levelConfig.bossHP}, EnemiesToKill=${this.levelConfig.enemiesToKill}`);
  }

  preload() {
    // Charger l'image de fond (toujours bg.png, on utilise bgTint pour varier)
    this.load.image('bg-stage', 'bg.png');
    
    // Audio (optionnel, peut être défini dans la config plus tard)
    // this.load.audio('stage-track', this.stageConfig.music);
    
    Player.preload(this);
    preloadEnemies(this);
  }
  
  _createParallaxPlaceholders() {
    // Créer les textures de parallax si elles n'existent pas déjà
    const width = 1920;
    const height = 1080;
    
    // Ciel (bg-sky) - Bleu foncé avec nuages
    if (!this.textures.exists('bg-sky')) {
      const skyGraphics = this.add.graphics();
      skyGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
      skyGraphics.fillRect(0, 0, width, height);
      // Ajouter quelques "nuages" (cercles)
      skyGraphics.fillStyle(0x2a2a3e, 0.3);
      for (let i = 0; i < 5; i++) {
        skyGraphics.fillCircle(200 + i * 300, 100 + i * 50, 80 + i * 20);
      }
      skyGraphics.generateTexture('bg-sky', width, height);
      skyGraphics.destroy();
    }
    
    // Fond lointain (bg-far) - Immeubles sombres
    if (!this.textures.exists('bg-far')) {
      const farGraphics = this.add.graphics();
      farGraphics.fillStyle(0x0f0f1a);
      farGraphics.fillRect(0, 0, width, height);
      // Immeubles lointains (rectangles sombres)
      farGraphics.fillStyle(0x1a1a2a);
      for (let i = 0; i < 8; i++) {
        const buildingHeight = 200 + Math.random() * 150;
        const buildingWidth = 100 + Math.random() * 80;
        farGraphics.fillRect(i * 200 + 50, height - buildingHeight, buildingWidth, buildingHeight);
      }
      farGraphics.generateTexture('bg-far', width, height);
      farGraphics.destroy();
    }
    
    // Fond proche (bg-near) - Détails plus clairs
    if (!this.textures.exists('bg-near')) {
      const nearGraphics = this.add.graphics();
      nearGraphics.fillStyle(0x1a1a2a);
      nearGraphics.fillRect(0, 0, width, height);
      // Immeubles proches (plus détaillés)
      nearGraphics.fillStyle(0x2a2a3a);
      for (let i = 0; i < 10; i++) {
        const buildingHeight = 300 + Math.random() * 200;
        const buildingWidth = 120 + Math.random() * 100;
        nearGraphics.fillRect(i * 180 + 30, height - buildingHeight, buildingWidth, buildingHeight);
        // Fenêtres (petits carrés)
        nearGraphics.fillStyle(0x3a3a4a);
        for (let j = 0; j < 3; j++) {
          for (let k = 0; k < 4; k++) {
            nearGraphics.fillRect(
              i * 180 + 30 + 20 + k * 25,
              height - buildingHeight + 30 + j * 40,
              15, 15
            );
          }
        }
        nearGraphics.fillStyle(0x2a2a3a);
      }
      nearGraphics.generateTexture('bg-near', width, height);
      nearGraphics.destroy();
    }
  }

  create() {
    this.worldWidth = 3200; // Largeur fixe pour l'instant
    this.score = 0;
    
    // SYSTÈME DE VAGUES SIMPLIFIÉ (Data-Driven)
    this.currentWave = 0; // Vague actuelle (0 = pas commencé)
    this.totalWaves = this.levelConfig.waves || 3; // Nombre de vagues depuis la config
    this.enemiesKilled = 0; // Compteur d'ennemis tués
    this.enemiesToKill = this.levelConfig.enemiesToKill || 5; // Nombre d'ennemis à tuer avant le boss
    this.enemies = this.physics.add.group();
    this.props = this.physics.add.group(); // Groupe pour les props destructibles
    this.boss = null;
    this.bossActive = false;
    this.isWaveActive = false; // Verrouillage : empêche de sauter les vagues pendant le spawn
    this.isTransitioning = false; // Flag pour empêcher les transitions multiples
    
    console.log(`[LEVEL] Configuration chargée: ${this.levelConfig.name}`);
    console.log(`[LEVEL] Vagues: ${this.totalWaves}, Ennemis à tuer: ${this.enemiesToKill}, Boss HP: ${this.levelConfig.bossHP}`);
    
    // FLAGS DE JEU
    this.gameStarted = false;
    this.gamePaused = false;
    this.gameOverActive = false;
    
    // CRÉATION DU MONDE
    // Créer les textures de parallax avant de créer le background
    this._createParallaxPlaceholders();
    this._createBackground();
    this._createGround();

    this.physics.world.setBounds(0, 0, this.worldWidth, this.scale.height);

    // ANIMATIONS
    Player.createAnimations(this);
    createEnemyAnimations(this);

    // JOUEUR
    this.player = new Player(this, 160, this.scale.height - 120);
    this.player.setDepth(1);

    // CONTRÔLES
    this.cursors = this.input.keyboard.createCursorKeys();
    this.actionKeys = this.input.keyboard.addKeys({
      punch: Phaser.Input.Keyboard.KeyCodes.J,
      kick: Phaser.Input.Keyboard.KeyCodes.K,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
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

    // HUD
    this.hud = new HUD(this);
    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    this.hud.updateScore(this.score);
    // Afficher le nom du niveau dans le HUD
    this.hud.updateWave(0, this.totalWaves, `STAGE ${this.levelIndex}: ${this.levelConfig.name}`);
    
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
    
    // UI
    this._createUI();
    
    // Le jeu démarre en pause, attend le bouton Start
    // PAS de physics.pause() ici - on laisse la physique active
  }

  _createBackground() {
    // Utiliser bg.png avec le tint de la config
    this.bg = this.add.image(0, 0, 'bg-stage');
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-4);
    this.bg.setScrollFactor(0.1, 1); // Bouge très lentement pour effet de profondeur
    
    // Appliquer le tint (couleur d'ambiance) depuis la config
    if (this.levelConfig.bgTint) {
      this.bg.setTint(this.levelConfig.bgTint);
      console.log(`[LEVEL] Tint appliqué: ${this.levelConfig.bgTint.toString(16)}`);
    }
    
    // FALLBACK : Assurer que l'image couvre toute la hauteur du jeu
    this.bg.displayHeight = this.scale.height;
    // Maintenir le ratio d'aspect et ajuster la largeur en conséquence
    this.bg.scaleX = this.bg.scaleY;
    
    // Si l'image est trop petite en largeur, l'étirer pour couvrir toute la largeur
    if (this.bg.displayWidth < this.worldWidth) {
      this.bg.displayWidth = this.worldWidth;
      // Ajuster la hauteur pour maintenir le ratio si nécessaire
      this.bg.displayHeight = (this.bg.height / this.bg.width) * this.bg.displayWidth;
    }
    
    // S'assurer que l'image est visible
    this.bg.setVisible(true);
    this.bg.setActive(true);
    
    console.log('[BG] Image de fond créée:', {
      key: 'bg-stage',
      width: this.bg.width,
      height: this.bg.height,
      displayWidth: this.bg.displayWidth,
      displayHeight: this.bg.displayHeight,
      depth: this.bg.depth,
      visible: this.bg.visible
    });
  }

  _createGround() {
    // Pas de sol physique en mode 2.5D
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
    
    this.startButton = this.add.text(centerX, centerY, 'START GAME', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setDepth(100);
    this.startButton.setScrollFactor(0);
    this.startButton.setInteractive({ useHandCursor: true });
    
    this.startButton.on('pointerdown', () => {
      this._startGame();
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
    
    // Démarrer la première vague avec transition
    this.currentWave = 1;
    this.enemiesKilled = 0;
    this._triggerWaveTransition(1);
  }

  _togglePause() {
    if (!this.gameStarted || this.gameOverActive) return;
    
    this.gamePaused = !this.gamePaused;
    
    if (this.gamePaused) {
      this.pauseButton.setText('▶');
    } else {
      this.pauseButton.setText('⏸');
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
    
    this.hud.updateWave(waveNum, this.totalWaves, `STAGE ${this.levelIndex}: ${this.levelConfig.name} - Wave ${waveNum}`);
    
    // Vérifier si c'est la dernière vague (boss)
    if (waveNum >= this.totalWaves) {
      // VAGUE BOSS
      this._spawnBoss(this.levelConfig.bossHP);
      // Pour le boss, on active immédiatement (pas de spawn progressif)
      this.isWaveActive = true;
      console.log(`[WAVE] Boss spawné, verrouillage désactivé (isWaveActive = true)`);
    } else {
      // VAGUE D'ENNEMIS
      this._spawnWaveEnemies();
    }
  }

  _spawnWaveEnemies() {
    // Calculer le nombre d'ennemis pour cette vague
    // Répartir enemiesToKill sur toutes les vagues (sauf la dernière qui est le boss)
    const enemiesPerWave = Math.ceil(this.enemiesToKill / (this.totalWaves - 1));
    const enemyTypes = this.levelConfig.enemies || ['punk'];
    
    console.log(`[WAVE] Spawn de ${enemiesPerWave} ennemis (types: ${enemyTypes.join(', ')})`);
    
    // Spawner 2-3 props destructibles aléatoirement
    const propCount = Phaser.Math.Between(2, 3);
    for (let i = 0; i < propCount; i++) {
      const propX = Phaser.Math.Between(300, this.worldWidth - 300);
      const propY = Phaser.Math.Between(this.scale.height * 0.4, this.scale.height * 0.8);
      
      this.time.delayedCall(i * 200, () => {
        const prop = new Prop(this, propX, propY, 'crate');
        this.props.add(prop);
        console.log(`[PROP] Caisse spawnée à (${propX}, ${propY})`);
      });
    }
    
    let spawnedCount = 0;
    
    for (let i = 0; i < enemiesPerWave; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const x = 600 + (i * 150);
      const y = this.scale.height - 120;
      
      this.time.delayedCall(i * 500, () => {
        const enemy = spawnEnemy(this, type, x, y);
        if (enemy) {
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

  _spawnBoss(bossHP) {
    console.log('========================================');
    console.log(`[BOSS] SPAWN BOSS (HP: ${bossHP})`);
    console.log('========================================');
    
    this.bossActive = true;
    
    // Position : Même hauteur Y que le joueur pour qu'ils soient sur le même plan
    const bossX = this.player ? this.player.x + 200 : 600; // À droite du joueur
    const bossY = this.player ? this.player.y : this.scale.height - 120; // Même hauteur Y
    
    // IMAGE DE SECOURS : Utiliser l'image 'idle1' du joueur
    const playerIdleKey = Player.frameKey('idle', 1); // 'player-idle-1'
    console.log(`[BOSS] Utilisation de l'image: ${playerIdleKey}`);
    
    // Créer le boss manuellement
    this.boss = this.physics.add.sprite(bossX, bossY, playerIdleKey);
    
    if (!this.boss) {
      console.error('[BOSS] ÉCHEC: Impossible de créer le sprite!');
      return;
    }

    // VISUEL
    this.boss.setScale(4); // GÉANT
    this.boss.setTint(0xff0000); // ROUGE
    this.boss.setDepth(100);
    this.boss.setVisible(true);
    this.boss.setActive(true);

    // Position
    this.boss.x = bossX;
    this.boss.y = bossY;

    // Stats depuis la config
    this.boss.health = bossHP;
    this.boss.maxHealth = bossHP;
    this.boss.isDead = false;
    this.boss.lastAttackTime = 0;
    this.boss.attackCooldown = 2000; // 2 secondes entre les attaques
    this.boss.isAttacking = false;
    this.boss.attackState = 'idle'; // 'idle', 'walking', 'attacking'
    
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
    this.boss.takeDamage = (amount) => {
      if (this.boss.isDead) return;
      
      this.boss.health -= amount;
      console.log(`[BOSS] Dégâts: ${amount}, PV: ${this.boss.health}`);
      
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
              this.boss.setTint(0xff0000);
            }
            if (flashCount >= 4) {
              this.boss.setTint(0xff0000);
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
      this.hud.showBossHealth(this.boss.health, this.boss.maxHealth);
    }
    
    console.log('[BOSS] Boss spawné avec succès!');
    console.log('========================================');
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
    if (enemy.isDead) return;
    
    // Vérifier si l'attaque est active
    if (!this.player.attackState || !this.player.attackState.active) return;
    
    // SYSTÈME DE COMBO : Calculer les dégâts selon le combo
    const comboCount = this.player.comboCount || 1;
    const isFinisher = comboCount === 3;
    const damage = isFinisher ? 3 : 1; // Finisher = x3 dégâts
    const knockbackMultiplier = isFinisher ? 3 : 1; // Finisher = x3 knockback
    
    // Appliquer les dégâts
    enemy.takeDamage(damage);
    
    // KNOCKBACK selon le combo
    if (enemy.body && isFinisher) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const knockbackForce = 400 * knockbackMultiplier; // Force de base x3 pour finisher
        enemy.body.setVelocity(
          (dx / distance) * knockbackForce,
          (dy / distance) * knockbackForce
        );
      }
    }
    
    // Score selon le combo
    const score = isFinisher ? 360 : (comboCount * 120);
    this.addScore(score);
    
    // VFX : Hit Stop, Screen Shake, Particules
    const hitStopDuration = isFinisher ? 150 : 50;
    this._applyHitStop(hitStopDuration);
    this._applyScreenShake(isFinisher ? 15 : 5);
    this._spawnHitParticles(enemy.x, enemy.y, isFinisher);
    
    // UI FLOTTANTE : Afficher le texte de combo
    const comboText = comboCount === 1 ? 'HIT!' : comboCount === 2 ? 'DOUBLE!' : 'SMASH!!!';
    this._showComboText(enemy.x, enemy.y - 50, comboText, isFinisher);
  }

  _handlePlayerHitBoss(playerHitbox, boss) {
    if (boss.isDead) return;
    
    // Vérifier si l'attaque est active
    if (!this.player.attackState || !this.player.attackState.active) return;
    
    // Calculer le combo pour le boss aussi
    const comboCount = this.player.comboCount || 1;
    const isFinisher = comboCount === 3;
    const damage = isFinisher ? 3 : 1;
    
    // Appliquer les dégâts
    boss.takeDamage(damage);
    
    // RÉACTIONS VISUELLES ET PHYSIQUES
    // Shake du boss
    this.tweens.add({
      targets: boss,
      x: boss.x + Phaser.Math.Between(-8, 8),
      y: boss.y + Phaser.Math.Between(-8, 8),
      duration: 100,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        if (boss && !boss.isDead) {
          boss.x = boss.x; // Restaurer position
          boss.y = boss.y;
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
    
    // Texte de combo
    const comboText = comboCount === 1 ? 'HIT!' : comboCount === 2 ? 'DOUBLE!' : 'SMASH!!!';
    this._showComboText(boss.x, boss.y - 80, comboText, isFinisher);
  }

  _handlePlayerHitProp(playerHitbox, prop) {
    if (!prop || prop.isDead || prop.isTakingDamage) return;
    
    // Vérifier si l'attaque est active
    if (!this.player.attackState || !this.player.attackState.active) return;
    
    // Appliquer les dégâts au prop
    prop.takeDamage(1);
    
    // VFX léger pour les props
    this._applyScreenShake(2);
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

  _bossStartAttack(time) {
    if (!this.boss || !this.player || this.boss.isDead || this.boss.isAttacking) {
      return;
    }
    
    console.log('[BOSS] Début de l\'attaque!');
    
    // Mettre à jour le cooldown
    this.boss.lastAttackTime = time;
    this.boss.isAttacking = true;
    this.boss.attackState = 'attacking';
    
    // Jouer l'animation punch
    this.boss.play(Player.animKey('punch'), true);
    // Maintenir le tint et le scale pendant l'attaque
    this.boss.setTint(0xff0000);
    this.boss.setScale(4);
    
    // Écouter la fin de l'animation
    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.boss && !this.boss.isDead) {
        this.boss.isAttacking = false;
        this.boss.attackState = 'idle';
        this.boss.play(Player.animKey('idle'), true);
        // Maintenir le tint et le scale
        this.boss.setTint(0xff0000);
        this.boss.setScale(4);
        
        // Désactiver la hitbox d'attaque
        if (this.boss.attackHitbox && this.boss.attackHitbox.body) {
          this.boss.attackHitbox.body.enable = false;
        }
      }
    });
    
    // Activer la hitbox d'attaque pendant l'animation (frame 2 sur 3)
    this.time.delayedCall(200, () => {
      if (this.boss && !this.boss.isDead && this.boss.isAttacking) {
        // Activer la hitbox d'attaque
        if (this.boss.attackHitbox && this.boss.attackHitbox.body) {
          this.boss.attackHitbox.body.enable = true;
          console.log('[BOSS] Hitbox d\'attaque activée!');
        }
      }
    });
    
    // Désactiver la hitbox après l'animation
    this.time.delayedCall(400, () => {
      if (this.boss && this.boss.attackHitbox && this.boss.attackHitbox.body) {
        this.boss.attackHitbox.body.enable = false;
      }
    });
  }

  update(time) {
    // Si le jeu n'a pas commencé ou est en pause, ne pas mettre à jour
    if (!this.gameStarted || this.gamePaused) {
      return;
    }
    
    // Vérifier le Game Over
    if (this.player && this.player.health <= 0 && !this.gameOverActive) {
      this._handleGameOver();
      return;
    }
    
    if (!this.player || this.gameOverActive) {
      return;
    }

    // CRITIQUE : Toujours appeler player.update() à chaque frame
    this.player.update(this.cursors, this.actionKeys, time);

    // PARALLAX SCROLLING - Mise à jour des couches
    const cameraScrollX = this.cameras.main.scrollX;
    
    // Ciel : Fixe (pas de mouvement)
    // this.bgSky ne bouge pas (scrollFactor = 0)
    
    // Fond lointain : Mouvement lent
    if (this.bgFar) {
      this.bgFar.tilePositionX = cameraScrollX * 0.3;
    }
    
    // Fond proche : Mouvement plus rapide
    if (this.bgNear) {
      this.bgNear.tilePositionX = cameraScrollX * 0.6;
    }
    
    // Ancien background (compatibilité)
    if (this.backgroundFar) {
      this.backgroundFar.tilePositionX = cameraScrollX * 0.2;
    }

    // Mettre à jour les ennemis
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) return;
      if (enemy.update && typeof enemy.update === 'function') {
        enemy.update(this.player, time);
      }
    });
    
    // IA DU BOSS : Fait dans la scène, pas dans le sprite
    if (this.boss && this.boss.active && !this.boss.isDead) {
      if (this.boss.body && this.player && this.player.active) {
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const distance = Phaser.Math.Distance.Between(
          this.boss.x, 
          this.boss.y, 
          this.player.x, 
          this.player.y
        );
        
        // Si le boss est en train d'attaquer, ne pas bouger
        if (this.boss.isAttacking) {
          this.boss.body.setVelocity(0, 0);
        } else {
          // MOUVEMENT : Avancer vers le joueur avec moveToObject (vitesse 40)
          if (distance >= 80) {
            // Avancer vers le joueur
            this.physics.moveToObject(this.boss, this.player, 40);
            this.boss.setFlipX(this.player.x < this.boss.x);
            
            // ANIMATION : Marche
            if (this.boss.attackState !== 'walking') {
              this.boss.attackState = 'walking';
              this.boss.play(Player.animKey('walk'), true);
              // Maintenir le tint et le scale
              this.boss.setTint(0xff0000);
              this.boss.setScale(4);
            }
          } else if (distance < 80 && time >= this.boss.lastAttackTime + this.boss.attackCooldown) {
            // ATTAQUE : Si très proche (distance < 80) et cooldown écoulé
            this.boss.body.setVelocity(0, 0);
            this._bossStartAttack(time);
          } else {
            // S'arrêter et jouer idle
            this.boss.body.setVelocity(0, 0);
            if (this.boss.attackState !== 'idle') {
              this.boss.attackState = 'idle';
              this.boss.play(Player.animKey('idle'), true);
              // Maintenir le tint et le scale
              this.boss.setTint(0xff0000);
              this.boss.setScale(4);
            }
          }
        }
        
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
      // Vérifier si on a tué assez d'ennemis pour débloquer le boss
      if (this.enemiesKilled >= this.enemiesToKill) {
        console.log(`[WAVE] ${this.enemiesKilled} ennemis tués (objectif: ${this.enemiesToKill}), passage au boss`);
        // Ne pas lancer directement, attendre la transition
        if (!this.isTransitioning) {
          this._nextWave(); // Passer au boss (via transition)
        }
      } else if (this.currentWave < this.totalWaves) {
        // Spawner plus d'ennemis si nécessaire
        console.log(`[WAVE] Tous les ennemis éliminés, mais objectif non atteint (${this.enemiesKilled}/${this.enemiesToKill}), respawn`);
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
    const saved = localStorage.getItem('metalSlugHyper_maxLevelReached');
    return saved ? parseInt(saved, 10) : 1;
  }

  // ========================================
  // VFX & GAME FEEL - SYSTÈME DE COMBO
  // ========================================

  _applyHitStop(duration) {
    // Hit Stop : Figer le jeu pendant quelques millisecondes
    this.time.timeScale = 0.1; // Ralentir à 10% de la vitesse
    
    this.time.delayedCall(duration, () => {
      this.time.timeScale = 1.0; // Revenir à la vitesse normale
    });
  }

  _applyScreenShake(intensity) {
    // Screen Shake : Tremblement de caméra
    const shakeX = Phaser.Math.Between(-intensity, intensity);
    const shakeY = Phaser.Math.Between(-intensity, intensity);
    
    const originalScrollX = this.cameras.main.scrollX;
    const originalScrollY = this.cameras.main.scrollY;
    
    this.cameras.main.setScroll(
      originalScrollX + shakeX,
      originalScrollY + shakeY
    );
    
    // Retour progressif à la position normale
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: originalScrollX,
      scrollY: originalScrollY,
      duration: 200,
      ease: 'Power2'
    });
  }

  _spawnHitParticles(x, y, isFinisher) {
    // Particules d'impact : Explosion de particules au point de contact
    const particleCount = isFinisher ? 20 : 10;
    const colors = isFinisher ? [0xffffff, 0xff0000, 0xffff00] : [0xffffff, 0xffaaaa];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.rectangle(x, y, 4, 4, colors[Math.floor(Math.random() * colors.length)]);
      particle.setDepth(50);
      
      // Direction aléatoire
      const angle = Math.random() * Math.PI * 2;
      const speed = isFinisher ? 200 + Math.random() * 100 : 100 + Math.random() * 50;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Animation de particule
      this.tweens.add({
        targets: particle,
        x: particle.x + vx * 0.3,
        y: particle.y + vy * 0.3,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        duration: isFinisher ? 400 : 300,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  _showComboText(x, y, text, isFinisher) {
    // Texte flottant de combo
    const fontSize = isFinisher ? '48px' : '32px';
    const color = isFinisher ? '#ffff00' : '#ffffff';
    const strokeColor = isFinisher ? '#ff0000' : '#000000';
    
    const comboText = this.add.text(x, y, text, {
      fontSize: fontSize,
      fontFamily: 'monospace',
      fill: color,
      stroke: strokeColor,
      strokeThickness: 6,
      align: 'center'
    });
    comboText.setOrigin(0.5);
    comboText.setDepth(150);
    
    // Animation flottante
    this.tweens.add({
      targets: comboText,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.5, to: isFinisher ? 1.5 : 1.2 },
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        comboText.destroy();
      }
    });
  }
}
