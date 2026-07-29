import type { ICameraPort } from '@application/ports/ICameraPort';
import type { ICombatPort } from '@application/ports/ICombatPort';
import type { IEnergyPort } from '@application/ports/IEnergyPort';
import type { IEnemyPort } from '@application/ports/IEnemyPort';
import type { IHealthPort } from '@application/ports/IHealthPort';
import type { IManaPort } from '@application/ports/IManaPort';
import type { IInputPort } from '@application/ports/IInputPort';
import type { IInventoryPort } from '@application/ports/IInventoryPort';
import type { ILevelRepository } from '@application/ports/ILevelRepository';
import type { IPhysicsPort } from '@application/ports/IPhysicsPort';
import type { IProgressionPort } from '@application/ports/IProgressionPort';
import type { ISavePort } from '@application/ports/ISavePort';
import { AddExperience } from '@application/use-cases/AddExperience';
import { AddItem } from '@application/use-cases/AddItem';
import { ApplyDamage } from '@application/use-cases/ApplyDamage';
import { ExecuteMeleeAttack } from '@application/use-cases/ExecuteMeleeAttack';
import { LoadLevel } from '@application/use-cases/LoadLevel';
import { RemoveItem } from '@application/use-cases/RemoveItem';
import { UpdateEnemies } from '@application/use-cases/UpdateEnemies';
import { UpdatePlayerMovement } from '@application/use-cases/UpdatePlayerMovement';
import { UpdateSettings } from '@application/use-cases/UpdateSettings';
import type { ISettingsPort } from '@application/ports/ISettingsPort';
import { ListSaveSlots } from '@application/use-cases/ListSaveSlots';
import { LoadGame } from '@application/use-cases/LoadGame';
import { SaveGame } from '@application/use-cases/SaveGame';
import { StartNewGame } from '@application/use-cases/StartNewGame';
import { UseItem } from '@application/use-cases/UseItem';
import { InMemoryCombatAdapter } from '@infrastructure/adapters/InMemoryCombatAdapter';
import { InMemoryEnergyAdapter } from '@infrastructure/adapters/InMemoryEnergyAdapter';
import { InMemoryEnemyAdapter } from '@infrastructure/adapters/InMemoryEnemyAdapter';
import { InMemoryHealthAdapter } from '@infrastructure/adapters/InMemoryHealthAdapter';
import { InMemoryManaAdapter } from '@infrastructure/adapters/InMemoryManaAdapter';
import { InMemoryInventoryAdapter } from '@infrastructure/adapters/InMemoryInventoryAdapter';
import { InMemoryProgressionAdapter } from '@infrastructure/adapters/InMemoryProgressionAdapter';
import { LocalStorageSaveAdapter } from '@infrastructure/adapters/LocalStorageSaveAdapter';
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
  savePort: ISavePort;
  startNewGame: StartNewGame;
  saveGame: SaveGame;
  loadGame: LoadGame;
  listSaveSlots: ListSaveSlots;
  createSceneDependencies: (scene: Phaser.Scene) => SceneDependencies;
}

export interface SceneDependencies {
  inputPort: IInputPort;
  physicsPort: IPhysicsPort;
  cameraPort: ICameraPort;
  healthPort: IHealthPort;
  manaPort: IManaPort;
  energyPort: IEnergyPort;
  combatPort: ICombatPort;
  enemyPort: IEnemyPort;
  updatePlayerMovement: UpdatePlayerMovement;
  applyDamage: ApplyDamage;
  executeMeleeAttack: ExecuteMeleeAttack;
  updateEnemies: UpdateEnemies;
  loadLevel: LoadLevel;
  levelCollisionResolver: LevelCollisionResolver;
}

function createLevelRepository(): TiledLevelRepository {
  return new TiledLevelRepository();
}

function createHealthPort(): IHealthPort {
  return new InMemoryHealthAdapter();
}

function createManaPort(): IManaPort {
  return new InMemoryManaAdapter();
}

function createEnergyPort(): IEnergyPort {
  return new InMemoryEnergyAdapter();
}

function createCombatPort(): ICombatPort {
  return new InMemoryCombatAdapter();
}

function createEnemyPort(): IEnemyPort {
  return new InMemoryEnemyAdapter();
}

let settingsPortSingleton: ISettingsPort | undefined;
let progressionPortSingleton: IProgressionPort | undefined;
let inventoryPortSingleton: IInventoryPort | undefined;
let savePortSingleton: ISavePort | undefined;

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

function createSavePort(): ISavePort {
  if (!savePortSingleton) {
    savePortSingleton = new LocalStorageSaveAdapter();
  }

  return savePortSingleton;
}

export function createSceneDependencies(scene: Phaser.Scene): SceneDependencies {
  const levelRepository = createLevelRepository();
  const healthPort = createHealthPort();
  const manaPort = createManaPort();
  const energyPort = createEnergyPort();
  const combatPort = createCombatPort();
  const enemyPort = createEnemyPort();
  const applyDamage = new ApplyDamage(healthPort);

  return {
    inputPort: new PhaserInputAdapter(scene),
    physicsPort: new PhaserPhysicsAdapter(scene),
    cameraPort: new PhaserSmoothCameraAdapter(scene.cameras.main),
    healthPort,
    manaPort,
    energyPort,
    combatPort,
    enemyPort,
    updatePlayerMovement: new UpdatePlayerMovement(),
    applyDamage,
    executeMeleeAttack: new ExecuteMeleeAttack(combatPort, enemyPort),
    updateEnemies: new UpdateEnemies(enemyPort, healthPort, applyDamage),
    loadLevel: new LoadLevel(levelRepository),
    levelCollisionResolver: new LevelCollisionResolver(),
  };
}

export function createAppDependencies(): AppDependencies {
  const levelRepository = createLevelRepository();
  const settingsPort = createSettingsPort();
  const progressionPort = createProgressionPort();
  const inventoryPort = createInventoryPort();
  const savePort = createSavePort();

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
    savePort,
    startNewGame: new StartNewGame(progressionPort, inventoryPort),
    saveGame: new SaveGame(savePort, progressionPort, inventoryPort),
    loadGame: new LoadGame(savePort, progressionPort, inventoryPort),
    listSaveSlots: new ListSaveSlots(savePort),
    createSceneDependencies,
  };
}
