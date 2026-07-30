import { FLY_HOVER_AMPLITUDE, FLY_HOVER_PERIOD_MS } from '../constants/projectiles';
import { Vector2 } from '../value-objects/Vector2';
import type { EnemyState } from '../entities/EnemyState';
import type { MovementContext } from './types';
import { groundPatrolBehavior } from './groundPatrolBehavior';

export function flyHoverBehavior(state: EnemyState, ctx: MovementContext): EnemyState {
  const afterPatrol = groundPatrolBehavior(state, ctx);
  const floorY = ctx.floorY ?? state.hoverCenterY;
  const nextTimer = afterPatrol.behaviorTimerMs;
  const phase = (nextTimer / FLY_HOVER_PERIOD_MS) * Math.PI * 2;
  const offsetY = Math.sin(phase) * FLY_HOVER_AMPLITUDE;

  return {
    ...afterPatrol,
    position: new Vector2(afterPatrol.position.x, floorY + offsetY),
  };
}
