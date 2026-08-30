import { describe, expect, it } from 'vitest';

import { createEnemyFromSpawn, ENEMY_ARCHETYPES } from '@domain/constants/enemies';
import { Vector2 } from '@domain/value-objects/Vector2';

import { resolveEnemyAnimation } from './resolveEnemyAnimation';

describe('resolveEnemyAnimation', () => {
  it('returns walk for a ground-patrol grunt with non-zero patrol distance', () => {
    const grunt = createEnemyFromSpawn({
      kind: 'enemy_spawn',
      id: 'grunt-1',
      position: new Vector2(200, 300),
      enemyType: 'grunt',
    });

    expect(resolveEnemyAnimation(grunt, ENEMY_ARCHETYPES.grunt)).toBe('walk');
  });

  it('returns idle for a stationary caster that is not casting', () => {
    const caster = createEnemyFromSpawn({
      kind: 'enemy_spawn',
      id: 'caster-1',
      position: new Vector2(200, 300),
      enemyType: 'caster',
    });

    expect(resolveEnemyAnimation(caster, ENEMY_ARCHETYPES.caster)).toBe('idle');
  });

  it('returns attack while a caster has an active projectile inside the cast window', () => {
    const caster = {
      ...createEnemyFromSpawn({
        kind: 'enemy_spawn',
        id: 'caster-1',
        position: new Vector2(200, 300),
        enemyType: 'caster',
      }),
      behaviorTimerMs: 0,
    };

    expect(
      resolveEnemyAnimation(caster, ENEMY_ARCHETYPES.caster, { hasActiveProjectile: true }),
    ).toBe('attack');
  });

  it('returns fly for a flyer regardless of patrol motion', () => {
    const flyer = createEnemyFromSpawn({
      kind: 'enemy_spawn',
      id: 'flyer-1',
      position: new Vector2(200, 300),
      enemyType: 'flyer',
    });

    expect(resolveEnemyAnimation(flyer, ENEMY_ARCHETYPES.flyer)).toBe('fly');
  });

  it('returns idle for a grunt with zero patrol distance', () => {
    const grunt = createEnemyFromSpawn({
      kind: 'enemy_spawn',
      id: 'grunt-idle',
      position: new Vector2(200, 300),
      enemyType: 'grunt',
      patrolDistance: 0,
    });

    expect(resolveEnemyAnimation(grunt, ENEMY_ARCHETYPES.grunt)).toBe('idle');
  });
});
