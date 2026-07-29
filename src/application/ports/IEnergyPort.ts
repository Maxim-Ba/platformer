import type { EnergyState } from '@domain/value-objects/EnergyState';

export interface IEnergyPort {
  getEnergy(): EnergyState;
  reset(): void;
}
