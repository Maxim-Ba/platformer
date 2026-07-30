import { describe, expect, it } from 'vitest';

import {
  ATTACK_ACTIVE_MS,
  ATTACK_COOLDOWN_MS,
  MELEE_DAMAGE,
} from '@domain/constants/combat';
import { ENEMY_ARCHETYPES } from '@domain/constants/enemies';
import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import { InMemoryCombatAdapter } from '@infrastructure/adapters/InMemoryCombatAdapter';
import { InMemoryEnemyAdapter } from '@infrastructure/adapters/InMemoryEnemyAdapter';

import { ExecuteMeleeAttack } from './ExecuteMeleeAttack';

describe('ExecuteMeleeAttack', () => {
  const gruntSpawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'grunt-1',
    position: new Vector2(130, 200),
    enemyType: 'grunt',
    patrolDistance: 120,
  };

  const flyerSpawn: EnemySpawn = {
    kind: 'enemy_spawn',
    id: 'flyer-1',
    position: new Vector2(130, 200),
    enemyType: 'flyer',
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

  it('requires two hits to kill grunt with 2 HP', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    enemyPort.spawnEnemies([gruntSpawn]);
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    const first = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(first.enemiesHit).toContain('grunt-1');
    expect(first.enemiesKilled).toHaveLength(0);
    expect(enemyPort.getEnemies()[0]?.hp).toBe(ENEMY_ARCHETYPES.grunt.maxHp - MELEE_DAMAGE);

    combatPort.tick(ATTACK_ACTIVE_MS + ATTACK_COOLDOWN_MS);

    const second = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(second.enemiesKilled).toEqual([{ enemyId: 'grunt-1', killXp: 25 }]);
    expect(enemyPort.getEnemies()).toHaveLength(0);
  });

  it('kills flyer in one hit using smaller hitbox', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    enemyPort.spawnEnemies([flyerSpawn]);
    const useCase = new ExecuteMeleeAttack(combatPort, enemyPort);

    const result = useCase.execute({
      playerPosition: new Vector2(100, 200),
      facingDirection: 1,
      attackPressed: true,
      deltaMs: 16,
    });

    expect(result.enemiesHit).toContain('flyer-1');
    expect(result.enemiesKilled).toEqual([{ enemyId: 'flyer-1', killXp: 30 }]);
    expect(enemyPort.getEnemies()).toHaveLength(0);
  });

  it('does not apply damage when no enemy overlaps hitbox', () => {
    const combatPort = new InMemoryCombatAdapter();
    const enemyPort = new InMemoryEnemyAdapter();
    enemyPort.spawnEnemies([
      {
        ...gruntSpawn,
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
