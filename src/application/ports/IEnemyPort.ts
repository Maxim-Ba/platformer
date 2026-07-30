import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import type { EnemyState } from '@domain/entities/EnemyState';
import type { ProjectileSpawn } from '@domain/entities/ProjectileState';
import type { ProjectileState } from '@domain/entities/ProjectileState';

export interface IEnemyPort {
  spawnEnemies(definitions: readonly EnemySpawn[]): void;
  getEnemies(): readonly EnemyState[];
  updateEnemy(state: EnemyState): void;
  applyDamage(enemyId: string, amount: number): boolean;
  getProjectiles(): readonly ProjectileState[];
  addProjectiles(spawns: readonly ProjectileSpawn[]): void;
  tickProjectiles(deltaMs: number): void;
  removeProjectile(projectileId: string): void;
  removeEnemy(enemyId: string): void;
  reset(): void;
}
