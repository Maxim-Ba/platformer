import { MAX_ENERGY } from '../constants/resources';

export class EnergyState {
  constructor(
    readonly current: number,
    readonly max: number,
  ) {}

  static initial(max: number = MAX_ENERGY): EnergyState {
    return new EnergyState(max, max);
  }
}
