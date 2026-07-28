import type { IInputPort } from '@application/ports/IInputPort';
import type { ILevelRepository } from '@application/ports/ILevelRepository';
import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import { LoadLevel } from '@application/use-cases/LoadLevel';
import { UpdatePlayerMovement } from '@application/use-cases/UpdatePlayerMovement';
import { LevelCollisionResolver } from '@infrastructure/phaser/LevelCollisionResolver';
import { TiledLevelRepository } from '@infrastructure/tiled/TiledLevelRepository';
import { PhaserInputAdapter } from '@infrastructure/phaser/PhaserInputAdapter';
import { PhaserPhysicsAdapter } from '@infrastructure/phaser/PhaserPhysicsAdapter';
import type Phaser from 'phaser';

export interface AppDependencies {
  levelRepository: ILevelRepository;
  loadLevel: LoadLevel;
  createSceneDependencies: (scene: Phaser.Scene) => SceneDependencies;
}

export interface SceneDependencies {
  inputPort: IInputPort;
  physicsPort: IPhysicsPort;
  updatePlayerMovement: UpdatePlayerMovement;
  loadLevel: LoadLevel;
  levelCollisionResolver: LevelCollisionResolver;
}

function createLevelRepository(): TiledLevelRepository {
  return new TiledLevelRepository();
}

export function createSceneDependencies(scene: Phaser.Scene): SceneDependencies {
  const levelRepository = createLevelRepository();

  return {
    inputPort: new PhaserInputAdapter(scene),
    physicsPort: new PhaserPhysicsAdapter(scene),
    updatePlayerMovement: new UpdatePlayerMovement(),
    loadLevel: new LoadLevel(levelRepository),
    levelCollisionResolver: new LevelCollisionResolver(),
  };
}

export function createAppDependencies(): AppDependencies {
  const levelRepository = createLevelRepository();

  return {
    levelRepository,
    loadLevel: new LoadLevel(levelRepository),
    createSceneDependencies,
  };
}
