import type { PlayerAttributes } from '@domain/types/player-stats';
import { DerivedStats } from '@domain/types/player-stats';

const MAX_CRIT_CHANCE = 50;

export class PlayerStatsRules {
  computeDerived(attributes: PlayerAttributes): DerivedStats {
    const { strength, agility, intellect, luck, vitality } = attributes;

    return new DerivedStats(
      intellect * 3 + luck,
      50 + vitality * 10 + strength * 2,
      30 + agility * 5,
      20 + intellect * 8,
      Math.min(MAX_CRIT_CHANCE, luck * 2 + agility),
      strength * 2 + vitality,
      strength * 3 + agility,
      intellect * 4,
    );
  }
}
