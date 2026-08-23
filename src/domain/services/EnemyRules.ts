import { PLAYER_COLLISION_HEIGHT, PLAYER_COLLISION_WIDTH } from '../constants/player';
import { PROJECTILE_HEIGHT, PROJECTILE_WIDTH } from '../constants/projectiles';
import type { EnemyArchetype } from '../entities/Enemy';
import type { EnemyState } from '../entities/EnemyState';
import type { ProjectileState } from '../entities/ProjectileState';
import { Vector2 } from '../value-objects/Vector2';

export class ProjectileRules {
  move(projectile: ProjectileState, deltaMs: number): ProjectileState {
    const deltaSeconds = deltaMs / 1000;

    return {
      ...projectile,
      position: new Vector2(
        projectile.position.x + projectile.velocity.x * deltaSeconds,
        projectile.position.y + projectile.velocity.y * deltaSeconds,
      ),
      remainingMs: projectile.remainingMs - deltaMs,
    };
  }

  isExpired(projectile: ProjectileState): boolean {
    return projectile.remainingMs <= 0;
  }

  getProjectileAabb(projectile: ProjectileState): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: projectile.position.x - PROJECTILE_WIDTH / 2,
      y: projectile.position.y - PROJECTILE_HEIGHT / 2,
      width: PROJECTILE_WIDTH,
      height: PROJECTILE_HEIGHT,
    };
  }

  overlapsPlayer(
    projectile: ProjectileState,
    playerX: number,
    playerFeetY: number,
    playerWidth = PLAYER_COLLISION_WIDTH,
    playerHeight = PLAYER_COLLISION_HEIGHT,
  ): boolean {
    const aabb = this.getProjectileAabb(projectile);
    const playerLeft = playerX - playerWidth / 2;
    const playerRight = playerX + playerWidth / 2;
    const playerTop = playerFeetY - playerHeight;
    const playerBottom = playerFeetY;

    return (
      playerRight > aabb.x &&
      playerLeft < aabb.x + aabb.width &&
      playerBottom > aabb.y &&
      playerTop < aabb.y + aabb.height
    );
  }
}

export class EnemyRules {
  applyDamage(enemy: EnemyState, amount: number): EnemyState | null {
    const nextHp = enemy.hp - amount;

    if (nextHp <= 0) {
      return null;
    }

    return { ...enemy, hp: nextHp };
  }

  getEnemyAabb(
    enemy: EnemyState,
    archetype: EnemyArchetype,
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: enemy.position.x - archetype.width / 2,
      y: enemy.position.y - archetype.height,
      width: archetype.width,
      height: archetype.height,
    };
  }

  overlapsPlayer(
    enemy: EnemyState,
    archetype: EnemyArchetype,
    playerX: number,
    playerFeetY: number,
    playerWidth = PLAYER_COLLISION_WIDTH,
    playerHeight = PLAYER_COLLISION_HEIGHT,
  ): boolean {
    const enemyAabb = this.getEnemyAabb(enemy, archetype);
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
}
