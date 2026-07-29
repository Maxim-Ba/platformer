import { describe, expect, it } from 'vitest';

import { DASH_COOLDOWN_MS, DASH_DURATION_MS, DASH_SPEED } from '../constants/dash';
import { DashState } from '../value-objects/DashState';
import { DashRules } from './DashRules';

describe('DashRules', () => {
  const rules = new DashRules();

  it('blocks dash while on cooldown', () => {
    const state = new DashState(0, DASH_COOLDOWN_MS, 1);

    expect(rules.canStart(state)).toBe(false);
  });

  it('blocks dash while active window is open', () => {
    const state = new DashState(DASH_DURATION_MS, 0, 1);

    expect(rules.canStart(state)).toBe(false);
  });

  it('starts dash with configured duration and direction', () => {
    const state = DashState.initial();

    const next = rules.startDash(state, -1);

    expect(next.isDashing).toBe(true);
    expect(next.remainingMs).toBe(DASH_DURATION_MS);
    expect(next.direction).toBe(-1);
  });

  it('decays dash duration and starts cooldown when dash ends', () => {
    const state = new DashState(DASH_DURATION_MS, 0, 1);

    const next = rules.tick(state, DASH_DURATION_MS);

    expect(next.isDashing).toBe(false);
    expect(next.remainingMs).toBe(0);
    expect(next.cooldownRemainingMs).toBe(DASH_COOLDOWN_MS);
  });

  it('applies overflow delta to cooldown when dash ends mid-tick', () => {
    const state = new DashState(DASH_DURATION_MS, 0, 1);

    const next = rules.tick(state, DASH_DURATION_MS + 100);

    expect(next.isDashing).toBe(false);
    expect(next.cooldownRemainingMs).toBe(DASH_COOLDOWN_MS - 100);
  });

  it('decays cooldown when not dashing', () => {
    const state = new DashState(0, DASH_COOLDOWN_MS, 1);

    const next = rules.tick(state, 100);

    expect(next.cooldownRemainingMs).toBe(DASH_COOLDOWN_MS - 100);
  });

  it('returns horizontal dash velocity with zero gravity', () => {
    expect(rules.getDashVelocity(1)).toEqual({ x: DASH_SPEED, y: 0 });
    expect(rules.getDashVelocity(-1)).toEqual({ x: -DASH_SPEED, y: 0 });
  });
});
