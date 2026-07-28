import { HealthState } from '../value-objects/HealthState';

export class HealthRules {
  clampHp(hp: number, maxHp: number): number {
    return Math.max(0, Math.min(hp, maxHp));
  }

  isAlive(currentHp: number): boolean {
    return currentHp > 0;
  }

  isInvulnerable(invulnerabilityRemainingMs: number): boolean {
    return invulnerabilityRemainingMs > 0;
  }

  applyDamage(state: HealthState, amount: number): HealthState {
    if (this.isInvulnerable(state.invulnerabilityRemainingMs)) {
      return state;
    }

    const newHp = this.clampHp(state.currentHp - amount, state.maxHp);
    return state.withCurrentHp(newHp);
  }

  decayInvulnerability(state: HealthState, deltaMs: number): HealthState {
    if (state.invulnerabilityRemainingMs <= 0) {
      return state;
    }

    return state.withInvulnerabilityRemainingMs(
      Math.max(0, state.invulnerabilityRemainingMs - deltaMs),
    );
  }

  grantInvulnerability(state: HealthState, durationMs: number): HealthState {
    return state.withInvulnerabilityRemainingMs(
      Math.max(state.invulnerabilityRemainingMs, durationMs),
    );
  }
}
