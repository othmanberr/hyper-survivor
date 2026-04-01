import Phaser from 'phaser';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    // Charger l'image de fond pour l'intro (fallback)
    this.load.image('bg-intro', 'bg.png');
    
    // Charger l'image de l'histoire d'intro
    // Essayer plusieurs chemins possibles
    // Le dossier assets/ est défini comme publicDir dans vite.config.js
    // Donc les fichiers sont accessibles directement à la racine
    
    // Essayer d'abord le chemin direct
    this.load.image('intro_story', 'intro_story.png');
    
    // Écouter les événements de chargement pour déboguer
    this.load.on('filecomplete', (key, type, data) => {
      if (key === 'intro_story') {
        console.log(`[INTRO] ✓ Fichier intro_story.png chargé avec succès!`);
      }
    });
    
    this.load.on('loaderror', (file) => {
      if (file.key === 'intro_story') {
        console.error(`[INTRO] ✗ Erreur de chargement de intro_story.png`);
        console.error(`[INTRO] URL tentée: ${file.url}`);
        console.error(`[INTRO] Vérifiez que le fichier existe dans assets/intro_story.png`);
      }
    });
    
    // Si le chargement échoue, on utilisera bg-intro comme fallback
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Fond avec l'image intro_story.png
    // Vérifier si l'image a été chargée avec succès
    let bgKey = 'bg-intro'; // Fallback par défaut
    
    // Liste toutes les textures disponibles pour déboguer
    console.log('[INTRO] Textures disponibles:', Object.keys(this.textures.list));
    
    // Attendre que les textures soient chargées
    if (this.textures.exists('intro_story')) {
      bgKey = 'intro_story';
      console.log('[INTRO] ✓ Utilisation de intro_story.png');
    } else {
      console.warn('[INTRO] ✗ intro_story.png non disponible, utilisation du fallback bg.png');
      console.log('[INTRO] Vérifiez que le fichier existe dans assets/intro_story.png');
    }
    
    try {
      this.bg = this.add.image(0, 0, bgKey);
      this.bg.setOrigin(0, 0);
      this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
      this.bg.setDepth(-1);
      
      // Si c'est le fallback, assombrir un peu pour l'ambiance
      if (bgKey === 'bg-intro') {
        this.bg.setTint(0x222222); // Assombrir le fond
      }
      
      console.log(`[INTRO] Image de fond créée avec la clé: ${bgKey}`);
    } catch (error) {
      console.error('[INTRO] Erreur lors de la création de l\'image:', error);
      // Fallback ultime
      this.bg = this.add.image(0, 0, 'bg-intro');
      this.bg.setOrigin(0, 0);
      this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
      this.bg.setTint(0x000000);
      this.bg.setDepth(-1);
    }

    // Texte défilant style Star Wars
    const introText = `AN 2025

Le réseau Hyperliquid est le dernier bastion
de la liberté financière dans un monde
où la centralisation règne en maître.

Mais l'Empire Centralisé a envoyé
ses armées de Bots et de FUD
pour détruire ce qui reste de décentralisation.

JEFF, un guerrier solitaire,
doit combattre pour préserver
l'autonomie du réseau.

Son arme : La détermination.
Son objectif : Libérer Hyperliquid
de l'emprise de l'Empire.

Le combat commence maintenant...`;

    // Créer le texte défilant
    this.introText = this.add.text(centerX, this.cameras.main.height + 100, introText, {
      fontSize: '24px',
      fontFamily: 'monospace',
      fill: '#ffd700',
      align: 'center',
      wordWrap: { width: this.cameras.main.width - 100 }
    });
    this.introText.setOrigin(0.5, 0);
    this.introText.setDepth(10);

    // Animation de défilement vers le haut
    const scrollDuration = 10000; // 10 secondes
    this.tweens.add({
      targets: this.introText,
      y: -this.introText.height - 200,
      duration: scrollDuration,
      ease: 'Linear',
      onComplete: () => {
        // Fondu au noir puis lancer TitleScene
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('TitleScene');
        });
      }
    });

    // Permettre de skip avec Espace ou clic
    const skipAction = () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('TitleScene');
      });
    };
    
    this.input.keyboard.once('keydown-SPACE', skipAction);
    this.input.once('pointerdown', skipAction);

    // Texte "PRESS SPACE TO SKIP" en bas
    const skipText = this.add.text(centerX, this.cameras.main.height - 40, 'PRESS SPACE TO SKIP', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fill: '#888888',
      align: 'center'
    });
    skipText.setOrigin(0.5);
    skipText.setDepth(10);

    // Animation de clignotement
    this.tweens.add({
      targets: skipText,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
}

