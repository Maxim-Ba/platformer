import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SAVE_SLOT_ID, SAVE_FILE_PATH_PREFIX } from '@domain/constants/save';
import { DEFAULT_LEVEL_ID } from '@game/constants';
import { MOCK_DEFAULT_SKILL_POINTS } from '@domain/constants/skill-trees';
import { SkillsState } from '@domain/value-objects/SkillsState';
import { InMemoryInventoryAdapter } from '@infrastructure/adapters/InMemoryInventoryAdapter';
import { InMemoryPlayerStatsAdapter } from '@infrastructure/adapters/InMemoryPlayerStatsAdapter';
import { InMemoryProgressionAdapter } from '@infrastructure/adapters/InMemoryProgressionAdapter';
import { InMemorySkillsAdapter } from '@infrastructure/adapters/InMemorySkillsAdapter';
import { JsonFileSaveAdapter } from '@infrastructure/adapters/JsonFileSaveAdapter';

import { AddExperience } from './AddExperience';
import { AddItem } from './AddItem';
import { LoadGame } from './LoadGame';
import { SaveGame } from './SaveGame';
import { StartNewGame } from './StartNewGame';

function buildSaveStorageKey(prefix: string, slotId: string): string {
  return `${prefix}${SAVE_FILE_PATH_PREFIX}${slotId}.json`;
}

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
    const skillsPort = new InMemorySkillsAdapter();
    const addExperience = new AddExperience(progressionPort);
    const addItem = new AddItem(inventoryPort);

    addExperience.execute(100);
    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 3 });
    skillsPort.learnNode('physical-l2-0');
    skillsPort.selectNode('physical-l2-0');

    const useCase = new StartNewGame(progressionPort, inventoryPort, skillsPort);
    const result = useCase.execute();

    expect(result.levelId).toBe(DEFAULT_LEVEL_ID);
    expect(progressionPort.getProgression().experience).toBe(0);
    expect(progressionPort.getProgression().level).toBe(1);
    expect(inventoryPort.getInventory().slots.every((slot) => slot === null)).toBe(true);
    expect(skillsPort.getAvailableSkillPoints()).toBe(MOCK_DEFAULT_SKILL_POINTS);
    expect(skillsPort.getSelectedNodeIds()).toEqual([]);
  });

  it('SaveGame persists v2 progression and inventory snapshot', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const skillsPort = new InMemorySkillsAdapter();
    const addExperience = new AddExperience(progressionPort);
    const addItem = new AddItem(inventoryPort);

    addExperience.execute(40);
    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 2 });

    const saveGame = new SaveGame(savePort, progressionPort, inventoryPort, skillsPort);
    saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: 'level-01' });

    const saved = savePort.load(DEFAULT_SAVE_SLOT_ID);

    expect(saved?.version).toBe(2);
    expect(saved?.game.levelId).toBe('level-01');
    expect(saved?.character.progression.experience).toBe(40);
    expect(saved?.character.inventory.slots[0]).toEqual({
      id: 'coin-1',
      type: 'coin',
      quantity: 2,
    });
    expect(saved?.character.skills).toEqual(skillsPort.getState());
  });

  it('SaveGame persists skills and player stats when ports are wired', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const skillsPort = new InMemorySkillsAdapter();
    const playerStatsPort = new InMemoryPlayerStatsAdapter();

    skillsPort.learnNode('physical-l2-0');
    skillsPort.selectNode('physical-l2-0');
    playerStatsPort.increaseAttribute('strength');

    const saveGame = new SaveGame(
      savePort,
      progressionPort,
      inventoryPort,
      skillsPort,
      playerStatsPort,
    );
    saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: 'level-01' });

    const saved = savePort.load(DEFAULT_SAVE_SLOT_ID);

    expect(saved?.character.skills.unlockedNodeIds).toContain('physical-l2-0');
    expect(saved?.character.stats?.attributes.getValue('strength')).toBe(11);
    expect(saved?.character.stats?.unallocatedPoints).toBe(2);
  });

  it('LoadGame restores ports and returns level id', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const skillsPort = new InMemorySkillsAdapter();
    const addExperience = new AddExperience(progressionPort);
    const addItem = new AddItem(inventoryPort);
    const saveGame = new SaveGame(savePort, progressionPort, inventoryPort, skillsPort);

    addExperience.execute(100);
    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 1 });
    skillsPort.learnNode('physical-l2-0');
    skillsPort.selectNode('physical-l2-0');
    saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: 'level-01' });

    const freshProgression = new InMemoryProgressionAdapter();
    const freshInventory = new InMemoryInventoryAdapter();
    const freshSkills = new InMemorySkillsAdapter();
    const loadOnFreshPorts = new LoadGame(
      savePort,
      freshProgression,
      freshInventory,
      freshSkills,
    );
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
    expect(freshSkills.getUnlockedNodeIds()).toContain('physical-l2-0');
    expect(freshSkills.getSelectedNodeIds()).toContain('physical-l2-0');
  });

  it('LoadGame leaves stats unchanged when save has no stats section', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const skillsPort = new InMemorySkillsAdapter();
    const playerStatsPort = new InMemoryPlayerStatsAdapter();

    playerStatsPort.increaseAttribute('strength');
    const strengthBeforeLoad = playerStatsPort.getAttributes().getValue('strength');

    const saveGame = new SaveGame(savePort, progressionPort, inventoryPort, skillsPort);
    saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: 'level-01' });

    const loadGame = new LoadGame(
      savePort,
      progressionPort,
      inventoryPort,
      skillsPort,
      playerStatsPort,
    );
    loadGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID });

    expect(playerStatsPort.getAttributes().getValue('strength')).toBe(strengthBeforeLoad);
  });

  it('LoadGame returns null for missing save without mutating state', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');
    const progressionPort = new InMemoryProgressionAdapter();
    const inventoryPort = new InMemoryInventoryAdapter();
    const skillsPort = new InMemorySkillsAdapter();
    const addExperience = new AddExperience(progressionPort);
    const loadGame = new LoadGame(savePort, progressionPort, inventoryPort, skillsPort);

    addExperience.execute(25);
    const result = loadGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID });

    expect(result).toBeNull();
    expect(progressionPort.getProgression().experience).toBe(25);
  });

  it('JsonFileSaveAdapter returns null for corrupt save data', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');

    storage.set(buildSaveStorageKey('test:save:', DEFAULT_SAVE_SLOT_ID), '{ invalid json');

    expect(savePort.load(DEFAULT_SAVE_SLOT_ID)).toBeNull();
  });

  it('JsonFileSaveAdapter migrates legacy v1 flat saves to v2 on load', () => {
    const savePort = new JsonFileSaveAdapter('test:save:');
    const v1Payload = {
      version: 1,
      levelId: 'level-01',
      savedAt: '2026-01-01T00:00:00.000Z',
      progression: {
        level: 1,
        experience: 40,
        experienceToNextLevel: 100,
        unlockedIds: [],
      },
      inventory: {
        slots: Array.from({ length: 20 }, () => null),
      },
    };

    storage.set(
      buildSaveStorageKey('test:save:', DEFAULT_SAVE_SLOT_ID),
      JSON.stringify(v1Payload),
    );

    const loaded = savePort.load(DEFAULT_SAVE_SLOT_ID);

    expect(loaded?.version).toBe(2);
    expect(loaded?.game.levelId).toBe('level-01');
    expect(loaded?.character.progression.experience).toBe(40);
    expect(loaded?.character.skills).toEqual(SkillsState.initial());
  });
});
