export class DashState {
  constructor(
    readonly remainingMs: number,
    readonly cooldownRemainingMs: number,
    readonly direction: -1 | 1,
  ) {}

  static initial(): DashState {
    return new DashState(0, 0, 1);
  }

  get isDashing(): boolean {
    return this.remainingMs > 0;
  }

  withRemainingMs(remainingMs: number): DashState {
    return new DashState(remainingMs, this.cooldownRemainingMs, this.direction);
  }

  withCooldownRemainingMs(cooldownRemainingMs: number): DashState {
    return new DashState(this.remainingMs, cooldownRemainingMs, this.direction);
  }

  withDirection(direction: -1 | 1): DashState {
    return new DashState(this.remainingMs, this.cooldownRemainingMs, direction);
  }
}
