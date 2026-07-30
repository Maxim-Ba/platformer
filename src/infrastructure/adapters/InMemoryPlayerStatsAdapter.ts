import type { IPlayerStatsPort } from '@application/ports/IPlayerStatsPort';
import { PlayerStatsRules } from '@domain/services/PlayerStatsRules';
import {
  MAX_ATTRIBUTE_VALUE,
  MIN_ATTRIBUTE_VALUE,
  PlayerAttributes,
  PlayerStatsState,
  type AttributeId,
} from '@domain/types/player-stats';

const MOCK_UNALLOCATED_POINTS = 3;

export class InMemoryPlayerStatsAdapter implements IPlayerStatsPort {
  private attributes = PlayerAttributes.mockInitial();
  private unallocatedPoints = MOCK_UNALLOCATED_POINTS;
  private readonly rules = new PlayerStatsRules();

  getAttributes(): PlayerAttributes {
    return this.attributes;
  }

  getUnallocatedPoints(): number {
    return this.unallocatedPoints;
  }

  getDerivedStats() {
    return this.rules.computeDerived(this.attributes);
  }

  getState(): PlayerStatsState {
    return new PlayerStatsState(this.attributes, this.unallocatedPoints);
  }

  increaseAttribute(id: AttributeId): boolean {
    if (this.unallocatedPoints <= 0) {
      return false;
    }

    const current = this.attributes.getValue(id);
    if (current >= MAX_ATTRIBUTE_VALUE) {
      return false;
    }

    this.attributes = this.attributes.withAttribute(id, current + 1);
    this.unallocatedPoints -= 1;
    return true;
  }

  decreaseAttribute(id: AttributeId): boolean {
    const current = this.attributes.getValue(id);
    if (current <= MIN_ATTRIBUTE_VALUE) {
      return false;
    }

    this.attributes = this.attributes.withAttribute(id, current - 1);
    this.unallocatedPoints += 1;
    return true;
  }

  restoreState(state: PlayerStatsState): void {
    this.attributes = state.attributes;
    this.unallocatedPoints = state.unallocatedPoints;
  }
}
