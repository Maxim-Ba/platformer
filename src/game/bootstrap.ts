import Phaser from 'phaser';

import { createAppDependencies } from '@game/composition-root';
import { createGameConfig } from '@game/game-config';
import { REGISTRY_APP_DEPENDENCIES_KEY } from '@game/constants';
import { SceneKeys } from '@game/scene-keys';
import { BootScene } from '@presentation/scenes/BootScene';
import { GameOverScene } from '@presentation/scenes/GameOverScene';
import { GameScene } from '@presentation/scenes/GameScene';
import { MainMenuScene } from '@presentation/scenes/MainMenuScene';
import { PreloadScene } from '@presentation/scenes/PreloadScene';

export function registerScenes(game: Phaser.Game): void {
  game.scene.add(SceneKeys.Boot, BootScene);
  game.scene.add(SceneKeys.Preload, PreloadScene);
  game.scene.add(SceneKeys.MainMenu, MainMenuScene);
  game.scene.add(SceneKeys.Game, GameScene);
  game.scene.add(SceneKeys.GameOver, GameOverScene);
}

export function createGame(): Phaser.Game {
  const appDependencies = createAppDependencies();
  const game = new Phaser.Game(createGameConfig());

  registerScenes(game);
  game.scene.start(SceneKeys.Boot, {
    [REGISTRY_APP_DEPENDENCIES_KEY]: appDependencies,
  });

  return game;
}
