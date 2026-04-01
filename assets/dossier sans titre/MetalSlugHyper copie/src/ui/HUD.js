import Phaser from 'phaser';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(20, 20).setDepth(10).setScrollFactor(0);

    this.healthBarBg = scene.add.rectangle(0, 0, 220, 18, 0x111111).setOrigin(0, 0);
    this.healthBarFill = scene.add.rectangle(0, 0, 220, 18, 0xff4444).setOrigin(0, 0);
    this.healthLabel = scene.add.text(0, -18, 'JEFF', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#fefefe',
    });

    this.waveLabel = scene.add.text(0, 34, 'Wave 1/3', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#f0f0f0',
    });

    this.scoreLabel = scene.add.text(0, 56, 'Score 000000', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#f0f0f0',
    });

    this.statusLabel = scene.add
      .text(scene.scale.width / 2, 40, '', {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#ffd966',
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setScrollFactor(0);

    // Barre de vie du boss (en bas de l'écran, initialement cachée)
    const bossBarY = scene.scale.height - 40;
    this.bossHealthBarBg = scene.add.rectangle(scene.scale.width / 2, bossBarY, 400, 24, 0x111111)
      .setOrigin(0.5, 0.5)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);
    
    this.bossHealthBarFill = scene.add.rectangle(scene.scale.width / 2, bossBarY, 400, 24, 0xFFD700)
      .setOrigin(0.5, 0.5)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);
    
    this.bossHealthLabel = scene.add.text(scene.scale.width / 2, bossBarY - 20, 'BOSS', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    })
      .setOrigin(0.5, 0.5)
      .setDepth(10)
      .setScrollFactor(0)
      .setVisible(false);

    this.root.add([
      this.healthLabel,
      this.healthBarBg,
      this.healthBarFill,
      this.waveLabel,
      this.scoreLabel,
    ]);
  }

  updateHealth(current, max) {
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    this.healthBarFill.scaleX = pct;
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
  
  showBossHealth(current, max) {
    this.bossHealthBarBg.setVisible(true);
    this.bossHealthBarFill.setVisible(true);
    this.bossHealthLabel.setVisible(true);
    this.updateBossHealth(current, max);
  }
  
  updateBossHealth(current, max) {
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    this.bossHealthBarFill.scaleX = pct;
    
    // Mettre à jour le texte avec les PV
    this.bossHealthLabel.setText(`BOSS ${current}/${max}`);
  }
  
  hideBossHealth() {
    this.bossHealthBarBg.setVisible(false);
    this.bossHealthBarFill.setVisible(false);
    this.bossHealthLabel.setVisible(false);
  }
}

