import Phaser from 'phaser';
import spawnHitSpark from '../fx/hitSpark.js';

const ANIMATION_DEFINITION = {
  idle: { dir: 'idle', frameCount: 4, frameRate: 6, repeat: -1 },
  walk: { dir: 'walk', frameCount: 10, frameRate: 8, repeat: -1 },
  punch: { dir: 'punch', frameCount: 3, frameRate: 6, repeat: 0 },
  kick: { dir: 'kick', frameCount: 5, frameRate: 6, repeat: 0 },
  'jump-kick': { dir: 'jump-kick', frameCount: 3, frameRate: 6, repeat: 0 },
};

const ATTACK_DEFINITION = {
  punch: { damage: 1, range: 80, activeFrames: [2] }, // Frame 2 sur 3 (coup étendu)
  kick: { damage: 1, range: 90, activeFrames: [2, 3] }, // Frames 2-3 sur 5 (coup étendu)
  'jump-kick': { damage: 1, range: 100, activeFrames: [2] }, // Frame 2 sur 3 (coup étendu)
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  static preload(scene) {
    Object.entries(ANIMATION_DEFINITION).forEach(([name, config]) => {
      for (let i = 1; i <= config.frameCount; i += 1) {
        const key = Player.frameKey(name, i);
        scene.load.image(key, `/${config.dir}/${config.dir.replace('-', '')}${i}.png`);
      }
    });
  }

  static createAnimations(scene) {
    Object.entries(ANIMATION_DEFINITION).forEach(([name, config]) => {
      const frames = [];
      for (let i = 1; i <= config.frameCount; i += 1) {
        frames.push({ key: Player.frameKey(name, i) });
      }

      scene.anims.create({
        key: Player.animKey(name),
        frames,
        frameRate: config.frameRate,
        repeat: config.repeat,
      });
    });
  }

  static frameKey(name, index) {
    return `player-${name}-${index}`;
  }

  static animKey(name) {
    return `player-${name}`;
  }

  constructor(scene, x, y) {
    super(scene, x, y, Player.frameKey('idle', 1));

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(48, 70);
    this.setOffset(20, 10);

    this.speed = 240;
    this.depthSpeed = 240; // Vitesse sur l'axe Y (profondeur)
    this.isLocked = false;
    this.facing = 'right';
    this.maxHealth = 120;
    this.health = this.maxHealth;
    this.invulnerable = false;
    this.invulDuration = 600;
    
    // Système de saut simulé (axe Z)
    this.isJumping = false;
    this.jumpHeight = 0; // Hauteur actuelle du saut (0 = sol)
    this.maxJumpHeight = 60; // Hauteur maximale du saut
    this.jumpSpeed = 300; // Vitesse de montée/descente (pixels par seconde)
    this.depthY = y; // Position Y de profondeur (avant/arrière dans le décor)
    this.jumpTime = 0; // Temps écoulé depuis le début du saut
    this.lastUpdateTime = null; // Dernière mise à jour pour calculer le delta
    
    // Ombre pour le saut
    this.shadow = scene.add.ellipse(x, this.depthY + 35, 40, 15, 0x000000, 0.3);
    this.shadow.setDepth(0);
    
    this.attackState = {
      current: null,
      active: false,
      activeFrames: [],
    };
    this.attackHitbox = scene.add.zone(this.x, this.y, 60, 80);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.setData('type', 'player-attack');
    this.isHitboxActive = false;
    
    // SYSTÈME DE COMBO
    this.comboCount = 0; // 0, 1, 2, 3
    this.comboTimer = 0; // Timer pour reset le combo après 1 seconde
    this.comboResetDelay = 1000; // 1 seconde
    
    // Écouter les événements de frame d'animation pour activer/désactiver la hitbox
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this._onAnimationUpdate, this);
  }

  playAction(name, ignoreLock = false) {
    if (this.isLocked && !ignoreLock) {
      return;
    }

    const key = Player.animKey(name);
    if (this.anims.getName() === key && this.anims.isPlaying) {
      return;
    }

    this.isLocked = ['punch', 'kick', 'jump-kick'].includes(name);
    this.play(key, true);

    if (this.isLocked) {
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isLocked = false;
        this.attackState.current = null;
        this.attackState.active = false;
        this.attackState.activeFrames = [];
        this.attackState.attackName = null;
        this._disableHitbox();
        this.scene.events.emit('player-attack-end');
      });
    }

    if (ATTACK_DEFINITION[name]) {
      this.queueAttackWindow(name);
    }
  }

  update(cursors, actionKeys, time) {
    if (!this.body) return;
    this._syncHitboxPosition();
    this._updateJump(time);
    this._constrainYPosition();
    this._constrainYPosition();
    
    // GESTION DU COMBO TIMER
    if (this.comboCount > 0) {
      const deltaTime = this.lastComboUpdateTime ? time - this.lastComboUpdateTime : 0;
      this.comboTimer += deltaTime;
      if (this.comboTimer >= this.comboResetDelay) {
        // Reset le combo si trop de temps écoulé
        this.comboCount = 0;
        this.comboTimer = 0;
      }
    }
    this.lastComboUpdateTime = time;

    // Mouvement 2.5D : Gauche/Droite = X, Haut/Bas = Y (profondeur)
    if (!this.isLocked) {
      // Mouvement horizontal (X)
      if (cursors.left.isDown) {
        this.setVelocityX(-this.speed);
        this.setFlipX(true);
        this.facing = 'left';
        if (!this.isJumping) this.playAction('walk', true);
      } else if (cursors.right.isDown) {
        this.setVelocityX(this.speed);
        this.setFlipX(false);
        this.facing = 'right';
        if (!this.isJumping) this.playAction('walk', true);
      } else {
        this.setVelocityX(0);
        if (!this.isJumping) this.playAction('idle', true);
      }
      
      // Mouvement vertical (Y = profondeur)
      if (cursors.up.isDown) {
        this.setVelocityY(-this.depthSpeed);
      } else if (cursors.down.isDown) {
        this.setVelocityY(this.depthSpeed);
      } else {
        this.setVelocityY(0);
      }
    } else {
      // Pendant une attaque, on peut toujours bouger en profondeur
      if (cursors.up.isDown) {
        this.setVelocityY(-this.depthSpeed);
      } else if (cursors.down.isDown) {
        this.setVelocityY(this.depthSpeed);
      } else {
        this.setVelocityY(0);
      }
      
      if (!cursors.left.isDown && !cursors.right.isDown) {
        this.setVelocityX(0);
      }
    }

    // Saut simulé (Espace = axe Z)
    if (Phaser.Input.Keyboard.JustDown(actionKeys.jump)) {
      if (!this.isJumping) {
        this._startJump();
      }
    }

    // Attaques
    if (Phaser.Input.Keyboard.JustDown(actionKeys.punch)) {
      if (!this.isJumping) {
        this.setVelocityX(0);
        
        // SYSTÈME DE COMBO
        this.comboCount++;
        this.comboTimer = 0; // Reset le timer à chaque coup
        
        // Limiter à 3 coups max
        if (this.comboCount > 3) {
          this.comboCount = 1; // Recommencer le cycle
        }
        
        // Émettre l'événement de combo pour l'UI et les VFX
        this.scene.events.emit('player-combo-hit', {
          comboCount: this.comboCount,
          isFinisher: this.comboCount === 3
        });
        
        this.playAction('punch', true);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(actionKeys.kick)) {
      if (this.isJumping) {
        this.playAction('jump-kick', true);
      } else {
        this.setVelocityX(0);
        this.playAction('kick', true);
      }
    }
  }
  
  _startJump() {
    this.isJumping = true;
    this.jumpHeight = 0;
    this.jumpTime = 0;
  }
  
  _constrainYPosition() {
    if (!this.scene) return;
    
    // Contrainte Y : le joueur ne peut se déplacer que dans la moitié inférieure de l'écran
    const screenHeight = this.scene.scale.height;
    const minY = screenHeight * 0.5; // Milieu de l'écran
    const maxY = screenHeight; // Bas de l'écran
    
    // Appliquer la contrainte sur depthY (profondeur)
    this.depthY = Phaser.Math.Clamp(this.depthY, minY, maxY);
    
    // Si on est en train de sauter, ajuster aussi this.y
    if (this.isJumping) {
      this.y = this.depthY - this.jumpHeight;
    } else {
      this.y = this.depthY;
    }
    
    // Bloquer la vélocité Y si on atteint les limites
    if ((this.depthY <= minY && this.body.velocity.y < 0) || 
        (this.depthY >= maxY && this.body.velocity.y > 0)) {
      this.setVelocityY(0);
    }
  }
  
  _updateJump(time) {
    if (!this.scene) return;
    
    // depthY suit toujours la position Y réelle (profondeur)
    this.depthY = this.y;
    
    if (this.isJumping) {
      // Utiliser le temps de la scène pour calculer le delta
      const currentTime = time || this.scene.time.now;
      if (!this.lastUpdateTime) {
        this.lastUpdateTime = currentTime;
      }
      const delta = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      this.jumpTime += delta;
      
      // Phase de montée : 0 à maxJumpHeight en ~200ms
      const riseTime = 200;
      // Phase de descente : maxJumpHeight à 0 en ~200ms
      const fallTime = 200;
      const totalJumpTime = riseTime + fallTime;
      
      if (this.jumpTime < riseTime) {
        // Montée
        this.jumpHeight = (this.jumpTime / riseTime) * this.maxJumpHeight;
      } else if (this.jumpTime < totalJumpTime) {
        // Descente
        const fallProgress = (this.jumpTime - riseTime) / fallTime;
        this.jumpHeight = this.maxJumpHeight * (1 - fallProgress);
      } else {
        // Saut terminé
        this.jumpHeight = 0;
        this.isJumping = false;
        this.jumpTime = 0;
        this.lastUpdateTime = null;
      }
      
      // Modifier visuellement la position Y (on monte)
      this.y = this.depthY - this.jumpHeight;
      
      // Mettre à jour l'ombre (reste au sol, suit la profondeur)
      if (this.shadow) {
        this.shadow.x = this.x;
        this.shadow.y = this.depthY + 35; // Suit la profondeur
        // L'ombre devient plus petite quand on monte
        const shadowScale = 1 - (this.jumpHeight / this.maxJumpHeight) * 0.5;
        this.shadow.setScale(shadowScale, shadowScale);
      }
    } else {
      // Au sol, pas de modification visuelle
      if (this.shadow) {
        this.shadow.x = this.x;
        this.shadow.y = this.depthY + 35; // Suit la profondeur
        this.shadow.setScale(1, 1);
      }
    }
  }

  queueAttackWindow(name) {
    const config = ATTACK_DEFINITION[name];
    if (!config) return;
    
    this.attackState.current = config;
    this.attackState.active = false;
    this.attackState.activeFrames = config.activeFrames || [];
    this.attackState.attackName = name;
    
    // Préparer la hitbox mais ne pas l'activer encore
    this._prepareHitbox(config);
    
    this.scene.events.emit('player-attack-start', { damage: config.damage });
  }
  
  _onAnimationUpdate(anim, frame) {
    // Vérifier si c'est une animation d'attaque
    if (!this.attackState.current || !this.attackState.attackName) return;
    
    const animKey = Player.animKey(this.attackState.attackName);
    if (anim.key !== animKey) return;
    
    // Vérifier si la frame actuelle est dans les frames actives
    const currentFrameIndex = frame.index + 1; // Les frames sont indexées à partir de 0
    const isActiveFrame = this.attackState.activeFrames.includes(currentFrameIndex);
    
    if (isActiveFrame && !this.isHitboxActive) {
      // Activer la hitbox pendant cette frame
      this.attackState.active = true;
      this._enableHitbox(this.attackState.current);
    } else if (!isActiveFrame && this.isHitboxActive) {
      // Désactiver la hitbox si on sort des frames actives
      this.attackState.active = false;
      this._disableHitbox();
    }
  }

  getAttackBounds() {
    if (!this.attackState?.current) return null;
    const range = this.attackState.current.range;
    const direction = this.flipX ? -1 : 1;
    const width = range + 50;
    const height = 110;
    const x = this.x + direction * (range * 0.6);
    const y = this.y - 10;

    return new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height);
  }

  hasActiveHitbox() {
    return this.isHitboxActive;
  }

  takeDamage(amount) {
    if (this.invulnerable || this.health <= 0) return;

    this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);
    this.invulnerable = true;
    this.setTint(0xff9999);
    
    // RESET DU COMBO quand le joueur est touché
    this.comboCount = 0;
    this.comboTimer = 0;
    
    this.scene.events.emit('player-health-changed', { current: this.health, max: this.maxHealth });

    spawnHitSpark(this.scene, this.x, this.y - 20, {
      color: 0xff4d4d,
      width: 34,
      height: 8,
      lifespan: 200,
      angle: Phaser.Math.Between(-10, 10),
    });
    if (this.scene?.cameras?.main) {
      this.scene.cameras.main.shake(150, 0.0035);
    }

    this.scene.time.delayedCall(120, () => this.clearTint());
    this.scene.time.delayedCall(this.invulDuration, () => {
      if (this.scene) this.invulnerable = false;
    });

    if (this.health <= 0) {
      this.handleDeath();
    }
  }

  heal(amount) {
    this.health = Phaser.Math.Clamp(this.health + amount, 0, this.maxHealth);
    this.scene.events.emit('player-health-changed', { current: this.health, max: this.maxHealth });
  }

  _syncHitboxPosition() {
    if (!this.attackHitbox) return;
    const direction = this.flipX ? -1 : 1;
    this.attackHitbox.x = this.x + direction * 50;
    // La hitbox suit le joueur en Y (profondeur) mais reste à la hauteur du sol pour les collisions
    this.attackHitbox.y = this.depthY - 10;
  }

  _prepareHitbox(config) {
    if (!this.attackHitbox?.body) return;
    const width = config.range + 40;
    const height = 70;
    this.attackHitbox.setSize(width, height);
    this.attackHitbox.body.setSize(width, height);
    this._syncHitboxPosition();
  }
  
  _enableHitbox(config) {
    if (!this.attackHitbox?.body) return;
    this.attackHitbox.body.enable = true;
    this.isHitboxActive = true;
    this._syncHitboxPosition();
  }

  _disableHitbox() {
    if (!this.attackHitbox?.body) return;
    this.attackHitbox.body.enable = false;
    this.isHitboxActive = false;
  }

  _constrainYPosition() {
    if (!this.scene) return;
    // Contrainte Y : le joueur ne peut se déplacer que dans la moitié inférieure de l'écran
    const screenHeight = this.scene.scale.height;
    const minY = screenHeight * 0.5; // Milieu de l'écran
    const maxY = screenHeight; // Bas de l'écran
    
    // Appliquer la contrainte sur depthY (profondeur)
    this.depthY = Phaser.Math.Clamp(this.depthY, minY, maxY);
    
    // Si on saute, ajuster aussi la position visuelle
    if (this.isJumping) {
      this.y = this.depthY - this.jumpHeight;
    } else {
      this.y = this.depthY;
    }
  }

  handleDeath() {
    this.setVelocity(0, 0);
    this.anims.stop();
    this.disableBody(true, false);
    if (this.shadow) {
      this.shadow.destroy();
    }
    this.emit('player-dead', this);
    this.scene.events.emit('player-dead');
  }
}

