import { MovementRules } from '@domain/services/MovementRules';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';

import type { InputSnapshot } from './InputSnapshot';

export interface UpdatePlayerMovementInput {
  state: PlayerState;
  input: InputSnapshot;
  deltaMs: number;
  wasGrounded: boolean;
}

export class UpdatePlayerMovement {
  constructor(private readonly rules: MovementRules = new MovementRules()) {}

  execute({ state, input, deltaMs, wasGrounded }: UpdatePlayerMovementInput): PlayerState {
    let coyoteTimeRemainingMs = this.rules.updateCoyoteTime(
      state.isGrounded,
      wasGrounded,
      state.coyoteTimeRemainingMs,
      deltaMs,
    );

    let jumpBufferRemainingMs = this.rules.updateJumpBuffer(
      input.jumpPressed,
      state.jumpBufferRemainingMs,
      deltaMs,
    );

    let velocity = state.velocity;
    let jumpedThisFrame = false;

    if (
      this.rules.shouldExecuteJump(
        state.isGrounded,
        coyoteTimeRemainingMs,
        input.jumpPressed,
        jumpBufferRemainingMs,
      )
    ) {
      velocity = this.rules.applyJump(velocity);
      coyoteTimeRemainingMs = 0;
      jumpBufferRemainingMs = 0;
      jumpedThisFrame = true;
    }

    velocity = this.rules.applyHorizontalMovement(velocity, input.horizontalAxis);

    if (state.isGrounded && !jumpedThisFrame) {
      velocity = velocity.withY(0);
    } else if (!state.isGrounded && !jumpedThisFrame) {
      velocity = this.rules.applyGravity(velocity, deltaMs);
    }

    const deltaSeconds = deltaMs / 1000;
    const position = new Vector2(
      state.position.x + velocity.x * deltaSeconds,
      state.position.y + velocity.y * deltaSeconds,
    );

    return new PlayerState(
      position,
      velocity,
      state.isGrounded,
      coyoteTimeRemainingMs,
      jumpBufferRemainingMs,
    );
  }
}
