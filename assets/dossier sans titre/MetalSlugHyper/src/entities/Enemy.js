import Phaser from 'phaser';
import spawnHitSpark from '../fx/hitSpark.js';

const ENEMY_CONFIG = {
  punk: {
    key: 'enemy-punk',
    path: '/enemies/punk',
    animations: {
      idle: { dir: 'idle', prefix: 'idle', frames: 4, frameRate: 6, repeat: -1 },
      walk: { dir: 'walk', prefix: 'walk', frames: 4, frameRate: 8, repeat: -1 },
      attack: { dir: 'attack', prefix: 'punch', frames: 3, frameRate: 6, repeat: 0 },
      hurt: { dir: 'hurt', prefix: 'hurt', frames: 4, frameRate: 6, repeat: 0 },
    },
    speed: 110,
    health: 1, // One-hit kill
    damage: 14,
    attackRange: 70,
    attackCooldown: 1500, // Réduit la vitesse d'attaque (augmenté de 900 à 1500)
    attackType: 'melee',
    aiType: 'CHASER', // Type d'IA : fonce sur le joueur
  },
  brute: {
    key: 'enemy-brute',
    path: '/enemies/punk', // Réutilise les assets punk
    animations: {
      idle: { dir: 'idle', prefix: 'idle', frames: 4, frameRate: 6, repeat: -1 },
      walk: { dir: 'walk', prefix: 'walk', frames: 4, frameRate: 8, repeat: -1 },
      attack: { dir: 'attack', prefix: 'punch', frames: 3, frameRate: 6, repeat: 0 },
      hurt: { dir: 'hurt', prefix: 'hurt', frames: 4, frameRate: 6, repeat: 0 },
    },
    speed: 60, // Plus lent
    health: 1, // One-hit kill
    damage: 22, // Frappe plus fort
    attackRange: 80,
    attackCooldown: 2200, // Attaque plus lentement
    attackType: 'melee',
    scale: 1.3, // Plus gros
    tint: 0x8b4513, // Couleur brune pour le différencier
  },
  elite: {
    key: 'enemy-elite',
    path: '/bosses/tako', // Utilise les assets du boss
    animations: {
      idle: { dir: 'idle', prefix: 'idle', frames: 4, frameRate: 6, repeat: -1 },
      walk: { dir: 'walk', prefix: 'walk', frames: 6, frameRate: 6, repeat: -1 },
      attack: { dir: 'smash', prefix: 'smash', frames: 6, frameRate: 6, repeat: 0 },
      hurt: { dir: 'hurt', prefix: 'frame', frames: 4, frameRate: 6, repeat: 0 },
    },
    speed: 90,
    health: 1, // One-hit kill (Type Élite mais même PV)
    damage: 18,
    attackRange: 100,
    attackCooldown: 1800,
    attackType: 'melee',
    aiType: 'CHASER', // Type d'IA : fonce sur le joueur
    // Taille normale (pas de scale)
  },
  sniper: {
    key: 'enemy-sniper',
    path: '/enemies/sniper',
    animations: {
      idle: { dir: 'idle', prefix: 'long-tail-idle', frames: 4, frameRate: 6, repeat: -1 },
      walk: { dir: 'walk', prefix: 'long-hair-walk', frames: 8, frameRate: 8, repeat: -1 },
      attack: { dir: 'attack', prefix: 'long-hair-kick', frames: 6, frameRate: 6, repeat: 0 },
      hurt: { dir: 'hurt', prefix: 'long-hair-hurt', frames: 4, frameRate: 6, repeat: 0 },
    },
    speed: 100,
    health: 1,
    damage: 16,
    attackRange: 300, // Distance de tir
    attackCooldown: 3000, // Toutes les 3 secondes
    attackType: 'projectile',
    aiType: 'SNIPER', // Type d'IA : garde distance et tire
    projectile: {
      key: 'enemy-bullet',
      speed: 400,
      damage: 14,
    },
  },
  tank: {
    key: 'enemy-tank',
    path: '/enemies/punk', // Réutilise les assets punk
    animations: {
      idle: { dir: 'idle', prefix: 'idle', frames: 4, frameRate: 6, repeat: -1 },
      walk: { dir: 'walk', prefix: 'walk', frames: 4, frameRate: 8, repeat: -1 },
      attack: { dir: 'attack', prefix: 'punch', frames: 3, frameRate: 6, repeat: 0 },
      hurt: { dir: 'hurt', prefix: 'hurt', frames: 4, frameRate: 6, repeat: 0 },
    },
    speed: 50, // Très lent
    health: 1,
    damage: 20, // Frappe fort
    attackRange: 70,
    attackCooldown: 2000,
    attackType: 'melee',
    aiType: 'TANK', // Type d'IA : lent, immunisé au knockback
    scale: 1.2, // Légèrement plus gros
    tint: 0x666666, // Gris pour le différencier
  },
};

export function preloadEnemies(scene) {
  Object.values(ENEMY_CONFIG).forEach((config) => {
    Object.entries(config.animations).forEach(([name, anim]) => {
      for (let i = 1; i <= anim.frames; i += 1) {
        const key = `${config.key}-${name}-${i}`;
        scene.load.image(key, `${config.path}/${anim.dir}/${anim.prefix}${i}.png`);
      }
    });
  });
}

export function createEnemyAnimations(scene) {
  Object.values(ENEMY_CONFIG).forEach((config) => {
    Object.entries(config.animations).forEach(([name, anim]) => {
      const frames = Array.from({ length: anim.frames }, (_, idx) => ({
        key: `${config.key}-${name}-${idx + 1}`,
      }));

      const animKey = `${config.key}-${name}`;
      if (scene.anims.exists(animKey)) return;

      scene.anims.create({
        key: animKey,
        frames,
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    });
  });
}

export function spawnEnemy(scene, type, x, y) {
  const config = ENEMY_CONFIG[type];
  if (!config) {
    throw new Error(`Unknown enemy type: ${type}`);
  }

  return new Enemy(scene, x, y, config);
}

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, `${config.key}-idle-1`);
    this.scene = scene;
    this.config = config;
    this.health = config.health;
    this.isDead = false;
    this.isHit = false; // Flag anti-spam pour éviter les hits multiples
    this.isTakingDamage = false; // Flag pour éviter les appels multiples de takeDamage
    this.lastAttackTime = 0;
    this.isAttacking = false;
    
    // Type d'IA (par défaut chaser si non spécifié)
    this.aiType = config.aiType || 'chaser';
    
    // Variables spécifiques au SNIPER/SHOOTER
    this.lastShotTime = 0;
    this.isCharging = false;
    this.chargeTimer = null;
    
    // Variables spécifiques au DASHER
    this.lastDashTime = 0;
    this.isDashing = false;
    this.dashDirection = { x: 0, y: 0 };

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setDepth(1);
    
    // Appliquer le scale si défini (pour le Brute)
    if (config.scale) {
      this.setScale(config.scale);
      this.body.setSize(48 * config.scale, 70 * config.scale);
      this.body.setOffset(20 * config.scale, 5 * config.scale);
    } else {
      this.body.setSize(48, 70);
      this.body.setOffset(20, 5);
    }
    
    // Appliquer le tint si défini (pour le Brute)
    if (config.tint) {
      this.setTint(config.tint);
    }
    
    // Ombre 2.5D (reste au sol)
    const shadowSize = config.scale ? 40 * config.scale : 40;
    const shadowHeight = config.scale ? 15 * config.scale : 15;
    this.shadow = scene.add.ellipse(x, y + 35, shadowSize, shadowHeight, 0x000000, 0.3);
    this.shadow.setDepth(0);
    this.baseY = y; // Position Y de base pour l'ombre

    this.play(`${this.config.key}-idle`);
  }

  face(targetX) {
    this.setFlipX(targetX > this.x);
  }

  update(player, time) {
    if (this.isDead || !player) return;
    
    if (this.scene && typeof this.scene._clampSpriteToRoad === 'function') {
      this.scene._clampSpriteToRoad(this);
    }
    
    // FREEZE COMPLET : Si le jeu est en pause, ne pas exécuter la logique
    if (this.scene && this.scene.isGamePaused) {
      return;
    }
    
    // Mettre à jour l'ombre (reste au sol, suit la position X et Y de profondeur)
    if (this.shadow) {
      this.shadow.x = this.x;
      this.shadow.y = this.y + 35; // Toujours au sol par rapport à l'ennemi
    }

    const targetX = player.x;
    const targetY = player.y; // Suivre aussi en profondeur (Y)
    this.face(targetX);

    if (this.isAttacking || this.isCharging) {
      this.setVelocityX(0);
      this.setVelocityY(0);
      return;
    }

    // Distance 2D pour le mouvement
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    
    // COMPORTEMENT SELON LE TYPE D'IA (switch pour gérer tous les types)
    const aiTypeLower = (this.aiType || 'chaser').toLowerCase();
    
    switch(aiTypeLower) {
      case 'shooter':
        this._updateShooterAI(player, time, distance);
        break;
      case 'chaser':
        this._updateChaserAI(player, time, distance);
        break;
      case 'tank':
        this._updateTankAI(player, time, distance);
        break;
      case 'dasher':
        this._updateDasherAI(player, time, distance);
        break;
      case 'turret':
        this._updateTurretAI(player, time, distance);
        break;
      case 'sniper': // Ancien nom, compatibilité
        this._updateSniperAI(player, time, distance);
        break;
      default:
        // CHASER par défaut
        this._updateChaserAI(player, time, distance);
    }
  }
  
  _updateChaserAI(player, time, distance) {
    // Comportement original : fonce sur le joueur
    if (distance > this.config.attackRange) {
      // Mouvement horizontal
      const dirX = player.x < this.x ? -1 : 1;
      this.setVelocityX(dirX * this.config.speed);
      
      // Mouvement vertical (profondeur) - suit le joueur
      const dirY = player.y < this.y ? -1 : 1;
      this.setVelocityY(dirY * this.config.speed * 0.8);
      
      this.play(`${this.config.key}-walk`, true);
    } else {
      this.setVelocityX(0);
      this.setVelocityY(0);
      this.tryAttack(player, time, distance);
    }
  }
  
  _updateSniperAI(player, time, distance) {
    // SNIPER : Garde distance de 300px, recule si approché (mais reste dans le cadre), tire toutes les 3 secondes
    const idealDistance = 300;
    
    // Récupérer les limites du monde
    const worldBounds = this.scene.physics.world.bounds;
    const margin = 60; // Marge de sécurité pour ne pas sortir
    
    // Vérifier si on est proche des bords
    const nearLeftEdge = this.x <= worldBounds.x + margin;
    const nearRightEdge = this.x >= worldBounds.width - margin;
    const nearTopEdge = this.y <= worldBounds.y + margin;
    const nearBottomEdge = this.y >= worldBounds.height - margin;
    
    if (distance < idealDistance - 50) {
      // Trop proche : reculer MAIS seulement si on ne sort pas du cadre
      const dirX = player.x < this.x ? 1 : -1; // Direction opposée (reculer)
      const dirY = player.y < this.y ? 1 : -1;
      
      // Si on est déjà au bord, ne pas reculer dans cette direction
      if ((nearLeftEdge && dirX < 0) || (nearRightEdge && dirX > 0)) {
        this.setVelocityX(0);
      } else {
        this.setVelocityX(dirX * this.config.speed);
      }
      
      if ((nearTopEdge && dirY < 0) || (nearBottomEdge && dirY > 0)) {
        this.setVelocityY(0);
      } else {
        this.setVelocityY(dirY * this.config.speed * 0.8);
      }
      
      this.play(`${this.config.key}-walk`, true);
    } else if (distance > idealDistance + 50) {
      // Trop loin : s'approcher un peu (mais rester dans le cadre)
      const dirX = player.x < this.x ? -1 : 1;
      const dirY = player.y < this.y ? -1 : 1;
      
      // Si on est au bord, ne pas s'approcher dans cette direction
      if ((nearLeftEdge && dirX < 0) || (nearRightEdge && dirX > 0)) {
        this.setVelocityX(0);
      } else {
        this.setVelocityX(dirX * this.config.speed * 0.5);
      }
      
      if ((nearTopEdge && dirY < 0) || (nearBottomEdge && dirY > 0)) {
        this.setVelocityY(0);
      } else {
        this.setVelocityY(dirY * this.config.speed * 0.4);
      }
      
      this.play(`${this.config.key}-walk`, true);
    } else {
      // Distance idéale : s'arrêter
      this.setVelocityX(0);
      this.setVelocityY(0);
      this.play(`${this.config.key}-idle`, true);
    }
    
    // Sécurité : Forcer le respect des limites du monde (correction immédiate)
    if (this.x < worldBounds.x + margin) {
      this.x = worldBounds.x + margin;
      this.setVelocityX(0);
    } else if (this.x > worldBounds.width - margin) {
      this.x = worldBounds.width - margin;
      this.setVelocityX(0);
    }
    
    if (this.y < worldBounds.y + margin) {
      this.y = worldBounds.y + margin;
      this.setVelocityY(0);
    } else if (this.y > worldBounds.height - margin) {
      this.y = worldBounds.height - margin;
      this.setVelocityY(0);
    }
    
    // Tir toutes les 3 secondes
    if (time >= this.lastShotTime + this.config.attackCooldown) {
      this._startSniperCharge(player, time);
    }
  }
  
  _updateTankAI(player, time, distance) {
    // TANK : Très lent, mais fonce quand même
    // Immunisé au knockback (body.immovable = true temporairement)
    if (!this.body.immovable) {
      this.body.setImmovable(true);
    }
    
    if (distance > this.config.attackRange) {
      const dirX = player.x < this.x ? -1 : 1;
      const dirY = player.y < this.y ? -1 : 1;
      this.setVelocityX(dirX * this.config.speed);
      this.setVelocityY(dirY * this.config.speed * 0.8);
      this.play(`${this.config.key}-walk`, true);
    } else {
      this.setVelocityX(0);
      this.setVelocityY(0);
      this.tryAttack(player, time, distance);
    }
  }
  
  _updateShooterAI(player, time, distance) {
    // SHOOTER : Reste à distance (300px) et tire
    const idealDistance = this.config.attackRange || 300;
    
    if (distance < idealDistance - 50) {
      // Trop proche : reculer
      const dirX = player.x < this.x ? 1 : -1;
      const dirY = player.y < this.y ? 1 : -1;
      this.setVelocityX(dirX * this.config.speed * 0.7);
      this.setVelocityY(dirY * this.config.speed * 0.6);
      this.play(`${this.config.key}-walk`, true);
    } else if (distance > idealDistance + 50) {
      // Trop loin : s'approcher un peu
      const dirX = player.x < this.x ? -1 : 1;
      const dirY = player.y < this.y ? -1 : 1;
      this.setVelocityX(dirX * this.config.speed * 0.5);
      this.setVelocityY(dirY * this.config.speed * 0.4);
      this.play(`${this.config.key}-walk`, true);
    } else {
      // Distance idéale : s'arrêter et tirer
      this.setVelocityX(0);
      this.setVelocityY(0);
      this.play(`${this.config.key}-idle`, true);
    }
    
    // Tir toutes les X secondes
    if (time >= this.lastShotTime + (this.config.attackCooldown || 2000)) {
      this._startSniperCharge(player, time);
    }
  }
  
  _updateDasherAI(player, time, distance) {
    // DASHER : Fait des pointes de vitesse brusques vers le joueur
    const dashSpeed = this.config.dashSpeed || 250;
    const dashCooldown = this.config.dashCooldown || 3000;
    
    // Vérifier si on peut faire un dash
    if (!this.isDashing && time >= this.lastDashTime + dashCooldown && distance > 150) {
      // Lancer un dash vers le joueur
      this.isDashing = true;
      this.lastDashTime = time;
      
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.dashDirection.x = (dx / dist) * dashSpeed;
        this.dashDirection.y = (dy / dist) * dashSpeed * 0.8;
        
        this.setVelocityX(this.dashDirection.x);
        this.setVelocityY(this.dashDirection.y);
        
        // Arrêter le dash après 400ms
        this.scene.time.delayedCall(400, () => {
          if (this.active && !this.isDead) {
            this.isDashing = false;
            this.setVelocityX(0);
            this.setVelocityY(0);
          }
        });
      }
    }
    
    // Si on n'est pas en train de dasher, mouvement normal
    if (!this.isDashing) {
      if (distance > this.config.attackRange) {
        const dirX = player.x < this.x ? -1 : 1;
        const dirY = player.y < this.y ? -1 : 1;
        this.setVelocityX(dirX * this.config.speed);
        this.setVelocityY(dirY * this.config.speed * 0.8);
        this.play(`${this.config.key}-walk`, true);
      } else {
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.tryAttack(player, time, distance);
      }
    } else {
      // Pendant le dash, continuer l'animation de marche
      this.play(`${this.config.key}-walk`, true);
    }
  }
  
  _updateTurretAI(player, time, distance) {
    // TURRET : Ne bouge pas (velocity = 0), tire en éventail
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.play(`${this.config.key}-idle`, true);
    
    // Tir en éventail toutes les X secondes
    if (time >= this.lastShotTime + (this.config.attackCooldown || 1800)) {
      this._fireFanProjectiles(player, time);
    }
  }
  
  _fireFanProjectiles(player, time) {
    if (!this.config.projectile || !this.scene) return;
    
    this.lastShotTime = time;
    const projectileCount = this.config.projectileCount || 3;
    const angleSpread = 60; // Degrés d'écart entre chaque projectile
    
    // Angle de base (vers le joueur)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Calculer l'angle de départ (angle de base - spread/2)
    const startAngle = baseAngle - (angleSpread * (projectileCount - 1)) / 2;
    
    for (let i = 0; i < projectileCount; i++) {
      const angle = (startAngle + i * angleSpread) * (Math.PI / 180);
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      
      // Créer un projectile
      const projectile = this.scene.add.rectangle(this.x, this.y, 10, 10, 0xff0000);
      this.scene.physics.add.existing(projectile);
      projectile.body.setAllowGravity(false);
      projectile.setDepth(3);
      
      // Vitesse du projectile
      const speed = this.config.projectile.speed || 400;
      projectile.body.setVelocity(directionX * speed, directionY * speed);
      
      // Détruire après un certain temps
      this.scene.time.delayedCall(3000, () => {
        if (projectile && projectile.active) {
          projectile.destroy();
        }
      });
      
      // Collision avec le joueur
      this.scene.physics.add.overlap(
        projectile,
        this.scene.player,
        (proj, player) => {
          if (player && !player.invulnerable) {
            player.takeDamage(this.config.projectile.damage || this.config.damage);
          }
          if (proj && proj.active) {
            proj.destroy();
          }
        },
        null,
        this.scene
      );
    }
  }
  
  _startSniperCharge(player, time) {
    if (this.isCharging) return;
    
    this.isCharging = true;
    this.lastShotTime = time;
    
    // Clignotement (charge)
    let flashCount = 0;
    const maxFlashes = 6;
    const flashInterval = 100;
    
    this.chargeTimer = this.scene.time.addEvent({
      delay: flashInterval,
      repeat: maxFlashes - 1,
      callback: () => {
        if (this.isDead || !this.active) {
          this.chargeTimer.destroy();
          return;
        }
        flashCount++;
        if (flashCount % 2 === 0) {
          this.setTint(0xffff00); // Jaune
        } else {
          this.clearTint();
        }
        
        if (flashCount >= maxFlashes) {
          // Tirer le projectile
          this._fireProjectile(player);
          this.isCharging = false;
          this.clearTint();
        }
      }
    });
  }
  
  _fireProjectile(player) {
    if (!this.config.projectile || !this.scene) return;
    
    // Créer un projectile simple (ligne droite vers le joueur)
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const directionX = dx / distance;
    const directionY = dy / distance;
    
    // Créer un sprite de projectile simple
    const projectile = this.scene.add.rectangle(this.x, this.y, 8, 8, 0xff0000);
    this.scene.physics.add.existing(projectile);
    projectile.body.setAllowGravity(false);
    projectile.setDepth(3);
    
    // Vitesse du projectile
    const speed = this.config.projectile.speed;
    projectile.body.setVelocity(directionX * speed, directionY * speed);
    
    // Détruire après un certain temps
    this.scene.time.delayedCall(3000, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });
    
    // Collision avec le joueur
    this.scene.physics.add.overlap(
      projectile,
      this.scene.player,
      (proj, player) => {
        if (player && !player.invulnerable) {
          player.takeDamage(this.config.projectile.damage);
        }
        if (proj && proj.active) {
          proj.destroy();
        }
      },
      null,
      this.scene
    );
  }

  tryAttack(player, time, distance) {
    if (time < this.lastAttackTime + this.config.attackCooldown) {
      this.play(`${this.config.key}-idle`, true);
      return;
    }

    this.lastAttackTime = time;
    this.play(`${this.config.key}-attack`, true);
    this.isAttacking = true;
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
    });

    if (this.config.attackType === 'melee') {
      const dir = player.x < this.x ? -1 : 1;
      this.scene.tweens.add({
        targets: this,
        x: this.x + dir * 18,
        duration: 120,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
      this.scene.time.delayedCall(220, () => {
        if (!this.scene || this.isDead) return;
        const currentDistance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (currentDistance <= this.config.attackRange + 10) {
          player.takeDamage(this.config.damage);
        }
      });
    } else {
      this.scene.time.delayedCall(260, () => {
        if (!this.scene || this.isDead) return;
        this.scene.spawnEnemyProjectile(this, this.config.projectile);
      });
    }
  }

  takeDamage(amount, sourceX = null) {
    // SÉCURITÉ : Vérifications critiques pour éviter les freezes
    if (!this || !this.active || this.isDead) return;
    if (!this.scene || !this.scene.scene) return; // Vérifier que la scène existe
    
    // Protection contre les appels multiples simultanés
    if (this.isTakingDamage) return;
    this.isTakingDamage = true;
    
    this.health -= amount;

    // LOGIQUE STRICTE : Animation de mort SEULEMENT si PV <= 0
    if (this.health <= 0) {
      this.isTakingDamage = false; // Réinitialiser avant de mourir
      this.die();
      return;
    }

    // TANK : Pas de flash ni de knockback
    if (this.aiType === 'TANK') {
      // Le tank encaisse sans réaction visuelle ni physique
      return;
    }

    // Si PV > 0 : juste knockback + flash, reste debout
    // Ne pas jouer l'animation hurt si on veut qu'il reste debout
    // this.play(`${this.config.key}-hurt`, true); // Désactivé pour rester debout
    
    // Clignotement en rouge (Game Feel) - SAUF pour TANK
    try {
      if (this._applyHitFlash && typeof this._applyHitFlash === 'function') {
        this._applyHitFlash();
      }
    } catch (error) {
      console.warn('[ENEMY] Erreur dans _applyHitFlash:', error);
    }

    // Particules d'impact (avec protection)
    try {
      const impactX = sourceX !== null && isFinite(sourceX) ? sourceX : this.x;
      if (this.scene && spawnHitSpark) {
        spawnHitSpark(this.scene, (impactX + this.x) / 2, this.y - 40, {
          color: 0xfff5c6,
          width: 28,
        });
      }
    } catch (error) {
      console.warn('[ENEMY] Erreur dans spawnHitSpark:', error);
    }

    // Knockback amélioré (direction opposée au coup) - glisse au sol
    // TANK : Immunisé au knockback
    if (sourceX !== null && isFinite(sourceX) && this.aiType !== 'TANK' && this.body && this.body.enable) {
      try {
        const knockDir = this.x < sourceX ? -1 : 1;
        const knockbackForce = 180;
        this.setVelocityX(knockDir * -knockbackForce);
        
        // Réduire progressivement le knockback avec un timer
        let currentVelocity = knockDir * -knockbackForce;
        const deceleration = knockbackForce / 10; // 10 étapes pour réduire à 0
        const decelTimer = this.scene.time.addEvent({
          delay: 20,
          repeat: 10,
          callback: () => {
            if (this.isDead || !this.active || !this.body) {
              if (decelTimer) decelTimer.destroy();
              return;
            }
            currentVelocity = Math.abs(currentVelocity) > deceleration 
              ? currentVelocity + (knockDir * deceleration)
              : 0;
            this.setVelocityX(currentVelocity);
            if (Math.abs(currentVelocity) < 5) {
              this.setVelocityX(0);
              if (decelTimer) decelTimer.destroy();
            }
          }
        });
      } catch (error) {
        console.warn('[ENEMY] Erreur dans le knockback:', error);
      }
    }
    
    // Réinitialiser le flag après un court délai
    this.scene.time.delayedCall(100, () => {
      if (this && this.active) {
        this.isTakingDamage = false;
      }
    });
  }
  
  _applyHitFlash() {
    // Clignotement en rouge puis retour à la normale
    this.setTint(0xff0000);
    
    // Clignoter plusieurs fois pour un effet visuel plus impactant
    let flashCount = 0;
    const maxFlashes = 3;
    const flashInterval = 50;
    
    const flashTimer = this.scene.time.addEvent({
      delay: flashInterval,
      repeat: maxFlashes - 1,
      callback: () => {
        flashCount++;
        if (flashCount % 2 === 0) {
          this.setTint(0xff0000);
        } else {
          this.clearTint();
        }
      },
      callbackScope: this
    });
    
    // S'assurer de revenir à la normale après tous les clignotements
    this.scene.time.delayedCall(flashInterval * maxFlashes + 20, () => {
      if (this.scene && this.active && !this.isDead) {
        this.clearTint();
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isHit = false; // Réinitialiser le flag lors de la mort
    this.isTakingDamage = false; // Réinitialiser le flag de dégâts
    
    // Nettoyer le timer de reset du flag isHit
    if (this._hitResetTimer && this._hitResetTimer.destroy) {
      this._hitResetTimer.destroy();
      this._hitResetTimer = null;
    }
    
    this.setVelocity(0, 0);
    this.anims.stop();
    
    // VFX de particules pour la mort (explosion de pixels)
    this._createDeathParticles();
    
    // Animation de mort avec fade-out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 20,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.disableBody(true, true);
        this.emit('enemy-dead', this);
        // Détruire après un court délai pour laisser les particules s'afficher
        this.scene.time.delayedCall(300, () => {
          if (this.active) {
            this.destroy();
          }
        });
      }
    });
    
    // Légère rotation pour l'effet de chute
    this.scene.tweens.add({
      targets: this,
      angle: this.flipX ? -90 : 90,
      duration: 400,
      ease: 'Power2'
    });
  }
  
  _createDeathParticles() {
    if (!this.scene) return;
    
    // Créer la texture de particule si elle n'existe pas
    if (!this.scene.textures.exists('death-particle')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(0, 0, 3);
      graphics.generateTexture('death-particle', 6, 6);
      graphics.destroy();
    }
    
    // Créer un émetteur de particules "juicy" pour l'effet de mort
    const particles = this.scene.add.particles(this.x, this.y, 'death-particle', {
      speed: { min: 120, max: 280 },
      scale: { start: 1.5, end: 0 },
      lifespan: { min: 400, max: 700 },
      quantity: 30, // Plus de particules pour un effet plus impactant
      tint: [0xff0000, 0xff3300, 0xff6600, 0xff9900, 0xffff00, 0xffffff], // Dégradé rouge-orange-jaune-blanc
      emitZone: { 
        type: 'edge', 
        source: new Phaser.Geom.Circle(0, 0, 30), 
        quantity: 30 
      },
      gravityY: 150, // Gravité pour faire tomber les particules
      blendMode: 'ADD', // Mode de fusion pour un effet plus lumineux
      frequency: -1, // Émission unique
      follow: null
    });
    
    // Démarrer l'émission (une seule fois, explosion rapide)
    particles.explode(30, this.x, this.y);
    
    // Arrêter et détruire après un court délai
    this.scene.time.delayedCall(800, () => {
      if (particles && particles.active) {
        particles.destroy();
      }
    });
    
    // Effet de flash lumineux au moment de la mort
    const flash = this.scene.add.rectangle(this.x, this.y, 100, 100, 0xffffff, 0.8);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    flash.setDepth(50);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 150,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }
}

