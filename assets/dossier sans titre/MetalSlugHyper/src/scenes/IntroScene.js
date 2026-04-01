import Phaser from 'phaser';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    // Charger l'image de fond pour l'intro (fallback) depuis assets/backgrounds/
    this.load.image('bg-intro', 'backgrounds/bg.png');
    
    // Charger l'image de l'histoire d'intro depuis assets/
    // Le dossier assets/ est défini comme publicDir dans vite.config.js
    // Donc les fichiers sont accessibles directement à la racine
    this.load.image('intro_story', 'intro_story.jpg');
    
    // Écouter les événements de chargement pour déboguer
    this.load.on('filecomplete', (key, type, data) => {
      if (key === 'intro_story') {
        console.log(`[INTRO] ✓ Fichier intro_story.jpg chargé avec succès!`);
      }
    });
    
    this.load.on('loaderror', (file) => {
      if (file.key === 'intro_story') {
        console.error(`[INTRO] ✗ Erreur de chargement de intro_story.jpg`);
        console.error(`[INTRO] URL tentée: ${file.url}`);
        console.error(`[INTRO] Vérifiez que le fichier existe dans assets/intro_story.jpg`);
      }
    });
    
    // Si le chargement échoue, on utilisera bg-intro comme fallback
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Fond avec l'image intro_story.jpg
    // Vérifier si l'image a été chargée avec succès
    let bgKey = 'bg-intro'; // Fallback par défaut
    
    // Liste toutes les textures disponibles pour déboguer
    console.log('[INTRO] Textures disponibles:', Object.keys(this.textures.list));
    
    // Attendre que les textures soient chargées
    if (this.textures.exists('intro_story')) {
      bgKey = 'intro_story';
      console.log('[INTRO] ✓ Utilisation de intro_story.jpg');
    } else {
      console.warn('[INTRO] ✗ intro_story.jpg non disponible, utilisation du fallback bg.png');
      console.log('[INTRO] Vérifiez que le fichier existe dans assets/intro_story.jpg');
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

    // Texte du prologue (version anglaise)
    const PROLOGUE_LINES = [
      'YEAR 202X. THE ETERNAL BEAR MARKET.',
      'The Centralized Empire (CEX) has captured global liquidity.',
      'Gas Fees are at their ATH, and censorship reigns supreme.',
      '',
      'A single light persists: The HYPERLIQUID Network.',
      '',
      'JEFF, the Gigabrain Architect, must now climb the Citadel,',
      'defeat the imposters, and deploy the Genesis Block of freedom.',
      '',
      'The ascent begins now. WAGMI.'
    ];

    // Joindre les lignes avec des retours à la ligne
    const introText = PROLOGUE_LINES.join('\n');

    // Créer le texte défilant (positionné en bas, hors écran)
    const screenHeight = this.cameras.main.height;
    const screenWidth = this.cameras.main.width;
    
    this.introText = this.add.text(centerX, screenHeight, introText, {
      fontSize: '36px',
      fontFamily: 'Arial, Verdana, sans-serif',
      fill: '#FFD700', // Or/Jaune
      align: 'center',
      wordWrap: { width: screenWidth - 150 },
      lineSpacing: 12
    });
    this.introText.setOrigin(0.5, 0); // Centré horizontalement, ancré en haut
    this.introText.setDepth(10);
    
    // Ajouter stroke et shadow pour la lisibilité
    this.introText.setStroke('#000000', 4); // Contour noir épais
    this.introText.setShadow(3, 3, 'rgba(0, 0, 0, 0.9)', 5); // Ombre portée

    // Animation de défilement cinématographique (25 secondes)
    const scrollDuration = 25000; // 25 secondes pour un scroll lent et épique
    const finalY = -this.introText.height - 100; // Sortir complètement de l'écran en haut
    
    this.tweens.add({
      targets: this.introText,
      y: finalY,
      duration: scrollDuration,
      ease: 'Linear', // Mouvement linéaire constant
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

