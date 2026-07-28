import type { ICameraPort } from '@application/ports/ICameraPort';
import type { IHealthPort } from '@application/ports/IHealthPort';
import type { IInputPort } from '@application/ports/IInputPort';
import type { IInventoryPort } from '@application/ports/IInventoryPort';
import type { ILevelRepository } from '@application/ports/ILevelRepository';
import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import type { IProgressionPort } from '@application/ports/IProgressionPort';
import type { ISettingsPort } from '@application/ports/ISettingsPort';
import { AddExperience } from '@application/use-cases/AddExperience';
import { AddItem } from '@application/use-cases/AddItem';
import { ApplyDamage } from '@application/use-cases/ApplyDamage';
import { LoadLevel } from '@application/use-cases/LoadLevel';
import { RemoveItem } from '@application/use-cases/RemoveItem';
import { UpdatePlayerMovement } from '@application/use-cases/UpdatePlayerMovement';
import { UpdateSettings } from '@application/use-cases/UpdateSettings';
import { UseItem } from '@application/use-cases/UseItem';
import { InMemoryHealthAdapter } from '@infrastructure/adapters/InMemoryHealthAdapter';
import { InMemoryInventoryAdapter } from '@infrastructure/adapters/InMemoryInventoryAdapter';
import { InMemoryProgressionAdapter } from '@infrastructure/adapters/InMemoryProgressionAdapter';
import { LocalStorageSettingsAdapter } from '@infrastructure/adapters/LocalStorageSettingsAdapter';
import { LevelCollisionResolver } from '@infrastructure/phaser/LevelCollisionResolver';
import { TiledLevelRepository } from '@infrastructure/tiled/TiledLevelRepository';
import { PhaserInputAdapter } from '@infrastructure/phaser/PhaserInputAdapter';
import { PhaserPhysicsAdapter } from '@infrastructure/phaser/PhaserPhysicsAdapter';
import { PhaserSmoothCameraAdapter } from '@infrastructure/phaser/PhaserSmoothCameraAdapter';
import type Phaser from 'phaser';

// Feature modules: domain rules → application ports/use-cases → infrastructure adapters.
// Concrete adapters are instantiated only in this composition root.

export interface AppDependencies {
  levelRepository: ILevelRepository;
  loadLevel: LoadLevel;
  settingsPort: ISettingsPort;
  updateSettings: UpdateSettings;
  progressionPort: IProgressionPort;
  addExperience: AddExperience;
  inventoryPort: IInventoryPort;
  addItem: AddItem;
  removeItem: RemoveItem;
  useItem: UseItem;
  createSceneDependencies: (scene: Phaser.Scene) => SceneDependencies;
}

export interface SceneDependencies {
  inputPort: IInputPort;
  physicsPort: IPhysicsPort;
  cameraPort: ICameraPort;
  healthPort: IHealthPort;
  updatePlayerMovement: UpdatePlayerMovement;
  applyDamage: ApplyDamage;
  loadLevel: LoadLevel;
  levelCollisionResolver: LevelCollisionResolver;
}

function createLevelRepository(): TiledLevelRepository {
  return new TiledLevelRepository();
}

function createHealthPort(): IHealthPort {
  return new InMemoryHealthAdapter();
}

let settingsPortSingleton: ISettingsPort | undefined;
let progressionPortSingleton: IProgressionPort | undefined;
let inventoryPortSingleton: IInventoryPort | undefined;

function createSettingsPort(): ISettingsPort {
  if (!settingsPortSingleton) {
    settingsPortSingleton = new LocalStorageSettingsAdapter();
  }

  return settingsPortSingleton;
}

function createProgressionPort(): IProgressionPort {
  if (!progressionPortSingleton) {
    progressionPortSingleton = new InMemoryProgressionAdapter();
  }

  return progressionPortSingleton;
}

function createInventoryPort(): IInventoryPort {
  if (!inventoryPortSingleton) {
    inventoryPortSingleton = new InMemoryInventoryAdapter();
  }

  return inventoryPortSingleton;
}

export function createSceneDependencies(scene: Phaser.Scene): SceneDependencies {
  const levelRepository = createLevelRepository();
  const healthPort = createHealthPort();

  return {
    inputPort: new PhaserInputAdapter(scene),
    physicsPort: new PhaserPhysicsAdapter(scene),
    cameraPort: new PhaserSmoothCameraAdapter(scene.cameras.main),
    healthPort,
    updatePlayerMovement: new UpdatePlayerMovement(),
    applyDamage: new ApplyDamage(healthPort),
    loadLevel: new LoadLevel(levelRepository),
    levelCollisionResolver: new LevelCollisionResolver(),
  };
}

export function createAppDependencies(): AppDependencies {
  const levelRepository = createLevelRepository();
  const settingsPort = createSettingsPort();
  const progressionPort = createProgressionPort();
  const inventoryPort = createInventoryPort();

  return {
    levelRepository,
    loadLevel: new LoadLevel(levelRepository),
    settingsPort,
    updateSettings: new UpdateSettings(settingsPort),
    progressionPort,
    addExperience: new AddExperience(progressionPort),
    inventoryPort,
    addItem: new AddItem(inventoryPort),
    removeItem: new RemoveItem(inventoryPort),
    useItem: new UseItem(inventoryPort),
    createSceneDependencies,
  };
}
