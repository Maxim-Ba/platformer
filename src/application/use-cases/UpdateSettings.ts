import { SettingsRules } from '@domain/services/SettingsRules';
import type { GameSettings, GameSettingsPatch } from '@domain/types/GameSettings';

import type { ISettingsPort } from '../ports/ISettingsPort';

export class UpdateSettings {
  constructor(
    private readonly settingsPort: ISettingsPort,
    private readonly rules: SettingsRules = new SettingsRules(),
  ) {}

  execute(patch: GameSettingsPatch): GameSettings {
    const merged = this.rules.merge(this.settingsPort.getSettings(), patch);
    const validated = this.rules.validate(merged);
    this.settingsPort.updateSettings({
      audio: validated.audio,
      video: validated.video,
      controls: validated.controls,
      cosmetics: validated.cosmetics,
    });
    return validated;
  }
}
