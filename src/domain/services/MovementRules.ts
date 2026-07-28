import {
  COYOTE_TIME_MS,
  GRAVITY,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  PLAYER_SPEED,
} from '../constants/movement';
import { Velocity } from '../value-objects/Velocity';

export interface MovementConfig {
  gravity: number;
  playerSpeed: number;
  jumpVelocity: number;
  coyoteTimeMs: number;
  jumpBufferMs: number;
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  gravity: GRAVITY,
  playerSpeed: PLAYER_SPEED,
  jumpVelocity: JUMP_VELOCITY,
  coyoteTimeMs: COYOTE_TIME_MS,
  jumpBufferMs: JUMP_BUFFER_MS,
};

export class MovementRules {
  constructor(private readonly config: MovementConfig = DEFAULT_MOVEMENT_CONFIG) {}

  applyGravity(velocity: Velocity, deltaMs: number): Velocity {
    const deltaSeconds = deltaMs / 1000;
    return velocity.withY(velocity.y + this.config.gravity * deltaSeconds);
  }

  applyHorizontalMovement(velocity: Velocity, horizontalAxis: -1 | 0 | 1): Velocity {
    return velocity.withX(horizontalAxis * this.config.playerSpeed);
  }

  applyJump(velocity: Velocity): Velocity {
    return velocity.withY(this.config.jumpVelocity);
  }

  canJump(isGrounded: boolean, coyoteTimeRemainingMs: number): boolean {
    return isGrounded || coyoteTimeRemainingMs > 0;
  }

  updateCoyoteTime(
    isGrounded: boolean,
    wasGrounded: boolean,
    currentCoyoteMs: number,
    deltaMs: number,
  ): number {
    if (isGrounded) {
      return this.config.coyoteTimeMs;
    }

    if (wasGrounded) {
      return this.config.coyoteTimeMs;
    }

    return Math.max(0, currentCoyoteMs - deltaMs);
  }

  updateJumpBuffer(
    jumpPressed: boolean,
    currentBufferMs: number,
    deltaMs: number,
  ): number {
    if (jumpPressed) {
      return this.config.jumpBufferMs;
    }

    return Math.max(0, currentBufferMs - deltaMs);
  }

  shouldExecuteJump(
    isGrounded: boolean,
    coyoteTimeRemainingMs: number,
    jumpPressed: boolean,
    jumpBufferRemainingMs: number,
  ): boolean {
    const jumpInputActive = jumpPressed || jumpBufferRemainingMs > 0;
    return jumpInputActive && this.canJump(isGrounded, coyoteTimeRemainingMs);
  }
}
