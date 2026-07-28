import { MAX_HP } from '../constants/health';

export class HealthState {
  constructor(
    readonly currentHp: number,
    readonly maxHp: number,
    readonly invulnerabilityRemainingMs: number,
  ) {}

  static initial(maxHp: number = MAX_HP): HealthState {
    return new HealthState(maxHp, maxHp, 0);
  }

  withCurrentHp(currentHp: number): HealthState {
    return new HealthState(currentHp, this.maxHp, this.invulnerabilityRemainingMs);
  }

  withInvulnerabilityRemainingMs(invulnerabilityRemainingMs: number): HealthState {
    return new HealthState(this.currentHp, this.maxHp, invulnerabilityRemainingMs);
  }
}
