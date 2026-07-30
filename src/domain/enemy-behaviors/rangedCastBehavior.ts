import {
  CASTER_AGGRO_RANGE,
  CAST_INTERVAL_MS,
  MAX_PROJECTILES_PER_CASTER,
  PROJECTILE_DAMAGE,
  PROJECTILE_LIFETIME_MS,
  PROJECTILE_SPEED,
} from '../constants/projectiles';
import { Vector2 } from '../value-objects/Vector2';
import type { EnemyState } from '../entities/EnemyState';
import type { AttackContext, AttackTickResult } from './types';

export function rangedCastBehavior(
  state: EnemyState,
  ctx: AttackContext,
): AttackTickResult {
  const dx = ctx.playerPosition.x - ctx.enemyPosition.x;
  const dy = ctx.playerPosition.y - ctx.enemyPosition.y;
  const distance = Math.hypot(dx, dy);

  if (
    distance > CASTER_AGGRO_RANGE ||
    ctx.activeProjectileCount >= MAX_PROJECTILES_PER_CASTER ||
    state.behaviorTimerMs < CAST_INTERVAL_MS
  ) {
    return {
      state,
      spawnedProjectiles: [],
    };
  }

  const length = distance > 0 ? distance : 1;
  const velocity = new Vector2(
    (dx / length) * PROJECTILE_SPEED,
    (dy / length) * PROJECTILE_SPEED,
  );

  return {
    state: { ...state, behaviorTimerMs: 0 },
    spawnedProjectiles: [
      {
        ownerEnemyId: state.id,
        position: new Vector2(ctx.enemyPosition.x, ctx.enemyPosition.y - 20),
        velocity,
        damage: PROJECTILE_DAMAGE,
        lifetimeMs: PROJECTILE_LIFETIME_MS,
      },
    ],
  };
}
