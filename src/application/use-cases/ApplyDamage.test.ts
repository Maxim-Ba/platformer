import { describe, expect, it } from 'vitest';

import { HAZARD_DAMAGE, INVULNERABILITY_MS, MAX_HP } from '@domain/constants/health';
import { InMemoryHealthAdapter } from '@infrastructure/adapters/InMemoryHealthAdapter';

import { ApplyDamage } from './ApplyDamage';

describe('ApplyDamage', () => {
  it('reduces HP and grants invulnerability on survivable hazard damage', () => {
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new ApplyDamage(healthPort);

    const result = useCase.execute(HAZARD_DAMAGE);

    expect(result.survived).toBe(true);
    expect(result.health.currentHp).toBe(MAX_HP - HAZARD_DAMAGE);
    expect(result.health.invulnerabilityRemainingMs).toBe(INVULNERABILITY_MS);
  });

  it('does not change HP while invulnerable', () => {
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new ApplyDamage(healthPort);

    useCase.execute(HAZARD_DAMAGE);
    const result = useCase.execute(HAZARD_DAMAGE);

    expect(result.health.currentHp).toBe(MAX_HP - HAZARD_DAMAGE);
  });

  it('reports death when damage reduces HP to zero', () => {
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new ApplyDamage(healthPort);

    for (let i = 0; i < MAX_HP; i += 1) {
      healthPort.tick(INVULNERABILITY_MS + 1);
      useCase.execute(HAZARD_DAMAGE, { grantInvulnerabilityMs: 0 });
    }

    expect(healthPort.isAlive()).toBe(false);
    expect(healthPort.getHealth().currentHp).toBe(0);
  });
});
