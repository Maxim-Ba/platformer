import { INITIAL_EXPERIENCE, INITIAL_LEVEL } from '../constants/progression';
import { ProgressionRules } from '../services/ProgressionRules';

export class ProgressionState {
  constructor(
    readonly level: number,
    readonly experience: number,
    readonly experienceToNextLevel: number,
    readonly unlockedIds: readonly string[],
  ) {}

  static initial(rules: ProgressionRules = new ProgressionRules()): ProgressionState {
    return new ProgressionState(
      INITIAL_LEVEL,
      INITIAL_EXPERIENCE,
      rules.experienceToNextLevel(INITIAL_LEVEL),
      [],
    );
  }

  withLevel(level: number, experienceToNextLevel: number): ProgressionState {
    return new ProgressionState(level, this.experience, experienceToNextLevel, this.unlockedIds);
  }

  withExperience(experience: number): ProgressionState {
    return new ProgressionState(this.level, experience, this.experienceToNextLevel, this.unlockedIds);
  }

  withExperienceToNextLevel(experienceToNextLevel: number): ProgressionState {
    return new ProgressionState(this.level, this.experience, experienceToNextLevel, this.unlockedIds);
  }

  withUnlockedIds(unlockedIds: readonly string[]): ProgressionState {
    return new ProgressionState(this.level, this.experience, this.experienceToNextLevel, unlockedIds);
  }
}
