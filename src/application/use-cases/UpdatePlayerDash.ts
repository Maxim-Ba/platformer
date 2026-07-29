import { DashRules } from '@domain/services/DashRules';
import { PlayerState } from '@domain/value-objects/PlayerState';
import { Vector2 } from '@domain/value-objects/Vector2';

export interface UpdatePlayerDashInput {
  readonly state: PlayerState;
  readonly direction: -1 | 1;
  readonly deltaMs: number;
}

export class UpdatePlayerDash {
  constructor(private readonly rules: DashRules = new DashRules()) {}

  execute({ state, direction, deltaMs }: UpdatePlayerDashInput): PlayerState {
    const velocity = this.rules.getDashVelocity(direction);
    const deltaSeconds = deltaMs / 1000;
    const position = new Vector2(
      state.position.x + velocity.x * deltaSeconds,
      state.position.y + velocity.y * deltaSeconds,
    );

    return new PlayerState(
      position,
      velocity,
      state.isGrounded,
      state.coyoteTimeRemainingMs,
      state.jumpBufferRemainingMs,
    );
  }
}
