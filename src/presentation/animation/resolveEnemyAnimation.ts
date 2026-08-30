import type { EnemyArchetype } from '@domain/entities/Enemy';
import type { EnemyState } from '@domain/entities/EnemyState';

export type EnemyAnimationKey = 'idle' | 'walk' | 'fly' | 'attack' | 'hurt';

export interface EnemyAnimationResolveContext {
  hasActiveProjectile?: boolean;
  isHurt?: boolean;
}

/** Matches caster attack strip (~8 frames at 10 fps) after ranged-cast resets the timer. */
export const CASTER_ATTACK_ANIM_MS = 800;

export function resolveEnemyAnimation(
  state: Pick<EnemyState, 'patrolMinX' | 'patrolMaxX' | 'behaviorTimerMs'>,
  archetype: Pick<
    EnemyArchetype,
    'movementBehaviorId' | 'attackBehaviorId' | 'speed'
  >,
  context?: EnemyAnimationResolveContext,
): EnemyAnimationKey {
  if (context?.isHurt) {
    return 'hurt';
  }

  if (archetype.movementBehaviorId === 'fly-hover') {
    return 'fly';
  }

  if (archetype.attackBehaviorId === 'ranged-cast') {
    const isCasting =
      Boolean(context?.hasActiveProjectile) && state.behaviorTimerMs < CASTER_ATTACK_ANIM_MS;

    return isCasting ? 'attack' : 'idle';
  }

  const patrolSpan = state.patrolMaxX - state.patrolMinX;

  if (archetype.speed > 0 && patrolSpan > 0) {
    return 'walk';
  }

  return 'idle';
}

export function toEnemyPhaserAnimKey(spriteKey: string, animationKey: EnemyAnimationKey): string {
  return `${spriteKey}-${animationKey}`;
}
