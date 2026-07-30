import { MELEE_DAMAGE } from '@domain/constants/combat';
import { resolveArchetype } from '@domain/constants/enemies';
import { CombatRules } from '@domain/services/CombatRules';
import { EnemyRules } from '@domain/services/EnemyRules';
import type { Vector2 } from '@domain/value-objects/Vector2';

import type { ICombatPort } from '../ports/ICombatPort';
import type { IEnemyPort } from '../ports/IEnemyPort';

export interface ExecuteMeleeAttackInput {
  readonly playerPosition: Vector2;
  readonly facingDirection: -1 | 1;
  readonly attackPressed: boolean;
  readonly deltaMs: number;
}

export interface EnemyKillReward {
  readonly enemyId: string;
  readonly killXp: number;
}

export interface ExecuteMeleeAttackResult {
  readonly attackStarted: boolean;
  readonly enemiesHit: readonly string[];
  readonly enemiesKilled: readonly EnemyKillReward[];
}

export class ExecuteMeleeAttack {
  constructor(
    private readonly combatPort: ICombatPort,
    private readonly enemyPort: IEnemyPort,
    private readonly combatRules: CombatRules = new CombatRules(),
    private readonly enemyRules: EnemyRules = new EnemyRules(),
  ) {}

  execute(input: ExecuteMeleeAttackInput): ExecuteMeleeAttackResult {
    this.combatPort.tick(input.deltaMs);

    let attackStarted = false;
    const stateBeforeAttack = this.combatPort.getAttackState();

    if (input.attackPressed && this.combatRules.canStartAttack(stateBeforeAttack)) {
      this.combatPort.startAttack(input.facingDirection);
      attackStarted = true;
    }

    const attackState = this.combatPort.getAttackState();

    if (!this.combatRules.isAttackActive(attackState)) {
      return {
        attackStarted,
        enemiesHit: [],
        enemiesKilled: [],
      };
    }

    const hitbox = this.combatRules.computeHitbox(
      input.playerPosition.x,
      input.playerPosition.y,
      attackState.facingDirection,
    );

    const enemiesHit: string[] = [];
    const enemiesKilled: EnemyKillReward[] = [];

    for (const enemy of this.enemyPort.getEnemies()) {
      const archetype = resolveArchetype(enemy.archetypeId);
      const enemyAabb = this.enemyRules.getEnemyAabb(enemy, archetype);

      if (
        !this.combatRules.hitboxOverlapsAabb(
          hitbox,
          enemyAabb.x,
          enemyAabb.y,
          enemyAabb.width,
          enemyAabb.height,
        )
      ) {
        continue;
      }

      enemiesHit.push(enemy.id);

      if (this.enemyPort.applyDamage(enemy.id, MELEE_DAMAGE)) {
        enemiesKilled.push({ enemyId: enemy.id, killXp: archetype.killXp });
      }
    }

    return {
      attackStarted,
      enemiesHit,
      enemiesKilled,
    };
  }
}
