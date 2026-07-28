import type { AppDependencies } from '@game/composition-root';
import { REGISTRY_APP_DEPENDENCIES_KEY } from '@game/constants';
import { SceneKeys } from '@game/scene-keys';
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.Boot });
  }

  init(data: Record<string, unknown>): void {
    const appDependencies = data[REGISTRY_APP_DEPENDENCIES_KEY] as AppDependencies | undefined;

    if (!appDependencies) {
      throw new Error('BootScene requires appDependencies in scene data.');
    }

    this.registry.set(REGISTRY_APP_DEPENDENCIES_KEY, appDependencies);
    this.registry.set('gameWidth', this.scale.width);
    this.registry.set('gameHeight', this.scale.height);
  }

  create(): void {
    this.scene.start(SceneKeys.Preload);
  }
}
