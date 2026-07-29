import { describe, expect, it } from 'vitest';

import { ENEMY_DEFAULT_HP, ENEMY_DEFAULT_PATROL_DISTANCE } from '../constants/combat';
import type { EnemySpawn } from '../entities/LevelDefinition';
import { Vector2 } from '../value-objects/Vector2';
import { EnemyRules } from './EnemyRules';

describe('EnemyRules', () => {
  const rules = new EnemyRules();

  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'enemy-1',
    position: new Vector2(200, 544),
    patrolDistance: ENEMY_DEFAULT_PATROL_DISTANCE,
  };

  it('creates enemy with patrol bounds around spawn X', () => {
    const enemy = rules.createFromSpawn(spawn);

    expect(enemy.hp).toBe(ENEMY_DEFAULT_HP);
    expect(enemy.patrolMinX).toBe(200 - ENEMY_DEFAULT_PATROL_DISTANCE);
    expect(enemy.patrolMaxX).toBe(200 + ENEMY_DEFAULT_PATROL_DISTANCE);
    expect(enemy.patrolDirection).toBe(1);
  });

  it('moves enemy horizontally during patrol update', () => {
    const enemy = rules.createFromSpawn(spawn);

    const next = rules.updatePatrol(enemy, 1000);

    expect(next.position.x).toBeGreaterThan(enemy.position.x);
  });

  it('reverses patrol direction at max boundary', () => {
    const enemy = {
      ...rules.createFromSpawn(spawn),
      position: new Vector2(spawn.position.x + ENEMY_DEFAULT_PATROL_DISTANCE, spawn.position.y),
      patrolDirection: 1 as const,
    };

    const next = rules.updatePatrol(enemy, 1000);

    expect(next.position.x).toBe(enemy.patrolMaxX);
    expect(next.patrolDirection).toBe(-1);
  });

  it('reverses patrol direction at min boundary', () => {
    const enemy = {
      ...rules.createFromSpawn(spawn),
      position: new Vector2(spawn.position.x - ENEMY_DEFAULT_PATROL_DISTANCE, spawn.position.y),
      patrolDirection: -1 as const,
    };

    const next = rules.updatePatrol(enemy, 1000);

    expect(next.position.x).toBe(enemy.patrolMinX);
    expect(next.patrolDirection).toBe(1);
  });

  it('removes enemy on lethal damage', () => {
    const enemy = rules.createFromSpawn(spawn);

    expect(rules.applyDamage(enemy, 1)).toBeNull();
  });

  it('detects overlap with player AABB', () => {
    const enemy = rules.createFromSpawn(spawn);

    expect(rules.overlapsPlayer(enemy, enemy.position.x, enemy.position.y)).toBe(true);
    expect(rules.overlapsPlayer(enemy, 0, 0)).toBe(false);
  });
});
