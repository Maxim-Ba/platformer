import type { ProgressionState } from '@domain/value-objects/ProgressionState';

export interface IProgressionPort {
  getProgression(): ProgressionState;
  addExperience(amount: number): void;
  getUnlockedIds(): readonly string[];
  isUnlocked(id: string): boolean;
  restoreProgression(state: ProgressionState): void;
}
