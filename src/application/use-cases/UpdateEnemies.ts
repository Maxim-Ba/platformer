import { ENEMY_CONTACT_DAMAGE } from '@domain/constants/combat';
import { EnemyRules } from '@domain/services/EnemyRules';
import type { Vector2 } from '@domain/value-objects/Vector2';

import type { IEnemyPort } from '../ports/IEnemyPort';
import type { IHealthPort } from '../ports/IHealthPort';
import { ApplyDamage } from './ApplyDamage';

export interface UpdateEnemiesInput {
  readonly playerPosition: Vector2;
  readonly deltaMs: number;
}

export interface UpdateEnemiesResult {
  readonly contactDamageApplied: boolean;
  readonly survived: boolean;
}

export class UpdateEnemies {
  constructor(
    private readonly enemyPort: IEnemyPort,
    private readonly healthPort: IHealthPort,
    private readonly applyDamage: ApplyDamage,
    private readonly enemyRules: EnemyRules = new EnemyRules(),
  ) {}

  execute(input: UpdateEnemiesInput): UpdateEnemiesResult {
    this.enemyPort.update(input.deltaMs);

    if (this.healthPort.isInvulnerable()) {
      return {
        contactDamageApplied: false,
        survived: true,
      };
    }

    for (const enemy of this.enemyPort.getEnemies()) {
      if (
        this.enemyRules.overlapsPlayer(
          enemy,
          input.playerPosition.x,
          input.playerPosition.y,
        )
      ) {
        const result = this.applyDamage.execute(ENEMY_CONTACT_DAMAGE);

        return {
          contactDamageApplied: true,
          survived: result.survived,
        };
      }
    }

    return {
      contactDamageApplied: false,
      survived: true,
    };
  }
}
