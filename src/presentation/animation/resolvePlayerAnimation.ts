export type PlayerAnimationKey = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'dash' | 'hurt';

export interface AnimationResolveContext {
  isAttacking?: boolean;
  isDashing?: boolean;
  isHurt?: boolean;
  runSpeedThreshold?: number;
}

export const DEFAULT_RUN_SPEED_THRESHOLD = 10;

export function resolvePlayerAnimation(
  state: {
    velocity: { x: number; y: number };
    isGrounded: boolean;
  },
  context?: AnimationResolveContext,
): PlayerAnimationKey {
  if (context?.isHurt) {
    return 'hurt';
  }

  if (context?.isAttacking) {
    return 'attack';
  }

  if (context?.isDashing) {
    return 'dash';
  }

  if (!state.isGrounded) {
    return state.velocity.y < 0 ? 'jump' : 'fall';
  }

  const threshold = context?.runSpeedThreshold ?? DEFAULT_RUN_SPEED_THRESHOLD;

  if (Math.abs(state.velocity.x) >= threshold) {
    return 'run';
  }

  return 'idle';
}
