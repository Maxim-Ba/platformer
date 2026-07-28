import type { ProgressionState } from '@domain/value-objects/ProgressionState';

import type { IProgressionPort } from '../ports/IProgressionPort';

export interface AddExperienceResult {
  progression: ProgressionState;
  leveledUp: boolean;
  newUnlocks: string[];
}

export class AddExperience {
  constructor(private readonly progressionPort: IProgressionPort) {}

  execute(amount: number): AddExperienceResult {
    const before = this.progressionPort.getProgression();
    this.progressionPort.addExperience(amount);
    const after = this.progressionPort.getProgression();

    return {
      progression: after,
      leveledUp: after.level > before.level,
      newUnlocks: after.unlockedIds.filter((id) => !before.unlockedIds.includes(id)),
    };
  }
}
