import Phaser from 'phaser';
import Loot from './Loot.js';

export default class Prop extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'crate') {
    // Utiliser les sprites de pneu en feu avec dégradation
    // État 1 = peu de feu (3 PV), État 2 = feu modéré (2 PV), État 3 = feu intense (1 PV), État 4 = braises (0 PV)
    const textureKey = 'tire-burning-1';
    const hasTireTexture = scene.textures && scene.textures.exists(textureKey);
    
    // Fallback : utiliser la texture de caisse si les pneus ne sont pas disponibles
    const fallbackTextureKey = 'prop-crate';
    const hasCrateTexture = scene.textures && scene.textures.exists(fallbackTextureKey);
    
    const finalTextureKey = hasTireTexture ? textureKey : (hasCrateTexture ? fallbackTextureKey : null);
    
    super(scene, x, y, finalTextureKey);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    this.type = type;
    
    // Si aucune texture n'existe, créer un rectangle directement comme fallback
    if (!finalTextureKey) {
      console.warn('[PROP] Aucune texture trouvée, utilisation d\'un rectangle');
      // Créer un rectangle marron comme fallback
      this.rectFallback = scene.add.rectangle(x, y, 40, 40, 0x8B4513);
      this.rectFallback.setStrokeStyle(2, 0x654321);
      this.rectFallback.setDepth(2);
      this.rectFallback.setOrigin(0.5, 0.5);
      
      // Cacher le sprite (on utilise le rectangle)
      this.setVisible(false);
    } else {
      // Utiliser la texture (pneu ou caisse)
      this.setTexture(finalTextureKey);
      this.rectFallback = null;
    }
    
    // État de dégradation visuelle (1 = intact, 4 = complètement brûlé)
    this.degradationState = 1;
    this.usingTires = hasTireTexture; // Flag pour savoir si on utilise les pneus ou les caisses
    
    // Position verticale alignée sur la route
    if (this.scene && typeof this.scene._alignSpriteToGround === 'function') {
      this.scene._alignSpriteToGround(this);
    }
    
    // Physique - FIX "PATINOIRE" : Béton armé pour empêcher tout mouvement
    this.setCollideWorldBounds(false);
    
    // Ajuster la taille de la hitbox selon si on utilise les pneus ou les caisses
    if (this.usingTires) {
      // Pour les pneus, on ajustera la hitbox après le scale
      // Temporairement, utiliser une taille par défaut
      this.body.setSize(40, 40);
    } else {
      // Pour les caisses, taille normale
      this.body.setSize(40, 40);
    }
    
    this.body.setOffset(0, 0);
    this.body.setImmovable(true); // CRUCIAL : Ne bouge pas quand touché
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0); // Vélocité à zéro
    this.body.setBounce(0); // Pas de rebond
    this.body.setFriction(1); // Friction maximale
    this.body.setDrag(1000); // Drag très élevé pour stopper tout mouvement
    
    // Stats
    this.maxHealth = 3;
    this.health = this.maxHealth;
    this.isDead = false;
    this.isTakingDamage = false; // Flag pour éviter les appels multiples
    
    // Visuel
    this.setDepth(2);
    this.setOrigin(0.5, 0.5);
    
    // Réduire encore plus la taille des pneus (ils sont trop grands par défaut)
    if (this.usingTires) {
      this.setScale(0.25); // Réduire à 25% de la taille originale (encore plus petit)
      
      // Attendre que le scale soit appliqué, puis ajuster la hitbox
      // Utiliser un délai pour s'assurer que displayWidth/Height sont calculés
      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(10, () => {
          if (this && this.body && this.active) {
            const scaledWidth = this.displayWidth || 40;
            const scaledHeight = this.displayHeight || 40;
            // Hitbox légèrement plus petite que le sprite pour faciliter les coups
            const hitboxWidth = scaledWidth * 0.9;
            const hitboxHeight = scaledHeight * 0.9;
            this.body.setSize(hitboxWidth, hitboxHeight);
            this.body.setOffset((scaledWidth - hitboxWidth) / 2, (scaledHeight - hitboxHeight) / 2);
            console.log(`[PROP] Hitbox ajustée pour pneu: ${hitboxWidth}x${hitboxHeight}`);
          }
        });
      }
      
      // Animation dynamique des flammes (pulsation/oscillation)
      this._startFlameAnimation();
    }
    
    // Initialiser l'état de dégradation visuelle (seulement si on utilise les pneus)
    if (this.usingTires) {
      this._updateDegradationState();
    }
    
    // L'overlap sera créé dans GameScene.js après la création du joueur
  }
  
  // MÉTHODE UPDATE : S'assurer que la caisse ne bouge JAMAIS
  update() {
    if (this.isDead || !this.body) {
      // Si le prop est mort, nettoyer les flammes si elles existent encore
      if (this.isDead && this.flameParticles && this.flameParticles.length > 0) {
        this._cleanupFlameParticles();
      }
      return;
    }
    
    if (this.scene && typeof this.scene._clampSpriteToRoad === 'function') {
      this.scene._clampSpriteToRoad(this);
    }
    
    // Si on utilise le rectangle fallback, synchroniser sa position
    if (this.rectFallback && this.rectFallback.active) {
      this.rectFallback.x = this.x;
      this.rectFallback.y = this.y;
    }
    
    // Mettre à jour la position des particules de flammes pour qu'elles suivent le pneu
    // SEULEMENT si le prop est encore actif et n'est pas mort
    if (!this.isDead && this.usingTires && this.flameParticles && this.flameAngles) {
      this.flameTimer += 0.016; // ~60fps
      
      // Filtrer les flammes actives avant de les mettre à jour
      const activeFlames = [];
      this.flameParticles.forEach((flame, index) => {
        if (flame && flame.active && this.flameAngles[index] !== undefined) {
          // Calculer l'angle actuel avec rotation
          const currentAngle = this.flameAngles[index] + (this.flameTimer * this.flameRotationSpeed * (1 + index * 0.1));
          const distance = 12 + Math.sin(this.flameTimer * 2 + index) * 3; // Distance variable pour effet organique
          
          // Position relative au pneu
          flame.x = this.x + Math.cos(currentAngle) * distance;
          flame.y = this.y + Math.sin(currentAngle) * distance - 8; // Légèrement au-dessus
          
          activeFlames.push(flame);
        }
      });
      
      // Si certaines flammes ont été détruites, mettre à jour le tableau
      if (activeFlames.length !== this.flameParticles.length) {
        this.flameParticles = activeFlames;
      }
    }
    
    // FORCER la vélocité à zéro à chaque frame (sécurité absolue)
    if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
      this.body.setVelocity(0, 0);
    }
    
    // S'assurer que les propriétés physiques restent correctes
    if (!this.body.immovable) {
      this.body.setImmovable(true);
    }
  }
  
  takeDamage(amount) {
    // ========================================
    // SÉCURITÉ ABSOLUE : Vérifications critiques
    // ========================================
    
    // 1. Si la prop est déjà morte ou en train d'être touchée, on arrête
    if (!this || !this.active || this.isDead) return;
    
    // 2. Protection contre les appels multiples simultanés (AVANT TOUT)
    if (this.isTakingDamage) return;
    this.isTakingDamage = true;
    
    // 3. Vérifier que la scène existe
    if (!this.scene || !this.scene.scene) return;
    
    // 4. Vérifier que le body existe
    if (!this.body) return;
    
    // 5. Appliquer les dégâts
    this.health -= amount;
    
    // 5.5. Mettre à jour l'état de dégradation visuelle selon la santé (seulement si on utilise les pneus)
    if (this.usingTires) {
      this._updateDegradationState();
    }
    
    // 6. Sauvegarder les coordonnées avant le shake
    const originalX = this.x;
    const originalY = this.y;
    
    // 7. Son : Hit (caisse touchée) - avec protection
    try {
      if (this.scene && this.scene.audioManager && typeof this.scene.audioManager.playSFX === 'function') {
        this.scene.audioManager.playSFX('hit');
      }
    } catch (error) {
      console.warn('[PROP] Erreur dans playSFX:', error);
    }
    
    // 8. Flash blanc + Shake VISUEL (sans modifier la position physique)
    try {
      if (this.rectFallback && this.rectFallback.active) {
        this.rectFallback.setFillStyle(0xffffff); // Flash blanc pour le rectangle
      } else if (this.setTint) {
        this.setTint(0xffffff);
      }
    } catch (error) {
      console.warn('[PROP] Erreur dans le flash:', error);
    }
    
    // 9. Créer un sprite temporaire pour l'effet de shake (ne touche pas au body)
    try {
      const shakeOffset = Phaser.Math.Between(-5, 5);
      const shakeTargets = (this.rectFallback && this.rectFallback.active) ? [this.rectFallback] : [this];
      
      if (this.scene && this.scene.tweens) {
        this.scene.tweens.add({
          targets: shakeTargets,
          x: originalX + shakeOffset,
          y: originalY + shakeOffset,
          duration: 50,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            if (this && !this.isDead && this.active && this.body) {
              // FORCER le retour à la position originale et vélocité à zéro
              this.x = originalX;
              this.y = originalY;
              if (this.rectFallback && this.rectFallback.active) {
                this.rectFallback.x = originalX;
                this.rectFallback.y = originalY;
                this.rectFallback.setFillStyle(0x8B4513); // Retour au marron
              }
              if (this.body && this.body.enable) {
                this.body.setVelocity(0, 0);
                // Note: setPosition n'existe pas sur body, on utilise this.x et this.y directement
              }
              if (!this.rectFallback && this.clearTint) {
                this.clearTint();
              }
            }
          }
        });
      }
    } catch (error) {
      console.warn('[PROP] Erreur dans le shake:', error);
    }
    
    // 10. Retirer le tint après le flash (un seul timer)
    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(100, () => {
        if (this && !this.isDead && this.active) {
          try {
            if (this.rectFallback && this.rectFallback.active) {
              this.rectFallback.setFillStyle(0x8B4513); // Retour au marron
            } else if (this.clearTint) {
              this.clearTint();
            }
          } catch (error) {
            console.warn('[PROP] Erreur dans clearTint:', error);
          }
        }
      });
    }
    
    // 11. Vérifier si la prop doit être détruite
    if (this.health <= 0) {
      // Réinitialiser le flag avant destruction
      this.isTakingDamage = false;
      
      // NETTOYER LES FLAMMES IMMÉDIATEMENT quand le prop meurt
      if (this.usingTires) {
        this._cleanupFlameParticles();
      }
      
      // DÉSACTIVER LA PHYSIQUE D'ABORD (évite les conflits)
      try {
        if (this.body && this.body.enable) {
          this.disableBody(true, true);
        }
      } catch (error) {
        console.warn('[PROP] Erreur dans disableBody:', error);
      }
      
      // Sauvegarder les coordonnées avant destruction
      const destroyX = originalX;
      const destroyY = originalY;
      
      // SPAWN DU LOOT AVEC PROTECTION ABSOLUE (AVANT TOUT)
      // Utiliser le système de temps de Phaser avec un délai minimal
      if (this.scene && this.scene.time && this.scene.spawnLoot && typeof this.scene.spawnLoot === 'function') {
        this.scene.time.delayedCall(10, () => {
          try {
            if (this.scene && this.scene.spawnLoot) {
              this.scene.spawnLoot(destroyX, destroyY);
            }
          } catch (error) {
            console.error('[PROP] Erreur critique dans spawnLoot:', error);
          }
        });
      }
      
      // Détruire l'objet après un court délai (sans particules pour éviter le freeze)
      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(50, () => {
          try {
            if (this && !this.isDead && this.active) {
              this._destroySimple(destroyX, destroyY);
            }
          } catch (error) {
            console.error('[PROP] Erreur dans _destroySimple:', error);
          }
        });
      } else {
        // Fallback si pas de time system
        this._destroySimple(destroyX, destroyY);
      }
      
      return; // IMPORTANT : Sortir immédiatement
    } else {
      // Réinitialiser le flag après un court délai (un seul timer)
      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(150, () => {
          if (this && !this.isDead && this.active) {
            this.isTakingDamage = false;
          }
        });
      }
    }
  }
  
  /**
   * Destruction simple sans particules (pour éviter les freezes)
   */
  _destroySimple(destroyX = null, destroyY = null) {
    // ========================================
    // SÉCURITÉ : Éviter les destructions multiples
    // ========================================
    
    if (this.isDead || !this.active) return;
    this.isDead = true;
    this.isTakingDamage = false; // Réinitialiser le flag
    
    // Nettoyer les particules de flammes
    this._cleanupFlameParticles();
    
    // Arrêter toutes les animations de ce sprite
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
    }
    
    // Désactiver la physique si elle est encore active
    try {
      if (this.body && this.body.enable) {
        this.disableBody(true, true);
      }
    } catch (error) {
      // Ignorer les erreurs de physique
    }
    
    // Détruire le rectangle fallback si il existe
    try {
      if (this.rectFallback && this.rectFallback.active) {
        this.rectFallback.destroy();
        this.rectFallback = null;
      }
    } catch (error) {
      // Ignorer les erreurs
    }
    
    // Détruire le sprite (en dernier)
    try {
      if (this.active) {
        super.destroy();
      }
    } catch (error) {
      console.warn('[PROP] Erreur dans super.destroy():', error);
    }
  }
  
  destroy(destroyX = null, destroyY = null) {
    // Utiliser la version simple pour éviter les freezes
    this._destroySimple(destroyX, destroyY);
  }
  
  _spawnDestructionParticles(x, y) {
    // SÉCURITÉ : Vérifications avant de créer des particules
    if (!this.scene || !this.scene.scene || !this.scene.add) return;
    if (!isFinite(x) || !isFinite(y)) return;
    
    try {
      // Créer des particules de débris
      const particleCount = 15;
      const colors = [0x8B4513, 0x654321, 0xA0522D]; // Différentes nuances de marron
      
      for (let i = 0; i < particleCount; i++) {
        try {
          const particle = this.scene.add.rectangle(
            x, 
            y, 
            3, 
            3, 
            colors[Math.floor(Math.random() * colors.length)]
          );
          
          if (!particle) continue;
          
          particle.setDepth(50);
          
          // Direction aléatoire
          const angle = Math.random() * Math.PI * 2;
          const speed = 80 + Math.random() * 60;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          
          // Animation de particule (avec protection)
          if (this.scene.tweens) {
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
                  try {
                    particle.destroy();
                  } catch (error) {
                    console.warn('[PROP] Erreur dans la destruction de particule:', error);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.warn('[PROP] Erreur dans la création de particule:', error);
          // Continuer avec les autres particules
        }
      }
    } catch (error) {
      console.warn('[PROP] Erreur dans _spawnDestructionParticles:', error);
    }
  }
  
  // _spawnLoot supprimé : Utilise maintenant this.scene.spawnLoot() dans takeDamage()
  
  /**
   * Démarre l'animation dynamique des flammes (pulsation et mouvement)
   */
  _startFlameAnimation() {
    if (!this.scene || !this.usingTires) return;
    
    // Animation de pulsation du sprite (scale qui pulse légèrement)
    if (this.scene.tweens) {
      this.scene.tweens.add({
        targets: this,
        scaleX: { from: this.scaleX, to: this.scaleX * 1.05 },
        scaleY: { from: this.scaleY, to: this.scaleY * 1.05 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Créer des particules de flammes qui bougent autour du pneu
    this.flameParticles = [];
    this.flameAngles = []; // Stocker les angles initiaux
    const flameCount = 8; // Nombre de particules de flammes
    
    for (let i = 0; i < flameCount; i++) {
      const baseAngle = (i / flameCount) * Math.PI * 2;
      this.flameAngles.push(baseAngle);
      
      const distance = 12; // Distance du centre du pneu
      
      // Créer une particule de flamme
      const flame = this.scene.add.circle(
        this.x,
        this.y - 8, // Légèrement au-dessus
        2 + Math.random() * 2, // Taille aléatoire
        0xff6600, // Orange
        0.7 + Math.random() * 0.3 // Opacité aléatoire
      );
      
      flame.setDepth(this.depth + 1);
      this.flameParticles.push(flame);
      
      // Animation de pulsation (scale et alpha)
      if (this.scene.tweens) {
        // Pulsation (scale)
        this.scene.tweens.add({
          targets: flame,
          scale: { from: 0.7, to: 1.4 },
          alpha: { from: 0.5, to: 1.0 },
          duration: 300 + Math.random() * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Changement de couleur (orange -> rouge -> orange)
        this.scene.tweens.add({
          targets: flame,
          duration: 400 + Math.random() * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onUpdate: (tween) => {
            if (!flame || !flame.active) return;
            const progress = tween.progress;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
              Phaser.Display.Color.ValueToColor(0xff6600), // Orange
              Phaser.Display.Color.ValueToColor(0xff0000), // Rouge
              100,
              progress * 100
            );
            flame.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
          }
        });
      }
    }
    
    // Timer pour faire tourner les flammes autour du pneu
    this.flameRotationSpeed = 0.02; // Vitesse de rotation
    this.flameTimer = 0;
  }
  
  /**
   * Nettoie les particules de flammes
   */
  _cleanupFlameParticles() {
    if (!this.flameParticles) return;
    
    console.log(`[PROP] Nettoyage de ${this.flameParticles.length} particules de flammes`);
    
    this.flameParticles.forEach((flame, index) => {
      try {
        if (flame) {
          // Arrêter toutes les animations de cette flamme
          if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(flame);
          }
          
          // Détruire la flamme si elle existe encore
          if (flame.active !== false) {
            flame.destroy();
          }
        }
      } catch (error) {
        console.warn(`[PROP] Erreur lors du nettoyage de la flamme ${index}:`, error);
      }
    });
    
    // Vider le tableau
    this.flameParticles = [];
    this.flameAngles = [];
    
    // Arrêter le timer de rotation
    this.flameTimer = 0;
  }
  
  /**
   * Met à jour l'état de dégradation visuelle selon la santé restante
   * État 1 (3 PV) : tire-burning-1.png (peu de feu)
   * État 2 (2 PV) : tire-burning-2.png (feu modéré)
   * État 3 (1 PV) : tire-burning-3.png (feu intense)
   * État 4 (0 PV) : tire-burning-4.png (braises)
   */
  _updateDegradationState() {
    // Calculer le nouvel état selon la santé
    let newState;
    if (this.health >= 3) {
      newState = 1; // Intact - peu de feu
    } else if (this.health >= 2) {
      newState = 2; // Légèrement endommagé - feu modéré
    } else if (this.health >= 1) {
      newState = 3; // Très endommagé - feu intense
    } else {
      newState = 4; // Presque détruit - braises
    }
    
    // Si l'état a changé, mettre à jour le sprite
    if (newState !== this.degradationState) {
      this.degradationState = newState;
      const textureKey = `tire-burning-${newState}`;
      
      // Vérifier si la texture existe avant de l'appliquer
      if (this.scene && this.scene.textures && this.scene.textures.exists(textureKey)) {
        this.setTexture(textureKey);
        console.log(`[PROP] État de dégradation mis à jour: ${textureKey} (PV: ${this.health})`);
      } else {
        console.warn(`[PROP] Texture ${textureKey} non trouvée`);
      }
    }
  }
}

