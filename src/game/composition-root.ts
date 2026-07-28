import type { IInputPort } from '@application/ports/IInputPort';
import type { ILevelRepository } from '@application/ports/ILevelRepository';
import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import { UpdatePlayerMovement } from '@application/use-cases/UpdatePlayerMovement';
import { PlaceholderLevelRepository } from '@infrastructure/adapters/PlaceholderLevelRepository';
import { PhaserInputAdapter } from '@infrastructure/phaser/PhaserInputAdapter';
import { PhaserPhysicsAdapter } from '@infrastructure/phaser/PhaserPhysicsAdapter';
import type Phaser from 'phaser';

export interface AppDependencies {
  levelRepository: ILevelRepository;
  createSceneDependencies: (scene: Phaser.Scene) => SceneDependencies;
}

export interface SceneDependencies {
  inputPort: IInputPort;
  physicsPort: IPhysicsPort;
  updatePlayerMovement: UpdatePlayerMovement;
}

export function createSceneDependencies(scene: Phaser.Scene): SceneDependencies {
  return {
    inputPort: new PhaserInputAdapter(scene),
    physicsPort: new PhaserPhysicsAdapter(scene),
    updatePlayerMovement: new UpdatePlayerMovement(),
  };
}

export function createAppDependencies(): AppDependencies {
  return {
    levelRepository: new PlaceholderLevelRepository(),
    createSceneDependencies,
  };
}
