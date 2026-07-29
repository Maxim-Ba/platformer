import type { IInventoryPort } from '../ports/IInventoryPort';
import type { IProgressionPort } from '../ports/IProgressionPort';
import type { ISavePort } from '../ports/ISavePort';

export interface LoadGameInput {
  slotId: string;
}

export interface LoadGameResult {
  levelId: string;
}

export class LoadGame {
  constructor(
    private readonly savePort: ISavePort,
    private readonly progressionPort: IProgressionPort,
    private readonly inventoryPort: IInventoryPort,
  ) {}

  execute(input: LoadGameInput): LoadGameResult | null {
    const save = this.savePort.load(input.slotId);
    if (!save) {
      return null;
    }

    this.progressionPort.restoreProgression(save.progression);
    this.inventoryPort.restoreInventory(save.inventory);

    return { levelId: save.levelId };
  }
}
