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
  // Sélection du personnage (peut être changé pour choisir entre player et player2)
  static playerFolder = 'player2'; // Changer en 'player' pour utiliser Jeff, ou 'player2' pour le nouveau personnage
  
  static preload(scene) {
    // Charger toutes les images du joueur depuis assets/player/ ou assets/player2/
    // Avec publicDir: 'assets' dans vite.config.js, le chemin est player/dir/frame.png
    const playerPath = Player.playerFolder;
    
    // D'abord, charger le sprite de base du personnage (si disponible)
    // Ce sprite sera utilisé comme référence pour générer les autres si nécessaire
    const baseSpritePath = `${playerPath}/base.png`;
    scene.load.image(`player-base`, baseSpritePath);
    
    Object.entries(ANIMATION_DEFINITION).forEach(([name, config]) => {
      for (let i = 1; i <= config.frameCount; i += 1) {
        const key = Player.frameKey(name, i);
        // Construire le nom du fichier selon le type d'animation
        let fileName;
        if (name === 'jump-kick') {
          // jump-kick utilise jumpkick1.png, jumpkick2.png, etc.
          fileName = `jumpkick${i}.png`;
        } else {
          // Pour idle, walk, punch, kick : utiliser le nom du dossier + numéro
          // idle -> idle1.png, walk -> walk1.png, punch -> punch1.png, kick -> kick1.png
          fileName = `${config.dir}${i}.png`;
        }
        
        const imagePath = `${playerPath}/${config.dir}/${fileName}`;
        console.log(`[PLAYER] Chargement: ${key} -> ${imagePath}`);
        
        scene.load.image(key, imagePath);
        
        // Ajouter un listener pour détecter les erreurs de chargement
        scene.load.on('loaderror', (file) => {
          if (file.key === key) {
            console.warn(`[PLAYER] ⚠ Sprite ${key} non trouvé, sera généré depuis le sprite de base`);
            console.warn(`[PLAYER] Chemin tenté: ${file.url}`);
          }
        });
      }
    });
  }
  
  /**
   * Génère les sprites manquants depuis le sprite de base
   * Appelé dans create() après le chargement
   */
  static generateMissingSprites(scene) {
    const playerPath = Player.playerFolder;
    
    // Vérifier si le sprite de base existe
    if (!scene.textures.exists('player-base')) {
      console.warn('[PLAYER] Sprite de base non trouvé, impossible de générer les sprites manquants');
      console.warn('[PLAYER] Placez un sprite de base dans: assets/player2/base.png');
      return;
    }
    
    const baseTexture = scene.textures.get('player-base');
    if (!baseTexture || !baseTexture.source || !baseTexture.source[0]) {
      console.warn('[PLAYER] Texture de base invalide');
      return;
    }
    
    const baseImage = baseTexture.source[0].image;
    const baseWidth = baseImage.width;
    const baseHeight = baseImage.height;
    
    console.log(`[PLAYER] Génération des sprites manquants depuis le sprite de base (${baseWidth}x${baseHeight})`);
    
    Object.entries(ANIMATION_DEFINITION).forEach(([name, config]) => {
      for (let i = 1; i <= config.frameCount; i += 1) {
        const key = Player.frameKey(name, i);
        
        // Si le sprite n'existe pas, le générer depuis le sprite de base
        if (!scene.textures.exists(key)) {
          console.log(`[PLAYER] Génération de ${key} depuis le sprite de base`);
          
          // Créer un canvas pour appliquer des transformations selon l'animation
          const canvas = document.createElement('canvas');
          canvas.width = baseWidth;
          canvas.height = baseHeight;
          const ctx = canvas.getContext('2d');
          
          // Appliquer des transformations selon le type d'animation
          ctx.save();
          
          if (name === 'walk') {
            // Animation de marche : légère translation horizontale
            const offsetX = Math.sin((i / config.frameCount) * Math.PI * 2) * 2;
            ctx.translate(offsetX, 0);
          } else if (name === 'punch') {
            // Coup de poing : légère rotation et translation vers l'avant
            const progress = (i - 1) / (config.frameCount - 1);
            ctx.translate(baseWidth * 0.1 * progress, 0);
            ctx.rotate(progress * 0.1);
          } else if (name === 'kick') {
            // Coup de pied : rotation de la jambe
            const progress = (i - 1) / (config.frameCount - 1);
            ctx.translate(0, baseHeight * 0.1 * progress);
            ctx.rotate(-progress * 0.15);
          } else if (name === 'jump-kick') {
            // Coup de pied sauté : rotation plus importante
            const progress = (i - 1) / (config.frameCount - 1);
            ctx.translate(0, -baseHeight * 0.2 * progress);
            ctx.rotate(-progress * 0.3);
          }
          // idle : pas de transformation
          
          // Dessiner l'image de base avec les transformations
          ctx.drawImage(baseImage, 0, 0);
          ctx.restore();
          
          // Créer la texture depuis le canvas
          scene.textures.addCanvas(key, canvas);
        }
      }
    });
    
    console.log('[PLAYER] Génération des sprites manquants terminée');
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

    this.speed = 260; // Légèrement plus rapide pour plus de réactivité
    this.depthSpeed = 260; // Vitesse sur l'axe Y (profondeur)
    this.isLocked = false;
    this.facing = 'right';
    this.maxHealth = 120;
    this.health = this.maxHealth;
    this.invulnerable = false;
    this.invulDuration = 600;
    
    // SYSTÈME DE DASH/ESQUIVE
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashCooldownMax = 1000; // 1 seconde de cooldown
    this.dashDuration = 200; // Durée du dash (ms)
    this.dashSpeed = 600; // Vitesse pendant le dash
    this.dashInvulnerable = false; // Invincibilité pendant le dash
    this.lastDirectionKey = null; // Pour détecter le double-tap
    this.lastDirectionTime = 0;
    this.doubleTapWindow = 300; // Fenêtre pour double-tap (ms)
    
    // SYSTÈME DE RAGE/SUPER
    this.rage = 0;
    this.maxRage = 100;
    this.rageGainPerHit = 5; // Rage gagnée par hit
    this.rageGainPerCombo = 10; // Rage bonus pour les combos
    this.superReady = false; // Prêt pour l'attaque super
    
    // SYSTÈME DE PARRY/CONTRE-ATTAQUE
    this.isParrying = false;
    this.parryWindow = 200; // Fenêtre de parry (ms)
    this.parryCooldown = 0;
    this.parryCooldownMax = 2000; // 2 secondes de cooldown
    this.lastParryTime = 0;
    
    // SYSTÈME D'ARME TEMPORAIRE
    this.currentWeapon = null; // { damage: 20, maxDurability: 5, spriteKey: 'pipe' }
    this.weaponDurability = 0; // Durabilité actuelle
    this.weaponSprite = null; // Sprite visuel de l'arme équipée
    
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
    
    // SYSTÈME DE COMBO AMÉLIORÉ
    this.comboCount = 0; // 0, 1, 2, 3, 4, 5...
    this.comboTimer = 0; // Timer pour reset le combo après 1.5 seconde
    this.comboResetDelay = 1500; // 1.5 seconde
    this.comboSequence = []; // Séquence d'attaques pour varier les combos
    this.lastAttackType = null; // Dernière attaque utilisée
    
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
    
    // FREEZE COMPLET : Si le jeu est en pause, ne pas exécuter la logique
    if (this.scene && this.scene.isGamePaused) {
      return;
    }
    this._syncHitboxPosition();
    this._updateJump(time);
    this._constrainYPosition();
    this._constrainYPosition();
    
    // GESTION DU DASH COOLDOWN
    if (this.dashCooldown > 0) {
      const deltaTime = this.lastUpdateTime ? time - this.lastUpdateTime : 0;
      this.dashCooldown = Math.max(0, this.dashCooldown - deltaTime);
    }
    this.lastUpdateTime = time;
    
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

    // GESTION DU DASH
    if (this.isDashing) {
      // Pendant le dash, mouvement rapide et invincibilité
      this.dashInvulnerable = true;
      this.invulnerable = true;
      
      // Le dash se termine après sa durée
      if (time - this.dashStartTime >= this.dashDuration) {
        this.isDashing = false;
        this.dashInvulnerable = false;
        this.invulnerable = false;
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.isLocked = false;
      }
    } else {
      // Détection du double-tap pour dash
      let dashDirection = null;
      if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
        if (this.lastDirectionKey === 'left' && (time - this.lastDirectionTime) < this.doubleTapWindow) {
          dashDirection = 'left';
        }
        this.lastDirectionKey = 'left';
        this.lastDirectionTime = time;
      } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
        if (this.lastDirectionKey === 'right' && (time - this.lastDirectionTime) < this.doubleTapWindow) {
          dashDirection = 'right';
        }
        this.lastDirectionKey = 'right';
        this.lastDirectionTime = time;
      }
      
      // Dash avec Shift aussi
      if (actionKeys.dash && Phaser.Input.Keyboard.JustDown(actionKeys.dash)) {
        if (cursors.left.isDown) dashDirection = 'left';
        else if (cursors.right.isDown) dashDirection = 'right';
      }
      
      // Activer le dash si détecté et cooldown OK
      if (dashDirection && this.dashCooldown <= 0 && !this.isLocked && !this.isJumping) {
        this._startDash(dashDirection, time);
      }
    }

    // Mouvement 2.5D : Gauche/Droite = X, Haut/Bas = Y (profondeur)
    if (!this.isLocked && !this.isDashing) {
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
      
      // Mouvement vertical (Y = profondeur) - LOGIQUE ULTRA-SIMPLIFIÉE
      if (cursors.down.isDown) {
        // TOUJOURS permettre la descente
        this.setVelocityY(this.depthSpeed);
      } else if (cursors.up.isDown) {
        // Vérifier les limites seulement pour la montée
        if (this.scene && this.scene.roadTopBoundary !== undefined) {
          const originY = this.originY ?? 0.5;
          const displayHeight = this.displayHeight || this.height || 0;
          const bottomOffset = displayHeight * (1 - originY);
          const currentBottom = this.y + bottomOffset;
          const minBottom = this.scene.roadTopBoundary + 4;
          
          // Si on est déjà en haut, bloquer la montée
          if (currentBottom <= minBottom + 10) {
            this.setVelocityY(0);
          } else {
            this.setVelocityY(-this.depthSpeed);
          }
        } else {
          this.setVelocityY(-this.depthSpeed);
        }
      } else {
        // Aucune touche : arrêter le mouvement
        this.setVelocityY(0);
      }
    } else {
      // Pendant une attaque, on peut toujours bouger en profondeur - LOGIQUE SIMPLIFIÉE
      if (cursors.down.isDown) {
        // TOUJOURS permettre la descente
        this.setVelocityY(this.depthSpeed);
      } else if (cursors.up.isDown) {
        // Vérifier les limites seulement pour la montée
        if (this.scene && this.scene.roadTopBoundary !== undefined) {
          const originY = this.originY ?? 0.5;
          const displayHeight = this.displayHeight || this.height || 0;
          const bottomOffset = displayHeight * (1 - originY);
          const currentBottom = this.y + bottomOffset;
          const minBottom = this.scene.roadTopBoundary + 4;
          
          if (currentBottom <= minBottom + 5) {
            this.setVelocityY(0);
          } else {
            this.setVelocityY(-this.depthSpeed);
          }
        } else {
          this.setVelocityY(-this.depthSpeed);
        }
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

    // SYSTÈME DE COMBO AMÉLIORÉ : Punch -> Kick -> Jump-Kick
    if (Phaser.Input.Keyboard.JustDown(actionKeys.punch)) {
      if (!this.isJumping) {
        this.setVelocityX(0);
        
        // Vérifier si on peut enchaîner avec un combo
        const canCombo = this.comboCount > 0 && this.comboTimer < this.comboResetDelay;
        
        if (!canCombo) {
          // Nouveau combo : commencer par punch
          this.comboCount = 1;
          this.comboSequence = ['punch'];
        } else {
          // Continuer le combo
          this.comboCount++;
          this.comboSequence.push('punch');
        }
        
        this.comboTimer = 0; // Reset le timer
        this.lastAttackType = 'punch';
        
        // Émettre l'événement de combo
        this.scene.events.emit('player-combo-hit', {
          comboCount: this.comboCount,
          isFinisher: this.comboCount >= 3
        });
        
        this.playAction('punch', true);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(actionKeys.kick)) {
      if (this.isJumping) {
        // Jump-kick : peut être le 3ème coup d'un combo
        const canCombo = this.comboCount >= 2 && this.comboTimer < this.comboResetDelay;
        
        if (canCombo) {
          this.comboCount++;
          this.comboSequence.push('jump-kick');
          this.comboTimer = 0;
          
          // Finisher aérien
          this.scene.events.emit('player-combo-hit', {
            comboCount: this.comboCount,
            isFinisher: true
          });
        }
        
        this.playAction('jump-kick', true);
      } else {
        // Kick au sol : peut être le 2ème coup d'un combo
        const canCombo = this.comboCount >= 1 && this.comboTimer < this.comboResetDelay && this.lastAttackType === 'punch';
        
        if (canCombo) {
          this.comboCount++;
          this.comboSequence.push('kick');
        } else if (this.comboCount === 0) {
          // Commencer un nouveau combo avec kick
          this.comboCount = 1;
          this.comboSequence = ['kick'];
        }
        
        this.comboTimer = 0;
        this.lastAttackType = 'kick';
        this.setVelocityX(0);
        
        this.scene.events.emit('player-combo-hit', {
          comboCount: this.comboCount,
          isFinisher: this.comboCount >= 3
        });
        
        this.playAction('kick', true);
      }
    }
    
    // ATTAQUE SUPER (quand la rage est pleine)
    if (this.superReady && Phaser.Input.Keyboard.JustDown(actionKeys.punch) && Phaser.Input.Keyboard.JustDown(actionKeys.kick)) {
      this._performSuperAttack();
    }
  }
  
  _startDash(direction, time) {
    this.isDashing = true;
    this.dashStartTime = time;
    this.dashCooldown = this.dashCooldownMax;
    this.isLocked = true; // Empêcher les attaques pendant le dash
    
    // Vitesse du dash
    const dashSpeedX = direction === 'left' ? -this.dashSpeed : this.dashSpeed;
    this.setVelocityX(dashSpeedX);
    this.setFlipX(direction === 'left');
    
    // Effet visuel (traînée)
    if (this.scene) {
      // Créer une traînée visuelle
      const trail = this.scene.add.rectangle(this.x, this.y, 30, 60, 0x00ffff, 0.5);
      trail.setDepth(this.depth - 1);
      this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 0.5,
        duration: 200,
        onComplete: () => trail.destroy()
      });
    }
    
    // Fin du dash après la durée
    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.dashInvulnerable = false;
      this.isLocked = false;
      this.setVelocityX(0);
    });
  }
  
  _performSuperAttack() {
    if (!this.superReady || this.isLocked) return;
    
    // Consommer toute la rage
    this.rage = 0;
    this.superReady = false;
    
    // Animation et effet visuel
    this.isLocked = true;
    this.setVelocityX(0);
    
    // Screen shake intense
    if (this.scene && this.scene._applyScreenShake) {
      this.scene._applyScreenShake(30);
    }
    
    // Créer une zone d'attaque large autour du joueur
    const superHitbox = this.scene.add.zone(this.x, this.y, 200, 200);
    this.scene.physics.add.existing(superHitbox);
    superHitbox.body.setAllowGravity(false);
    
    // Effet visuel
    const superEffect = this.scene.add.circle(this.x, this.y, 100, 0xffff00, 0.5);
    superEffect.setDepth(this.depth + 1);
    this.scene.tweens.add({
      targets: superEffect,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 0.8, to: 0 },
      duration: 500,
      onComplete: () => superEffect.destroy()
    });
    
    // Dégâts massifs à tous les ennemis proches
    if (this.scene && this.scene.enemies) {
      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.active || enemy.isDead) return;
        const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (distance <= 200) {
          // Dégâts massifs
          if (enemy.takeDamage) {
            enemy.takeDamage(50); // Dégâts énormes
          }
          // Knockback
          if (enemy.body) {
            const dirX = enemy.x > this.x ? 1 : -1;
            enemy.body.setVelocityX(dirX * 400);
          }
        }
      });
    }
    
    // Réinitialiser après l'attaque
    this.scene.time.delayedCall(800, () => {
      this.isLocked = false;
      if (superHitbox) superHitbox.destroy();
    });
  }
  
  // Ajouter de la rage
  addRage(amount) {
    this.rage = Math.min(this.maxRage, this.rage + amount);
    this.superReady = this.rage >= this.maxRage;
    
    // Mettre à jour le HUD
    if (this.scene && this.scene.hud && this.scene.hud.updateRage) {
      this.scene.hud.updateRage(this.rage, this.maxRage);
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

