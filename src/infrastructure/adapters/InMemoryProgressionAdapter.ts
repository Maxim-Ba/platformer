import type { IProgressionPort } from '@application/ports/IProgressionPort';
import { ProgressionRules } from '@domain/services/ProgressionRules';
import { ProgressionState } from '@domain/value-objects/ProgressionState';

export class InMemoryProgressionAdapter implements IProgressionPort {
  private state = ProgressionState.initial();
  private readonly rules = new ProgressionRules();

  getProgression(): ProgressionState {
    return this.state;
  }

  addExperience(amount: number): void {
    const result = this.rules.addExperience(this.state, amount);
    this.state = result.state;
  }

  getUnlockedIds(): readonly string[] {
    return this.state.unlockedIds;
  }

  isUnlocked(id: string): boolean {
    return this.rules.isUnlocked(this.state.unlockedIds, id);
  }
}
