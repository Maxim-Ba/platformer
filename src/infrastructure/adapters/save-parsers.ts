import type { InventoryItem } from '@domain/entities/InventoryItem';
import type { GameSave } from '@domain/types/GameSave';
import {
  ATTRIBUTE_IDS,
  PlayerAttributes,
  PlayerStatsState,
} from '@domain/types/player-stats';
import { InventoryState } from '@domain/value-objects/InventoryState';
import { ProgressionState } from '@domain/value-objects/ProgressionState';
import { SkillsState } from '@domain/value-objects/SkillsState';

function isInventoryItem(value: unknown): value is InventoryItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.type === 'string' &&
    typeof item.quantity === 'number'
  );
}

export function parseProgressionState(raw: unknown): ProgressionState | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;
  if (
    typeof value.level !== 'number' ||
    typeof value.experience !== 'number' ||
    typeof value.experienceToNextLevel !== 'number' ||
    !Array.isArray(value.unlockedIds) ||
    !value.unlockedIds.every((id) => typeof id === 'string')
  ) {
    return null;
  }

  return new ProgressionState(
    value.level,
    value.experience,
    value.experienceToNextLevel,
    value.unlockedIds,
  );
}

export function parseInventoryState(raw: unknown): InventoryState | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;
  if (!Array.isArray(value.slots)) {
    return null;
  }

  const slots = value.slots.map((slot) => {
    if (slot === null) {
      return null;
    }

    return isInventoryItem(slot) ? slot : null;
  });

  if (slots.some((slot, index) => slot === null && (value.slots as unknown[])[index] !== null)) {
    return null;
  }

  return new InventoryState(slots);
}

export function parseSkillsState(raw: unknown): SkillsState | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;
  if (
    !Array.isArray(value.unlockedNodeIds) ||
    !value.unlockedNodeIds.every((id) => typeof id === 'string') ||
    !Array.isArray(value.selectedNodeIds) ||
    !value.selectedNodeIds.every((id) => typeof id === 'string') ||
    typeof value.availableSkillPoints !== 'number'
  ) {
    return null;
  }

  return new SkillsState(
    value.unlockedNodeIds,
    value.selectedNodeIds,
    value.availableSkillPoints,
  );
}

function parsePlayerAttributes(raw: unknown): PlayerAttributes | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;
  for (const attributeId of ATTRIBUTE_IDS) {
    if (typeof value[attributeId] !== 'number') {
      return null;
    }
  }

  return new PlayerAttributes(
    value.strength as number,
    value.agility as number,
    value.intellect as number,
    value.luck as number,
    value.carryCapacity as number,
    value.vitality as number,
  );
}

export function parsePlayerStatsState(raw: unknown): PlayerStatsState | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const attributes = parsePlayerAttributes(value.attributes);
  if (!attributes || typeof value.unallocatedPoints !== 'number') {
    return null;
  }

  return new PlayerStatsState(attributes, value.unallocatedPoints);
}

function parseV2GameSave(value: Record<string, unknown>): GameSave | null {
  if (value.version !== 2 || typeof value.savedAt !== 'string') {
    return null;
  }

  if (typeof value.game !== 'object' || value.game === null) {
    return null;
  }

  if (typeof value.character !== 'object' || value.character === null) {
    return null;
  }

  const game = value.game as Record<string, unknown>;
  const character = value.character as Record<string, unknown>;

  if (typeof game.levelId !== 'string') {
    return null;
  }

  const progression = parseProgressionState(character.progression);
  const inventory = parseInventoryState(character.inventory);
  const skills = parseSkillsState(character.skills);
  if (!progression || !inventory || !skills) {
    return null;
  }

  const save: GameSave = {
    version: 2,
    savedAt: value.savedAt,
    game: { levelId: game.levelId },
    character: {
      progression,
      inventory,
      skills,
    },
  };

  if (character.stats !== undefined) {
    const stats = parsePlayerStatsState(character.stats);
    if (stats) {
      save.character.stats = stats;
    }
  }

  return save;
}

function migrateV1ToV2(value: Record<string, unknown>): GameSave | null {
  if (
    value.version !== 1 ||
    typeof value.levelId !== 'string' ||
    typeof value.savedAt !== 'string'
  ) {
    return null;
  }

  const progression = parseProgressionState(value.progression);
  const inventory = parseInventoryState(value.inventory);
  if (!progression || !inventory) {
    return null;
  }

  return {
    version: 2,
    savedAt: value.savedAt,
    game: { levelId: value.levelId },
    character: {
      progression,
      inventory,
      skills: SkillsState.initial(),
    },
  };
}

export function normalizeGameSave(raw: unknown): GameSave | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;

  if (value.version === 2) {
    return parseV2GameSave(value);
  }

  if (value.version === 1) {
    return migrateV1ToV2(value);
  }

  return null;
}
