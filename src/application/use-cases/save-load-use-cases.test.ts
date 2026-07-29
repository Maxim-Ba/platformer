import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SAVE_SLOT_ID } from '@domain/constants/save';
import { DEFAULT_LEVEL_ID } from '@game/constants';
import { InMemoryInventoryAdapter } from '@infrastructure/adapters/InMemoryInventoryAdapter';
import { InMemoryProgressionAdapter } from '@infrastructure/adapters/InMemoryProgressionAdapter';
import { LocalStorageSaveAdapter } from '@infrastructure/adapters/LocalStorageSaveAdapter';

import { AddExperience } from './AddExperience';
import { AddItem } from './AddItem';
import { LoadGame } from './LoadGame';
import { SaveGame } from './SaveGame';
import { StartNewGame } from './StartNewGame';

describe('save/load use cases', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('StartNewGame resets progression and inventory', () => {
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const addExperience = new AddExperience(progressionPort);
    const addItem = new AddItem(inventoryPort);

    addExperience.execute(100);
    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 3 });

    const useCase = new StartNewGame(progressionPort, inventoryPort);
    const result = useCase.execute();

    expect(result.levelId).toBe(DEFAULT_LEVEL_ID);
    expect(progressionPort.getProgression().experience).toBe(0);
    expect(progressionPort.getProgression().level).toBe(1);
    expect(inventoryPort.getInventory().slots.every((slot) => slot === null)).toBe(true);
  });

  it('SaveGame persists progression and inventory snapshot', () => {
    const savePort = new LocalStorageSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const addExperience = new AddExperience(progressionPort);
    const addItem = new AddItem(inventoryPort);

    addExperience.execute(40);
    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 2 });

    const saveGame = new SaveGame(savePort, progressionPort, inventoryPort);
    saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: 'level-01' });

    const saved = savePort.load(DEFAULT_SAVE_SLOT_ID);

    expect(saved?.levelId).toBe('level-01');
    expect(saved?.progression.experience).toBe(40);
    expect(saved?.inventory.slots[0]).toEqual({
      id: 'coin-1',
      type: 'coin',
      quantity: 2,
    });
  });

  it('LoadGame restores ports and returns level id', () => {
    const savePort = new LocalStorageSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const addExperience = new AddExperience(progressionPort);
    const addItem = new AddItem(inventoryPort);
    const saveGame = new SaveGame(savePort, progressionPort, inventoryPort);

    addExperience.execute(100);
    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 1 });
    saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: 'level-01' });

    const freshProgression = new InMemoryProgressionAdapter();
    const freshInventory = new InMemoryInventoryAdapter();
    const loadOnFreshPorts = new LoadGame(savePort, freshProgression, freshInventory);
    const result = loadOnFreshPorts.execute({ slotId: DEFAULT_SAVE_SLOT_ID });

    expect(result).toEqual({ levelId: 'level-01' });
    expect(freshProgression.getProgression().level).toBe(2);
    expect(freshProgression.getProgression().experience).toBe(0);
    expect(freshProgression.isUnlocked('dash')).toBe(true);
    expect(freshInventory.getInventory().slots[0]).toEqual({
      id: 'coin-1',
      type: 'coin',
      quantity: 1,
    });
  });

  it('LoadGame returns null for missing save without mutating state', () => {
    const savePort = new LocalStorageSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const addExperience = new AddExperience(progressionPort);
    const loadGame = new LoadGame(savePort, progressionPort, inventoryPort);

    addExperience.execute(25);
    const result = loadGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID });

    expect(result).toBeNull();
    expect(progressionPort.getProgression().experience).toBe(25);
  });

  it('LocalStorageSaveAdapter returns null for corrupt save data', () => {
    const savePort = new LocalStorageSaveAdapter('test:save:');

    storage.set('test:save:slot-1', '{ invalid json');

    expect(savePort.load(DEFAULT_SAVE_SLOT_ID)).toBeNull();
  });
});
