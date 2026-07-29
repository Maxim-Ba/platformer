import type { IEnemyPort } from '@application/ports/IEnemyPort';
import type { EnemySpawn } from '@domain/entities/LevelDefinition';
import type { EnemyState } from '@domain/entities/EnemyState';
import { EnemyRules } from '@domain/services/EnemyRules';

export class InMemoryEnemyAdapter implements IEnemyPort {
  private enemies = new Map<string, EnemyState>();
  private readonly rules = new EnemyRules();

  spawnEnemies(definitions: readonly EnemySpawn[]): void {
    for (const spawn of definitions) {
      this.enemies.set(spawn.id, this.rules.createFromSpawn(spawn));
    }
  }

  getEnemies(): readonly EnemyState[] {
    return [...this.enemies.values()];
  }

  applyDamage(enemyId: string, amount: number): boolean {
    const enemy = this.enemies.get(enemyId);

    if (!enemy) {
      return false;
    }

    const next = this.rules.applyDamage(enemy, amount);

    if (!next) {
      this.enemies.delete(enemyId);
      return true;
    }

    this.enemies.set(enemyId, next);
    return false;
  }

  update(deltaMs: number): void {
    for (const [id, enemy] of this.enemies) {
      this.enemies.set(id, this.rules.updatePatrol(enemy, deltaMs));
    }
  }

  removeEnemy(enemyId: string): void {
    this.enemies.delete(enemyId);
  }

  reset(): void {
    this.enemies.clear();
  }
}
