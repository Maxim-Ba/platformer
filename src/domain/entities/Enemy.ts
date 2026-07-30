import type { Vector2 } from '../value-objects/Vector2';

export type EnemyTypeId = 'grunt' | 'flyer' | 'caster';

export type MovementBehaviorId = 'ground-patrol' | 'fly-hover';
export type AttackBehaviorId = 'contact' | 'ranged-cast';

/** Общий контракт для любого врага на уровне */
export interface Enemy {
  readonly id: string;
  readonly archetypeId: EnemyTypeId;
  readonly position: Vector2;
  readonly hp: number;
  readonly patrolDirection: -1 | 1;
  readonly patrolMinX: number;
  readonly patrolMaxX: number;
  readonly behaviorTimerMs: number;
}

export interface EnemyArchetype {
  readonly id: EnemyTypeId;
  readonly maxHp: number;
  readonly width: number;
  readonly height: number;
  readonly speed: number;
  readonly killXp: number;
  readonly movementBehaviorId: MovementBehaviorId;
  readonly attackBehaviorId: AttackBehaviorId;
  readonly spriteKey: string;
  readonly defaultPatrolDistance: number;
}
