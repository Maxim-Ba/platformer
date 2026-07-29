import { MELEE_DAMAGE } from '@domain/constants/combat';
import { CombatRules } from '@domain/services/CombatRules';
import type { Vector2 } from '@domain/value-objects/Vector2';

import type { ICombatPort } from '../ports/ICombatPort';
import type { IEnemyPort } from '../ports/IEnemyPort';
import { EnemyRules } from '@domain/services/EnemyRules';

export interface ExecuteMeleeAttackInput {
  readonly playerPosition: Vector2;
  readonly facingDirection: -1 | 1;
  readonly attackPressed: boolean;
  readonly deltaMs: number;
}

export interface ExecuteMeleeAttackResult {
  readonly attackStarted: boolean;
  readonly enemiesHit: readonly string[];
  readonly enemiesKilled: readonly string[];
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
    const enemiesKilled: string[] = [];

    for (const enemy of this.enemyPort.getEnemies()) {
      const enemyAabb = this.enemyRules.getEnemyAabb(enemy);

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
        enemiesKilled.push(enemy.id);
      }
    }

    return {
      attackStarted,
      enemiesHit,
      enemiesKilled,
    };
  }
}
