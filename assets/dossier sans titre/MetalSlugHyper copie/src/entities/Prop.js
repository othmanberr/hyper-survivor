import Phaser from 'phaser';

export default class Prop extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'crate') {
    // Utiliser un sprite simple (carré marron) si pas d'asset
    super(scene, x, y, null);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    this.type = type;
    
    // Créer un sprite graphique simple (carré marron)
    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(0x8B4513); // Marron
    this.graphics.fillRect(0, 0, 40, 40);
    this.graphics.lineStyle(2, 0x654321); // Bordure plus foncée
    this.graphics.strokeRect(0, 0, 40, 40);
    this.graphics.generateTexture('prop-crate', 40, 40);
    this.graphics.destroy();
    
    // Utiliser la texture générée
    this.setTexture('prop-crate');
    
    // Physique
    this.setCollideWorldBounds(false);
    this.body.setSize(40, 40);
    this.body.setOffset(0, 0);
    this.body.setImmovable(true); // Ne bouge pas quand touché
    this.body.setAllowGravity(false);
    
    // Stats
    this.maxHealth = 3;
    this.health = this.maxHealth;
    this.isDead = false;
    this.isTakingDamage = false; // Flag pour éviter les appels multiples
    
    // Visuel
    this.setDepth(2);
    this.setOrigin(0.5, 0.5);
    
    // L'overlap sera créé dans GameScene.js après la création du joueur
  }
  
  takeDamage(amount) {
    if (this.isDead || this.isTakingDamage) return;
    
    this.isTakingDamage = true;
    this.health -= amount;
    
    // Sauvegarder les coordonnées avant le shake
    const originalX = this.x;
    const originalY = this.y;
    
    // Flash blanc + Shake
    this.setTint(0xffffff);
    this.scene.tweens.add({
      targets: this,
      x: originalX + Phaser.Math.Between(-5, 5),
      y: originalY + Phaser.Math.Between(-5, 5),
      duration: 100,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        if (this && !this.isDead) {
          this.x = originalX;
          this.y = originalY;
          this.clearTint();
          this.isTakingDamage = false;
        }
      }
    });
    
    // Retirer le tint après le flash
    this.scene.time.delayedCall(100, () => {
      if (this && !this.isDead) {
        this.clearTint();
        this.isTakingDamage = false;
      }
    });
    
    if (this.health <= 0) {
      // Sauvegarder les coordonnées avant destruction
      const destroyX = this.x;
      const destroyY = this.y;
      this.destroy(destroyX, destroyY);
    } else {
      // Réinitialiser le flag après un court délai
      this.scene.time.delayedCall(150, () => {
        if (this && !this.isDead) {
          this.isTakingDamage = false;
        }
      });
    }
  }
  
  destroy(destroyX = null, destroyY = null) {
    if (this.isDead) return;
    this.isDead = true;
    
    // Sauvegarder les coordonnées avant destruction
    const finalX = destroyX !== null ? destroyX : this.x;
    const finalY = destroyY !== null ? destroyY : this.y;
    
    // Explosion de particules (débris)
    this._spawnDestructionParticles(finalX, finalY);
    
    // Loot garanti
    this._spawnLoot(finalX, finalY);
    
    // Détruire le sprite
    super.destroy();
  }
  
  _spawnDestructionParticles(x, y) {
    // Créer des particules de débris
    const particleCount = 15;
    const colors = [0x8B4513, 0x654321, 0xA0522D]; // Différentes nuances de marron
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.rectangle(
        x, 
        y, 
        3, 
        3, 
        colors[Math.floor(Math.random() * colors.length)]
      );
      particle.setDepth(50);
      
      // Direction aléatoire
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Animation de particule
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx * 0.5,
        y: particle.y + vy * 0.5,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          if (particle && particle.active) {
            particle.destroy();
          }
        }
      });
    }
  }
  
  _spawnLoot(x, y) {
    // Loot garanti : Soin (30%) ou Score (70%)
    const isHealth = Math.random() < 0.3;
    
    // Sauvegarder les références nécessaires
    const scene = this.scene;
    const player = scene.player;
    
    let loot;
    
    if (isHealth) {
      // COEUR pour le soin : Créer un coeur visuel
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xff0000); // Rouge
      graphics.fillCircle(0, 0, 12);
      graphics.fillStyle(0xff6666); // Rouge clair pour le centre
      graphics.fillCircle(0, 0, 8);
      graphics.generateTexture('heart-loot', 24, 24);
      graphics.destroy();
      
      loot = scene.add.image(x, y, 'heart-loot');
      loot.setDepth(5);
      loot.setScale(0.8);
      
      // Animation de pulsation pour le coeur
      scene.tweens.add({
        targets: loot,
        scale: { from: 0.8, to: 1.0 },
        duration: 300,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    } else {
      // ÉTOILE pour le score : Créer une étoile visuelle
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xffff00); // Jaune
      graphics.fillCircle(0, 0, 10);
      graphics.fillStyle(0xffaa00); // Orange pour le centre
      graphics.fillCircle(0, 0, 6);
      graphics.generateTexture('star-loot', 20, 20);
      graphics.destroy();
      
      loot = scene.add.image(x, y, 'star-loot');
      loot.setDepth(5);
      loot.setScale(0.8);
      
      // Animation de rotation pour l'étoile
      scene.tweens.add({
        targets: loot,
        rotation: Math.PI * 2,
        duration: 1000,
        repeat: -1,
        ease: 'Linear'
      });
    }
    
    // Animation de flottement vers le haut
    scene.tweens.add({
      targets: loot,
      y: loot.y - 40,
      alpha: 0,
      scale: 0.3,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        try {
          if (isHealth && player && player.active) {
            player.heal(20); // Soigne 20 HP
          } else if (scene.addScore && typeof scene.addScore === 'function') {
            scene.addScore(50); // Bonus de score
          }
        } catch (error) {
          console.error('[PROP] Erreur lors du spawn du loot:', error);
        }
        if (loot && loot.active) {
          loot.destroy();
        }
      }
    });
  }
}

