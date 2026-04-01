import Phaser from 'phaser';

/**
 * AudioManager - Gestion centralisée du son
 * Singleton attaché à la scène
 */
export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {}; // Cache des sons chargés
    this.bgm = null; // Référence à la musique de fond
    this.muted = false;
  }

  /**
   * Charge tous les sons depuis assets/audio/
   * @param {Phaser.Scene} scene - La scène qui charge les assets
   */
  static preload(scene) {
    const audioFiles = [
      { key: 'bgm', path: 'audio/stage1-theme.ogg' },
      { key: 'punch', path: 'audio/punch.ogg', optional: true },
      { key: 'hit', path: 'audio/hit.ogg', optional: true },
      { key: 'explosion', path: 'audio/explosion.ogg', optional: true },
      { key: 'collect', path: 'audio/collect.ogg', optional: true }
    ];

    audioFiles.forEach(({ key, path, optional }) => {
      try {
        // Utiliser load.audio avec gestion d'erreur
        scene.load.audio(key, path);
        console.log(`[AUDIO] Chargement: ${key} -> ${path}`);
      } catch (error) {
        if (optional) {
          console.warn(`[AUDIO] Fichier audio optionnel manquant: ${path} (clé: ${key}) - Le jeu continuera sans ce son`);
        } else {
          console.warn(`[AUDIO] Fichier audio manquant: ${path} (clé: ${key})`);
        }
      }
    });
    
    // Gérer les erreurs de chargement
    scene.load.on('loaderror', (file) => {
      if (file.type === 'audio') {
        console.warn(`[AUDIO] Erreur de chargement pour: ${file.key} (${file.url}) - Le jeu continuera sans ce son`);
      }
    });
  }

  /**
   * Initialise l'AudioManager après le chargement
   */
  init() {
    // Les sons seront créés à la demande dans playSFX
    console.log('[AUDIO] AudioManager initialisé');
  }

  /**
   * Joue la musique de fond en boucle
   */
  playBGM() {
    if (this.muted) return;
    if (!this.scene || !this.scene.sound) return;

    try {
      // Arrêter la BGM précédente si elle existe
      if (this.bgm && this.bgm.isPlaying) {
        this.bgm.stop();
      }

      // Vérifier si la BGM existe dans le cache
      if (!this.scene.cache.audio.exists('bgm')) {
        console.warn('[AUDIO] BGM non trouvée dans le cache (clé: bgm)');
        return;
      }

      // Créer et jouer la nouvelle BGM
      this.bgm = this.scene.sound.add('bgm', {
        volume: 0.4,
        loop: true
      });
      
      this.bgm.on('error', (error) => {
        console.warn('[AUDIO] Erreur lors de la lecture de la BGM:', error);
      });
      
      this.bgm.play();
      console.log('[AUDIO] BGM lancée');
    } catch (error) {
      console.warn('[AUDIO] Erreur lors du lancement de la BGM:', error);
    }
  }

  /**
   * Arrête la musique de fond
   */
  stopBGM() {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }
  }

  /**
   * Joue un effet sonore
   * @param {string} key - Clé du son (punch, hit, explosion, collect)
   */
  playSFX(key) {
    if (this.muted) return;
    if (!this.scene || !this.scene.sound) return;

    try {
      // Vérifier si le son existe dans le cache
      if (!this.scene.cache.audio.exists(key)) {
        // Son non chargé, ignorer silencieusement (fichier optionnel manquant)
        return;
      }

      // Créer et jouer le son
      const sound = this.scene.sound.add(key, {
        volume: 0.8
      });
      
      sound.once('play', () => {
        // Son joué avec succès
      });
      
      sound.on('error', (error) => {
        console.warn(`[AUDIO] Erreur lors de la lecture de ${key}:`, error);
        sound.destroy();
      });
      
      sound.play();

      // Nettoyer après la lecture (optionnel, pour éviter l'accumulation)
      sound.once('complete', () => {
        if (sound && sound.active) {
          sound.destroy();
        }
      });
    } catch (error) {
      // Ignorer silencieusement les erreurs (fichiers optionnels manquants)
      // console.warn(`[AUDIO] Erreur lors de la lecture de ${key}:`, error);
    }
  }

  /**
   * Active/désactive le son
   */
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    } else {
      this.playBGM();
    }
    console.log(`[AUDIO] Son ${this.muted ? 'désactivé' : 'activé'}`);
  }

  /**
   * Nettoie les ressources audio
   */
  destroy() {
    this.stopBGM();
    this.sounds = {};
  }
}

