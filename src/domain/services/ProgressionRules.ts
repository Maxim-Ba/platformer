import { LEVEL_UNLOCKS, XP_PER_LEVEL_MULTIPLIER } from '../constants/progression';
import { ProgressionState } from '../value-objects/ProgressionState';

export interface ProgressionAddExperienceResult {
  state: ProgressionState;
  leveledUp: boolean;
  newUnlocks: string[];
}

export class ProgressionRules {
  experienceToNextLevel(level: number): number {
    return XP_PER_LEVEL_MULTIPLIER * level;
  }

  getUnlocksForLevel(level: number): readonly string[] {
    return LEVEL_UNLOCKS[level] ?? [];
  }

  isUnlocked(unlockedIds: readonly string[], id: string): boolean {
    return unlockedIds.includes(id);
  }

  addExperience(state: ProgressionState, amount: number): ProgressionAddExperienceResult {
    if (amount <= 0) {
      return { state, leveledUp: false, newUnlocks: [] };
    }

    let experience = state.experience + amount;
    let level = state.level;
    let experienceToNextLevel = state.experienceToNextLevel;
    const unlockedIds = [...state.unlockedIds];
    const newUnlocks: string[] = [];
    let leveledUp = false;

    while (experience >= experienceToNextLevel) {
      experience -= experienceToNextLevel;
      level += 1;
      leveledUp = true;
      experienceToNextLevel = this.experienceToNextLevel(level);

      for (const unlockId of this.getUnlocksForLevel(level)) {
        if (!unlockedIds.includes(unlockId)) {
          unlockedIds.push(unlockId);
          newUnlocks.push(unlockId);
        }
      }
    }

    return {
      state: new ProgressionState(level, experience, experienceToNextLevel, unlockedIds),
      leveledUp,
      newUnlocks,
    };
  }
}
