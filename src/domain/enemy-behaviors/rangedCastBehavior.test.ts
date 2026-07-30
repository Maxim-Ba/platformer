import { describe, expect, it } from 'vitest';

import { CAST_INTERVAL_MS, CASTER_AGGRO_RANGE } from '../constants/projectiles';
import type { EnemySpawn } from '../entities/LevelDefinition';
import { Vector2 } from '../value-objects/Vector2';
import { createEnemyFromSpawn } from '../constants/enemies';
import { rangedCastBehavior } from './rangedCastBehavior';

describe('rangedCastBehavior', () => {
  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'caster-1',
    position: new Vector2(100, 200),
    enemyType: 'caster',
  };

  it('does not spawn projectile before cast interval', () => {
    const enemy = createEnemyFromSpawn(spawn);

    const result = rangedCastBehavior(enemy, {
      deltaMs: 16,
      playerPosition: new Vector2(120, 200),
      enemyPosition: enemy.position,
      activeProjectileCount: 0,
    });

    expect(result.spawnedProjectiles).toHaveLength(0);
  });

  it('spawns projectile toward player when in aggro range and cooldown elapsed', () => {
    const enemy = {
      ...createEnemyFromSpawn(spawn),
      behaviorTimerMs: CAST_INTERVAL_MS,
    };

    const result = rangedCastBehavior(enemy, {
      deltaMs: 16,
      playerPosition: new Vector2(200, 200),
      enemyPosition: enemy.position,
      activeProjectileCount: 0,
    });

    expect(result.spawnedProjectiles).toHaveLength(1);
    expect(result.spawnedProjectiles[0]?.velocity.x).toBeGreaterThan(0);
    expect(result.state.behaviorTimerMs).toBe(0);
  });

  it('does not spawn when player is outside aggro range', () => {
    const enemy = {
      ...createEnemyFromSpawn(spawn),
      behaviorTimerMs: CAST_INTERVAL_MS,
    };

    const result = rangedCastBehavior(enemy, {
      deltaMs: 16,
      playerPosition: new Vector2(100 + CASTER_AGGRO_RANGE + 50, 200),
      enemyPosition: enemy.position,
      activeProjectileCount: 0,
    });

    expect(result.spawnedProjectiles).toHaveLength(0);
  });
});
