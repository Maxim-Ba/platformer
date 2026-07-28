import { describe, expect, it } from 'vitest';

import { COYOTE_TIME_MS, JUMP_BUFFER_MS, JUMP_VELOCITY, PLAYER_SPEED } from '../constants/movement';
import { Velocity } from '../value-objects/Velocity';
import { MovementRules } from './MovementRules';

describe('MovementRules', () => {
  const rules = new MovementRules();

  it('applies gravity to vertical velocity when airborne', () => {
    const velocity = new Velocity(0, 0);

    expect(rules.applyGravity(velocity, 1000).y).toBeGreaterThan(0);
  });

  it('clamps horizontal velocity to configured max speed', () => {
    const velocity = new Velocity(0, 0);

    expect(rules.applyHorizontalMovement(velocity, 1).x).toBe(PLAYER_SPEED);
    expect(rules.applyHorizontalMovement(velocity, -1).x).toBe(-PLAYER_SPEED);
    expect(rules.applyHorizontalMovement(velocity, 0).x).toBe(0);
  });

  it('applies configured jump velocity upward', () => {
    const velocity = new Velocity(100, 50);

    expect(rules.applyJump(velocity)).toEqual(new Velocity(100, JUMP_VELOCITY));
  });

  it('resets coyote time while grounded', () => {
    expect(rules.updateCoyoteTime(true, false, 0, 16)).toBe(COYOTE_TIME_MS);
  });

  it('starts coyote window when leaving ground', () => {
    expect(rules.updateCoyoteTime(false, true, 0, 16)).toBe(COYOTE_TIME_MS);
  });

  it('expires coyote time after the window elapses', () => {
    const remaining = rules.updateCoyoteTime(false, false, COYOTE_TIME_MS, 16);

    expect(remaining).toBe(COYOTE_TIME_MS - 16);
    expect(rules.updateCoyoteTime(false, false, 1, 16)).toBe(0);
  });

  it('refreshes jump buffer while jump is pressed', () => {
    expect(rules.updateJumpBuffer(true, 0, 16)).toBe(JUMP_BUFFER_MS);
  });

  it('decays jump buffer over time', () => {
    expect(rules.updateJumpBuffer(false, JUMP_BUFFER_MS, 40)).toBe(JUMP_BUFFER_MS - 40);
  });
});
