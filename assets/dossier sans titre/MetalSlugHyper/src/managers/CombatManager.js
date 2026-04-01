import Phaser from 'phaser';
import Loot from '../entities/Loot.js';

/**
 * CombatManager - Gestion des collisions et du combat
 * 
 * Responsabilités :
 * - Collisions joueur vs ennemis
 * - Collisions joueur vs boss
 * - Collisions joueur vs props
 * - Système de loot
 * - Système d'armes équipées
 */
export default class CombatManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Quand le joueur frappe un ennemi
     */
    handlePlayerHitEnemy(playerHitbox, enemy) {
        // Vérifications de sécurité
        if (!enemy || !enemy.active || enemy.isDead) return;
        if (!enemy.body || !enemy.body.enable) return;
        if (enemy.isHit) return;
        if (!this.scene.player || !this.scene.player.active || !this.scene.player.body) return;
        if (!this.scene.player.attackState || !this.scene.player.attackState.active) return;
        if (!playerHitbox || !playerHitbox.active) return;

        // Marquer comme touché
        enemy.isHit = true;

        const resetTimer = this.scene.time.delayedCall(300, () => {
            if (enemy && enemy.active && !enemy.isDead) {
                enemy.isHit = false;
            }
        });

        if (enemy._hitResetTimer?.destroy) {
            enemy._hitResetTimer.destroy();
        }
        enemy._hitResetTimer = resetTimer;

        try {
            // Son
            this.scene.audioManager?.playSFX?.('punch');

            // Calcul des dégâts avec combo
            const comboCount = this.scene.player.comboCount || 1;
            const isFinisher = comboCount >= 3;
            const comboMultiplier = 1 + (comboCount - 1) * 0.6;
            const finisherBonus = isFinisher ? 2 : 0;

            let baseDamage = isFinisher ? (3 + finisherBonus) : 1;
            let weaponBonus = 0;
            const comboDamageBonus = Math.floor((comboCount - 1) * 0.5);

            // Système d'arme
            if (this.scene.player.currentWeapon && this.scene.player.weaponDurability > 0) {
                weaponBonus = this.scene.player.currentWeapon.damage;
                this.scene.player.weaponDurability--;

                if (this.scene.hud?.updateWeapon && this.scene.player.currentWeapon) {
                    this.scene.hud.updateWeapon(
                        this.scene.player.currentWeapon,
                        this.scene.player.weaponDurability,
                        this.scene.player.currentWeapon.maxDurability
                    );
                }

                if (this.scene.player.weaponDurability <= 0) {
                    this.unequipWeapon(this.scene.player);
                }
            }

            const damage = Math.floor((baseDamage + weaponBonus + comboDamageBonus) * comboMultiplier);
            const knockbackMultiplier = isFinisher ? 4 : (1 + comboCount * 0.3);

            // Appliquer les dégâts
            if (enemy.takeDamage && enemy.active && !enemy.isDead) {
                enemy.takeDamage(damage, this.scene.player.x);
            }

            this.scene.audioManager?.playSFX?.('hit');

            // Knockback finisher
            if (enemy.body?.enable && isFinisher && !enemy.isDead) {
                const dx = enemy.x - this.scene.player.x;
                const dy = enemy.y - this.scene.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0 && isFinite(distance)) {
                    const knockbackForce = 400 * knockbackMultiplier;
                    enemy.body.setVelocity(
                        (dx / distance) * knockbackForce,
                        (dy / distance) * knockbackForce
                    );
                }
            }

            // Score et rage
            const baseScore = 120;
            const score = Math.floor(baseScore * comboMultiplier);

            const rageGain = this.scene.player.rageGainPerHit +
                (comboCount > 1 ? this.scene.player.rageGainPerCombo * (comboCount - 1) : 0);
            this.scene.player.addRage(rageGain);
            this.scene.addScore(score);

            // VFX
            if (enemy.active && !enemy.isDead) {
                const hitStopDuration = isFinisher ? 200 : (50 + comboCount * 10);
                this.scene.vfxManager.applyHitStop(hitStopDuration);
                this.scene.vfxManager.applyScreenShake(isFinisher ? 20 : (5 + comboCount * 2));
                this.scene.vfxManager.spawnHitParticles(enemy.x, enemy.y, isFinisher);

                if (isFinisher && !this.scene.slowMotionActive) {
                    this.scene.vfxManager.activateSlowMotion(300);
                }

                // Texte de combo
                const comboTexts = {
                    1: 'HIT!', 2: 'DOUBLE!', 3: 'TRIPLE!', 4: 'COMBO!', 5: 'MEGA!'
                };
                const comboText = comboTexts[comboCount] || `${comboCount}x COMBO!`;
                this.scene.vfxManager.showComboText(enemy.x, enemy.y - 50, comboText, isFinisher);

                if (this.scene.hud?.showCombo) {
                    this.scene.hud.showCombo(comboCount, comboMultiplier);
                }
            }
        } catch (error) {
            console.error('[COMBAT] Erreur dans handlePlayerHitEnemy:', error);
            if (enemy?.active) {
                enemy.isHit = false;
            }
        }
    }

    /**
     * Quand le joueur frappe le boss
     */
    handlePlayerHitBoss(playerHitbox, boss) {
        if (!boss || !boss.active || boss.isDead) return;
        if (!boss.body || !boss.body.enable) return;
        if (boss.isHit) return;
        if (!this.scene.player || !this.scene.player.active || !this.scene.player.body) return;
        if (!this.scene.player.attackState || !this.scene.player.attackState.active) return;
        if (!playerHitbox || !playerHitbox.active) return;

        boss.isHit = true;

        this.scene.time.delayedCall(300, () => {
            if (boss && boss.active && !boss.isDead) {
                boss.isHit = false;
            }
        });

        try {
            const comboCount = this.scene.player.comboCount || 1;
            const isFinisher = comboCount === 3;
            const comboMultiplier = 1 + (comboCount - 1) * 0.6;
            const finisherBonus = isFinisher ? 2 : 0;

            let baseDamage = isFinisher ? (3 + finisherBonus) : 1;
            let weaponBonus = 0;
            const comboDamageBonus = Math.floor((comboCount - 1) * 0.5);

            if (this.scene.player.currentWeapon && this.scene.player.weaponDurability > 0) {
                weaponBonus = this.scene.player.currentWeapon.damage;
                this.scene.player.weaponDurability--;

                if (this.scene.hud?.updateWeapon && this.scene.player.currentWeapon) {
                    this.scene.hud.updateWeapon(
                        this.scene.player.currentWeapon,
                        this.scene.player.weaponDurability,
                        this.scene.player.currentWeapon.maxDurability
                    );
                }

                if (this.scene.player.weaponDurability <= 0) {
                    this.unequipWeapon(this.scene.player);
                }
            }

            const damage = Math.floor((baseDamage + weaponBonus + comboDamageBonus) * comboMultiplier);

            if (boss.takeDamage) {
                boss.takeDamage(damage, this.scene.player.x);
            }

            if (boss.active && !boss.isDead) {
                // Shake du boss
                this.scene.tweens.add({
                    targets: boss,
                    x: boss.x + Phaser.Math.Between(-8, 8),
                    y: boss.y + Phaser.Math.Between(-8, 8),
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });

                this.scene.vfxManager.spawnHitParticles(boss.x, boss.y, isFinisher);
                this.scene.vfxManager.applyScreenShake(isFinisher ? 10 : 5);
                this.scene.vfxManager.applyHitStop(isFinisher ? 100 : 30);

                const comboTexts = {
                    1: 'HIT!', 2: 'DOUBLE!', 3: 'TRIPLE!', 4: 'COMBO!', 5: 'MEGA!'
                };
                const comboText = comboTexts[comboCount] || `${comboCount}x COMBO!`;
                this.scene.vfxManager.showComboText(boss.x, boss.y - 80, comboText, isFinisher);

                if (isFinisher && !this.scene.slowMotionActive) {
                    this.scene.vfxManager.activateSlowMotion(400);
                }
            }
        } catch (error) {
            console.error('[COMBAT] Erreur dans handlePlayerHitBoss:', error);
            if (boss?.active) {
                boss.isHit = false;
            }
        }
    }

    /**
     * Quand le joueur frappe une prop
     */
    handlePlayerHitProp(playerHitbox, prop) {
        if (!prop || !prop.active || prop.isDead) return;
        if (!prop.body || !prop.body.enable) return;
        if (prop.isTakingDamage) return;
        if (!this.scene.player || !this.scene.player.active || !this.scene.player.body) return;

        if (!this.scene.player.hasActiveHitbox?.()) {
            if (!this.scene.player.attackState?.active) return;
        }

        if (!playerHitbox || !playerHitbox.active) return;
        if (!prop.scene) return;

        try {
            if (prop.takeDamage && prop.active && !prop.isDead) {
                prop.takeDamage(1);
            }

            if (prop.active && !prop.isDead) {
                this.scene.vfxManager.applyScreenShake(2);
            }
        } catch (error) {
            console.error('[COMBAT] Erreur dans handlePlayerHitProp:', error);
        }
    }

    /**
     * Quand le joueur collecte un loot
     */
    handlePlayerCollectLoot(player, loot) {
        if (!loot || !loot.active) return;

        if (loot instanceof Loot) {
            if (loot.collected) return;
            loot.collect();
            return;
        }

        if (loot.getData?.('collected')) return;

        if (loot.setData) {
            loot.setData('collected', true);
        }

        const lootType = loot.getData?.('type') || loot.type || 'GOLD';

        try {
            if (lootType === 'HEART') {
                if (this.scene.player && this.scene.player.health < this.scene.player.maxHealth) {
                    this.scene.player.health = Math.min(this.scene.player.health + 20, this.scene.player.maxHealth);
                    this.scene.events.emit('player-health-changed', {
                        current: this.scene.player.health,
                        max: this.scene.player.maxHealth
                    });
                }
            } else if (lootType === 'GOLD') {
                this.scene.addScore(100);
            } else if (lootType === 'WEAPON') {
                this.equipWeapon(this.scene.player);
            }

            this.scene.vfxManager.applyScreenShake(1);

            this.scene.tweens.add({
                targets: loot,
                y: loot.y - 50,
                alpha: 0,
                scale: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    if (loot?.active) {
                        loot.destroy();
                    }
                }
            });

        } catch (error) {
            console.error('[COMBAT] Erreur dans handlePlayerCollectLoot:', error);
            if (loot?.active) {
                loot.destroy();
            }
        }
    }

    /**
     * Quand le boss touche physiquement le joueur
     */
    handleBossTouchPlayer(player, boss) {
        if (boss.isDead || !player || player.invulnerable) return;

        const now = this.scene.time.now;
        if (!boss.lastTouchTime) boss.lastTouchTime = 0;

        if (now >= boss.lastTouchTime + 500) {
            boss.lastTouchTime = now;

            player.takeDamage(5);
            console.log('[BOSS] Touche le joueur! Dégâts appliqués');

            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && player.body) {
                const knockbackForce = 200;
                player.body.setVelocity(
                    (dx / distance) * knockbackForce,
                    (dy / distance) * knockbackForce
                );

                this.scene.time.delayedCall(200, () => {
                    if (player?.body) {
                        player.body.setVelocityX(player.body.velocity.x * 0.5);
                        player.body.setVelocityY(player.body.velocity.y * 0.5);
                    }
                });
            }
        }
    }

    /**
     * Quand la hitbox d'attaque du boss touche le joueur
     */
    handleBossAttackHitPlayer(bossHitbox, player) {
        const boss = this.scene.boss || this.scene.bossManager?.boss;
        if (!boss || boss.isDead || !player || player.invulnerable) return;
        if (!boss.isAttacking) return;

        player.takeDamage(15);
        console.log('[BOSS] Coup de poing! Joueur touché (15 dégâts)');

        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && player.body) {
            const knockbackForce = 300;
            player.body.setVelocity(
                (dx / distance) * knockbackForce,
                (dy / distance) * knockbackForce
            );

            this.scene.time.delayedCall(300, () => {
                if (player?.body) {
                    player.body.setVelocityX(player.body.velocity.x * 0.5);
                    player.body.setVelocityY(player.body.velocity.y * 0.5);
                }
            });
        }

        if (boss.attackHitbox?.body) {
            boss.attackHitbox.body.enable = false;
        }
    }

    /**
     * Équipe une arme au joueur
     */
    equipWeapon(player) {
        if (!player) return;

        player.currentWeapon = {
            damage: 20,
            maxDurability: 5,
            spriteKey: 'pipe'
        };
        player.weaponDurability = 5;

        if (this.scene.hud?.updateWeapon) {
            this.scene.hud.updateWeapon(player.currentWeapon, player.weaponDurability, player.currentWeapon.maxDurability);
        }

        if (player.weaponSprite) {
            player.weaponSprite.destroy();
        }

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x888888);
        graphics.fillRect(0, 0, 20, 4);
        graphics.fillStyle(0x666666);
        graphics.fillRect(2, 0, 4, 4);
        graphics.generateTexture('weapon-equipped', 20, 4);
        graphics.destroy();

        player.weaponSprite = this.scene.add.image(player.x, player.y, 'weapon-equipped');
        player.weaponSprite.setDepth(2);
        player.weaponSprite.setOrigin(0.5, 0.5);
        player.weaponSprite.setScale(1.2);

        console.log('[WEAPON] Arme équipée! Dégâts: +20, Durabilité: 5');
    }

    /**
     * Retire l'arme du joueur
     */
    unequipWeapon(player) {
        if (!player) return;

        if (player.weaponSprite) {
            player.weaponSprite.destroy();
            player.weaponSprite = null;
        }

        player.currentWeapon = null;
        player.weaponDurability = 0;

        if (this.scene.hud?.updateWeapon) {
            this.scene.hud.updateWeapon(null, 0, 0);
        }

        console.log('[WEAPON] Arme cassée! Retour aux attaques de base.');
    }

    /**
     * Spawn un loot à la position donnée
     */
    spawnLoot(x, y) {
        if (!this.scene?.scene) return;
        if (!isFinite(x) || !isFinite(y)) return;
        if (!this.scene.lootGroup) {
            this.scene.lootGroup = this.scene.physics.add.group();
        }

        try {
            const rand = Math.random();
            let lootType;

            if (rand < 0.1) {
                lootType = 'WEAPON';
            } else if (rand < 0.37) {
                lootType = 'HEART';
            } else {
                lootType = 'GOLD';
            }

            const loot = new Loot(this.scene, x, y, lootType);
            if (!loot) return;

            try {
                if (this.scene.lootGroup) {
                    this.scene.lootGroup.add(loot);
                }
            } catch (error) {
                console.error('[COMBAT] Erreur dans l\'ajout au groupe:', error);
            }

            this.scene._clampSpriteToRoad(loot);
            console.log(`[COMBAT] Loot spawné: ${lootType} à (${x}, ${y})`);

        } catch (error) {
            console.error('[COMBAT] Erreur critique dans spawnLoot:', error);
        }
    }

    destroy() {
        // Cleanup si nécessaire
    }
}
