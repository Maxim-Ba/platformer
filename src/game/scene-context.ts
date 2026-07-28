import type { AppDependencies } from '@game/composition-root';
import { REGISTRY_APP_DEPENDENCIES_KEY } from '@game/constants';
import type Phaser from 'phaser';

export function getAppDependenciesFromRegistry(scene: Phaser.Scene): AppDependencies {
  const dependencies = scene.registry.get(REGISTRY_APP_DEPENDENCIES_KEY) as
    | AppDependencies
    | undefined;

  if (!dependencies) {
    throw new Error('AppDependencies not found in scene registry. BootScene must run first.');
  }

  return dependencies;
}
