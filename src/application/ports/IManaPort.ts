import type { ManaState } from '@domain/value-objects/ManaState';

export interface IManaPort {
  getMana(): ManaState;
  reset(): void;
}
