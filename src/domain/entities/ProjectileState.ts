import type { Vector2 } from '../value-objects/Vector2';

export interface ProjectileState {
  readonly id: string;
  readonly ownerEnemyId: string;
  readonly position: Vector2;
  readonly velocity: Vector2;
  readonly damage: number;
  readonly remainingMs: number;
}

export interface ProjectileSpawn {
  readonly ownerEnemyId: string;
  readonly position: Vector2;
  readonly velocity: Vector2;
  readonly damage: number;
  readonly lifetimeMs: number;
}
