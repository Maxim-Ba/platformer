import { describe, expect, it } from 'vitest';

import {
  ATTACK_ACTIVE_MS,
  ATTACK_COOLDOWN_MS,
} from '@domain/constants/combat';
import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import { InMemoryCombatAdapter } from '@infrastructure/adapters/InMemoryCombatAdapter';
import { InMemoryEnemyAdapter } from '@infrastructure/adapters/InMemoryEnemyAdapter';

import { ExecuteMeleeAttack } from './ExecuteMeleeAttack';

describe('ExecuteMeleeAttack', () => {
  const spawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'enemy-1',
    position: new Vector2(130, 200),
    patrolDistance: 120,
  };

  it('starts attack when input is pressed and cooldown elapsed', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    const result = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(result.attackStarted).toBe(true);
    expect(combatPort.getAttackState().isAttacking).toBe(true);
  });

  it('does not start attack while cooldown is active', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    const result = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(result.attackStarted).toBe(false);
  });

  it('damages overlapping enemy during active attack window', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    enemyPort.spawnEnemies([spawn]);
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    const result = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(result.enemiesHit).toContain('enemy-1');
    expect(result.enemiesKilled).toContain('enemy-1');
    expect(enemyPort.getEnemies()).toHaveLength(0);
  });

  it('does not apply damage when no enemy overlaps hitbox', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    enemyPort.spawnEnemies([
      {
        ...spawn,
        position: new Vector2(500, 200),
      },
    ]);
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    const result = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: false,
      deltaMs: 16,
    });

    expect(result.enemiesHit).toHaveLength(0);
    expect(enemyPort.getEnemies()).toHaveLength(1);
  });

  it('ignores attack input after cooldown expires again', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: false,
      deltaMs: ATTACK_ACTIVE_MS + ATTACK_COOLDOWN_MS,
    });

    const result = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(result.attackStarted).toBe(true);
  });
});
