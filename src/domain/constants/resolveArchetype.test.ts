import { describe, expect, it, vi } from 'vitest';

import {
  ENEMY_ARCHETYPES,
  createEnemyFromSpawn,
  createEnemyFromSpawnWithArchetype,
  createTestArchetype,
  resolveArchetype,
} from './enemies';
import type { EnemySpawn } from '../entities/LevelDefinition';
import { Vector2 } from '../value-objects/Vector2';

describe('resolveArchetype', () => {
  it('resolves grunt archetype with expected stats', () => {
    const archetype = resolveArchetype('grunt');

    expect(archetype).toEqual(ENEMY_ARCHETYPES.grunt);
    expect(archetype.maxHp).toBe(2);
    expect(archetype.width).toBe(64);
    expect(archetype.height).toBe(96);
    expect(archetype.killXp).toBe(25);
  });

  it('resolves flyer and caster archetypes', () => {
    expect(resolveArchetype('flyer').maxHp).toBe(1);
    expect(resolveArchetype('flyer').width).toBe(48);
    expect(resolveArchetype('caster').killXp).toBe(40);
    expect(resolveArchetype('caster').attackBehaviorId).toBe('ranged-cast');
  });

  it('falls back to grunt for unknown type with warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const archetype = resolveArchetype('unknown-boss');

    expect(archetype.id).toBe('grunt');
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe('createEnemyFromSpawn', () => {
  const baseSpawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'enemy-1',
    position: new Vector2(200, 300),
    enemyType: 'grunt',
  };

  it('initializes HP from archetype', () => {
    const enemy = createEnemyFromSpawn(baseSpawn);

    expect(enemy.hp).toBe(2);
    expect(enemy.archetypeId).toBe('grunt');
    expect(enemy.behaviorTimerMs).toBe(0);
  });

  it('uses archetype default patrol distance when override omitted', () => {
    const flyer = createEnemyFromSpawn({ ...baseSpawn, enemyType: 'flyer' });

    expect(flyer.patrolMinX).toBe(200 - 160);
    expect(flyer.patrolMaxX).toBe(200 + 160);
  });

  it('applies patrolDistance override from spawn', () => {
    const enemy = createEnemyFromSpawn({ ...baseSpawn, patrolDistance: 80 });

    expect(enemy.patrolMinX).toBe(120);
    expect(enemy.patrolMaxX).toBe(280);
  });
});

describe('enemy extensibility', () => {
  it('spawns valid Enemy from new catalog entry without consumer changes', () => {
    const customArchetype = createTestArchetype({
      id: 'grunt',
      maxHp: 5,
      width: 40,
      height: 50,
      killXp: 99,
      defaultPatrolDistance: 64,
    });

    const spawn: EnemySpawn = {
      kind: 'enemy_spawn',
      id: 'enemy-custom',
      position: new Vector2(100, 200),
      enemyType: 'grunt',
    };

    const enemy = createEnemyFromSpawnWithArchetype(spawn, customArchetype);

    expect(enemy.id).toBe('enemy-custom');
    expect(enemy.archetypeId).toBe('grunt');
    expect(enemy.hp).toBe(5);
    expect(enemy.patrolMinX).toBe(36);
    expect(enemy.patrolMaxX).toBe(164);
    expect(enemy.behaviorTimerMs).toBe(0);
  });
});
