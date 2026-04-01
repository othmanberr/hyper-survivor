/**
 * VFXManager - Gestion des effets visuels (Game Feel)
 * 
 * Responsabilités :
 * - Hit Stop (freeze momentané)
 * - Slow Motion (ralenti pour finishers)
 * - Screen Shake (tremblement de caméra)
 * - Particules d'impact
 * - Textes flottants de combo
 */
export default class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.slowMotionActive = false;
    this.slowMotionTimer = null;
    this.slowMotionOverlay = null;
  }

  /**
   * Hit Stop : Figer le jeu pendant quelques millisecondes
   * @param {number} duration - Durée du freeze en ms
   */
  applyHitStop(duration) {
    this.scene.time.timeScale = 0.1;
    
    this.scene.time.delayedCall(duration, () => {
      this.scene.time.timeScale = 1.0;
    });
  }

  /**
   * Slow Motion : Ralentir le temps à 30% pour les finishers
   * @param {number} duration - Durée du slow-motion en ms
   */
  activateSlowMotion(duration) {
    if (this.slowMotionActive) return;
    
    this.slowMotionActive = true;
    this.scene.time.timeScale = 0.3;
    
    // Effet visuel : assombrir légèrement l'écran
    if (!this.slowMotionOverlay) {
      this.slowMotionOverlay = this.scene.add.rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        0x000000,
        0.1
      );
      this.slowMotionOverlay.setDepth(100);
      this.slowMotionOverlay.setScrollFactor(0);
    }
    this.slowMotionOverlay.setVisible(true);
    
    // Retour à la normale après la durée
    this.slowMotionTimer = this.scene.time.delayedCall(duration, () => {
      this.scene.time.timeScale = 1.0;
      this.slowMotionActive = false;
      if (this.slowMotionOverlay) {
        this.slowMotionOverlay.setVisible(false);
      }
    });
  }

  /**
   * Screen Shake : Tremblement de caméra
   * @param {number} intensity - Intensité du shake en pixels
   */
  applyScreenShake(intensity) {
    const shakeX = Phaser.Math.Between(-intensity, intensity);
    const shakeY = Phaser.Math.Between(-intensity, intensity);
    
    const originalScrollX = this.scene.cameras.main.scrollX;
    const originalScrollY = this.scene.cameras.main.scrollY;
    
    this.scene.cameras.main.setScroll(
      originalScrollX + shakeX,
      originalScrollY + shakeY
    );
    
    // Retour progressif à la position normale
    this.scene.tweens.add({
      targets: this.scene.cameras.main,
      scrollX: originalScrollX,
      scrollY: originalScrollY,
      duration: 200,
      ease: 'Power2'
    });
  }

  /**
   * Spawn de particules d'impact
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {boolean} isFinisher - Si c'est un coup final (plus de particules)
   */
  spawnHitParticles(x, y, isFinisher = false) {
    const particleCount = isFinisher ? 20 : 10;
    const colors = isFinisher ? [0xffffff, 0xff0000, 0xffff00] : [0xffffff, 0xffaaaa];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.rectangle(
        x, y, 4, 4, 
        colors[Math.floor(Math.random() * colors.length)]
      );
      particle.setDepth(50);
      
      // Direction aléatoire
      const angle = Math.random() * Math.PI * 2;
      const speed = isFinisher ? 200 + Math.random() * 100 : 100 + Math.random() * 50;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Animation de particule
      this.scene.tweens.add({
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

  /**
   * Affiche un texte flottant de combo
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} text - Texte à afficher
   * @param {boolean} isFinisher - Si c'est un finisher (style différent)
   */
  showComboText(x, y, text, isFinisher = false) {
    const fontSize = isFinisher ? '48px' : '32px';
    const color = isFinisher ? '#ffff00' : '#ffffff';
    const strokeColor = isFinisher ? '#ff0000' : '#000000';
    
    const comboText = this.scene.add.text(x, y, text, {
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
    this.scene.tweens.add({
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

  /**
   * Crée la texture de particule (si nécessaire)
   */
  createParticleTexture() {
    if (this.scene.textures.exists('particle')) return;
    
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }

  /**
   * Nettoie les ressources du manager
   */
  destroy() {
    if (this.slowMotionTimer) {
      this.slowMotionTimer.remove();
    }
    if (this.slowMotionOverlay) {
      this.slowMotionOverlay.destroy();
    }
  }
}
