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
    // Charger l'image de fond du niveau
    if (this.levelConfig && this.levelConfig.storyImageKey) {
      // Essayer de charger l'image spécifique, avec fallback
      this.load.image(this.levelConfig.storyImageKey, this.levelConfig.storyImageKey + '.png');
    }
    // Toujours charger bg.png comme fallback
    this.load.image('bg-story', 'bg.png');
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Fond avec l'image du niveau (assombrie)
    let bgKey = 'bg-story';
    if (this.levelConfig && this.levelConfig.storyImageKey) {
      if (this.textures.exists(this.levelConfig.storyImageKey)) {
        bgKey = this.levelConfig.storyImageKey;
      }
    }
    
    this.bg = this.add.image(0, 0, bgKey);
    this.bg.setOrigin(0, 0);
    this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    this.bg.setTint(0x333333); // Assombrir le fond
    this.bg.setDepth(-1);

    // Titre du chapitre
    if (this.levelConfig && this.levelConfig.storyTitle) {
      const titleText = this.add.text(centerX, 80, this.levelConfig.storyTitle, {
        fontSize: '42px',
        fontFamily: 'monospace',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        fontWeight: 'bold'
      });
      titleText.setOrigin(0.5);
      titleText.setDepth(10);
    }

    // Zone de texte en bas de l'écran (style cinématique)
    const textBoxY = this.cameras.main.height - 180;
    const textBoxHeight = 150;

    // Fond semi-transparent pour le texte
    const textBox = this.add.rectangle(centerX, textBoxY + textBoxHeight / 2, this.cameras.main.width - 40, textBoxHeight, 0x000000, 0.7);
    textBox.setDepth(5);

    // Texte de l'histoire (effet machine à écrire)
    if (this.levelConfig && this.levelConfig.storyText) {
      this.storyText = this.add.text(centerX, textBoxY + 20, '', {
        fontSize: '20px',
        fontFamily: 'monospace',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: this.cameras.main.width - 80 },
        lineSpacing: 8
      });
      this.storyText.setOrigin(0.5, 0);
      this.storyText.setDepth(10);

      // Effet machine à écrire
      this._typewriterEffect(this.levelConfig.storyText);
    } else {
      // Texte par défaut si pas de config
      this.storyText = this.add.text(centerX, textBoxY + 20, 'Préparez-vous au combat...', {
        fontSize: '20px',
        fontFamily: 'monospace',
        fill: '#ffffff',
        align: 'center'
      });
      this.storyText.setOrigin(0.5, 0);
      this.storyText.setDepth(10);
    }

    // Instruction "PRESS SPACE TO CONTINUE"
    this.continueText = this.add.text(centerX, this.cameras.main.height - 30, 'PRESS SPACE TO CONTINUE', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fill: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    this.continueText.setOrigin(0.5);
    this.continueText.setDepth(10);
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

    // Interaction : Espace pour continuer
    this.canContinue = false;
    this.isTransitioning = false;
    
    // Créer une référence à la touche Espace pour vérification continue
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Écouter aussi les clics de souris
    this.input.on('pointerdown', () => {
      if (this.canContinue && !this.isTransitioning) {
        this._continueToGame();
      }
    });
  }

  _typewriterEffect(fullText) {
    let currentIndex = 0;
    const typeSpeed = 30;

    const typeChar = () => {
      if (currentIndex < fullText.length) {
        this.storyText.setText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        this.time.delayedCall(typeSpeed, typeChar);
      } else {
        // Texte terminé, afficher l'instruction
        this.canContinue = true;
        this.continueText.setAlpha(1);
      }
    };

    // Démarrer l'effet après un court délai
    this.time.delayedCall(500, typeChar);
  }

  update() {
    // Vérifier en continu si Espace est pressé et si on peut continuer
    if (this.spaceKey && this.spaceKey.isDown && this.canContinue && !this.isTransitioning) {
      this._continueToGame();
    }
  }

  _continueToGame() {
    // Empêcher les appels multiples
    if (this.isTransitioning || !this.canContinue) {
      return;
    }
    
    this.isTransitioning = true;
    
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
