import Phaser from 'phaser';
import spawnHitSpark from '../fx/hitSpark.js';

const BOSS_CONFIG = {
  tako: {
    key: 'boss-tako',
    path: '/bosses/tako',
    animations: {
      idle: { dir: 'idle', prefix: 'idle', frames: 4, frameRate: 6, repeat: -1 },
      walk: { dir: 'walk', prefix: 'walk', frames: 6, frameRate: 6, repeat: -1 },
      smash: { dir: 'smash', prefix: 'smash', frames: 6, frameRate: 6, repeat: 0 },
      hurt: { dir: 'hurt', prefix: 'frame', frames: 4, frameRate: 6, repeat: 0 },
    },
    speed: 70,
    health: 750,
    damage: 26,
    attackCooldown: 1800,
    smashRadius: 150,
  },
};

export function preloadBosses(scene) {
  Object.values(BOSS_CONFIG).forEach((config) => {
    Object.entries(config.animations).forEach(([name, anim]) => {
      for (let i = 1; i <= anim.frames; i += 1) {
        const key = `${config.key}-${name}-${i}`;
        scene.load.image(key, `${config.path}/${anim.dir}/${anim.prefix}${i}.png`);
      }
    });
  });
}

export function createBossAnimations(scene) {
  Object.values(BOSS_CONFIG).forEach((config) => {
    Object.entries(config.animations).forEach(([name, anim]) => {
      const animKey = `${config.key}-${name}`;
      if (scene.anims.exists(animKey)) return;

      const frames = Array.from({ length: anim.frames }, (_, idx) => ({
        key: `${config.key}-${name}-${idx + 1}`,
      }));

      scene.anims.create({
        key: animKey,
        frames,
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    });
  });
}

export function spawnBoss(scene, type, x, y, overrides = {}) {
  const config = { ...BOSS_CONFIG[type], ...overrides };
  if (!config) {
    throw new Error(`Unknown boss type: ${type}`);
  }

  return new Boss(scene, x, y, config);
}

class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, `${config.key}-idle-1`);

    this.scene = scene;
    this.config = config;
    this.maxHealth = config.health;
    this.health = config.health;
    this.isDead = false;
    this.isHit = false; // Flag anti-spam pour éviter les hits multiples
    this.lastAttackTime = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Taille de base du body (sera ajustée après setScale)
    this.body.setSize(120, 150);
    this.body.setOffset(70, 40);

    this.setDepth(2);
    this.setCollideWorldBounds(true);

    this.play(`${config.key}-idle`);
  }
  
  // Méthode pour ajuster la physique après un setScale
  adjustBodyForScale(scale) {
    if (!this.body) return;
    
    // Dimensions de base du sprite
    const baseWidth = 120;
    const baseHeight = 150;
    const baseOffsetX = 70;
    const baseOffsetY = 40;
    
    // Nouvelles dimensions après scale
    const newWidth = baseWidth * scale;
    const newHeight = baseHeight * scale;
    
    // Ajuster la taille du body (utiliser 0.5 et 0.8 pour mieux coller au sprite)
    this.body.setSize(newWidth * 0.5, newHeight * 0.8);
    
    // Centrer l'offset
    const offsetX = (newWidth - (newWidth * 0.5)) / 2;
    const offsetY = (newHeight - (newHeight * 0.8)) / 2;
    this.body.setOffset(offsetX, offsetY);
    
    // Activer la physique
    this.body.enable = true;
    this.body.setImmovable(true);
    this.body.setCollideWorldBounds(true);
  }

  update(player, time) {
    if (this.isDead || !player) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    
    // Si le joueur est loin, avancer vers lui
    if (distance > this.config.smashRadius * 0.8) {
      const dir = player.x < this.x ? -1 : 1;
      this.setFlipX(dir < 0);
      
      // Avancer lentement vers le joueur (IA)
      const speed = this.config.speed || 50;
      this.setVelocityX(dir * speed);
      
      // Animation de marche si disponible
      if (this.anims.exists(`${this.config.key}-walk`)) {
        this.play(`${this.config.key}-walk`, true);
      } else {
        // Sinon, utiliser moveToObject pour un mouvement fluide
        this.scene.physics.moveToObject(this, player, speed);
      }
      return;
    }

    // Si proche, s'arrêter et attaquer
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.setFlipX(player.x < this.x);

    if (time >= this.lastAttackTime + this.config.attackCooldown) {
      this.lastAttackTime = time;
      this.performSmash();
    } else {
      if (this.anims.exists(`${this.config.key}-idle`)) {
        this.play(`${this.config.key}-idle`, true);
      }
    }
  }

  performSmash() {
    this.play(`${this.config.key}-smash`, true);
    this.scene.time.delayedCall(400, () => {
      if (!this.scene || this.isDead) return;
      const player = this.scene.player;
      if (!player) return;

      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= this.config.smashRadius) {
        player.takeDamage(this.config.damage);
      }
    });
  }

  takeDamage(amount, sourceX = null) {
    if (this.isDead) return;
    this.health -= amount;
    this.play(`${this.config.key}-hurt`, true);
    
    // Émettre l'événement de changement de vie pour l'UI
    this.emit('boss-health-changed', { current: this.health, max: this.maxHealth });
    
    // Clignotement en rouge (Game Feel)
    this._applyHitFlash();

    const impactX = sourceX ?? this.x;
    spawnHitSpark(this.scene, (impactX + this.x) / 2, this.y - 70, {
      color: 0xfff1a6,
      width: 36,
    });

    // Knockback amélioré (direction opposée au coup)
    if (sourceX !== null) {
      const knockDir = this.x < sourceX ? -1 : 1;
      const knockbackForce = 120; // Moins fort que les ennemis normaux
      this.setVelocityX(knockDir * -knockbackForce);
      
      // Réduire progressivement le knockback avec un timer
      let currentVelocity = knockDir * -knockbackForce;
      const deceleration = knockbackForce / 8;
      const decelTimer = this.scene.time.addEvent({
        delay: 25,
        repeat: 8,
        callback: () => {
          if (this.isDead || !this.active) {
            decelTimer.destroy();
            return;
          }
          currentVelocity = Math.abs(currentVelocity) > deceleration 
            ? currentVelocity + (knockDir * deceleration)
            : 0;
          this.setVelocityX(currentVelocity);
          if (Math.abs(currentVelocity) < 5) {
            this.setVelocityX(0);
            decelTimer.destroy();
          }
        }
      });
    }

    if (this.health <= 0) {
      this.die();
    }
  }
  
  _applyHitFlash() {
    // Sauvegarder le tint original (or pour le final boss)
    const originalTint = this.tintTopLeft;
    
    // Clignotement en rouge puis retour à la normale
    this.setTint(0xff0000);
    
    // Clignoter plusieurs fois pour un effet visuel plus impactant
    let flashCount = 0;
    const maxFlashes = 4; // Plus de clignotements pour le boss
    const flashInterval = 60;
    
    const flashTimer = this.scene.time.addEvent({
      delay: flashInterval,
      repeat: maxFlashes - 1,
      callback: () => {
        flashCount++;
        if (flashCount % 2 === 0) {
          this.setTint(0xff0000);
        } else {
          // Restaurer le tint original (or si c'est le final boss)
          if (originalTint !== 0xffffff) {
            this.setTint(originalTint);
          } else {
            this.clearTint();
          }
        }
      },
      callbackScope: this
    });
    
    // S'assurer de revenir à la normale après tous les clignotements
    this.scene.time.delayedCall(flashInterval * maxFlashes + 30, () => {
      if (this.scene && this.active && !this.isDead) {
        // Restaurer le tint original
        if (originalTint !== 0xffffff) {
          this.setTint(originalTint);
        } else {
          this.clearTint();
        }
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isHit = false; // Réinitialiser le flag lors de la mort
    this.setVelocity(0, 0);
    this.anims.stop();
    
    // Animation de mort avec fade-out (plus dramatique pour le boss)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 40,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.disableBody(true, true);
        this.emit('boss-dead', this);
        this.destroy();
      }
    });
    
    // Rotation pour l'effet de chute
    this.scene.tweens.add({
      targets: this,
      angle: this.flipX ? -180 : 180,
      duration: 600,
      ease: 'Power2'
    });
  }
}

