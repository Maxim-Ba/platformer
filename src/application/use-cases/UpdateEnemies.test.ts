import { describe, expect, it } from 'vitest';

import { ENEMY_CONTACT_DAMAGE } from '@domain/constants/combat';
import { MAX_HP } from '@domain/constants/health';
import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import { InMemoryEnemyAdapter } from '@infrastructure/adapters/InMemoryEnemyAdapter';
import { InMemoryHealthAdapter } from '@infrastructure/adapters/InMemoryHealthAdapter';

import { ApplyDamage } from './ApplyDamage';
import { UpdateEnemies } from './UpdateEnemies';

describe('UpdateEnemies', () => {
  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'enemy-1',
    position: new Vector2(100, 200),
    patrolDistance: 120,
  };

  it('moves enemies during update', () => {
    const enemyPort = new InMemoryEnemyAdapter();
    const healthPort = new InMemoryHealthAdapter();
    const useCase = new UpdateEnemies(enemyPort, healthPort, new ApplyDamage(healthPort));
    enemyPort.spawnEnemies([spawn]);

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
    enemyPort.spawnEnemies([spawn]);

    const result = useCase.execute({
      playerPosition: spawn.position,
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
    enemyPort.spawnEnemies([spawn]);
    healthPort.grantInvulnerability(1000);

    const result = useCase.execute({
      playerPosition: spawn.position,
      deltaMs: 16,
    });

    expect(result.contactDamageApplied).toBe(false);
    expect(healthPort.getHealth().currentHp).toBe(MAX_HP);
  });
});
