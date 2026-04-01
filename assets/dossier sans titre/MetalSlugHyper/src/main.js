import Phaser from 'phaser';
import IntroScene from './scenes/IntroScene.js';
import TitleScene from './scenes/TitleScene.js';
import StoryScene from './scenes/StoryScene.js';
import MapScene from './scenes/MapScene.js';
import GameScene from './scenes/GameScene.js';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#0f0f0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Gravité désactivée pour le mode 2.5D
      debug: false,
    },
  },
  scene: [IntroScene, TitleScene, StoryScene, MapScene, GameScene], // IntroScene en premier pour qu'elle se lance au démarrage
};

let game = new Phaser.Game(config);

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    if (game) {
      game.destroy(true);
    }
  });
}
