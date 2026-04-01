import Phaser from 'phaser';
import { STAGES, getCurrentStage, saveCurrentStage } from '../config/StagesConfig.js';
import Player from '../entities/Player.js';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  preload() {
    // Charger l'image de fond
    this.load.image('bg-map', 'bg.png');
    
    // Précharger les assets du joueur pour l'icône
    Player.preload(this);
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // FOND ASSOMBRI
    this.bg = this.add.image(0, 0, 'bg-map');
    this.bg.setOrigin(0, 0);
    this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    this.bg.setTint(0x222222); // Plus sombre pour l'ambiance cyberpunk
    this.bg.setDepth(-1);

    // TITRE STYLE CYBERPUNK
    this.titleText = this.add.text(centerX, 40, 'SELECT MISSION', {
      fontSize: '42px',
      fontFamily: 'monospace',
      fill: '#00ffff', // Cyan électrique
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontWeight: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(10);
    
    // Effet de glow sur le titre
    this.tweens.add({
      targets: this.titleText,
      alpha: { from: 0.8, to: 1.0 },
      duration: 1000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Récupérer le niveau maximum débloqué depuis localStorage
    const maxLevelReached = this._getMaxLevelReached();
    console.log(`[MAP] Niveau maximum débloqué: ${maxLevelReached}`);

    // CHEMIN EN ZIGZAG (SERPENTIN) - 10 stages
    const pathPositions = this._generateZigzagPath(10);
    
    // Dessiner les connexions néon entre les niveaux
    this._drawNeonConnections(pathPositions, maxLevelReached);

    // Créer les noeuds de niveau (style cyberpunk)
    this.levelNodes = [];
    pathPositions.forEach((pos, index) => {
      const stageLevel = index + 1;
      const node = this._createCyberpunkNode(pos.x, pos.y, stageLevel, maxLevelReached);
      this.levelNodes.push(node);
    });

    // Bouton retour
    this.backButton = this.add.text(20, 20, '← BACK', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.backButton.setOrigin(0, 0);
    this.backButton.setDepth(10);
    this.backButton.setInteractive({ useHandCursor: true });

    this.backButton.on('pointerover', () => {
      this.backButton.setFill('#ffffff');
      this.backButton.setScale(1.1);
    });

    this.backButton.on('pointerout', () => {
      this.backButton.setFill('#00ffff');
      this.backButton.setScale(1.0);
    });

    this.backButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });
  }

  _generateZigzagPath(stageCount) {
    // Générer un chemin en zigzag (serpentin) pour les 10 stages
    const positions = [];
    const startX = 100;
    const endX = this.cameras.main.width - 100;
    const topY = 150;
    const bottomY = this.cameras.main.height - 100;
    const stepX = (endX - startX) / (stageCount - 1);
    
    for (let i = 0; i < stageCount; i++) {
      const x = startX + (i * stepX);
      // Zigzag : alterner entre haut et bas
      const y = (i % 2 === 0) ? topY : bottomY;
      positions.push({ x, y, stage: i + 1 });
    }
    
    return positions;
  }

  _drawNeonConnections(positions, maxLevelReached) {
    // Dessiner les connexions néon entre les niveaux
    for (let i = 0; i < positions.length - 1; i++) {
      const from = positions[i];
      const to = positions[i + 1];
      const isUnlocked = (i + 1) < maxLevelReached; // Le chemin est débloqué si le stage suivant est débloqué
      
      this._drawNeonLine(from.x, from.y, to.x, to.y, isUnlocked);
    }
  }

  _drawNeonLine(x1, y1, x2, y2, isUnlocked) {
    // Dessiner une ligne néon avec effet de glow
    const color = isUnlocked ? 0x00ffff : 0x444444; // Cyan électrique ou gris terne
    const alpha = isUnlocked ? 0.8 : 0.3;
    const lineWidth = isUnlocked ? 6 : 3;
    
    // Ligne principale
    const mainLine = this.add.graphics();
    mainLine.lineStyle(lineWidth, color, alpha);
    mainLine.lineBetween(x1, y1, x2, y2);
    mainLine.setDepth(5);
    
    // Effet de glow (ligne plus épaisse et plus transparente en dessous)
    if (isUnlocked) {
      const glowLine = this.add.graphics();
      glowLine.lineStyle(lineWidth + 4, color, alpha * 0.3);
      glowLine.lineBetween(x1, y1, x2, y2);
      glowLine.setDepth(4);
      
      // Animation de pulsation pour les chemins débloqués
      this.tweens.add({
        targets: [mainLine, glowLine],
        alpha: { from: alpha, to: alpha * 0.5 },
        duration: 1500,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  _createCyberpunkNode(x, y, stageLevel, maxLevelReached) {
    // Déterminer l'état du niveau
    const isLocked = stageLevel > maxLevelReached;
    const isCompleted = stageLevel < maxLevelReached;
    const isUnlocked = stageLevel === maxLevelReached;

    // Configuration visuelle selon l'état
    let nodeConfig = {
      circleColor: 0x444444,      // Gris foncé
      borderColor: 0x880000,      // Rouge sombre
      borderWidth: 3,
      glowColor: 0xff0000,        // Rouge lumineux
      textColor: '#888888',
      size: 60
    };

    if (isCompleted) {
      nodeConfig = {
        circleColor: 0xffaa00,    // Doré/orange
        borderColor: 0xffd700,    // Or brillant
        borderWidth: 4,
        glowColor: 0xffaa00,
        textColor: '#ffd700',
        size: 60
      };
    } else if (isUnlocked) {
      nodeConfig = {
        circleColor: 0x00aaff,    // Bleu cyan vibrant
        borderColor: 0x00ffff,    // Cyan électrique
        borderWidth: 4,
        glowColor: 0x00ffff,
        textColor: '#00ffff',
        size: 70
      };
    }

    // Créer le conteneur graphique du noeud
    const nodeContainer = this.add.container(x, y);
    nodeContainer.setDepth(7);

    // Cercle principal avec glow
    const mainCircle = this.add.graphics();
    mainCircle.fillStyle(nodeConfig.circleColor, 0.9);
    mainCircle.fillCircle(0, 0, nodeConfig.size);
    mainCircle.lineStyle(nodeConfig.borderWidth, nodeConfig.borderColor, 1);
    mainCircle.strokeCircle(0, 0, nodeConfig.size);
    mainCircle.setDepth(7);
    nodeContainer.add(mainCircle);

    // Effet de glow (cercle plus grand et transparent)
    let glowCircle = null;
    if (!isLocked) {
      glowCircle = this.add.graphics();
      glowCircle.fillStyle(nodeConfig.glowColor, 0.3);
      glowCircle.fillCircle(0, 0, nodeConfig.size + 10);
      glowCircle.setDepth(6);
      nodeContainer.add(glowCircle);
    }

    // Numéro du stage (style digital)
    const stageNumber = this.add.text(0, -15, stageLevel.toString(), {
      fontSize: '32px',
      fontFamily: 'monospace',
      fill: nodeConfig.textColor,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      fontWeight: 'bold'
    });
    stageNumber.setOrigin(0.5);
    stageNumber.setDepth(8);
    nodeContainer.add(stageNumber);

    // Icône selon l'état
    if (isLocked) {
      // Cadenas rouge lumineux
      const lockIcon = this.add.text(0, 10, '🔒', {
        fontSize: '28px'
      });
      lockIcon.setOrigin(0.5);
      lockIcon.setDepth(8);
      nodeContainer.add(lockIcon);
      
      // Animation de pulsation pour le cadenas
      this.tweens.add({
        targets: lockIcon,
        alpha: { from: 0.6, to: 1.0 },
        duration: 800,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    } else if (isCompleted) {
      // Coche lumineuse
      const checkIcon = this.add.text(0, 10, '✓', {
        fontSize: '36px',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
        fontWeight: 'bold'
      });
      checkIcon.setOrigin(0.5);
      checkIcon.setDepth(8);
      nodeContainer.add(checkIcon);
    } else if (isUnlocked) {
      // Sprite du joueur en miniature (niveau actuel)
      const playerIdleKey = Player.frameKey('idle', 1);
      if (this.textures.exists(playerIdleKey)) {
        const playerIcon = this.add.image(0, 15, playerIdleKey);
        playerIcon.setScale(0.3);
        playerIcon.setTint(0x00ffff); // Cyan pour correspondre au thème
        playerIcon.setDepth(8);
        nodeContainer.add(playerIcon);
      }
      
      // Animation de pulsation pour le niveau débloqué
      this.tweens.add({
        targets: nodeContainer,
        scale: { from: 1.0, to: 1.1 },
        duration: 1000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Nom du stage
    const stageConfig = STAGES.find(s => s.id === stageLevel);
    const nameText = this.add.text(0, nodeConfig.size + 20, stageConfig ? stageConfig.name : `Stage ${stageLevel}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      fill: nodeConfig.textColor,
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    });
    nameText.setOrigin(0.5);
    nameText.setDepth(8);
    nodeContainer.add(nameText);

    // Zone cliquable
    const hitArea = this.add.zone(0, 0, nodeConfig.size * 2.5, nodeConfig.size * 2.5);
    hitArea.setInteractive({ useHandCursor: !isLocked });
    hitArea.setData('stageLevel', stageLevel);
    hitArea.setData('isLocked', isLocked);
    hitArea.setData('nodeContainer', nodeContainer);
    hitArea.setDepth(9);
    nodeContainer.add(hitArea);

    // Interactions au survol (seulement si débloqué)
    if (!isLocked) {
      hitArea.on('pointerover', () => {
        // Grossir et augmenter la brillance
        this.tweens.add({
          targets: nodeContainer,
          scale: { from: nodeContainer.scaleX, to: 1.2 },
          duration: 200,
          ease: 'Power2'
        });
        
        // Augmenter l'alpha du glow
        if (glowCircle && glowCircle.active) {
          this.tweens.add({
            targets: glowCircle,
            alpha: { from: 0.3, to: 0.6 },
            duration: 200,
            ease: 'Power2'
          });
        }
      });

      hitArea.on('pointerout', () => {
        // Revenir à la taille normale
        this.tweens.add({
          targets: nodeContainer,
          scale: { from: nodeContainer.scaleX, to: isUnlocked ? 1.1 : 1.0 },
          duration: 200,
          ease: 'Power2'
        });
        
        // Réduire l'alpha du glow
        if (glowCircle && glowCircle.active) {
          this.tweens.add({
            targets: glowCircle,
            alpha: { from: 0.6, to: 0.3 },
            duration: 200,
            ease: 'Power2'
          });
        }
      });

      // Clic sur le niveau
      hitArea.on('pointerdown', () => {
        console.log(`[MAP] Lancement du Stage ${stageLevel}`);
        
        // Effet visuel de confirmation
        this.tweens.add({
          targets: nodeContainer,
          scale: { from: nodeContainer.scaleX, to: 1.3 },
          duration: 100,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            // Fondu au noir
            this.cameras.main.fadeOut(500, 0, 0, 0);
            
            // Lancer StoryScene d'abord (cutscene), puis GameScene
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('StoryScene', { 
                levelIndex: stageLevel,
                nextScene: 'GameScene'
              });
            });
          }
        });
      });
    } else {
      // Feedback visuel pour les niveaux verrouillés
      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: nodeContainer,
          alpha: 0.6,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });
      });
    }

    return {
      container: nodeContainer,
      hitArea,
      stageLevel,
      isLocked,
      isUnlocked,
      isCompleted
    };
  }

  _getMaxLevelReached() {
    const saved = localStorage.getItem('metalSlugHyper_maxLevelReached');
    return saved ? parseInt(saved, 10) : 1;
  }

  _saveMaxLevelReached(level) {
    const currentMax = this._getMaxLevelReached();
    if (level > currentMax) {
      localStorage.setItem('metalSlugHyper_maxLevelReached', level.toString());
      console.log(`[MAP] Nouveau niveau débloqué: ${level}`);
    }
  }
}
