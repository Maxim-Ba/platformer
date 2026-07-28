import type { GameSettings, GameSettingsPatch } from '@domain/types/GameSettings';

export interface ISettingsPort {
  getSettings(): GameSettings;
  updateSettings(patch: GameSettingsPatch): void;
  resetToDefaults(): void;
}
