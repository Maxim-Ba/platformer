import { INVULNERABILITY_MS } from '@domain/constants/health';
import { HealthRules } from '@domain/services/HealthRules';
import type { HealthState } from '@domain/value-objects/HealthState';

import type { IHealthPort } from '../ports/IHealthPort';

export interface ApplyDamageResult {
  survived: boolean;
  health: HealthState;
}

export interface ApplyDamageOptions {
  grantInvulnerabilityMs?: number;
}

export class ApplyDamage {
  constructor(
    private readonly healthPort: IHealthPort,
    private readonly rules: HealthRules = new HealthRules(),
  ) {}

  execute(amount: number, options: ApplyDamageOptions = {}): ApplyDamageResult {
    const before = this.healthPort.getHealth();

    if (this.rules.isInvulnerable(before.invulnerabilityRemainingMs)) {
      return {
        survived: this.rules.isAlive(before.currentHp),
        health: before,
      };
    }

    this.healthPort.applyDamage(amount);
    let health = this.healthPort.getHealth();

    if (!this.rules.isAlive(health.currentHp)) {
      return { survived: false, health };
    }

    const invulnerabilityMs = options.grantInvulnerabilityMs ?? INVULNERABILITY_MS;
    if (invulnerabilityMs > 0) {
      this.healthPort.grantInvulnerability(invulnerabilityMs);
      health = this.healthPort.getHealth();
    }

    return {
      survived: true,
      health,
    };
  }
}
