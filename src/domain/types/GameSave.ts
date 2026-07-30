import type { PlayerStatsState } from './player-stats';
import type { InventoryState } from '../value-objects/InventoryState';
import type { ProgressionState } from '../value-objects/ProgressionState';
import type { SkillsState } from '../value-objects/SkillsState';

export interface GameSaveGameState {
  levelId: string;
  currentRoomId?: string;
}

export interface GameSaveCharacterState {
  progression: ProgressionState;
  inventory: InventoryState;
  skills: SkillsState;
  stats?: PlayerStatsState;
}

export interface GameSave {
  version: 2;
  savedAt: string;
  game: GameSaveGameState;
  character: GameSaveCharacterState;
}

export interface SaveSlotMeta {
  slotId: string;
  levelId: string;
  savedAt: string;
}
