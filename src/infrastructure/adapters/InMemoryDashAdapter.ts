import type { IDashPort } from '@application/ports/IDashPort';
import { DashRules } from '@domain/services/DashRules';
import { DashState } from '@domain/value-objects/DashState';

export class InMemoryDashAdapter implements IDashPort {
  private state = DashState.initial();
  private readonly rules = new DashRules();

  getDashState(): DashState {
    return this.state;
  }

  startDash(direction: -1 | 1): void {
    this.state = this.rules.startDash(this.state, direction);
  }

  tick(deltaMs: number): void {
    this.state = this.rules.tick(this.state, deltaMs);
  }

  canStartDash(): boolean {
    return this.rules.canStart(this.state);
  }

  reset(): void {
    this.state = DashState.initial();
  }
}
