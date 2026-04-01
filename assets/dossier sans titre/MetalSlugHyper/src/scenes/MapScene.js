import Phaser from 'phaser';
import { LEVELS_CONFIG } from '../config/Levels.js';

export default class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  preload() {
    // Avec publicDir: 'assets' dans vite.config.js, les fichiers sont servis depuis la racine
    // Charger map_background.jpg depuis assets/backgrounds/
    this.load.image('map-bg', 'backgrounds/map_background.jpg');
    // On charge le player pour le petit icone (le fichier est à assets/player/idle/idle1.png)
    this.load.image('player-icon', 'player/idle/idle1.png'); 
  }

  create() {
    // 1. FOND D'ÉCRAN
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'map-bg');
    bg.setDisplaySize(this.scale.width, this.scale.height);
    bg.setDepth(-1); // Derrière tout

    // 2. TITRE
    this.add.text(this.scale.width / 2, 50, 'SELECT MISSION', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#FFD700', // OR pour harmoniser avec la palette
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 3. POSITIONS DÉFINITIVES DES STAGES
    const STAGE_POSITIONS = [
      { x: 348, y: 485 }, // Stage 1
      { x: 299, y: 367 }, // Stage 2
      { x: 334, y: 308 }, // Stage 3
      { x: 389, y: 410 }, // Stage 4
      { x: 463, y: 343 }, // Stage 5
      { x: 460, y: 257 }, // Stage 6
      { x: 533, y: 272 }, // Stage 7
      { x: 526, y: 220 }, // Stage 8
      { x: 581, y: 204 }, // Stage 9
      { x: 642, y: 99 }   // Stage 10
    ];

    // 4. RÉCUPÉRER LE NIVEAU MAX ATTEINT
    const maxLevelReached = this._getMaxLevelReached();
    console.log(`[MAP] Niveau maximum débloqué: ${maxLevelReached}`);

    // 5. CRÉER LES NOEUDS DE NIVEAU (Style Cyberpunk Premium Or/Métal)
    this.levelNodes = [];
    STAGE_POSITIONS.forEach((pos, index) => {
      const levelNum = index + 1;
      const isCompleted = levelNum < maxLevelReached;
      const isCurrent = levelNum === maxLevelReached;
      const isLocked = levelNum > maxLevelReached;
      const node = this._createLevelNode(pos.x, pos.y, levelNum, isCompleted, isCurrent, isLocked);
      this.levelNodes.push(node);
    });

    // 6. BOUTON RETOUR
    this._createBackButton();
  }

  _getMaxLevelReached() {
    // PROVISOIRE : Ouvrir tous les stages
    return 10; // Tous les stages sont débloqués
    // const saved = localStorage.getItem('metalSlugHyper_maxLevelReached');
    // return saved ? parseInt(saved, 10) : 1;
  }

  _createLevelNode(x, y, levelNum, isCompleted, isCurrent, isLocked) {
    // Conteneur pour le cercle et le texte
    const container = this.add.container(x, y);
    container.setSize(30, 30);

    // Configuration selon l'état
    let fillColor, fillAlpha, strokeColor, strokeWidth, strokeAlpha, textColor;
    
    if (isLocked) {
      // Niveau VERROUILLÉ : Gris foncé opaque
      fillColor = 0x222222; // Gris foncé
      fillAlpha = 0.9; // Opaque
      strokeColor = 0x555555; // Gris Acier
      strokeWidth = 2;
      strokeAlpha = 1.0;
      textColor = '#666666'; // Gris sombre
    } else if (isCurrent) {
      // Niveau COURANT (À jouer) : OR Épais et Brillant
      fillColor = 0x000000; // Noir
      fillAlpha = 0.8; // Transparent pour contraste
      strokeColor = 0xFFD700; // OR
      strokeWidth = 4; // Épais
      strokeAlpha = 1.0;
      textColor = '#FFD700'; // OR
    } else {
      // Niveau DÉBLOQUÉ (Terminé) : OR fin
      fillColor = 0x000000; // Noir
      fillAlpha = 0.8; // Transparent pour contraste
      strokeColor = 0xFFD700; // OR
      strokeWidth = 2; // Fin
      strokeAlpha = 1.0;
      textColor = '#ffffff'; // Blanc pour contraste max
    }

    // Créer le cercle avec remplissage et contour
    const circle = this.add.graphics();
    circle.fillStyle(fillColor, fillAlpha);
    circle.fillCircle(0, 0, 15);
    circle.lineStyle(strokeWidth, strokeColor, strokeAlpha);
    circle.strokeCircle(0, 0, 15);
    container.add(circle);

    // Numéro du stage
    const text = this.add.text(0, 0, levelNum.toString(), {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 2,
      fontWeight: 'bold'
    }).setOrigin(0.5);
    container.add(text);

    // Icône selon l'état
    if (isLocked) {
      // Icône cadenas pour les niveaux verrouillés (Gris sombre)
      const lockIcon = this.add.text(0, 8, '🔒', {
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(0.5);
      container.add(lockIcon);
    } else if (isCurrent) {
      // Icône joueur pour le niveau actuel (OR)
      if (this.textures.exists('player-icon')) {
        const playerIcon = this.add.image(0, 8, 'player-icon');
        playerIcon.setScale(0.15);
        playerIcon.setTint(0xFFD700); // OR
        container.add(playerIcon);
      }
    }

    // Animation de pulsation pour le niveau courant uniquement (effet "vivant")
    if (isCurrent) {
      this.tweens.add({
        targets: container,
        scale: { from: 1.0, to: 1.1 },
        duration: 1000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Interaction : Seulement si débloqué (terminé ou courant)
    if (!isLocked) {
      container.setInteractive({ useHandCursor: true });
      
      container.on('pointerover', () => {
        // Arrêter l'animation de pulsation si c'est le niveau courant, puis agrandir
        if (isCurrent) {
          this.tweens.killTweensOf(container);
        }
        this.tweens.add({
          targets: container,
          scale: { from: container.scaleX, to: 1.2 },
          duration: 150,
          ease: 'Power2'
        });
      });

      container.on('pointerout', () => {
        // Revenir à la taille normale
        this.tweens.add({
          targets: container,
          scale: { from: container.scaleX, to: 1.0 },
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            // Relancer l'animation de pulsation seulement si c'est le niveau courant
            if (isCurrent) {
              this.tweens.add({
                targets: container,
                scale: { from: 1.0, to: 1.1 },
                duration: 1000,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
              });
            }
          }
        });
      });

      container.on('pointerdown', () => {
        console.log(`[MAP] Lancement du Stage ${levelNum}`);
        
        // Effet visuel de confirmation
        this.tweens.add({
          targets: container,
          scale: { from: 1.15, to: 1.3 },
          duration: 100,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            // Lancer la scène d'histoire
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('StoryScene', { 
                levelIndex: levelNum,
                nextScene: 'GameScene'
              });
            });
          }
        });
      });
    }

    return container;
  }

  _createBackButton() {
    const backButton = this.add.text(20, 20, '← BACK', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#FFD700', // OR pour harmoniser avec la palette
      stroke: '#000000',
      strokeThickness: 3
    });
    backButton.setOrigin(0, 0);
    backButton.setDepth(10);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setFill('#ffffff');
      backButton.setScale(1.1);
    });

    backButton.on('pointerout', () => {
      backButton.setFill('#FFD700'); // OR
      backButton.setScale(1.0);
    });

    backButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    });
  }
}
