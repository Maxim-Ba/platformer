import { describe, expect, it } from 'vitest';

import { ENEMY_CONTACT_DAMAGE } from '@domain/constants/combat';
import { CAST_INTERVAL_MS } from '@domain/constants/projectiles';
import { MAX_HP } from '@domain/constants/health';
import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import { InMemoryEnemyAdapter } from '@infrastructure/adapters/InMemoryEnemyAdapter';
import { InMemoryHealthAdapter } from '@infrastructure/adapters/InMemoryHealthAdapter';

import { ApplyDamage } from './ApplyDamage';
import { UpdateEnemies } from './UpdateEnemies';

describe('UpdateEnemies', () => {
  const gruntSpawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'grunt-1',
    position: new Vector2(100, 200),
    enemyType: 'grunt',
    patrolDistance: 120,
  };

  const flyerSpawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'flyer-1',
    position: new Vector2(300, 150),
    enemyType: 'flyer',
  };

  const casterSpawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'caster-1',
    position: new Vector2(100, 200),
    enemyType: 'caster',
    patrolDistance: 0,
  };

  it('moves enemies during update', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([gruntSpawn]);

    const before = enemyPort.getEnemies()[0]!.position.x;

    useCase.execute({
      playerPosition: new Vector2(0, 0),
      deltaMs: 1000,
    });

    expect(enemyPort.getEnemies()[0]!.position.x).toBeGreaterThan(before);
  });

  it('applies contact damage when player overlaps enemy', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([gruntSpawn]);

    const result = useCase.execute({
      playerPosition: gruntSpawn.position,
      deltaMs: 16,
    });

    expect(result.contactDamageApplied).toBe(true);
    expect(result.survived).toBe(true);
    expect(healthPort.getHealth().currentHp).toBe(MAX_HP - ENEMY_CONTACT_DAMAGE);
  });

  it('skips contact damage while player is invulnerable', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([gruntSpawn]);
    healthPort.grantInvulnerability(1000);

    const result = useCase.execute({
      playerPosition: gruntSpawn.position,
      deltaMs: 16,
    });

    expect(result.contactDamageApplied).toBe(false);
    expect(healthPort.getHealth().currentHp).toBe(MAX_HP);
  });

  it('updates mixed enemy types in one frame', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([gruntSpawn, flyerSpawn, casterSpawn]);

    useCase.execute({
      playerPosition: new Vector2(0, 0),
      deltaMs: 100,
    });

    const enemies = enemyPort.getEnemies();
    expect(enemies).toHaveLength(3);
    expect(enemies.map((e) => e.archetypeId).sort()).toEqual(['caster', 'flyer', 'grunt']);
  });

  it('caster spawns projectile when player is in aggro range', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([casterSpawn]);

    const caster = enemyPort.getEnemies()[0]!;
    enemyPort.updateEnemy({ ...caster, behaviorTimerMs: CAST_INTERVAL_MS });

    useCase.execute({
      playerPosition: new Vector2(caster.position.x + 50, caster.position.y),
      deltaMs: 16,
    });

    expect(enemyPort.getProjectiles()).toHaveLength(1);
  });

  it('applies projectile damage when projectile overlaps player', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([casterSpawn]);

    const playerPosition = new Vector2(140, 200);
    enemyPort.addProjectiles([
      {
        ownerEnemyId: 'caster-1',
        position: playerPosition,
        velocity: new Vector2(0, 0),
        damage: 1,
        lifetimeMs: 3000,
      },
    ]);

    const result = useCase.execute({
      playerPosition,
      deltaMs: 16,
    });

    expect(result.projectileDamageApplied).toBe(true);
    expect(healthPort.getHealth().currentHp).toBe(MAX_HP - 1);
    expect(enemyPort.getProjectiles()).toHaveLength(0);
  });
});
