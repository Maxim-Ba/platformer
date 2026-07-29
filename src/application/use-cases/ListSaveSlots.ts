import type { SaveSlotMeta } from '@domain/types/GameSave';

import type { ISavePort } from '../ports/ISavePort';

export class ListSaveSlots {
  constructor(private readonly savePort: ISavePort) {}

  execute(): SaveSlotMeta[] {
    return this.savePort.listSlots();
  }
}
