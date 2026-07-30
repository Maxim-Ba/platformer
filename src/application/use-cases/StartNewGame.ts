import { DEFAULT_LEVEL_ID } from '@game/constants';
import { InventoryState } from '@domain/value-objects/InventoryState';
import { ProgressionState } from '@domain/value-objects/ProgressionState';

import type { IInventoryPort } from '../ports/IInventoryPort';
import type { IProgressionPort } from '../ports/IProgressionPort';
import type { ISkillsPort } from '../ports/ISkillsPort';

export interface StartNewGameResult {
  levelId: string;
}

export class StartNewGame {
  constructor(
    private readonly progressionPort: IProgressionPort,
    private readonly inventoryPort: IInventoryPort,
    private readonly skillsPort: ISkillsPort,
  ) {}

  execute(): StartNewGameResult {
    this.progressionPort.restoreProgression(ProgressionState.initial());
    this.inventoryPort.restoreInventory(InventoryState.empty());
    this.skillsPort.reset();

    return { levelId: DEFAULT_LEVEL_ID };
  }
}
