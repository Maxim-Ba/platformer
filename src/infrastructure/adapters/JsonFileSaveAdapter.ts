import type { ISavePort } from '@application/ports/ISavePort';
import {
  DEFAULT_SAVE_SLOT_ID,
  SAVE_FILE_PATH_PREFIX,
  SAVE_STORAGE_KEY_PREFIX,
} from '@domain/constants/save';
import type { GameSave, SaveSlotMeta } from '@domain/types/GameSave';

import { normalizeGameSave } from './save-parsers';

function buildStorageKey(slotId: string, prefix: string): string {
  return `${prefix}${SAVE_FILE_PATH_PREFIX}${slotId}.json`;
}

export class JsonFileSaveAdapter implements ISavePort {
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
        levelId: save.game.levelId,
        savedAt: save.savedAt,
      });
    }

    return slots;
  }

  save(slotId: string, data: GameSave): void {
    localStorage.setItem(
      buildStorageKey(slotId, this.storageKeyPrefix),
      JSON.stringify(data, null, 2),
    );
  }

  load(slotId: string): GameSave | null {
    try {
      const raw = localStorage.getItem(buildStorageKey(slotId, this.storageKeyPrefix));
      if (raw === null) {
        return null;
      }

      return normalizeGameSave(JSON.parse(raw));
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
