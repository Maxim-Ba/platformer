import type { IManaPort } from '@application/ports/IManaPort';
import { ManaState } from '@domain/value-objects/ManaState';

export class InMemoryManaAdapter implements IManaPort {
  private state = ManaState.initial();

  getMana(): ManaState {
    return this.state;
  }

  reset(): void {
    this.state = ManaState.initial();
  }
}
