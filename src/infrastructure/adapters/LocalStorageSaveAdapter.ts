import type { ISavePort } from '@application/ports/ISavePort';
import {
  DEFAULT_SAVE_SLOT_ID,
  SAVE_STORAGE_KEY_PREFIX,
  SAVE_VERSION,
} from '@domain/constants/save';
import type { InventoryItem } from '@domain/entities/InventoryItem';
import type { GameSave, SaveSlotMeta } from '@domain/types/GameSave';
import { InventoryState } from '@domain/value-objects/InventoryState';
import { ProgressionState } from '@domain/value-objects/ProgressionState';

function buildStorageKey(slotId: string, prefix: string): string {
  return `${prefix}${slotId}`;
}

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

function parseProgressionState(raw: unknown): ProgressionState | null {
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

function parseInventoryState(raw: unknown): InventoryState | null {
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

function parseGameSave(raw: unknown): GameSave | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;
  if (
    value.version !== SAVE_VERSION ||
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
    version: SAVE_VERSION,
    levelId: value.levelId,
    savedAt: value.savedAt,
    progression,
    inventory,
  };
}

export class LocalStorageSaveAdapter implements ISavePort {
  constructor(
    private readonly storageKeyPrefix: string = SAVE_STORAGE_KEY_PREFIX,
    private readonly knownSlotIds: readonly string[] = [DEFAULT_SAVE_SLOT_ID],
  ) {}

  listSlots(): SaveSlotMeta[] {
    const slots: SaveSlotMeta[] = [];

    for (const slotId of this.knownSlotIds) {
      const save = this.load(slotId);
      if (!save) {
        continue;
      }

      slots.push({
        slotId,
        levelId: save.levelId,
        savedAt: save.savedAt,
      });
    }

    return slots;
  }

  save(slotId: string, data: GameSave): void {
    localStorage.setItem(buildStorageKey(slotId, this.storageKeyPrefix), JSON.stringify(data));
  }

  load(slotId: string): GameSave | null {
    try {
      const raw = localStorage.getItem(buildStorageKey(slotId, this.storageKeyPrefix));
      if (raw === null) {
        return null;
      }

      return parseGameSave(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  delete(slotId: string): void {
    localStorage.removeItem(buildStorageKey(slotId, this.storageKeyPrefix));
  }

  hasSave(slotId: string): boolean {
    return this.load(slotId) !== null;
  }
}
