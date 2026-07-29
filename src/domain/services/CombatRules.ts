import {
  ATTACK_ACTIVE_MS,
  ATTACK_COOLDOWN_MS,
  ATTACK_HITBOX_HEIGHT,
  ATTACK_HITBOX_OFFSET_X,
  ATTACK_HITBOX_WIDTH,
} from '../constants/combat';
import { AttackState } from '../value-objects/AttackState';

export interface AttackHitbox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class CombatRules {
  canStartAttack(state: AttackState): boolean {
    return !state.isOnCooldown && !state.isAttacking;
  }

  startAttack(state: AttackState, facingDirection: -1 | 1): AttackState {
    return state
      .withFacingDirection(facingDirection)
      .withAttackActiveMs(ATTACK_ACTIVE_MS)
      .withCooldownRemainingMs(ATTACK_COOLDOWN_MS);
  }

  tick(state: AttackState, deltaMs: number): AttackState {
    const attackActiveMs = Math.max(0, state.attackActiveMs - deltaMs);
    const cooldownRemainingMs = Math.max(0, state.cooldownRemainingMs - deltaMs);

    return state.withAttackActiveMs(attackActiveMs).withCooldownRemainingMs(cooldownRemainingMs);
  }

  isAttackActive(state: AttackState): boolean {
    return state.isAttacking;
  }

  computeHitbox(playerX: number, playerFeetY: number, facingDirection: -1 | 1): AttackHitbox {
    const width = ATTACK_HITBOX_WIDTH;
    const height = ATTACK_HITBOX_HEIGHT;
    const y = playerFeetY - height;

    if (facingDirection > 0) {
      return {
        x: playerX + ATTACK_HITBOX_OFFSET_X,
        y,
        width,
        height,
      };
    }

    return {
      x: playerX - ATTACK_HITBOX_OFFSET_X - width,
      y,
      width,
      height,
    };
  }

  hitboxOverlapsAabb(
    hitbox: AttackHitbox,
    objectX: number,
    objectY: number,
    objectWidth: number,
    objectHeight: number,
  ): boolean {
    return (
      hitbox.x + hitbox.width > objectX &&
      hitbox.x < objectX + objectWidth &&
      hitbox.y + hitbox.height > objectY &&
      hitbox.y < objectY + objectHeight
    );
  }
}
