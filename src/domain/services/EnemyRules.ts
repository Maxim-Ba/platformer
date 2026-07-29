import {
  ENEMY_DEFAULT_HP,
  ENEMY_DEFAULT_PATROL_DISTANCE,
  ENEMY_HEIGHT,
  ENEMY_SPEED,
  ENEMY_WIDTH,
} from '../constants/combat';
import type { EnemySpawn } from '../entities/LevelDefinition';
import type { EnemyState } from '../entities/EnemyState';
import { Vector2 } from '../value-objects/Vector2';

export class EnemyRules {
  createFromSpawn(spawn: EnemySpawn): EnemyState {
    const patrolDistance = spawn.patrolDistance;
    const spawnX = spawn.position.x;

    return {
      id: spawn.id,
      position: spawn.position,
      hp: ENEMY_DEFAULT_HP,
      patrolDirection: 1,
      patrolMinX: spawnX - patrolDistance,
      patrolMaxX: spawnX + patrolDistance,
      speed: ENEMY_SPEED,
    };
  }

  updatePatrol(enemy: EnemyState, deltaMs: number): EnemyState {
    const deltaSeconds = deltaMs / 1000;
    let nextX = enemy.position.x + enemy.patrolDirection * enemy.speed * deltaSeconds;
    let nextDirection = enemy.patrolDirection;

    if (nextX <= enemy.patrolMinX) {
      nextX = enemy.patrolMinX;
      nextDirection = 1;
    } else if (nextX >= enemy.patrolMaxX) {
      nextX = enemy.patrolMaxX;
      nextDirection = -1;
    }

    return {
      ...enemy,
      position: new Vector2(nextX, enemy.position.y),
      patrolDirection: nextDirection,
    };
  }

  applyDamage(enemy: EnemyState, amount: number): EnemyState | null {
    const nextHp = enemy.hp - amount;

    if (nextHp <= 0) {
      return null;
    }

    return { ...enemy, hp: nextHp };
  }

  getEnemyAabb(enemy: EnemyState): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: enemy.position.x - ENEMY_WIDTH / 2,
      y: enemy.position.y - ENEMY_HEIGHT,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
    };
  }

  overlapsPlayer(
    enemy: EnemyState,
    playerX: number,
    playerFeetY: number,
    playerWidth = 24,
    playerHeight = 48,
  ): boolean {
    const enemyAabb = this.getEnemyAabb(enemy);
    const playerLeft = playerX - playerWidth / 2;
    const playerRight = playerX + playerWidth / 2;
    const playerTop = playerFeetY - playerHeight;
    const playerBottom = playerFeetY;

    return (
      playerRight > enemyAabb.x &&
      playerLeft < enemyAabb.x + enemyAabb.width &&
      playerBottom > enemyAabb.y &&
      playerTop < enemyAabb.y + enemyAabb.height
    );
  }

  defaultPatrolDistance(): number {
    return ENEMY_DEFAULT_PATROL_DISTANCE;
  }
}
