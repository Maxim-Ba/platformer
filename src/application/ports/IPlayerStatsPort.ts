import type {
  AttributeId,
  DerivedStats,
  PlayerAttributes,
  PlayerStatsState,
} from '@domain/types/player-stats';

export interface IPlayerStatsPort {
  getAttributes(): PlayerAttributes;
  getUnallocatedPoints(): number;
  getDerivedStats(): DerivedStats;
  increaseAttribute(id: AttributeId): boolean;
  decreaseAttribute(id: AttributeId): boolean;
  restoreState(state: PlayerStatsState): void;
}
