import { DASH_COOLDOWN_MS, DASH_DURATION_MS, DASH_SPEED } from '../constants/dash';
import { DashState } from '../value-objects/DashState';
import { Velocity } from '../value-objects/Velocity';

export class DashRules {
  canStart(state: DashState): boolean {
    return !state.isDashing && state.cooldownRemainingMs <= 0;
  }

  startDash(state: DashState, direction: -1 | 1): DashState {
    return state.withDirection(direction).withRemainingMs(DASH_DURATION_MS);
  }

  tick(state: DashState, deltaMs: number): DashState {
    if (state.isDashing) {
      const remainingMs = state.remainingMs - deltaMs;

      if (remainingMs > 0) {
        return state.withRemainingMs(remainingMs);
      }

      const overflowMs = -remainingMs;
      const cooldownRemainingMs = Math.max(0, DASH_COOLDOWN_MS - overflowMs);

      return state.withRemainingMs(0).withCooldownRemainingMs(cooldownRemainingMs);
    }

    if (state.cooldownRemainingMs > 0) {
      return state.withCooldownRemainingMs(Math.max(0, state.cooldownRemainingMs - deltaMs));
    }

    return state;
  }

  getDashVelocity(direction: -1 | 1): Velocity {
    return new Velocity(direction * DASH_SPEED, 0);
  }
}
