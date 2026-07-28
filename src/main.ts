import Phaser from 'phaser';

import { createAppDependencies } from '@game/composition-root';
import { GameScene } from '@presentation/scenes/GameScene';

const appDependencies = createAppDependencies();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  pixelArt: true,
  render: {
    roundPixels: true,
  },
  scene: [],
};

const game = new Phaser.Game(config);
game.scene.add('GameScene', GameScene);
game.scene.start('GameScene', {
  createSceneDependencies: appDependencies.createSceneDependencies,
});
