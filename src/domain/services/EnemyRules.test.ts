import { describe, expect, it } from 'vitest';

import { ENEMY_ARCHETYPES, createEnemyFromSpawn } from '../constants/enemies';
import type { EnemySpawn } from '../entities/LevelDefinition';
import { Vector2 } from '../value-objects/Vector2';
import { EnemyRules } from './EnemyRules';

describe('EnemyRules', () => {
  const rules = new EnemyRules();

  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'enemy-1',
    position: new Vector2(200, 544),
    enemyType: 'grunt',
  };

  it('applies archetype-sized AABB for grunt', () => {
    const enemy = createEnemyFromSpawn(spawn);
    const aabb = rules.getEnemyAabb(enemy, ENEMY_ARCHETYPES.grunt);

    expect(aabb.width).toBe(32);
    expect(aabb.height).toBe(48);
    expect(aabb.x).toBe(enemy.position.x - 16);
    expect(aabb.y).toBe(enemy.position.y - 48);
  });

  it('uses smaller flyer hitbox for overlap', () => {
    const enemy = createEnemyFromSpawn({ ...spawn, enemyType: 'flyer' });
    const aabb = rules.getEnemyAabb(enemy, ENEMY_ARCHETYPES.flyer);

    expect(aabb.width).toBe(24);
    expect(aabb.height).toBe(24);
  });

  it('removes enemy on lethal damage', () => {
    const enemy = createEnemyFromSpawn(spawn);

    expect(rules.applyDamage(enemy, 2)).toBeNull();
    expect(rules.applyDamage(enemy, 1)?.hp).toBe(1);
  });

  it('detects overlap with player AABB', () => {
    const enemy = createEnemyFromSpawn(spawn);

    expect(
      rules.overlapsPlayer(enemy, ENEMY_ARCHETYPES.grunt, enemy.position.x, enemy.position.y),
    ).toBe(true);
    expect(rules.overlapsPlayer(enemy, ENEMY_ARCHETYPES.grunt, 0, 0)).toBe(false);
  });
});
