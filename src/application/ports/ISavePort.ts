import type { GameSave, SaveSlotMeta } from '@domain/types/GameSave';

export interface ISavePort {
  listSlots(): SaveSlotMeta[];
  save(slotId: string, data: GameSave): void;
  load(slotId: string): GameSave | null;
  delete(slotId: string): void;
  hasSave(slotId: string): boolean;
}
