import { describe, expect, it } from 'vitest';

import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';

import {
  DEFAULT_RUN_SPEED_THRESHOLD,
  resolvePlayerAnimation,
} from './resolvePlayerAnimation';

function createState(
  velocity: Velocity,
  isGrounded: boolean,
): PlayerState {
  return new PlayerState(new Vector2(0, 0), velocity, isGrounded, 0, 0);
}

describe('resolvePlayerAnimation', () => {
  it('returns attack when attack context is active', () => {
    const state = createState(new Velocity(100, -200), false);

    expect(resolvePlayerAnimation(state, { isAttacking: true })).toBe('attack');
  });

  it('returns hurt over attack, dash, and movement', () => {
    const state = createState(new Velocity(100, -200), false);

    expect(
      resolvePlayerAnimation(state, {
        isHurt: true,
        isAttacking: true,
        isDashing: true,
      }),
    ).toBe('hurt');
  });

  it('returns dash over jump, fall, run, and idle when hurt and attack are inactive', () => {
    expect(
      resolvePlayerAnimation(createState(new Velocity(100, -200), false), { isDashing: true }),
    ).toBe('dash');
    expect(
      resolvePlayerAnimation(createState(new Velocity(DEFAULT_RUN_SPEED_THRESHOLD, 0), true), {
        isDashing: true,
      }),
    ).toBe('dash');
    expect(
      resolvePlayerAnimation(createState(new Velocity(0, 0), true), { isDashing: true }),
    ).toBe('dash');
  });

  it('returns attack over dash when both are active', () => {
    const state = createState(new Velocity(DEFAULT_RUN_SPEED_THRESHOLD, 0), true);

    expect(resolvePlayerAnimation(state, { isAttacking: true, isDashing: true })).toBe('attack');
  });

  it('returns jump when airborne with upward velocity', () => {
    const state = createState(new Velocity(0, -120), false);

    expect(resolvePlayerAnimation(state)).toBe('jump');
  });

  it('returns fall when airborne with zero or downward velocity', () => {
    expect(resolvePlayerAnimation(createState(new Velocity(0, 0), false))).toBe('fall');
    expect(resolvePlayerAnimation(createState(new Velocity(0, 80), false))).toBe('fall');
  });

  it('returns run when grounded and horizontal speed exceeds threshold', () => {
    const state = createState(new Velocity(DEFAULT_RUN_SPEED_THRESHOLD, 0), true);

    expect(resolvePlayerAnimation(state)).toBe('run');
    expect(resolvePlayerAnimation(createState(new Velocity(-20, 0), true))).toBe('run');
  });

  it('returns idle when grounded and horizontal speed is below threshold', () => {
    const state = createState(new Velocity(DEFAULT_RUN_SPEED_THRESHOLD - 1, 0), true);

    expect(resolvePlayerAnimation(state)).toBe('idle');
    expect(resolvePlayerAnimation(createState(new Velocity(0, 0), true))).toBe('idle');
  });

  it('prioritizes airborne animation over grounded movement', () => {
    const state = createState(new Velocity(200, 50), false);

    expect(resolvePlayerAnimation(state)).toBe('fall');
  });

  it('respects custom run speed threshold from context', () => {
    const state = createState(new Velocity(25, 0), true);

    expect(resolvePlayerAnimation(state, { runSpeedThreshold: 30 })).toBe('idle');
    expect(resolvePlayerAnimation(state, { runSpeedThreshold: 20 })).toBe('run');
  });
});
