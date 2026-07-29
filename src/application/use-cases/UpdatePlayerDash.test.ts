import { describe, expect, it } from 'vitest';

import { DASH_SPEED } from '@domain/constants/dash';
import { COYOTE_TIME_MS } from '@domain/constants/movement';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';
import { Velocity } from '@domain/value-objects/Velocity';

import { UpdatePlayerDash } from './UpdatePlayerDash';

describe('UpdatePlayerDash', () => {
  const useCase = new UpdatePlayerDash();

  it('moves player horizontally at dash speed without gravity', () => {
    const state = new PlayerState(
      new Vector2(100, 200),
      new Velocity(0, 50),
      false,
      0,
      0,
    );

    const result = useCase.execute({
      state,
      direction: 1,
      deltaMs: 100,
    });

    expect(result.velocity.x).toBe(DASH_SPEED);
    expect(result.velocity.y).toBe(0);
    expect(result.position.x).toBeCloseTo(100 + DASH_SPEED * 0.1);
    expect(result.position.y).toBe(200);
  });

  it('preserves grounded movement buffers while dashing', () => {
    const state = new PlayerState(
      new Vector2(0, 0),
      new Velocity(0, 0),
      true,
      COYOTE_TIME_MS,
      0,
    );

    const result = useCase.execute({
      state,
      direction: -1,
      deltaMs: 16,
    });

    expect(result.isGrounded).toBe(true);
    expect(result.coyoteTimeRemainingMs).toBe(COYOTE_TIME_MS);
  });
});
