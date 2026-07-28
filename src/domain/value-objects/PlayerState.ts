import { Vector2 } from './Vector2';
import { Velocity } from './Velocity';

export class PlayerState {
  constructor(
    readonly position: Vector2,
    readonly velocity: Velocity,
    readonly isGrounded: boolean,
    readonly coyoteTimeRemainingMs: number,
    readonly jumpBufferRemainingMs: number,
  ) {}

  withPosition(position: Vector2): PlayerState {
    return new PlayerState(
      position,
      this.velocity,
      this.isGrounded,
      this.coyoteTimeRemainingMs,
      this.jumpBufferRemainingMs,
    );
  }

  withVelocity(velocity: Velocity): PlayerState {
    return new PlayerState(
      this.position,
      velocity,
      this.isGrounded,
      this.coyoteTimeRemainingMs,
      this.jumpBufferRemainingMs,
    );
  }

  withGrounded(isGrounded: boolean): PlayerState {
    return new PlayerState(
      this.position,
      this.velocity,
      isGrounded,
      this.coyoteTimeRemainingMs,
      this.jumpBufferRemainingMs,
    );
  }

  withCoyoteTimeRemainingMs(coyoteTimeRemainingMs: number): PlayerState {
    return new PlayerState(
      this.position,
      this.velocity,
      this.isGrounded,
      coyoteTimeRemainingMs,
      this.jumpBufferRemainingMs,
    );
  }

  withJumpBufferRemainingMs(jumpBufferRemainingMs: number): PlayerState {
    return new PlayerState(
      this.position,
      this.velocity,
      this.isGrounded,
      this.coyoteTimeRemainingMs,
      jumpBufferRemainingMs,
    );
  }
}
