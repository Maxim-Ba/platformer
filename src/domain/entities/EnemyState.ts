import type { Vector2 } from '../value-objects/Vector2';

export interface EnemyState {
  readonly id: string;
  readonly position: Vector2;
  readonly hp: number;
  readonly patrolDirection: -1 | 1;
  readonly patrolMinX: number;
  readonly patrolMaxX: number;
  readonly speed: number;
}
