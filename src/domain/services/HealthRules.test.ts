import { describe, expect, it } from 'vitest';

import { HAZARD_DAMAGE, INVULNERABILITY_MS, MAX_HP } from '../constants/health';
import { HealthState } from '../value-objects/HealthState';
import { HealthRules } from './HealthRules';

describe('HealthRules', () => {
  const rules = new HealthRules();

  it('clamps HP between zero and max', () => {
    expect(rules.clampHp(5, MAX_HP)).toBe(MAX_HP);
    expect(rules.clampHp(-1, MAX_HP)).toBe(0);
    expect(rules.clampHp(2, MAX_HP)).toBe(2);
  });

  it('reports alive only while HP is positive', () => {
    expect(rules.isAlive(MAX_HP)).toBe(true);
    expect(rules.isAlive(1)).toBe(true);
    expect(rules.isAlive(0)).toBe(false);
  });

  it('blocks damage while invulnerable', () => {
    const state = new HealthState(MAX_HP, MAX_HP, INVULNERABILITY_MS);

    expect(rules.applyDamage(state, HAZARD_DAMAGE)).toEqual(state);
  });

  it('reduces HP by damage amount', () => {
    const state = HealthState.initial();

    expect(rules.applyDamage(state, HAZARD_DAMAGE).currentHp).toBe(MAX_HP - HAZARD_DAMAGE);
  });

  it('clamps HP to zero on lethal damage', () => {
    const state = new HealthState(1, MAX_HP, 0);

    expect(rules.applyDamage(state, HAZARD_DAMAGE).currentHp).toBe(0);
  });

  it('decays invulnerability over time', () => {
    const state = new HealthState(MAX_HP, MAX_HP, 100);

    expect(rules.decayInvulnerability(state, 40).invulnerabilityRemainingMs).toBe(60);
    expect(rules.decayInvulnerability(state, 100).invulnerabilityRemainingMs).toBe(0);
  });

  it('grants invulnerability for at least the requested duration', () => {
    const state = HealthState.initial();

    expect(rules.grantInvulnerability(state, INVULNERABILITY_MS).invulnerabilityRemainingMs).toBe(
      INVULNERABILITY_MS,
    );
  });
});
