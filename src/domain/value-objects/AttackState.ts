export class AttackState {
  constructor(
    readonly cooldownRemainingMs: number,
    readonly attackActiveMs: number,
    readonly facingDirection: -1 | 1,
  ) {}

  static initial(): AttackState {
    return new AttackState(0, 0, 1);
  }

  withCooldownRemainingMs(cooldownRemainingMs: number): AttackState {
    return new AttackState(cooldownRemainingMs, this.attackActiveMs, this.facingDirection);
  }

  withAttackActiveMs(attackActiveMs: number): AttackState {
    return new AttackState(this.cooldownRemainingMs, attackActiveMs, this.facingDirection);
  }

  withFacingDirection(facingDirection: -1 | 1): AttackState {
    return new AttackState(this.cooldownRemainingMs, this.attackActiveMs, facingDirection);
  }

  get isAttacking(): boolean {
    return this.attackActiveMs > 0;
  }

  get isOnCooldown(): boolean {
    return this.cooldownRemainingMs > 0;
  }
}
