import { MAX_MANA } from '../constants/resources';

export class ManaState {
  constructor(
    readonly current: number,
    readonly max: number,
  ) {}

  static initial(max: number = MAX_MANA): ManaState {
    return new ManaState(max, max);
  }
}
