import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { getBossConfig } from '../config/BossConfig.js';
import { spawnEnemy } from '../entities/Enemy.js';

/**
 * BossManager - Gestion du boss
 * 
 * Responsabilités :
 * - Cinématique d'entrée du boss
 * - Spawn et initialisation du boss
 * - IA du boss (différents types: CHASER, SHOOTER, TANK, etc.)
 * - Attaques du boss (projectiles, bombes, sauts, etc.)
 */
export default class BossManager {
    constructor(scene) {
        this.scene = scene;
        this.boss = null;
        this.bossActive = false;
        this.bossProjectiles = null;
    }

    /**
     * Initialise le manager
     */
    init() {
        this.bossProjectiles = this.scene.physics.add.group();
    }

    /**
     * Cinématique d'entrée du boss
     */
    startFinalBossCutscene() {
        const bossConfig = getBossConfig(this.scene.levelIndex);
        const bossName = bossConfig?.name || this.scene.levelConfig?.bossName || 'BOSS';
        console.log(`[CUTSCENE] Démarrage de la cinématique pour ${bossName}`);

        // ÉTAPE 1 : FREEZE
        this.scene.input.enabled = false;
        if (this.scene.player) {
            this.scene.player.setVelocityX(0);
            this.scene.player.setVelocityY(0);
            this.scene.player.playAction('idle', true);
            this.scene.player.isLocked = true;
        }

        if (this.scene.audioManager?.stopBGM) {
            this.scene.audioManager.stopBGM();
        }

        // ÉTAPE 2 : ALERTE
        this.scene.time.delayedCall(500, () => {
            this._showAlertEffect();

            // ÉTAPE 3 : ENTRÉE DU BOSS
            this.scene.time.delayedCall(1500, () => {
                this._spawnBossWithAnimation(bossConfig);
            });
        });
    }

    _showAlertEffect() {
        const redOverlay = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0xff0000,
            0
        );
        redOverlay.setDepth(200);
        redOverlay.setScrollFactor(0);

        this.scene.tweens.add({
            targets: redOverlay,
            alpha: { from: 0, to: 0.3 },
            duration: 200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 3,
            onComplete: () => redOverlay.destroy()
        });

        const warningText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'WARNING: WHALE ALERT',
            {
                fontSize: '48px',
                fontFamily: 'monospace',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
            }
        )
            .setOrigin(0.5, 0.5)
            .setDepth(201)
            .setScrollFactor(0)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: warningText,
            alpha: { from: 0, to: 1 },
            duration: 300,
            yoyo: true,
            repeat: 1,
            onComplete: () => warningText.destroy()
        });
    }

    _spawnBossWithAnimation(bossConfig) {
        const bossX = this.scene.player ? this.scene.player.x + 400 : 800;
        const bossYStart = -200;
        const bossYEnd = this.scene.groundY ?? (this.scene.scale.height - 120);

        // Pan de la caméra
        const camTargetX = bossX - this.scene.scale.width / 2;

        this.scene.tweens.add({
            targets: this.scene.cameras.main,
            scrollX: camTargetX,
            duration: 2000,
            ease: 'Power2.easeInOut',
            onComplete: () => {
                this._createBossSprite(bossConfig, bossX, bossYStart, bossYEnd);
            }
        });
    }

    _createBossSprite(bossConfig, bossX, bossYStart, bossYEnd) {
        this.bossActive = true;
        this.scene.bossActive = true;
        const playerIdleKey = Player.frameKey('idle', 1);

        this.boss = this.scene.physics.add.sprite(bossX, bossYStart, playerIdleKey);
        this.boss.setScale(bossConfig.scale || 4);
        this.boss.setTint(bossConfig.tint || 0xF3BA2F);
        this.boss.setDepth(100);
        this.boss.setVisible(true);
        this.boss.setActive(true);

        this.boss.health = bossConfig.hp || this.scene.levelConfig.bossHP;
        this.boss.maxHealth = bossConfig.hp || this.scene.levelConfig.bossHP;
        this.boss.isDead = false;
        this.boss.isLocked = true;

        // Référence dans la scène
        this.scene.boss = this.boss;

        // Animation de chute
        this.scene.tweens.add({
            targets: this.boss,
            y: bossYEnd,
            duration: 800,
            ease: 'Power3.easeIn',
            onComplete: () => {
                this.scene.vfxManager.applyScreenShake(30);
                this.scene.vfxManager.spawnHitParticles(this.boss.x, this.boss.y, true);

                // Dialogue
                this.scene.time.delayedCall(500, () => {
                    this._showBossDialogue(bossConfig);
                });
            }
        });
    }

    _showBossDialogue(bossConfig) {
        const dialogues = {
            10: "Funds are SAFU...\nBut YOU are not.",
            9: "Backdoor? What backdoor?\nI'm just... optimizing.",
            8: "KYC required!\nCode is NOT law here!",
            7: "The house always wins.\nYou're just a statistic.",
            6: "I hunt wicks.\nYou're my next target.",
            5: "Stable? Always.\nUntil it's not.",
            4: "Original code?\nWhy code when you can fork?",
            3: "50x leverage?\nWhat could go wrong?",
            2: "Vesting? I print faster\nthan you can count.",
            1: "Supercycle incoming!\nTrust me, bro.",
        };
        const dialogueContent = dialogues[this.scene.levelIndex] || "You've reached the end.\nNow face me!";

        const dialogueText = this.scene.add.text(
            this.boss.x,
            this.boss.y - 100,
            dialogueContent,
            {
                fontSize: '24px',
                fontFamily: 'monospace',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
                backgroundColor: '#000000',
                padding: { x: 15, y: 10 }
            }
        )
            .setOrigin(0.5, 0.5)
            .setDepth(202)
            .setScrollFactor(1, 1);

        this.scene.time.delayedCall(3000, () => {
            dialogueText.destroy();
            this._showFightText(bossConfig);
        });
    }

    _showFightText(bossConfig) {
        const finalCamX = (this.scene.player.x + this.boss.x) / 2 - this.scene.scale.width / 2;

        this.scene.tweens.add({
            targets: this.scene.cameras.main,
            scrollX: finalCamX,
            duration: 1500,
            ease: 'Power2.easeInOut',
            onComplete: () => {
                const fightText = this.scene.add.text(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                    'FIGHT!',
                    {
                        fontSize: '72px',
                        fontFamily: 'monospace',
                        color: '#ff0000',
                        stroke: '#000000',
                        strokeThickness: 8,
                    }
                )
                    .setOrigin(0.5, 0.5)
                    .setDepth(203)
                    .setScrollFactor(0)
                    .setAlpha(0)
                    .setScale(0.5);

                this.scene.tweens.add({
                    targets: fightText,
                    alpha: { from: 0, to: 1 },
                    scale: { from: 0.5, to: 1.5 },
                    duration: 400,
                    ease: 'Back.easeOut',
                    yoyo: true,
                    onComplete: () => {
                        fightText.destroy();
                        this._finalizeBossSpawn(bossConfig);
                    }
                });
            }
        });
    }

    _finalizeBossSpawn(bossConfig) {
        if (!this.boss) return;

        // Propriétés du boss
        this.boss.lastAttackTime = 0;
        this.boss.attackCooldown = bossConfig.attackRate || 2000;
        this.boss.isAttacking = false;
        this.boss.attackState = 'idle';
        this.boss.aiType = bossConfig.aiType || 'UBER';
        this.boss.speed = bossConfig.speed || 180;
        this.boss.damage = 20;
        this.boss.attackRange = 100;
        this.boss.knockbackResist = bossConfig.knockbackResist || false;

        // Variables d'IA
        this.boss.lastDashTime = 0;
        this.boss.isDashing = false;
        this.boss.lastShotTime = 0;
        this.boss.lastBombTime = 0;
        this.boss.lastJumpTime = 0;
        this.boss.lastSummonTime = 0;
        this.boss.randomDirection = { x: 0, y: 0 };
        this.boss.randomTimer = 0;
        this.boss.uberPhase = 0;
        this.boss.uberTimer = 0;
        this.boss.isCharging = false;
        this.boss.dashTarget = { x: 0, y: 0 };
        this.boss.lastFired = 0;

        // Hitbox d'attaque
        this.boss.attackHitbox = this.scene.add.zone(this.boss.x, this.boss.y, 100, 100);
        this.scene.physics.add.existing(this.boss.attackHitbox);
        this.boss.attackHitbox.body.setAllowGravity(false);
        this.boss.attackHitbox.body.enable = false;

        // Animation idle
        this.boss.play(Player.animKey('idle'), true);

        // Physique
        if (this.boss.body) {
            const realWidth = this.boss.width;
            const realHeight = this.boss.height;
            const hitboxWidth = realWidth * 0.2;
            const hitboxHeight = realHeight * 0.2;
            this.boss.body.setSize(hitboxWidth, hitboxHeight);
            const offsetX = (realWidth - hitboxWidth) / 2;
            const offsetY = (realHeight - hitboxHeight) / 2;
            this.boss.body.setOffset(offsetX, offsetY);
            this.boss.body.enable = true;
            this.boss.body.setImmovable(false);
            this.boss.body.setCollideWorldBounds(true);
            this.boss.body.setGravityY(0);
        }

        // Collisions
        this._setupBossCollisions();

        // Méthode takeDamage
        this._setupBossTakeDamage(bossConfig);

        // Afficher la barre de vie
        if (this.scene.hud) {
            const bossName = bossConfig?.name || this.scene.levelConfig?.bossName || 'GENERAL ZHAO';
            this.scene.hud.showBossHealth(this.boss.health, this.boss.maxHealth, bossName);
        }

        // Rendre les contrôles
        this.scene.input.enabled = true;
        if (this.scene.player) {
            this.scene.player.isLocked = false;
        }
        this.boss.isLocked = false;
        this.scene.waveManager.isWaveActive = true;

        if (this.scene.audioManager?.playBGM) {
            this.scene.audioManager.playBGM();
        }

        console.log('[CUTSCENE] Cinématique terminée, combat commencé!');
    }

    _setupBossCollisions() {
        if (this.scene.player) {
            this.scene.physics.add.collider(
                this.scene.player, this.boss,
                this.scene.combatManager.handleBossTouchPlayer.bind(this.scene.combatManager),
                null, this.scene
            );
        }

        if (this.scene.player?.attackHitbox) {
            this.scene.physics.add.overlap(
                this.scene.player.attackHitbox, this.boss,
                this.scene.combatManager.handlePlayerHitBoss.bind(this.scene.combatManager),
                null, this.scene
            );
        }

        if (this.scene.player && this.boss.attackHitbox) {
            this.scene.physics.add.overlap(
                this.boss.attackHitbox, this.scene.player,
                this.scene.combatManager.handleBossAttackHitPlayer.bind(this.scene.combatManager),
                null, this.scene
            );
        }
    }

    _setupBossTakeDamage(bossConfig) {
        this.boss.takeDamage = (amount, sourceX = null) => {
            if (this.boss.isDead) return;

            this.boss.health -= amount;
            console.log(`[BOSS] Dégâts: ${amount}, PV: ${this.boss.health}`);

            // Knockback
            if (sourceX !== null && this.boss.body && !this.boss.knockbackResist) {
                const knockDir = this.boss.x < sourceX ? -1 : 1;
                this.boss.body.setVelocityX(knockDir * -100);

                this.scene.time.addEvent({
                    delay: 20,
                    repeat: 5,
                    callback: () => {
                        if (this.boss && !this.boss.isDead && this.boss.body) {
                            this.boss.body.setVelocityX(this.boss.body.velocity.x * 0.7);
                        }
                    }
                });
            }

            // Flash rouge
            this._applyBossFlash(bossConfig);

            // Update HUD
            if (this.scene.hud) {
                this.scene.hud.updateBossHealth(this.boss.health, this.boss.maxHealth);
            }

            if (this.boss.health <= 0) {
                this.boss.isDead = true;
                this.bossActive = false;
                this.scene.bossActive = false;
                this.scene._handleStageClear();
                if (this.scene.hud) {
                    this.scene.hud.hideBossHealth();
                }
                this.boss.destroy();
                this.boss = null;
                this.scene.boss = null;
            }
        };
    }

    _applyBossFlash(bossConfig) {
        let flashCount = 0;
        const flashTimer = this.scene.time.addEvent({
            delay: 50,
            repeat: 4,
            callback: () => {
                if (this.boss && !this.boss.isDead) {
                    flashCount++;
                    if (flashCount % 2 === 0) {
                        this.boss.setTint(0xff3333);
                    } else {
                        this.boss.setTint(bossConfig?.tint || 0xF3BA2F);
                    }
                    if (flashCount >= 4) {
                        this.boss.setTint(bossConfig?.tint || 0xF3BA2F);
                        flashTimer.destroy();
                    }
                } else {
                    flashTimer.destroy();
                }
            }
        });
    }

    /**
     * Mise à jour de l'IA du boss
     */
    updateBossAI(time) {
        if (!this.boss || !this.scene.player || this.boss.isDead || this.boss.isAttacking) {
            return;
        }

        // Orientation vers le joueur
        this.boss.flipX = this.scene.player.x < this.boss.x;

        const distance = Phaser.Math.Distance.Between(
            this.boss.x, this.boss.y,
            this.scene.player.x, this.scene.player.y
        );

        // Dispatch selon le type d'IA
        switch (this.boss.aiType) {
            case 'CHASER':
                this._updateChaserAI(distance, time);
                break;
            case 'SHOOTER':
                this._updateShooterAI(distance, time);
                break;
            case 'TANK':
                this._updateTankAI(distance, time);
                break;
            case 'DASHER':
                this._updateDasherAI(distance, time);
                break;
            case 'TURRET':
                this._updateTurretAI(distance, time);
                break;
            case 'BOMBER':
                this._updateBomberAI(distance, time);
                break;
            case 'JUMPER':
                this._updateJumperAI(distance, time);
                break;
            case 'RANDOM':
                this._updateRandomAI(distance, time);
                break;
            case 'SUMMONER':
                this._updateSummonerAI(distance, time);
                break;
            case 'UBER':
            default:
                this._updateUberAI(distance, time);
                break;
        }

        // Clamping
        this.scene._clampSpriteToRoad(this.boss);
    }

    // ===== AI METHODS =====

    _updateChaserAI(distance, time) {
        const attackRange = this.boss.attackRange || 100;
        const canAttack = time >= this.boss.lastAttackTime + this.boss.attackCooldown;

        if (distance > attackRange) {
            this.scene.physics.moveToObject(this.boss, this.scene.player, this.boss.speed || 200);
            if (this.boss.attackState !== 'walking') {
                this.boss.attackState = 'walking';
                this.boss.play(Player.animKey('walk'), true);
            }
        } else if (canAttack && !this.boss.isAttacking) {
            this.performAttack(time);
        } else {
            this.boss.body.setVelocity(0, 0);
            if (this.boss.attackState !== 'idle') {
                this.boss.attackState = 'idle';
                this.boss.play(Player.animKey('idle'), true);
            }
        }
    }

    _updateShooterAI(distance, time) {
        const preferredDistance = 300;
        const tolerance = 50;

        if (distance < preferredDistance - tolerance) {
            const dx = this.boss.x - this.scene.player.x;
            const dy = this.boss.y - this.scene.player.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            this.boss.body.setVelocity((dx / len) * 80, (dy / len) * 80 * 0.6);
        } else if (distance > preferredDistance + tolerance) {
            this.scene.physics.moveToObject(this.boss, this.scene.player, 80);
        } else {
            this.boss.body.setVelocity(0, 0);
        }

        // Tir
        if (time >= this.boss.lastShotTime + this.boss.attackCooldown && !this.boss.isCharging) {
            this._startShooterCharge(time);
        }
    }

    _startShooterCharge(time) {
        this.boss.isCharging = true;
        this.boss.lastShotTime = time;

        let flashCount = 0;
        const maxFlashes = 4;
        const bossConfig = getBossConfig(this.scene.levelIndex);

        const flashTimer = this.scene.time.addEvent({
            delay: 100,
            repeat: maxFlashes,
            callback: () => {
                if (this.boss && !this.boss.isDead) {
                    flashCount++;
                    this.boss.setTint(flashCount % 2 === 0 ? 0xffffff : (bossConfig?.tint || 0xff0000));

                    if (flashCount >= maxFlashes) {
                        this._fireProjectile(this.scene.player);
                        this.boss.isCharging = false;
                        this.boss.setTint(bossConfig?.tint || 0xff0000);
                        flashTimer.destroy();
                    }
                } else {
                    flashTimer.destroy();
                }
            }
        });
    }

    _updateTankAI(distance, time) {
        if (!this.boss.body.immovable) {
            this.boss.body.setImmovable(true);
        }
        this.scene.physics.moveToObject(this.boss, this.scene.player, 20);

        if (this.boss.attackState !== 'walking') {
            this.boss.attackState = 'walking';
            this.boss.play(Player.animKey('walk'), true);
        }
    }

    _updateDasherAI(distance, time) {
        const dashCooldown = 3000;
        const waitTime = 1000;

        if (!this.boss.isDashing && time >= this.boss.lastDashTime + waitTime && time < this.boss.lastDashTime + dashCooldown) {
            this.boss.body.setVelocity(0, 0);
            if (this.boss.attackState !== 'idle') {
                this.boss.attackState = 'idle';
                this.boss.play(Player.animKey('idle'), true);
            }
        }

        if (!this.boss.isDashing && time >= this.boss.lastDashTime + dashCooldown) {
            this.boss.dashTarget.x = this.scene.player.x;
            this.boss.dashTarget.y = this.scene.player.y;
            this.boss.isDashing = true;
            this.boss.lastDashTime = time;

            this.scene.physics.moveTo(this.boss, this.boss.dashTarget.x, this.boss.dashTarget.y, 600);

            if (this.boss.attackState !== 'walking') {
                this.boss.attackState = 'walking';
                this.boss.play(Player.animKey('walk'), true);
            }

            this.scene.time.delayedCall(500, () => {
                if (this.boss && !this.boss.isDead) {
                    this.boss.isDashing = false;
                    this.boss.body.setVelocity(0, 0);
                    this.boss.lastDashTime = this.scene.time.now;
                }
            });
        }
    }

    _updateTurretAI(distance, time) {
        this.boss.body.setVelocity(0, 0);

        if (this.boss.attackState !== 'idle') {
            this.boss.attackState = 'idle';
            this.boss.play(Player.animKey('idle'), true);
        }

        if (time >= this.boss.lastShotTime + this.boss.attackCooldown) {
            this._fireTurretProjectiles(3);
            this.boss.lastShotTime = time;
        }
    }

    _updateBomberAI(distance, time) {
        this.boss.body.setVelocity(0, 0);

        if (this.boss.attackState !== 'idle') {
            this.boss.attackState = 'idle';
            this.boss.play(Player.animKey('idle'), true);
        }

        if (time >= this.boss.lastBombTime + this.boss.attackCooldown) {
            this._dropBomb();
            this.boss.lastBombTime = time;
        }
    }

    _updateJumperAI(distance, time) {
        if (this.boss.isAttacking) {
            this.boss.body.setVelocity(0, 0);
            return;
        }

        if (time >= this.boss.lastJumpTime + (this.boss.attackCooldown || 2000)) {
            this._bossJump();
            this.boss.lastJumpTime = time;
        }

        if (!this.boss.isAttacking) {
            this.scene.physics.moveToObject(this.boss, this.scene.player, this.boss.speed || 200);
            if (this.boss.attackState !== 'walking') {
                this.boss.attackState = 'walking';
                this.boss.play(Player.animKey('walk'), true);
            }
        }
    }

    _updateRandomAI(distance, time) {
        if (this.boss.isAttacking) {
            this.boss.body.setVelocity(0, 0);
            return;
        }

        if (time >= this.boss.randomTimer + 1000) {
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            this.boss.randomDirection.x = Math.cos(angle);
            this.boss.randomDirection.y = Math.sin(angle);
            this.boss.randomTimer = time;
        }

        const speed = this.boss.speed || 100;
        this.boss.body.setVelocity(
            this.boss.randomDirection.x * speed,
            this.boss.randomDirection.y * speed * 0.8
        );

        if (this.boss.attackState !== 'walking') {
            this.boss.attackState = 'walking';
            this.boss.play(Player.animKey('walk'), true);
        }

        const canAttack = time >= this.boss.lastAttackTime + this.boss.attackCooldown;
        if (distance < (this.boss.attackRange || 100) && canAttack && !this.boss.isAttacking) {
            this.performAttack(time);
        }
    }

    _updateSummonerAI(distance, time) {
        if (this.boss.isAttacking) {
            this.boss.body.setVelocity(0, 0);
            return;
        }

        if (time >= this.boss.lastSummonTime + (this.boss.attackCooldown || 5000)) {
            this._summonGuards();
            this.boss.lastSummonTime = time;
        }

        if (!this.boss.isAttacking) {
            this.scene.physics.moveToObject(this.boss, this.scene.player, this.boss.speed || 50);
            if (this.boss.attackState !== 'walking') {
                this.boss.attackState = 'walking';
                this.boss.play(Player.animKey('walk'), true);
            }
        }
    }

    _updateUberAI(distance, time) {
        const phaseDuration = 5000;
        const attackRange = this.boss.attackRange || 100;
        const canAttack = time >= this.boss.lastAttackTime + this.boss.attackCooldown;

        if (time >= this.boss.uberTimer + phaseDuration) {
            this.boss.uberPhase = (this.boss.uberPhase + 1) % 3;
            this.boss.uberTimer = time;
        }

        switch (this.boss.uberPhase) {
            case 0: // CHASER
                this._updateChaserAI(distance, time);
                break;
            case 1: // SHOOTER
                this._updateShooterAI(distance, time);
                break;
            case 2: // DASHER
                this._updateDasherAI(distance, time);
                break;
        }
    }

    // ===== ATTACK METHODS =====

    performAttack(time) {
        if (!this.boss || !this.scene.player || this.boss.isDead || this.boss.isAttacking) {
            return;
        }

        this.boss.lastAttackTime = time;
        this.boss.isAttacking = true;
        this.boss.attackState = 'attacking';
        this.boss.body.setVelocity(0, 0);

        this.boss.play(Player.animKey('punch'), true);
        const bossConfig = getBossConfig(this.scene.levelIndex);
        if (bossConfig) {
            this.boss.setTint(bossConfig.tint || 0xff0000);
            this.boss.setScale(bossConfig.scale || 4);
        }

        // Zone de dégâts
        this.scene.time.delayedCall(200, () => {
            if (!this.boss || !this.scene.player || this.boss.isDead || !this.boss.isAttacking) {
                return;
            }

            const direction = this.boss.flipX ? -1 : 1;
            const attackZoneX = this.boss.x + direction * 80;
            const attackZoneY = this.boss.y;

            const playerInZone = Phaser.Geom.Rectangle.Contains(
                new Phaser.Geom.Rectangle(
                    attackZoneX - 60,
                    attackZoneY - 50,
                    120,
                    100
                ),
                this.scene.player.x,
                this.scene.player.y
            );

            if (playerInZone && this.scene.player && !this.scene.player.invulnerable) {
                this.scene.player.takeDamage(this.boss.damage || 20);

                // Knockback
                const dx = this.scene.player.x - this.boss.x;
                const dy = this.scene.player.y - this.boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0 && this.scene.player.body) {
                    this.scene.player.body.setVelocity((dx / dist) * 400, (dy / dist) * 320);
                }

                this.scene.vfxManager.applyScreenShake(20);
                this.scene.vfxManager.spawnHitParticles(this.scene.player.x, this.scene.player.y, true);
                this.scene.vfxManager.applyHitStop(100);
            }
        });

        // Reset après animation
        this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (this.boss && !this.boss.isDead) {
                this.boss.isAttacking = false;
                this.boss.attackState = 'idle';
                this.boss.play(Player.animKey('idle'), true);
            }
        });

        this.scene.time.delayedCall(1000, () => {
            if (this.boss && !this.boss.isDead) {
                this.boss.isAttacking = false;
                this.boss.attackState = 'idle';
            }
        });
    }

    _fireProjectile(target) {
        const dx = target.x - this.boss.x;
        const dy = target.y - this.boss.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        const projectile = this.scene.add.rectangle(this.boss.x, this.boss.y, 12, 12, 0xff0000);
        this.scene.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.setDepth(3);

        const speed = 400;
        projectile.body.setVelocity((dx / len) * speed, (dy / len) * speed);

        this.scene.time.delayedCall(3000, () => {
            if (projectile?.active) projectile.destroy();
        });

        this.scene.physics.add.overlap(projectile, this.scene.player, (proj, player) => {
            if (player && !player.invulnerable) {
                player.takeDamage(this.boss.damage || 20);
            }
            if (proj?.active) proj.destroy();
        }, null, this.scene);
    }

    _fireTurretProjectiles(count) {
        const angleSpread = 360 / count;

        for (let i = 0; i < count; i++) {
            const angle = (i * angleSpread) * (Math.PI / 180);
            const projectile = this.scene.add.rectangle(this.boss.x, this.boss.y, 12, 12, 0xff0000);
            this.scene.physics.add.existing(projectile);
            projectile.body.setAllowGravity(false);
            projectile.setDepth(3);

            projectile.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

            this.scene.time.delayedCall(3000, () => {
                if (projectile?.active) projectile.destroy();
            });

            this.scene.physics.add.overlap(projectile, this.scene.player, (proj, player) => {
                if (player && !player.invulnerable) player.takeDamage(this.boss.damage || 20);
                if (proj?.active) proj.destroy();
            }, null, this.scene);
        }
    }

    _dropBomb() {
        const bombX = this.scene.player.x;
        const bombY = this.scene.player.y;

        const dangerZone = this.scene.add.circle(bombX, bombY, 60, 0xff0000, 0.5);
        dangerZone.setDepth(5);

        this.scene.tweens.add({
            targets: dangerZone,
            alpha: { from: 0.5, to: 1 },
            scale: { from: 0.8, to: 1.2 },
            duration: 500,
            repeat: 1,
            yoyo: true,
            onComplete: () => {
                if (this.scene.player && !this.scene.player.invulnerable) {
                    const distance = Phaser.Math.Distance.Between(bombX, bombY, this.scene.player.x, this.scene.player.y);
                    if (distance <= 60) {
                        this.scene.player.takeDamage(this.boss?.damage || 20);
                        this.scene.vfxManager.applyScreenShake(15);
                        this.scene.vfxManager.spawnHitParticles(bombX, bombY, true);
                    }
                }

                const explosion = this.scene.add.circle(bombX, bombY, 80, 0xff6600, 0.8);
                explosion.setDepth(5);
                this.scene.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: 2,
                    duration: 300,
                    onComplete: () => explosion.destroy()
                });

                dangerZone.destroy();
            }
        });
    }

    _bossJump() {
        if (this.boss.isAttacking) return;

        this.boss.isAttacking = true;
        const targetX = this.scene.player.x;
        const targetY = this.scene.player.y;

        this.scene.tweens.add({
            targets: this.boss,
            x: targetX,
            y: targetY - 150,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.boss,
                    y: targetY,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        this.boss.isAttacking = false;

                        const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.scene.player.x, this.scene.player.y);
                        if (distance <= 80 && this.scene.player && !this.scene.player.invulnerable) {
                            this.scene.player.takeDamage(this.boss.damage || 20);
                            this.scene.vfxManager.applyScreenShake(20);
                        }
                    }
                });
            }
        });
    }

    _summonGuards() {
        for (let i = 0; i < 2; i++) {
            const angle = (i * 180) * (Math.PI / 180);
            const spawnX = this.boss.x + Math.cos(angle) * 150;
            const spawnY = this.boss.y + Math.sin(angle) * 150;

            const guard = spawnEnemy(this.scene, 'punk', spawnX, spawnY);
            if (guard && this.scene.enemies) {
                guard.setDepth(5);
                this.scene._alignSpriteToGround(guard);
                this.scene._clampSpriteToRoad(guard);
                this.scene.enemies.add(guard);
            }
        }
        console.log('[BOSS] Gardes invoqués!');
    }

    /**
     * Mise à jour appelée dans update() de la scène
     */
    update(time) {
        if (this.boss && this.boss.active && !this.boss.isDead) {
            if (this.boss.body && this.scene.player?.active) {
                this.updateBossAI(time);

                // Synchroniser la hitbox d'attaque
                if (this.boss.attackHitbox) {
                    const direction = this.boss.flipX ? -1 : 1;
                    this.boss.attackHitbox.x = this.boss.x + direction * 80;
                    this.boss.attackHitbox.y = this.boss.y;
                }
            }
        }
    }

    destroy() {
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
    }
}
