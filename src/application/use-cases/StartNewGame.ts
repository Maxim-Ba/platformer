import { DEFAULT_LEVEL_ID, DEFAULT_ROOM_ID } from '@game/constants';
import { WORLD_PLAYTEST_ENABLED, WORLD_ENTRY_ROOM_ID } from '@game/world-graph';
import { InventoryState } from '@domain/value-objects/InventoryState';
import { ProgressionState } from '@domain/value-objects/ProgressionState';

import type { IInventoryPort } from '../ports/IInventoryPort';
import type { IProgressionPort } from '../ports/IProgressionPort';
import type { ISkillsPort } from '../ports/ISkillsPort';

export interface StartNewGameResult {
  levelId: string;
  currentRoomId?: string;
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

    if (WORLD_PLAYTEST_ENABLED) {
      return {
        levelId: DEFAULT_ROOM_ID,
        currentRoomId: WORLD_ENTRY_ROOM_ID,
      };
    }

    return { levelId: DEFAULT_LEVEL_ID };
  }
}
