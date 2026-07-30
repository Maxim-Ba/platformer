import { describe, expect, it } from 'vitest';

import { PlayerAttributes } from '../types/player-stats';
import { PlayerStatsRules } from './PlayerStatsRules';

describe('PlayerStatsRules', () => {
  const rules = new PlayerStatsRules();

  it('computes derived stats from mock initial attributes', () => {
    const attributes = PlayerAttributes.mockInitial();
    const derived = rules.computeDerived(attributes);

    expect(derived.maxHealth).toBe(50 + 10 * 10 + 10 * 2);
    expect(derived.maxEnergy).toBe(30 + 8 * 5);
    expect(derived.maxMana).toBe(20 + 6 * 8);
    expect(derived.physicalDefense).toBe(10 * 2 + 10);
    expect(derived.magicDefense).toBe(6 * 3 + 5);
    expect(derived.critChance).toBe(5 * 2 + 8);
    expect(derived.attackPower).toBe(10 * 3 + 8);
    expect(derived.magicPower).toBe(6 * 4);
  });

  it('caps crit chance at 50 percent', () => {
    const attributes = new PlayerAttributes(10, 30, 10, 30, 10, 10);
    const derived = rules.computeDerived(attributes);

    expect(derived.critChance).toBe(50);
  });

  it('recalculates when attributes change', () => {
    const base = PlayerAttributes.mockInitial();
    const increasedVitality = base.withAttribute('vitality', 15);

    expect(rules.computeDerived(increasedVitality).maxHealth).toBeGreaterThan(
      rules.computeDerived(base).maxHealth,
    );
  });
});
