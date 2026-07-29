import type { AttackState } from '@domain/value-objects/AttackState';

export interface ICombatPort {
  getAttackState(): AttackState;
  startAttack(facingDirection: -1 | 1): void;
  tick(deltaMs: number): void;
  reset(): void;
}
