import type { IInventoryPort } from '../ports/IInventoryPort';
import type { IPlayerStatsPort } from '../ports/IPlayerStatsPort';
import type { IProgressionPort } from '../ports/IProgressionPort';
import type { ISavePort } from '../ports/ISavePort';
import type { ISkillsPort } from '../ports/ISkillsPort';

export interface LoadGameInput {
  slotId: string;
}

export interface LoadGameResult {
  levelId: string;
  currentRoomId: string;
}

export class LoadGame {
  constructor(
    private readonly savePort: ISavePort,
    private readonly progressionPort: IProgressionPort,
    private readonly inventoryPort: IInventoryPort,
    private readonly skillsPort: ISkillsPort,
    private readonly playerStatsPort?: IPlayerStatsPort,
  ) {}

  execute(input: LoadGameInput): LoadGameResult | null {
    const save = this.savePort.load(input.slotId);
    if (!save) {
      return null;
    }

    this.progressionPort.restoreProgression(save.character.progression);
    this.inventoryPort.restoreInventory(save.character.inventory);
    this.skillsPort.restoreState(save.character.skills);

    if (save.character.stats && this.playerStatsPort) {
      this.playerStatsPort.restoreState(save.character.stats);
    }

    return {
      levelId: save.game.levelId,
      currentRoomId: save.game.currentRoomId ?? save.game.levelId,
    };
  }
}
