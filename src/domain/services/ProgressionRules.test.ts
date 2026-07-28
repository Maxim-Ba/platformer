import { describe, expect, it } from 'vitest';

import { XP_PER_LEVEL_MULTIPLIER } from '../constants/progression';
import { ProgressionState } from '../value-objects/ProgressionState';
import { ProgressionRules } from './ProgressionRules';

describe('ProgressionRules', () => {
  const rules = new ProgressionRules();

  it('uses linear XP threshold of 100 * level', () => {
    expect(rules.experienceToNextLevel(1)).toBe(XP_PER_LEVEL_MULTIPLIER);
    expect(rules.experienceToNextLevel(3)).toBe(XP_PER_LEVEL_MULTIPLIER * 3);
  });

  it('increases experience without leveling when below threshold', () => {
    const state = ProgressionState.initial();

    const result = rules.addExperience(state, 50);

    expect(result.leveledUp).toBe(false);
    expect(result.newUnlocks).toEqual([]);
    expect(result.state.experience).toBe(50);
    expect(result.state.level).toBe(1);
  });

  it('levels up and carries excess experience', () => {
    const state = ProgressionState.initial();

    const result = rules.addExperience(state, 150);

    expect(result.leveledUp).toBe(true);
    expect(result.state.level).toBe(2);
    expect(result.state.experience).toBe(50);
    expect(result.state.experienceToNextLevel).toBe(200);
  });

  it('unlocks content configured for reached levels', () => {
    const state = ProgressionState.initial();

    const result = rules.addExperience(state, 100);

    expect(result.newUnlocks).toEqual(['dash']);
    expect(result.state.unlockedIds).toEqual(['dash']);
  });

  it('reports unlock status accurately', () => {
    const state = new ProgressionState(2, 0, 200, ['dash']);

    expect(rules.isUnlocked(state.unlockedIds, 'dash')).toBe(true);
    expect(rules.isUnlocked(state.unlockedIds, 'double_jump')).toBe(false);
  });

  it('ignores non-positive experience amounts', () => {
    const state = ProgressionState.initial();

    const result = rules.addExperience(state, 0);

    expect(result).toEqual({ state, leveledUp: false, newUnlocks: [] });
  });
});
