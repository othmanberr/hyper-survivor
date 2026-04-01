import Phaser from 'phaser';

export default function spawnHitSpark(scene, x, y, options = {}) {
  const {
    color = 0xfff3a0,
    width = 26,
    height = 6,
    lifespan = 140,
    angle = Phaser.Math.Between(-25, 25),
  } = options;

  const spark = scene.add.rectangle(x, y, width, height, color).setDepth(20);
  spark.setBlendMode(Phaser.BlendModes.ADD);
  spark.rotation = Phaser.Math.DegToRad(angle);

  scene.tweens.add({
    targets: spark,
    alpha: { from: 1, to: 0 },
    scaleX: { from: 1, to: 2.2 },
    duration: lifespan,
    ease: 'Power2',
    onComplete: () => spark.destroy(),
  });
}

