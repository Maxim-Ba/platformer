import { describe, expect, it } from 'vitest';

import type { EnemySpawn } from '../entities/LevelDefinition';
import { Vector2 } from '../value-objects/Vector2';
import { createEnemyFromSpawn } from '../constants/enemies';
import { groundPatrolBehavior } from './groundPatrolBehavior';

describe('groundPatrolBehavior', () => {
  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'enemy-1',
    position: new Vector2(200, 300),
    enemyType: 'grunt',
  };

  it('moves enemy horizontally at configured speed', () => {
    const enemy = createEnemyFromSpawn(spawn);

    const next = groundPatrolBehavior(enemy, {
      deltaMs: 1000,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
      speed: 60,
    });

    expect(next.position.x).toBeGreaterThan(enemy.position.x);
  });

  it('reverses direction at patrol boundary', () => {
    const enemy = {
      ...createEnemyFromSpawn(spawn),
      position: new Vector2(320, 300),
      patrolDirection: 1 as const,
    };

    const next = groundPatrolBehavior(enemy, {
      deltaMs: 1000,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
      speed: 60,
    });

    expect(next.patrolDirection).toBe(-1);
    expect(next.position.x).toBe(enemy.patrolMaxX);
  });
});
