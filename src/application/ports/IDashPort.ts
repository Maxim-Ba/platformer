import type { DashState } from '@domain/value-objects/DashState';

export interface IDashPort {
  getDashState(): DashState;
  startDash(direction: -1 | 1): void;
  tick(deltaMs: number): void;
  canStartDash(): boolean;
  reset(): void;
}
