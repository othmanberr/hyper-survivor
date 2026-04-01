import Phaser from 'phaser';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(20, 20).setDepth(10).setScrollFactor(0);
    
    // Stocker le nom du boss pour le garder affiché lors des mises à jour
    this.currentBossName = '';

    // BARRE DE VIE DU JOUEUR (Haut Gauche, alignée avec la barre du boss)
    const healthBarY = 10; // Position Y commune pour les deux barres
    const healthBarWidth = 350; // Largeur ajustée (350 pixels)
    const healthBarHeight = 20; // Même hauteur que la barre du boss
    const healthBarX = 20; // Alignée à gauche
    this.healthBarBg = scene.add.rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x111111)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0);
    this.healthBarFill = scene.add.rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x00ff00)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0);
    // Pas de label "JEFF" - juste la barre

    // BARRE DE RAGE (En dessous de la barre de vie, alignée à gauche) - PLUS VISIBLE
    const rageBarX = healthBarX; // Même position X que la barre de vie (alignée à gauche)
    const rageBarY = healthBarY + healthBarHeight + 8; // Barre de vie + hauteur + espacement (8)
    const rageBarHeight = 18; // Plus haute (18px au lieu de 16px) pour plus de visibilité
    this.rageBarBg = scene.add.rectangle(rageBarX, rageBarY, healthBarWidth, rageBarHeight, 0x222222)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0);
    
    this.rageBarFill = scene.add.rectangle(rageBarX, rageBarY, 0, rageBarHeight - 2, 0xff00ff)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0);
    // Pas de label "RAGE" - juste la barre

    // TEXTES (Wave et Score) - Position ajustée
    this.waveLabel = scene.add.text(20, 60, 'Wave 1/3', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#f0f0f0',
    })
      .setDepth(10)
      .setScrollFactor(0);

    this.scoreLabel = scene.add.text(20, 80, 'Score 000000', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#f0f0f0',
    })
      .setDepth(10)
      .setScrollFactor(0);

    // AFFICHAGE COMBO AMÉLIORÉ
    this.comboLabel = scene.add.text(scene.scale.width / 2, 100, '', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
    })
      .setOrigin(0.5, 0.5)
      .setDepth(15)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    this.comboMultiplierLabel = scene.add.text(scene.scale.width / 2, 150, '', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4,
    })
      .setOrigin(0.5, 0.5)
      .setDepth(15)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);


    this.statusLabel = scene.add
      .text(scene.scale.width / 2, 40, '', {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#ffd966',
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setScrollFactor(0);

    // Barre de vie du boss (Haut Droite, EXACTEMENT alignée avec celle du joueur)
    const bossBarWidth = healthBarWidth; // Même largeur que la barre du joueur (350 pixels)
    const bossBarHeight = healthBarHeight; // Même hauteur que la barre du joueur (20 pixels)
    const bossBarX = scene.scale.width - bossBarWidth - 20; // Aligné à droite (screenWidth - 370)
    const bossBarY = healthBarY; // EXACTEMENT la même hauteur Y que la barre du joueur
    this.bossHealthBarBg = scene.add.rectangle(bossBarX, bossBarY, bossBarWidth, bossBarHeight, 0x111111)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);
    
    this.bossHealthBarFill = scene.add.rectangle(bossBarX, bossBarY, bossBarWidth, bossBarHeight, 0x00ff00)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);
    
    // Nom du boss (EN DESSOUS de la barre, aligné à droite, sans préfixe "BOSS:")
    const bossNameY = bossBarY + bossBarHeight + 5; // En dessous de la barre + espacement de 5px
    const bossNameX = bossBarX + bossBarWidth; // Position X à droite de la barre
    this.bossNameLabel = scene.add.text(bossNameX, bossNameY, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setOrigin(1, 0) // Aligné à droite (setOrigin(1, 0))
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);
    
    // Ancien label "BOSS" supprimé - on utilise maintenant bossNameLabel
    this.bossHealthLabel = null;

    // ========================================
    // ÉLÉMENTS ARCADE RÉTRO
    // ========================================
    
    // INSERT COIN (Haut Droite) - Clignotant
    // DÉSACTIVÉ PROVISOIREMENT
    // this.insertCoinText = scene.add.text(scene.scale.width - 20, 10, 'INSERT COIN', {
    //   fontSize: '20px',
    //   fontFamily: 'monospace',
    //   color: '#ffff00',
    //   stroke: '#000000',
    //   strokeThickness: 3,
    // })
    //   .setOrigin(1, 0) // Ancré à droite
    //   .setDepth(10)
    //   .setScrollFactor(0);
    
    // Animation de clignotement infinie
    // scene.tweens.add({
    //   targets: this.insertCoinText,
    //   alpha: { from: 1, to: 0.3 },
    //   duration: 800,
    //   ease: 'Sine.easeInOut',
    //   yoyo: true,
    //   repeat: -1
    // });
    this.insertCoinText = null; // Désactivé

    // TIMER (Haut Milieu) - Style Arcade
    this.timerLabel = scene.add.text(scene.scale.width / 2, 10, 'TIME 99', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setScrollFactor(0);

    // INDICATEUR D'ARME (Sous le timer, au centre) - Style Arcade (sans texte, sans cadre)
    const weaponIndicatorX = scene.scale.width / 2;
    const weaponIndicatorY = 10 + 50; // Sous le timer (10 + 50 = 60)
    
    // Icône de l'arme (par défaut: poing) - sans cadre
    this.weaponIcon = scene.add.text(weaponIndicatorX, weaponIndicatorY + 9, '👊', {
      fontSize: '30px',
    })
      .setOrigin(0.5, 0.5)
      .setDepth(10)
      .setScrollFactor(0);
    
    // Barre de durabilité (en dessous de l'icône)
    this.weaponDurabilityBarBg = scene.add.rectangle(weaponIndicatorX, weaponIndicatorY + 35, 35, 4, 0x333333)
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);
    
    this.weaponDurabilityBarFill = scene.add.rectangle(weaponIndicatorX - 17.5, weaponIndicatorY + 35, 0, 4, 0x00ff00)
      .setOrigin(0, 0)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);

    // NE PAS ajouter les barres au conteneur root (qui a un offset de 20,20)
    // Les barres doivent être positionnées directement dans la scène pour un alignement précis
    // this.root.add([
    //   this.healthBarBg,
    //   this.healthBarFill,
    //   this.waveLabel,
    //   this.scoreLabel,
    // ]);
  }

  updateHealth(current, max) {
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    this.healthBarFill.scaleX = pct;
    
    // SYSTÈME DE COULEUR DYNAMIQUE selon le pourcentage de vie
    let healthColor;
    if (pct > 0.75) {
      healthColor = 0x00ff00; // Vert (> 75%)
    } else if (pct > 0.50) {
      healthColor = 0xffff00; // Jaune (50-75%)
    } else if (pct > 0.25) {
      healthColor = 0xffa500; // Orange (25-50%)
    } else {
      healthColor = 0xff0000; // Rouge (< 25% - Critique)
    }
    
    // Appliquer la couleur dynamique
    this.healthBarFill.setFillStyle(healthColor);
  }
  
  updateBossHealth(current, max) {
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    this.bossHealthBarFill.scaleX = pct;
    // Forcer la position Y pour garantir l'alignement avec la barre du joueur
    this.bossHealthBarBg.y = 10;
    this.bossHealthBarFill.y = 10;
    
    // SYSTÈME DE COULEUR DYNAMIQUE selon le pourcentage de vie (même logique que le joueur)
    let healthColor;
    if (pct > 0.75) {
      healthColor = 0x00ff00; // Vert (> 75%)
    } else if (pct > 0.50) {
      healthColor = 0xffff00; // Jaune (50-75%)
    } else if (pct > 0.25) {
      healthColor = 0xffa500; // Orange (25-50%)
    } else {
      healthColor = 0xff0000; // Rouge (< 25% - Critique)
    }
    
    // Appliquer la couleur dynamique
    this.bossHealthBarFill.setFillStyle(healthColor);
    
    // NE PLUS afficher les PV numériques - juste le nom du boss (déjà défini dans showBossHealth)
  }

  updateWave(current, total, label = '') {
    const name = label ? ` — ${label}` : '';
    this.waveLabel.setText(`Wave ${current}/${total}${name}`);
  }

  updateScore(score) {
    this.scoreLabel.setText(`Score ${score.toString().padStart(6, '0')}`);
  }

  showStatus(text) {
    this.statusLabel.setText(text);
    this.scene.tweens.add({
      targets: this.statusLabel,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Sine.easeOut',
      onStart: () => this.statusLabel.setAlpha(1),
    });
  }

  showStageClear() {
    this.statusLabel.setAlpha(1).setText('STAGE CLEAR!');
    this.scene.tweens.add({
      targets: this.statusLabel,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      ease: 'Sine.easeInOut',
    });
  }
  
  showBossHealth(current, max, bossName = '') {
    this.bossHealthBarBg.setVisible(true);
    this.bossHealthBarFill.setVisible(true);
    
    // Stocker le nom du boss pour le garder affiché lors des mises à jour
    this.currentBossName = bossName || 'BOSS';
    
    // Afficher uniquement le nom du boss (sans préfixe "BOSS:" et sans PV)
    if (this.bossNameLabel) {
      this.bossNameLabel.setText(this.currentBossName);
      this.bossNameLabel.setVisible(true);
    }
    
    this.updateBossHealth(current, max);
  }
  
  hideBossHealth() {
    this.bossHealthBarBg.setVisible(false);
    this.bossHealthBarFill.setVisible(false);
    if (this.bossNameLabel) {
      this.bossNameLabel.setVisible(false);
    }
  }

  // Afficher le combo avec animation
  showCombo(comboCount, multiplier) {
    const comboTexts = {
      1: 'HIT!',
      2: 'DOUBLE!',
      3: 'TRIPLE!',
      4: 'SMASH!',
      5: 'COMBO!',
    };
    
    const text = comboTexts[comboCount] || `${comboCount}x COMBO!`;
    const multiplierText = multiplier > 1 ? `x${multiplier.toFixed(1)}` : '';
    
    this.comboLabel.setText(text);
    this.comboMultiplierLabel.setText(multiplierText);
    
    // Animation d'apparition
    this.comboLabel.setVisible(true).setAlpha(1);
    this.comboMultiplierLabel.setVisible(multiplier > 1).setAlpha(1);
    
    // Scale animation
    this.comboLabel.setScale(0.5);
    this.scene.tweens.add({
      targets: this.comboLabel,
      scale: { from: 0.5, to: 1.2 },
      duration: 150,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: [this.comboLabel, this.comboMultiplierLabel],
          alpha: { from: 1, to: 0 },
          duration: 500,
          delay: 300,
          onComplete: () => {
            this.comboLabel.setVisible(false);
            this.comboMultiplierLabel.setVisible(false);
          }
        });
      }
    });
    
    if (multiplier > 1) {
      this.comboMultiplierLabel.setScale(0.5);
      this.scene.tweens.add({
        targets: this.comboMultiplierLabel,
        scale: { from: 0.5, to: 1 },
        duration: 150,
        ease: 'Back.easeOut',
      });
    }
  }

  // Mettre à jour la barre de rage
  updateRage(current, max) {
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    const maxWidth = 350; // Même largeur que la barre de vie (350 pixels)
    this.rageBarFill.width = maxWidth * pct;
    this.rageBarFill.x = 20; // Aligné avec la barre de vie
    
    // Changer la couleur selon le niveau de rage
    if (pct >= 1) {
      this.rageBarFill.setFillStyle(0xffff00); // Jaune quand plein
    } else if (pct >= 0.7) {
      this.rageBarFill.setFillStyle(0xff00ff); // Magenta
    } else {
      this.rageBarFill.setFillStyle(0xff0088); // Rose foncé
    }
  }

  // Mettre à jour le timer
  updateTimer(seconds) {
    const timeStr = seconds.toString().padStart(2, '0');
    this.timerLabel.setText(`TIME ${timeStr}`);
    
    // Changer la couleur si moins de 10 secondes (rouge clignotant)
    if (seconds <= 10) {
      this.timerLabel.setColor('#ff0000');
      // Animation de clignotement
      if (!this.timerBlinking) {
        this.timerBlinking = true;
        this.scene.tweens.add({
          targets: this.timerLabel,
          alpha: { from: 1, to: 0.5 },
          duration: 300,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.timerLabel.setColor('#ffffff');
      if (this.timerBlinking) {
        this.timerBlinking = false;
        this.timerLabel.setAlpha(1);
      }
    }
  }

  // Mettre à jour l'indicateur d'arme
  updateWeapon(weapon, durability, maxDurability) {
    if (!weapon) {
      // Pas d'arme : afficher poing
      this.weaponIcon.setText('👊');
      this.weaponDurabilityBarBg.setVisible(false);
      this.weaponDurabilityBarFill.setVisible(false);
      return;
    }

    // Afficher l'icône selon le type d'arme
    const weaponIcons = {
      'pipe': '🔧',
      'knife': '🔪',
      'bat': '⚾',
      'sword': '⚔️',
    };
    
    this.weaponIcon.setText(weaponIcons[weapon.spriteKey] || '🔧');
    
    // Afficher et mettre à jour la barre de durabilité
    this.weaponDurabilityBarBg.setVisible(true);
    this.weaponDurabilityBarFill.setVisible(true);
    
    const pct = Phaser.Math.Clamp(durability / maxDurability, 0, 1);
    const maxWidth = 35;
    this.weaponDurabilityBarFill.width = maxWidth * pct;
    this.weaponDurabilityBarFill.x = this.scene.scale.width / 2 - 17.5;
    
    // Changer la couleur selon la durabilité
    if (pct > 0.5) {
      this.weaponDurabilityBarFill.setFillStyle(0x00ff00); // Vert
    } else if (pct > 0.25) {
      this.weaponDurabilityBarFill.setFillStyle(0xffff00); // Jaune
    } else {
      this.weaponDurabilityBarFill.setFillStyle(0xff0000); // Rouge
    }
  }
}

