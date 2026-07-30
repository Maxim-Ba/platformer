import type { IEnemyPort } from '@application/ports/IEnemyPort';
import { createEnemyFromSpawn } from '@domain/constants/enemies';
import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import type { EnemyState } from '@domain/entities/EnemyState';
import type { ProjectileSpawn, ProjectileState } from '@domain/entities/ProjectileState';
import { EnemyRules, ProjectileRules } from '@domain/services/EnemyRules';

export class InMemoryEnemyAdapter implements IEnemyPort {
  private enemies = new Map<string, EnemyState>();
  private projectiles = new Map<string, ProjectileState>();
  private nextProjectileId = 1;
  private readonly enemyRules = new EnemyRules();
  private readonly projectileRules = new ProjectileRules();

  spawnEnemies(definitions: readonly EnemySpawn[]): void {
    for (const spawn of definitions) {
      this.enemies.set(spawn.id, createEnemyFromSpawn(spawn));
    }
  }

  getEnemies(): readonly EnemyState[] {
    return [...this.enemies.values()];
  }

  updateEnemy(state: EnemyState): void {
    if (this.enemies.has(state.id)) {
      this.enemies.set(state.id, state);
    }
  }

  applyDamage(enemyId: string, amount: number): boolean {
    const enemy = this.enemies.get(enemyId);

    if (!enemy) {
      return false;
    }

    const next = this.enemyRules.applyDamage(enemy, amount);

    if (!next) {
      this.enemies.delete(enemyId);
      return true;
    }

    this.enemies.set(enemyId, next);
    return false;
  }

  getProjectiles(): readonly ProjectileState[] {
    return [...this.projectiles.values()];
  }

  addProjectiles(spawns: readonly ProjectileSpawn[]): void {
    for (const spawn of spawns) {
      const id = `projectile-${this.nextProjectileId++}`;
      this.projectiles.set(id, {
        id,
        ownerEnemyId: spawn.ownerEnemyId,
        position: spawn.position,
        velocity: spawn.velocity,
        damage: spawn.damage,
        remainingMs: spawn.lifetimeMs,
      });
    }
  }

  tickProjectiles(deltaMs: number): void {
    const expired: string[] = [];

    for (const [id, projectile] of this.projectiles) {
      const next = this.projectileRules.move(projectile, deltaMs);

      if (this.projectileRules.isExpired(next)) {
        expired.push(id);
      } else {
        this.projectiles.set(id, next);
      }
    }

    for (const id of expired) {
      this.projectiles.delete(id);
    }
  }

  removeProjectile(projectileId: string): void {
    this.projectiles.delete(projectileId);
  }

  removeEnemy(enemyId: string): void {
    this.enemies.delete(enemyId);

    for (const [id, projectile] of this.projectiles) {
      if (projectile.ownerEnemyId === enemyId) {
        this.projectiles.delete(id);
      }
    }
  }

  reset(): void {
    this.enemies.clear();
    this.projectiles.clear();
    this.nextProjectileId = 1;
  }
}
