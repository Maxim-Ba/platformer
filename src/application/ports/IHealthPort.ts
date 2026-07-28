import type { HealthState } from '@domain/value-objects/HealthState';

export interface IHealthPort {
  getHealth(): HealthState;
  applyDamage(amount: number): void;
  isAlive(): boolean;
  isInvulnerable(): boolean;
  reset(): void;
  tick(deltaMs: number): void;
  grantInvulnerability(durationMs: number): void;
}
