import { Vector2 } from '../value-objects/Vector2';
import type { EnemyState } from '../entities/EnemyState';
import type { MovementContext } from './types';

export function groundPatrolBehavior(state: EnemyState, ctx: MovementContext): EnemyState {
  const deltaSeconds = ctx.deltaMs / 1000;
  let nextX = state.position.x + state.patrolDirection * ctx.speed * deltaSeconds;
  let nextDirection = state.patrolDirection;

  if (nextX <= ctx.patrolMinX) {
    nextX = ctx.patrolMinX;
    nextDirection = 1;
  } else if (nextX >= ctx.patrolMaxX) {
    nextX = ctx.patrolMaxX;
    nextDirection = -1;
  }

  return {
    ...state,
    position: new Vector2(nextX, state.position.y),
    patrolDirection: nextDirection,
    behaviorTimerMs: state.behaviorTimerMs + ctx.deltaMs,
  };
}
