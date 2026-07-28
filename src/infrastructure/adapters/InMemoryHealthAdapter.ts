import type { IHealthPort } from '@application/ports/IHealthPort';
import { HealthRules } from '@domain/services/HealthRules';
import { HealthState } from '@domain/value-objects/HealthState';

export class InMemoryHealthAdapter implements IHealthPort {
  private state = HealthState.initial();
  private readonly rules = new HealthRules();

  getHealth(): HealthState {
    return this.state;
  }

  applyDamage(amount: number): void {
    this.state = this.rules.applyDamage(this.state, amount);
  }

  isAlive(): boolean {
    return this.rules.isAlive(this.state.currentHp);
  }

  isInvulnerable(): boolean {
    return this.rules.isInvulnerable(this.state.invulnerabilityRemainingMs);
  }

  reset(): void {
    this.state = HealthState.initial();
  }

  tick(deltaMs: number): void {
    this.state = this.rules.decayInvulnerability(this.state, deltaMs);
  }

  grantInvulnerability(durationMs: number): void {
    this.state = this.rules.grantInvulnerability(this.state, durationMs);
  }
}
