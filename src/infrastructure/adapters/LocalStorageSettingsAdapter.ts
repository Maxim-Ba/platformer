import type { ISettingsPort } from '@application/ports/ISettingsPort';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, SETTINGS_VERSION } from '@domain/constants/settings';
import { SettingsRules } from '@domain/services/SettingsRules';
import type { GameSettings, GameSettingsPatch } from '@domain/types/GameSettings';

interface StoredSettingsPayload {
  version: number;
  settings: GameSettings;
}

export class LocalStorageSettingsAdapter implements ISettingsPort {
  private settings: GameSettings;
  private readonly rules = new SettingsRules();

  constructor(private readonly storageKey: string = SETTINGS_STORAGE_KEY) {
    this.settings = this.loadFromStorage();
  }

  getSettings(): GameSettings {
    return this.settings;
  }

  updateSettings(patch: GameSettingsPatch): void {
    const merged = this.rules.merge(this.settings, patch);
    this.settings = this.rules.validate(merged);
    this.persist();
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.persist();
  }

  private loadFromStorage(): GameSettings {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === null) {
        return { ...DEFAULT_SETTINGS };
      }

      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return { ...DEFAULT_SETTINGS };
      }

      const payload = parsed as Partial<StoredSettingsPayload>;
      if (payload.version !== SETTINGS_VERSION) {
        return { ...DEFAULT_SETTINGS };
      }

      return this.rules.parseStored(payload);
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private persist(): void {
    const payload: StoredSettingsPayload = {
      version: SETTINGS_VERSION,
      settings: this.settings,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }
}
