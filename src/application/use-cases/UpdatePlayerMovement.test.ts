import { describe, expect, it } from 'vitest';

import {
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  PLAYER_SPEED,
} from '@domain/constants/movement';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';

import { UpdatePlayerMovement } from './UpdatePlayerMovement';

function createGroundedState(): PlayerState {
  return new PlayerState(
    new Vector2(0, 0),
    new Velocity(0, 0),
    true,
    COYOTE_TIME_MS,
    0,
  );
}

describe('UpdatePlayerMovement', () => {
  const useCase = new UpdatePlayerMovement();

  it('executes a grounded jump with configured upward velocity', () => {
    const result = useCase.execute({
      state: createGroundedState(),
      input: { horizontalAxis: 0, jumpPressed: true, dashPressed: false },
      deltaMs: 16,
      wasGrounded: true,
    });

    expect(result.velocity.y).toBe(JUMP_VELOCITY);
    expect(result.jumpBufferRemainingMs).toBe(0);
    expect(result.coyoteTimeRemainingMs).toBe(0);
  });

  it('executes a coyote jump shortly after leaving the ground', () => {
    const result = useCase.execute({
      state: new PlayerState(
        new Vector2(0, 0),
        new Velocity(0, 10),
        false,
        COYOTE_TIME_MS,
        0,
      ),
      input: { horizontalAxis: 0, jumpPressed: true, dashPressed: false },
      deltaMs: 16,
      wasGrounded: true,
    });

    expect(result.velocity.y).toBe(JUMP_VELOCITY);
  });

  it('does not jump after coyote time expires', () => {
    const result = useCase.execute({
      state: new PlayerState(
        new Vector2(0, 0),
        new Velocity(0, 100),
        false,
        0,
        0,
      ),
      input: { horizontalAxis: 0, jumpPressed: true, dashPressed: false },
      deltaMs: 16,
      wasGrounded: false,
    });

    expect(result.velocity.y).toBeGreaterThan(100);
    expect(result.velocity.y).not.toBe(JUMP_VELOCITY);
  });

  it('keeps horizontal velocity within configured max speed', () => {
    const result = useCase.execute({
      state: createGroundedState(),
      input: { horizontalAxis: 1, jumpPressed: false, dashPressed: false },
      deltaMs: 16,
      wasGrounded: true,
    });

    expect(result.velocity.x).toBe(PLAYER_SPEED);
    expect(Math.abs(result.velocity.x)).toBeLessThanOrEqual(PLAYER_SPEED);
  });

  it('allows horizontal movement while airborne', () => {
    const result = useCase.execute({
      state: new PlayerState(
        new Vector2(0, 0),
        new Velocity(0, 50),
        false,
        0,
        0,
      ),
      input: { horizontalAxis: -1, jumpPressed: false, dashPressed: false },
      deltaMs: 16,
      wasGrounded: false,
    });

    expect(result.velocity.x).toBe(-PLAYER_SPEED);
    expect(result.velocity.y).toBeGreaterThan(50);
  });

  it('executes a buffered jump on landing', () => {
    const result = useCase.execute({
      state: new PlayerState(
        new Vector2(0, 0),
        new Velocity(0, 0),
        true,
        COYOTE_TIME_MS,
        JUMP_BUFFER_MS,
      ),
      input: { horizontalAxis: 0, jumpPressed: false, dashPressed: false },
      deltaMs: 16,
      wasGrounded: true,
    });

    expect(result.velocity.y).toBe(JUMP_VELOCITY);
  });
});
