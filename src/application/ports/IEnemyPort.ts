import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import type { EnemyState } from '@domain/entities/EnemyState';

export interface IEnemyPort {
  spawnEnemies(definitions: readonly EnemySpawn[]): void;
  getEnemies(): readonly EnemyState[];
  applyDamage(enemyId: string, amount: number): boolean;
  update(deltaMs: number): void;
  removeEnemy(enemyId: string): void;
  reset(): void;
}
