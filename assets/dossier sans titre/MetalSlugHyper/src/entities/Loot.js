import Phaser from 'phaser';

export default class Loot extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'GOLD') {
    // Type: 'GOLD', 'HEART' ou 'WEAPON'
    super(scene, x, y, null);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    this.type = type; // 'GOLD', 'HEART' ou 'WEAPON'
    this.collected = false;
    
    // Créer la texture selon le type
    this._createTexture();
    
    // Physique
    this.setCollideWorldBounds(false);
    this.body.setSize(20, 20);
    this.body.setOffset(0, 0);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    
    // Visuel
    this.setDepth(5);
    this.setOrigin(0.5, 0.5);
    // Agrandir les loots pour qu'ils soient plus visibles
    if (this.type === 'HEART') {
      this.setScale(4.0); // Cœurs beaucoup plus grands
    } else if (this.type === 'GOLD') {
      this.setScale(1.5); // Pièces d'or plus grandes
    } else {
      this.setScale(0.8); // Armes gardent leur taille normale
    }
    
    // Supprimer l'arrière-plan gris des cœurs (si présent dans le sprite)
    if (this.type === 'HEART') {
      // Utiliser un mode de blend pour rendre transparent le fond gris
      this.setBlendMode(Phaser.BlendModes.NORMAL);
      this.setTint(0xffffff); // Pas de tint, couleur normale
    }
    
    // Animation de pulsation
    this._startIdleAnimation();
    
    // PETIT REBOND à l'apparition (Tween Y)
    if (this.scene && this.scene.tweens) {
      const startY = this.y;
      this.y = startY - 20; // Commence plus haut
      this.scene.tweens.add({
        targets: this,
        y: startY,
        duration: 300,
        ease: 'Bounce.easeOut'
      });
    }
  }
  
  _createTexture() {
    // Utiliser de vrais sprites 3D au lieu de générer des cercles
    // DEBUG : Lister toutes les textures disponibles
    const availableTextures = Object.keys(this.scene.textures.list || {});
    const heartTextures = availableTextures.filter(t => t.startsWith('loot-heart'));
    const goldTextures = availableTextures.filter(t => t.startsWith('loot-gold'));
    console.log(`[LOOT] Textures disponibles - Cœurs: ${heartTextures.length}, Pièces: ${goldTextures.length}`);
    
    if (this.type === 'HEART') {
      // COEUR 3D : Utiliser le sprite de cœur depuis Warped Lava Items
      // Utiliser heart-1.png comme frame de base, on animera avec les autres frames
      if (this.scene.textures.exists('loot-heart-1')) {
        console.log('[LOOT] ✓ Utilisation du sprite 3D de cœur: loot-heart-1');
        this.setTexture('loot-heart-1');
        this.heartFrameIndex = 1; // Pour l'animation
        
        // Supprimer l'arrière-plan gris en utilisant un blend mode
        // Le mode MULTIPLY ou SCREEN peut aider, mais mieux : créer une texture sans fond
        // On va utiliser un tint pour préserver les couleurs et un blend mode pour la transparence
        this.setBlendMode(Phaser.BlendModes.NORMAL);
        
        // Alternative : créer une texture modifiée sans le fond gris
        // On va le faire après le chargement initial
        this.scene.time.delayedCall(10, () => {
          if (this && this.active && this.scene) {
            this._removeHeartBackground();
          }
        });
      } else {
        console.warn('[LOOT] ✗ Sprite loot-heart-1 non trouvé');
        console.warn(`[LOOT] Textures de cœur disponibles: ${heartTextures.join(', ')}`);
        // Fallback : créer un cercle rouge si le sprite n'existe pas
        if (!this.scene.textures.exists('loot-heart-fallback')) {
          const graphics = this.scene.add.graphics();
          graphics.fillStyle(0xff0000);
          graphics.fillCircle(0, 0, 12);
          graphics.generateTexture('loot-heart-fallback', 24, 24);
          graphics.destroy();
        }
        this.setTexture('loot-heart-fallback');
      }
    } else if (this.type === 'WEAPON') {
      // ARME : Créer un tuyau/couteau (rectangle gris métallique)
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x888888); // Gris métal
      graphics.fillRect(-8, -2, 16, 4); // Tuyau horizontal
      graphics.fillStyle(0x666666); // Gris foncé pour le manche
      graphics.fillRect(-6, -1, 4, 2);
      graphics.fillStyle(0xaaaaaa); // Gris clair pour la lame
      graphics.fillRect(2, -1, 6, 2);
      graphics.generateTexture('loot-weapon', 20, 8);
      this.setTexture('loot-weapon');
      graphics.destroy();
    } else {
      // GOLD 3D : Utiliser le sprite de pièce depuis Props Pack 1
      if (this.scene.textures.exists('loot-gold-1')) {
        console.log('[LOOT] ✓ Utilisation du sprite 3D de pièce: loot-gold-1');
        this.setTexture('loot-gold-1');
        this.goldFrameIndex = 1; // Pour l'animation
      } else {
        console.warn('[LOOT] ✗ Sprite loot-gold-1 non trouvé');
        console.warn(`[LOOT] Textures de pièce disponibles: ${goldTextures.join(', ')}`);
        // Fallback : créer un cercle jaune si le sprite n'existe pas
        if (!this.scene.textures.exists('loot-gold-fallback')) {
          const graphics = this.scene.add.graphics();
          graphics.fillStyle(0xffff00);
          graphics.fillCircle(0, 0, 10);
          graphics.generateTexture('loot-gold-fallback', 20, 20);
          graphics.destroy();
        }
        this.setTexture('loot-gold-fallback');
      }
    }
  }
  
  _startIdleAnimation() {
    if (this.type === 'HEART') {
      // Animation de pulsation pour le coeur + animation des frames 3D
      this.scene.tweens.add({
        targets: this,
        scale: { from: 0.8, to: 1.0 },
        duration: 300,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
      
      // Animation des frames du cœur (heart-1 à heart-4)
      if (this.heartFrameIndex !== undefined) {
        this.heartFrameTimer = this.scene.time.addEvent({
          delay: 150, // Changer de frame toutes les 150ms
          callback: () => {
            if (this && this.active && !this.collected) {
              this.heartFrameIndex = (this.heartFrameIndex % 4) + 1;
              const heartKey = `loot-heart-${this.heartFrameIndex}`;
              const heartKeyNoBg = `loot-heart-${this.heartFrameIndex}-nobg`;
              
              // Utiliser la version sans fond si elle existe, sinon la version normale
              if (this.scene.textures.exists(heartKeyNoBg)) {
                this.setTexture(heartKeyNoBg);
              } else if (this.scene.textures.exists(heartKey)) {
                this.setTexture(heartKey);
                // Créer la version sans fond pour cette frame
                this.scene.time.delayedCall(10, () => {
                  if (this && this.active && !this.collected) {
                    this._removeHeartBackground();
                  }
                });
              }
            }
          },
          loop: true
        });
      }
    } else if (this.type === 'WEAPON') {
      // Animation de rotation pour l'arme (lent)
      this.scene.tweens.add({
        targets: this,
        rotation: Math.PI * 2,
        duration: 2000,
        repeat: -1,
        ease: 'Linear'
      });
    } else {
      // Animation de rotation 3D pour la pièce d'or (effet de pièce qui tourne sur elle-même)
      // Rotation continue sur l'axe Y (effet 3D)
      this.scene.tweens.add({
        targets: this,
        rotation: Math.PI * 2,
        duration: 600, // Rotation plus rapide pour un effet plus dynamique
        repeat: -1,
        ease: 'Linear'
      });
      
      // Animation des frames de la pièce (gold-1 à gold-6) pour simuler la rotation 3D
      // Les orb ont 6 frames pour une rotation plus fluide
      if (this.goldFrameIndex !== undefined) {
        this.goldFrameTimer = this.scene.time.addEvent({
          delay: 50, // Changer de frame toutes les 50ms pour un effet de rotation 3D fluide
          callback: () => {
            if (this && this.active && !this.collected) {
              this.goldFrameIndex = (this.goldFrameIndex % 6) + 1; // 6 frames au lieu de 4
              const goldKey = `loot-gold-${this.goldFrameIndex}`;
              if (this.scene.textures.exists(goldKey)) {
                this.setTexture(goldKey);
              }
            }
          },
          loop: true
        });
      }
      
      // Animation de scale pour simuler l'effet de profondeur lors de la rotation
      // Quand la pièce tourne, elle semble s'aplatir puis se réélargir (effet 3D)
      this.scene.tweens.add({
        targets: this,
        scaleX: { from: this.scaleX, to: this.scaleX * 0.2 }, // S'aplatit beaucoup pour simuler la rotation
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  collect() {
    if (this.collected) return;
    this.collected = true;
    
    // Arrêter toutes les animations
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
    }
    
    // Arrêter les timers d'animation de frames
    if (this.heartFrameTimer) {
      this.scene.time.removeEvent(this.heartFrameTimer);
    }
    if (this.goldFrameTimer) {
      this.scene.time.removeEvent(this.goldFrameTimer);
    }
    
    // Son : Collect
    if (this.scene && this.scene.audioManager) {
      this.scene.audioManager.playSFX('collect');
    }
    
    // TEXTE FLOTTANT selon le type
    let floatText = '';
    if (this.type === 'HEART') {
      floatText = 'HP UP';
    } else if (this.type === 'WEAPON') {
      floatText = 'WEAPON!';
    } else {
      floatText = '+500';
    }
    
    // Créer le texte flottant
    const text = this.scene.add.text(this.x, this.y - 30, floatText, {
      fontSize: '24px',
      fontFamily: 'Arial',
      fill: this.type === 'HEART' ? '#ff0000' : this.type === 'WEAPON' ? '#ffaa00' : '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(10);
    
    // Animation du texte (flotte vers le haut et disparaît)
    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        if (text && text.active) {
          text.destroy();
        }
      }
    });
    
    // Animation de collecte (flotte vers le haut et disparaît)
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      alpha: 0,
      scale: 0.3,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        if (this && this.active) {
          this.destroy();
        }
      }
    });
    
    // Appliquer l'effet selon le type
    if (this.type === 'HEART') {
      // Soigne le joueur
      if (this.scene.player && this.scene.player.active) {
        this.scene.player.heal(20);
      }
    } else if (this.type === 'WEAPON') {
      // Équipe l'arme (géré dans GameScene.js)
      // Ne rien faire ici, la logique est dans _handlePlayerCollectLoot
    } else {
      // Ajoute du score (SPECS: +500 pour GOLD)
      if (this.scene.addScore && typeof this.scene.addScore === 'function') {
        this.scene.addScore(500);
      }
    }
  }
  
  /**
   * Supprime l'arrière-plan gris et l'encadrement des cœurs en créant une nouvelle texture sans fond
   */
  _removeHeartBackground() {
    if (!this.scene || !this.texture || this.type !== 'HEART') return;
    
    try {
      const sourceTexture = this.scene.textures.get(this.texture.key);
      if (!sourceTexture || !sourceTexture.source || !sourceTexture.source[0]) return;
      
      const sourceImage = sourceTexture.source[0].image;
      if (!sourceImage) return;
      
      // Créer un canvas temporaire pour traiter l'image
      const canvas = document.createElement('canvas');
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      const ctx = canvas.getContext('2d');
      
      // Dessiner l'image source
      ctx.drawImage(sourceImage, 0, 0);
      
      // Récupérer les données de l'image
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Parcourir tous les pixels et rendre transparents les pixels gris/noirs (arrière-plan et encadrement)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Détecter les pixels gris/noirs (arrière-plan et encadrement)
        const avg = (r + g + b) / 3;
        const diff = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));
        
        // Supprimer :
        // 1. Pixels gris (faible différence entre r, g, b) - arrière-plan
        // 2. Pixels sombres (noir/gris foncé) - encadrement
        // 3. Pixels avec alpha faible
        const isGray = diff < 40; // Tolérance plus large pour détecter les gris
        const isDark = avg < 150; // Pixels sombres (noir/gris foncé)
        const isLightGray = avg > 100 && avg < 220 && diff < 40; // Gris clair
        
        if ((isGray && (isDark || isLightGray)) || (isDark && avg < 100)) {
          data[i + 3] = 0; // Alpha = 0 (transparent)
        }
        
        // Garder uniquement les pixels rouges/roses (le cœur)
        // Si c'est un pixel rouge/rose, le garder
        if (r > g + 30 && r > b + 30 && r > 150) {
          // C'est un pixel rouge, le garder
          continue;
        }
        
        // Si ce n'est pas rouge et que c'est gris/sombre, le rendre transparent
        if (!(r > g + 30 && r > b + 30 && r > 150)) {
          if (isGray || isDark) {
            data[i + 3] = 0;
          }
        }
      }
      
      // Appliquer les modifications
      ctx.putImageData(imageData, 0, 0);
      
      // Créer une nouvelle texture sans fond
      const newTextureKey = `loot-heart-${this.heartFrameIndex}-nobg`;
      if (!this.scene.textures.exists(newTextureKey)) {
        this.scene.textures.addCanvas(newTextureKey, canvas);
      }
      
      // Utiliser la nouvelle texture
      this.setTexture(newTextureKey);
      
    } catch (error) {
      console.warn('[LOOT] Erreur lors de la suppression du fond gris:', error);
      // En cas d'erreur, utiliser un blend mode pour améliorer la transparence
      this.setBlendMode(Phaser.BlendModes.ADD);
    }
  }
}

