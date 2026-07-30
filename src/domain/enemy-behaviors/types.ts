import type { EnemyArchetype } from '../entities/Enemy';
import type { EnemyState } from '../entities/EnemyState';
import type { ProjectileSpawn } from '../entities/ProjectileState';
import type { Vector2 } from '../value-objects/Vector2';

export interface MovementContext {
  readonly deltaMs: number;
  readonly patrolMinX: number;
  readonly patrolMaxX: number;
  readonly speed: number;
  readonly floorY?: number;
}

export interface AttackContext {
  readonly deltaMs: number;
  readonly playerPosition: Vector2;
  readonly enemyPosition: Vector2;
  readonly activeProjectileCount: number;
}

export interface AttackTickResult {
  readonly state: EnemyState;
  readonly spawnedProjectiles: readonly ProjectileSpawn[];
}

export type MovementBehavior = (state: EnemyState, ctx: MovementContext) => EnemyState;
export type AttackBehavior = (
  state: EnemyState,
  ctx: AttackContext,
  archetype: EnemyArchetype,
) => AttackTickResult;
