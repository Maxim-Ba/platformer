import type { InventoryState } from '../value-objects/InventoryState';
import type { ProgressionState } from '../value-objects/ProgressionState';

export interface GameSave {
  version: number;
  levelId: string;
  savedAt: string;
  progression: ProgressionState;
  inventory: InventoryState;
}

export interface SaveSlotMeta {
  slotId: string;
  levelId: string;
  savedAt: string;
}
