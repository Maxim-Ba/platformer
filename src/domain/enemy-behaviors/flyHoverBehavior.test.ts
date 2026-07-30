import { describe, expect, it } from 'vitest';

import type { EnemySpawn } from '../entities/LevelDefinition';
import { Vector2 } from '../value-objects/Vector2';
import { createEnemyFromSpawn } from '../constants/enemies';
import { flyHoverBehavior } from './flyHoverBehavior';

describe('flyHoverBehavior', () => {
  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'flyer-1',
    position: new Vector2(200, 300),
    enemyType: 'flyer',
  };

  it('applies vertical hover offset while patrolling horizontally', () => {
    const enemy = createEnemyFromSpawn(spawn);

    const next = flyHoverBehavior(enemy, {
      deltaMs: 16,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
      speed: 80,
      floorY: enemy.hoverCenterY,
    });

    expect(next.position.x).not.toBe(enemy.position.x);
    expect(next.position.y).not.toBe(enemy.position.y);
  });

  it('oscillates around hover center Y', () => {
    const enemy = {
      ...createEnemyFromSpawn(spawn),
      behaviorTimerMs: 500,
    };

    const up = flyHoverBehavior(enemy, {
      deltaMs: 0,
      patrolMinX: enemy.patrolMinX,
      patrolMaxX: enemy.patrolMaxX,
      speed: 0,
      floorY: 300,
    });

    const down = flyHoverBehavior(
      { ...enemy, behaviorTimerMs: 1500 },
      {
        deltaMs: 0,
        patrolMinX: enemy.patrolMinX,
        patrolMaxX: enemy.patrolMaxX,
        speed: 0,
        floorY: 300,
      },
    );

    expect(up.position.y).not.toBe(down.position.y);
  });
});
