import Phaser from 'phaser';
import { getCurrentStage } from '../config/StagesConfig.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  preload() {
    // Charger l'image de fond
    this.load.image('bg-title', 'bg.png');
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // FOND ASSOMBRI
    this.bg = this.add.image(0, 0, 'bg-title');
    this.bg.setOrigin(0, 0);
    this.bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    this.bg.setTint(0x444444); // Assombrir le fond
    this.bg.setDepth(-1);

    // TITRE PRINCIPAL : "METAL JEFF"
    this.titleText = this.add.text(centerX, centerY - 150, 'METAL JEFF', {
      fontSize: '72px',
      fontFamily: 'monospace',
      fill: '#ffd700', // Or/Jaune
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center',
      fontWeight: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(10);

    // Animation de "respiration" pour le titre
    this.tweens.add({
      targets: this.titleText,
      scale: { from: 1.0, to: 1.05 },
      duration: 1500,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // SOUS-TITRE : "HYPERLIQUID EVM EDITION"
    this.subtitleText = this.add.text(centerX, centerY - 80, 'HYPERLIQUID EVM EDITION', {
      fontSize: '24px',
      fontFamily: 'monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    this.subtitleText.setOrigin(0.5);
    this.subtitleText.setDepth(10);

    // BOUTON START GAME
    this.startButton = this.add.text(centerX, centerY + 50, 'START GAME', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setDepth(10);
    this.startButton.setInteractive({ useHandCursor: true });

    // Animation de clignotement pour le bouton START
    this.tweens.add({
      targets: this.startButton,
      alpha: { from: 1.0, to: 0.6 },
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Animation au survol de la souris
    this.startButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.startButton,
        scale: { from: 1.0, to: 1.2 },
        duration: 200,
        ease: 'Power2'
      });
      this.startButton.setFill('#ffff00'); // Jaune au survol
    });

    this.startButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.startButton,
        scale: { from: 1.2, to: 1.0 },
        duration: 200,
        ease: 'Power2'
      });
      this.startButton.setFill('#00ff00'); // Vert normal
    });

    // Clic sur START GAME
    this.startButton.on('pointerdown', () => {
      // Désactiver l'interactivité pour éviter les double-clics
      this.startButton.setInteractive(false);
      
      // Fondu au noir
      this.cameras.main.fadeOut(500, 0, 0, 0);
      
      // Lancer MapScene après le fade (au lieu de GameScene directement)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MapScene');
      });
    });

    // BOUTON CONNECT WALLET (Placeholder)
    this.walletButton = this.add.text(this.cameras.main.width - 20, 20, 'CONNECT WALLET', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fill: '#888888',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right'
    });
    this.walletButton.setOrigin(1, 0); // Ancré en haut à droite
    this.walletButton.setDepth(10);
    this.walletButton.setInteractive({ useHandCursor: true });

    // Animation au survol pour le bouton wallet
    this.walletButton.on('pointerover', () => {
      this.walletButton.setFill('#aaaaaa');
    });

    this.walletButton.on('pointerout', () => {
      this.walletButton.setFill('#888888');
    });

    // Clic sur CONNECT WALLET (placeholder)
    this.walletButton.on('pointerdown', () => {
      console.log('[WALLET] Connect Wallet clicked (placeholder)');
      // TODO: Implémenter la connexion wallet Web3
    });

    // Afficher le stage actuel débloqué (optionnel)
    const currentStage = getCurrentStage();
    if (currentStage > 1) {
      this.stageInfo = this.add.text(centerX, centerY + 150, `Continue from Stage ${currentStage}`, {
        fontSize: '20px',
        fontFamily: 'monospace',
        fill: '#aaaaaa',
        align: 'center'
      });
      this.stageInfo.setOrigin(0.5);
      this.stageInfo.setDepth(10);
    }
  }
}

