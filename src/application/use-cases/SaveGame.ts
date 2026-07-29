import { SAVE_VERSION } from '@domain/constants/save';
import type { GameSave } from '@domain/types/GameSave';

import type { IInventoryPort } from '../ports/IInventoryPort';
import type { IProgressionPort } from '../ports/IProgressionPort';
import type { ISavePort } from '../ports/ISavePort';

export interface SaveGameInput {
  slotId: string;
  levelId: string;
}

export class SaveGame {
  constructor(
    private readonly savePort: ISavePort,
    private readonly progressionPort: IProgressionPort,
    private readonly inventoryPort: IInventoryPort,
  ) {}

  execute(input: SaveGameInput): void {
    const payload: GameSave = {
      version: SAVE_VERSION,
      levelId: input.levelId,
      savedAt: new Date().toISOString(),
      progression: this.progressionPort.getProgression(),
      inventory: this.inventoryPort.getInventory(),
    };

    this.savePort.save(input.slotId, payload);
  }
}
