import Phaser from 'phaser';
import Prop from '../entities/Prop.js';
import { spawnEnemy } from '../entities/Enemy.js';

/**
 * WaveManager - Gestion des vagues d'ennemis
 * 
 * Responsabilités :
 * - Transitions entre les vagues (animations)
 * - Spawn des ennemis et props
 * - Logique d'avancement du joueur entre les vagues
 * - Indicateur "GO →"
 */
export default class WaveManager {
    constructor(scene) {
        this.scene = scene;

        // État des vagues
        this.currentWave = 0;
        this.totalWaves = 2;
        this.enemiesKilled = 0;
        this.enemiesToKill = 5;
        this.isWaveActive = false;
        this.isTransitioning = false;

        // Logique d'avancée entre les vagues
        this.isWaitingForAdvance = false;
        this.waveAdvanceTargetX = null;
        this.goArrow = null;

        // Découpage du niveau en segments
        this.playerStartX = null;
        this.stageEndMargin = 400;
        this.waveSegmentLength = null;
        this.currentRightLimitX = null;
    }

    /**
     * Initialise le manager avec les données du niveau
     */
    init(levelConfig, worldWidth, playerStartX) {
        this.enemiesToKill = levelConfig.enemiesCount || 5;
        this.playerStartX = playerStartX;

        // Calculer la longueur d'un segment de vague
        const endX = worldWidth - this.stageEndMargin;
        const usableWidth = Math.max(endX - playerStartX, 1000);
        this.waveSegmentLength = usableWidth / this.totalWaves;

        // Limite initiale de déplacement vers la droite
        this.currentRightLimitX = playerStartX + this.waveSegmentLength;
    }

    /**
     * Déclenche la transition visuelle vers une nouvelle vague
     */
    triggerWaveTransition(waveNum) {
        if (this.isTransitioning) {
            console.log('[TRANSITION] Transition déjà en cours, ignorée');
            return;
        }

        this.isTransitioning = true;
        this.isWaveActive = false;

        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.scale.height / 2;

        const isBossWave = waveNum >= this.totalWaves;

        if (isBossWave) {
            this._showBossTransition(centerX, centerY, waveNum);
        } else {
            this._showWaveTransition(centerX, centerY, waveNum);
        }
    }

    _showBossTransition(centerX, centerY, waveNum) {
        console.log(`[TRANSITION] Animation BOSS pour la vague ${waveNum}`);

        const warningText = this.scene.add.text(centerX, centerY - 40, 'WARNING !!', {
            fontSize: '80px',
            fontFamily: 'monospace',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
            fontWeight: 'bold'
        });
        warningText.setOrigin(0.5);
        warningText.setDepth(300);
        warningText.setScrollFactor(0);
        warningText.setAlpha(0);

        const bossText = this.scene.add.text(centerX, centerY + 60, 'BOSS DETECTED', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fill: '#ff3333',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            fontWeight: 'bold'
        });
        bossText.setOrigin(0.5);
        bossText.setDepth(300);
        bossText.setScrollFactor(0);
        bossText.setAlpha(0);

        this.scene.tweens.add({
            targets: [warningText, bossText],
            alpha: 1,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: [warningText, bossText],
                    alpha: { from: 1, to: 0.3 },
                    duration: 100,
                    repeat: 5,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        });

        this.scene.cameras.main.shake(2000, 0.02);

        this.scene.time.delayedCall(3000, () => {
            warningText.destroy();
            bossText.destroy();
            this.isTransitioning = false;
            this.startWave(waveNum);
        });
    }

    _showWaveTransition(centerX, centerY, waveNum) {
        console.log(`[TRANSITION] Animation normale pour la vague ${waveNum}`);

        const waveText = this.scene.add.text(centerX, centerY, `WAVE ${waveNum}`, {
            fontSize: '80px',
            fontFamily: 'monospace',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
            fontWeight: 'bold'
        });
        waveText.setOrigin(0.5);
        waveText.setDepth(300);
        waveText.setScrollFactor(0);
        waveText.setScale(0);

        this.scene.tweens.add({
            targets: waveText,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => {
                    this.scene.tweens.add({
                        targets: waveText,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            waveText.destroy();
                            this.isTransitioning = false;
                            this.startWave(waveNum);
                        }
                    });
                });
            }
        });
    }

    /**
     * Démarre une vague (spawn ennemis ou boss)
     */
    startWave(waveNum) {
        console.log(`[WAVE] Level ${this.scene.levelIndex} - Démarrage vague ${waveNum}/${this.totalWaves}`);

        this.isWaveActive = false;
        console.log(`[WAVE] Verrouillage activé pour la vague ${waveNum}`);

        this.scene.hud.updateWave(waveNum, this.totalWaves, `STAGE ${this.scene.levelIndex}: ${this.scene.levelConfig.title}`);

        // Mettre à jour la limite de déplacement
        if (this.waveSegmentLength && this.playerStartX !== null) {
            const targetMaxX = this.playerStartX + this.waveSegmentLength * waveNum;
            this.currentRightLimitX = Phaser.Math.Clamp(
                targetMaxX,
                this.playerStartX + 200,
                this.scene.worldWidth - this.stageEndMargin
            );
            console.log(`[WAVE] Limite X pour la vague ${waveNum}: ${Math.floor(this.currentRightLimitX)}`);
        }

        if (waveNum >= this.totalWaves) {
            // VAGUE BOSS
            this.scene.bossManager.startFinalBossCutscene();
        } else {
            // VAGUE D'ENNEMIS
            this.spawnWaveEnemies();
        }
    }

    /**
     * Spawn les ennemis et props pour la vague actuelle
     */
    spawnWaveEnemies() {
        const enemiesPerWave = Math.ceil(this.enemiesToKill / (this.totalWaves - 1));
        const enemyTypes = ['punk'];

        console.log(`[WAVE] Spawn de ${enemiesPerWave} ennemis (types: ${enemyTypes.join(', ')})`);

        // Spawner les props
        this._spawnProps(3);

        // Spawner les ennemis
        let spawnedCount = 0;

        for (let i = 0; i < enemiesPerWave; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

            const cameraRight = this.scene.cameras.main.scrollX + this.scene.cameras.main.width;
            const spawnBaseX = Phaser.Math.Clamp(cameraRight + 80, 400, this.scene.worldWidth - 50);
            const x = spawnBaseX + i * 60;
            const y = this.scene.groundY;

            this.scene.time.delayedCall(i * 500, () => {
                const enemy = spawnEnemy(this.scene, type, x, y);
                if (enemy) {
                    enemy.setDepth(5);
                    this.scene._alignSpriteToGround(enemy);
                    this.scene._clampSpriteToRoad(enemy);
                    this.scene.enemies.add(enemy);
                    spawnedCount++;

                    console.log(`[ENEMY] Spawné: ${type} (IA: ${enemy.aiType}) à (${x}, ${y})`);

                    enemy.on('enemy-dead', () => {
                        this.scene.enemies.remove(enemy);
                        this.enemiesKilled++;
                        this.scene.addScore(120);
                        console.log(`[ENEMY] Ennemis tués: ${this.enemiesKilled}/${this.enemiesToKill}`);
                    });

                    if (spawnedCount === enemiesPerWave) {
                        this.isWaveActive = true;
                        console.log(`[WAVE] Tous les ennemis spawnés, verrouillage désactivé`);
                    }
                }
            });
        }
    }

    _spawnProps(count) {
        for (let i = 0; i < count; i++) {
            const propSpawnBaseX = Phaser.Math.Clamp(this.scene.player.x + 200, 300, this.scene.worldWidth - 400);
            const propX = Phaser.Math.Between(propSpawnBaseX, propSpawnBaseX + 250);
            const propY = Phaser.Math.Between(this.scene.scale.height * 0.4, this.scene.scale.height * 0.8);

            this.scene.time.delayedCall(i * 200, () => {
                const prop = new Prop(this.scene, propX, propY, 'crate');
                this.scene.props.add(prop);
                this.scene._alignSpriteToGround(prop);
                console.log(`[PROP] Caisse spawnée à (${propX}, ${propY})`);
            });
        }
    }

    /**
     * Passe à la vague suivante
     */
    nextWave() {
        this.currentWave += 1;

        if (this.currentWave > this.totalWaves) {
            console.log(`[LEVEL] Toutes les vagues terminées pour le Level ${this.scene.levelIndex}!`);
            this.scene._handleStageClear();
            return;
        }

        this.triggerWaveTransition(this.currentWave);
    }

    /**
     * Prépare l'avancée vers la droite avant la prochaine vague
     */
    prepareAdvanceToNextWave() {
        if (!this.scene.player) return;
        if (this.isWaitingForAdvance) return;

        this.isWaitingForAdvance = true;

        if (this.waveSegmentLength && this.playerStartX !== null) {
            const nextSegmentIndex = this.currentWave;
            const idealTarget = this.playerStartX + this.waveSegmentLength * nextSegmentIndex;
            this.waveAdvanceTargetX = Phaser.Math.Clamp(
                idealTarget,
                this.scene.player.x + 100,
                this.scene.worldWidth - this.stageEndMargin
            );
        } else {
            const targetOffset = 400;
            this.waveAdvanceTargetX = Phaser.Math.Clamp(
                this.scene.player.x + targetOffset,
                this.scene.player.x + 100,
                this.scene.worldWidth - this.stageEndMargin
            );
        }

        console.log(`[WAVE] Vague terminée, avancer jusqu'à x >= ${this.waveAdvanceTargetX}`);
        this.showGoArrow();
    }

    /**
     * Affiche l'indicateur "GO →"
     */
    showGoArrow() {
        if (this.goArrow) {
            this.goArrow.destroy();
            this.goArrow = null;
        }

        const cam = this.scene.cameras.main;
        const centerY = cam.height * 0.35;
        const x = cam.width - 120;

        const container = this.scene.add.container(x, centerY);
        container.setScrollFactor(0);
        container.setDepth(500);

        const text = this.scene.add.text(0, 0, 'GO', {
            fontSize: '40px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'right',
        });
        text.setOrigin(1, 0.5);

        const arrow = this.scene.add.text(10, 0, '➜', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        });
        arrow.setOrigin(0, 0.5);

        container.add([text, arrow]);

        this.scene.tweens.add({
            targets: container,
            x: x + 20,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.goArrow = container;
    }

    /**
     * Mise à jour appelée dans update() de la scène
     */
    update() {
        if (this.isWaitingForAdvance && this.scene.player) {
            if (this.waveAdvanceTargetX !== null && this.scene.player.x >= this.waveAdvanceTargetX) {
                console.log(`[WAVE] Joueur a atteint la cible, lancement vague suivante`);
                this.isWaitingForAdvance = false;
                this.waveAdvanceTargetX = null;

                if (this.goArrow) {
                    this.goArrow.destroy();
                    this.goArrow = null;
                }

                if (!this.isTransitioning) {
                    this.nextWave();
                }
            }
        }
    }

    /**
     * Vérifie si la vague est terminée (tous les ennemis morts)
     */
    checkWaveComplete() {
        if (!this.scene.bossActive && this.scene.enemies.countActive() === 0 && this.isWaveActive) {
            this.isWaveActive = false;

            if (this.enemiesKilled >= this.enemiesToKill) {
                console.log(`[WAVE] ${this.enemiesKilled}/${this.enemiesToKill} ennemis tués, attente d'avancée`);
                if (!this.isTransitioning) {
                    this.prepareAdvanceToNextWave();
                }
            } else if (this.currentWave < this.totalWaves) {
                console.log(`[WAVE] Objectif non atteint, respawn`);
                this.spawnWaveEnemies();
            }
        }
    }

    destroy() {
        if (this.goArrow) {
            this.goArrow.destroy();
        }
    }
}
