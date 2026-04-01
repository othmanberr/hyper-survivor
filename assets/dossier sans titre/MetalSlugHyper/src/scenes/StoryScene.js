import Phaser from 'phaser';
import { getLevelById } from '../config/Levels.js';

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StoryScene' });
  }

  init(data) {
    // Récupérer les données du niveau
    this.levelIndex = data?.levelIndex || 1;
    this.nextScene = data?.nextScene || 'GameScene';
    this.levelConfig = getLevelById(this.levelIndex);
  }

  preload() {
    // Charger l'image de fond du niveau depuis assets/story/
    if (this.levelConfig && this.levelConfig.storyKey) {
      const imagePath = `story/${this.levelConfig.storyKey}.jpg`;
      console.log(`[STORY] Chargement de l'image: ${imagePath}`);
      this.load.image(this.levelConfig.storyKey, imagePath);
    }
    // Fallback
    this.load.image('bg-story', 'backgrounds/bg.png');
  }

  create() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // ========================================
    // FOND : Image plein écran
    // ========================================
    let bgKey = 'bg-story';
    if (this.levelConfig && this.levelConfig.storyKey) {
      if (this.textures.exists(this.levelConfig.storyKey)) {
        bgKey = this.levelConfig.storyKey;
        console.log(`[STORY] Image chargée: ${bgKey}`);
      } else {
        console.warn(`[STORY] Image non trouvée: ${this.levelConfig.storyKey}, utilisation du fallback`);
      }
    }
    
    // Image de fond : plein écran
    this.bg = this.add.image(centerX, centerY, bgKey);
    this.bg.setOrigin(0.5, 0.5);
    this.bg.setDisplaySize(screenWidth, screenHeight);
    this.bg.setDepth(0);

    // ========================================
    // BOÎTE DE TEXTE : Rectangle noir (tiers inférieur)
    // ========================================
    const textBoxHeight = screenHeight / 3; // Tiers inférieur
    const textBoxY = screenHeight - (textBoxHeight / 2); // Centré sur le tiers inférieur
    
    this.textBox = this.add.rectangle(
      centerX,
      textBoxY,
      screenWidth,
      textBoxHeight,
      0x000000,
      0.8 // Alpha 0.8
    );
    this.textBox.setDepth(10);
    this.textBox.setOrigin(0.5, 0.5);

    // ========================================
    // TEXTE : Titre (Jaune) et Texte (Blanc)
    // ========================================
    const textPadding = 30;
    const textBoxTop = textBoxY - (textBoxHeight / 2) + textPadding;
    
    // Titre (Jaune)
    if (this.levelConfig && this.levelConfig.storyTitle) {
      this.titleText = this.add.text(
        centerX,
        textBoxTop,
        this.levelConfig.storyTitle,
        {
          fontSize: '28px',
          fontFamily: 'Arial, sans-serif',
          fill: '#FFD700', // Jaune
          align: 'center',
          fontStyle: 'bold'
        }
      );
      this.titleText.setOrigin(0.5, 0);
      this.titleText.setDepth(11);
      this.titleText.setAlpha(0); // Commence invisible
    }

    // Texte de l'histoire (Blanc)
    if (this.levelConfig && this.levelConfig.storyText) {
      const titleHeight = this.titleText ? this.titleText.height + 20 : 0;
      const storyY = textBoxTop + titleHeight;
      const maxWidth = screenWidth - (textPadding * 2);
      
      this.storyText = this.add.text(
        centerX,
        storyY,
        this.levelConfig.storyText,
        {
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
          fill: '#FFFFFF', // Blanc
          align: 'center',
          wordWrap: { width: maxWidth }
        }
      );
      this.storyText.setOrigin(0.5, 0);
      this.storyText.setDepth(11);
      this.storyText.setAlpha(0); // Commence invisible
    }

    // ========================================
    // INTERACTION : ESPACE pour afficher le texte
    // ========================================
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.textShown = false;
    this.canContinue = false;
    this.isTransitioning = false;

    // Afficher le texte immédiatement si on appuie sur ESPACE
    this.spaceKey.on('down', () => {
      if (!this.textShown) {
        // Afficher tout le texte d'un coup
        this._showAllText();
      } else if (this.canContinue && !this.isTransitioning) {
        // Passer à la suite
        this._continueToGame();
      }
    });

    // Afficher aussi au clic
    this.input.on('pointerdown', () => {
      if (!this.textShown) {
        this._showAllText();
      } else if (this.canContinue && !this.isTransitioning) {
        this._continueToGame();
      }
    });

    // Afficher automatiquement après un court délai (optionnel)
    this.time.delayedCall(500, () => {
      if (!this.textShown) {
        this._showAllText();
      }
    });
  }

  _showAllText() {
    if (this.textShown) return;
    
    this.textShown = true;
    
    // Animation d'apparition du titre
    if (this.titleText) {
      this.tweens.add({
        targets: this.titleText,
        alpha: { from: 0, to: 1 },
        duration: 300,
        ease: 'Power2'
      });
    }

    // Animation d'apparition du texte
    if (this.storyText) {
      this.tweens.add({
        targets: this.storyText,
        alpha: { from: 0, to: 1 },
        duration: 300,
        delay: 100,
        ease: 'Power2',
        onComplete: () => {
          this.canContinue = true;
          this._showContinuePrompt();
        }
      });
    } else {
      this.canContinue = true;
      this._showContinuePrompt();
    }
  }

  _showContinuePrompt() {
    if (this.continueText) return; // Déjà affiché
    
    const screenHeight = this.cameras.main.height;
    const centerX = this.cameras.main.width / 2;
    
    this.continueText = this.add.text(
      centerX,
      screenHeight - 40,
      'PRESS SPACE TO CONTINUE',
      {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        fill: '#FFD700', // Jaune
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.continueText.setOrigin(0.5, 0.5);
    this.continueText.setDepth(12);
    this.continueText.setAlpha(0);

    // Animation de clignotement
    this.tweens.add({
      targets: this.continueText,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  update() {
    // Vérifier si ESPACE est pressé (gestion dans create avec on('down'))
    // Le update est gardé pour compatibilité mais la logique principale est dans create
  }

  _continueToGame() {
    // Empêcher les appels multiples
    if (this.isTransitioning || !this.canContinue) {
      return;
    }
    
    this.isTransitioning = true;
    console.log('[STORY] Transition vers le jeu');
    
    // Fondu au noir
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Lancer la scène suivante (GameScene avec le levelIndex)
      if (this.nextScene === 'GameScene') {
        this.scene.start('GameScene', { levelIndex: this.levelIndex });
      } else {
        this.scene.start(this.nextScene);
      }
    });
  }
}
