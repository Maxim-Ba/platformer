import type { IEnergyPort } from '@application/ports/IEnergyPort';
import { EnergyState } from '@domain/value-objects/EnergyState';

export class InMemoryEnergyAdapter implements IEnergyPort {
  private state = EnergyState.initial();

  getEnergy(): EnergyState {
    return this.state;
  }

  reset(): void {
    this.state = EnergyState.initial();
  }
}
