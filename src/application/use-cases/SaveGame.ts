import type { IInventoryPort } from '../ports/IInventoryPort';
import type { IPlayerStatsPort } from '../ports/IPlayerStatsPort';
import type { IProgressionPort } from '../ports/IProgressionPort';
import type { ISavePort } from '../ports/ISavePort';
import type { ISkillsPort } from '../ports/ISkillsPort';
import { SAVE_VERSION } from '@domain/constants/save';
import type { GameSave } from '@domain/types/GameSave';

export interface SaveGameInput {
  slotId: string;
  levelId: string;
}

export class SaveGame {
  constructor(
    private readonly savePort: ISavePort,
    private readonly progressionPort: IProgressionPort,
    private readonly inventoryPort: IInventoryPort,
    private readonly skillsPort: ISkillsPort,
    private readonly playerStatsPort?: IPlayerStatsPort,
  ) {}

  execute(input: SaveGameInput): void {
    const character: GameSave['character'] = {
      progression: this.progressionPort.getProgression(),
      inventory: this.inventoryPort.getInventory(),
      skills: this.skillsPort.getState(),
    };

    if (this.playerStatsPort) {
      character.stats = this.playerStatsPort.getState();
    }

    const payload: GameSave = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      game: { levelId: input.levelId },
      character,
    };

    this.savePort.save(input.slotId, payload);
  }
}
