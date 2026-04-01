import Phaser from 'phaser';

const PROJECTILE_KEY = 'enemy-bullet';

export function preloadProjectiles(scene) {
  scene.load.image(`${PROJECTILE_KEY}-1`, '/vfx/projectiles/shot-01-01.png');
  scene.load.image(`${PROJECTILE_KEY}-2`, '/vfx/projectiles/shot-01-02.png');
}

export function createProjectileAnimations(scene) {
  if (scene.anims.exists(PROJECTILE_KEY)) {
    return;
  }

  scene.anims.create({
    key: PROJECTILE_KEY,
    frames: [
      { key: `${PROJECTILE_KEY}-1` },
      { key: `${PROJECTILE_KEY}-2` },
    ],
    frameRate: 10,
    repeat: -1,
  });
}

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, `${PROJECTILE_KEY}-1`);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(2);
    this.setCollideWorldBounds(false);
    this.body.allowGravity = false;

    this.damage = 10;
    this.lifespan = 4000;
    this.speed = 300;
    this.direction = 1;

    this.play(PROJECTILE_KEY);
  }

  fire(startX, startY, direction, overrides = {}) {
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.reset(startX, startY);
    this.direction = direction;
    this.damage = overrides.damage ?? this.damage;
    this.speed = overrides.speed ?? this.speed;
    this.lifespan = overrides.lifespan ?? this.lifespan;

    this.setVelocityX(this.speed * this.direction);

    this.scene.time.delayedCall(this.lifespan, () => {
      if (this.active) this.destroyProjectile();
    });
  }

  destroyProjectile() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.body.stop();
  }
}

