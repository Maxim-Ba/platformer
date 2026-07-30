import { ENEMY_CONTACT_DAMAGE } from '@domain/constants/combat';
import { resolveArchetype } from '@domain/constants/enemies';
import { getAttackBehavior, getMovementBehavior } from '@domain/enemy-behaviors/behaviorRegistry';
import { EnemyRules, ProjectileRules } from '@domain/services/EnemyRules';
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
  readonly projectileDamageApplied: boolean;
  readonly survived: boolean;
}

export class UpdateEnemies {
  constructor(
    private readonly enemyPort: IEnemyPort,
    private readonly healthPort: IHealthPort,
    private readonly applyDamage: ApplyDamage,
    private readonly enemyRules: EnemyRules = new EnemyRules(),
    private readonly projectileRules: ProjectileRules = new ProjectileRules(),
  ) {}

  execute(input: UpdateEnemiesInput): UpdateEnemiesResult {
    for (const enemy of this.enemyPort.getEnemies()) {
      const archetype = resolveArchetype(enemy.archetypeId);
      const movement = getMovementBehavior(archetype.movementBehaviorId);

      const afterMovement = movement(enemy, {
        deltaMs: input.deltaMs,
        patrolMinX: enemy.patrolMinX,
        patrolMaxX: enemy.patrolMaxX,
        speed: archetype.speed,
        floorY: enemy.hoverCenterY,
      });

      const activeProjectiles = this.enemyPort
        .getProjectiles()
        .filter((projectile) => projectile.ownerEnemyId === enemy.id).length;

      const attack = getAttackBehavior(archetype.attackBehaviorId);
      const attackResult = attack(afterMovement, {
        deltaMs: input.deltaMs,
        playerPosition: input.playerPosition,
        enemyPosition: afterMovement.position,
        activeProjectileCount: activeProjectiles,
      }, archetype);

      this.enemyPort.updateEnemy(attackResult.state);

      if (attackResult.spawnedProjectiles.length > 0) {
        this.enemyPort.addProjectiles(attackResult.spawnedProjectiles);
      }
    }

    this.enemyPort.tickProjectiles(input.deltaMs);

    if (this.healthPort.isInvulnerable()) {
      return {
        contactDamageApplied: false,
        projectileDamageApplied: false,
        survived: true,
      };
    }

    for (const enemy of this.enemyPort.getEnemies()) {
      const archetype = resolveArchetype(enemy.archetypeId);

      if (archetype.attackBehaviorId !== 'contact') {
        continue;
      }

      if (
        this.enemyRules.overlapsPlayer(
          enemy,
          archetype,
          input.playerPosition.x,
          input.playerPosition.y,
        )
      ) {
        const result = this.applyDamage.execute(ENEMY_CONTACT_DAMAGE);

        return {
          contactDamageApplied: true,
          projectileDamageApplied: false,
          survived: result.survived,
        };
      }
    }

    for (const projectile of this.enemyPort.getProjectiles()) {
      if (
        this.projectileRules.overlapsPlayer(
          projectile,
          input.playerPosition.x,
          input.playerPosition.y,
        )
      ) {
        this.enemyPort.removeProjectile(projectile.id);
        const result = this.applyDamage.execute(projectile.damage);

        return {
          contactDamageApplied: false,
          projectileDamageApplied: true,
          survived: result.survived,
        };
      }
    }

    return {
      contactDamageApplied: false,
      projectileDamageApplied: false,
      survived: true,
    };
  }
}
