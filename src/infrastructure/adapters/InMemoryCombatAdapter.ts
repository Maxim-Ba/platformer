import type { ICombatPort } from '@application/ports/ICombatPort';
import { CombatRules } from '@domain/services/CombatRules';
import { AttackState } from '@domain/value-objects/AttackState';

export class InMemoryCombatAdapter implements ICombatPort {
  private state = AttackState.initial();
  private readonly rules = new CombatRules();

  getAttackState(): AttackState {
    return this.state;
  }

  startAttack(facingDirection: -1 | 1): void {
    this.state = this.rules.startAttack(this.state, facingDirection);
  }

  tick(deltaMs: number): void {
    this.state = this.rules.tick(this.state, deltaMs);
  }

  reset(): void {
    this.state = AttackState.initial();
  }
}
