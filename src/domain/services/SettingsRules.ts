import { DEFAULT_SETTINGS } from '../constants/settings';
import type { GameSettings, GameSettingsPatch } from '../types/GameSettings';

export class SettingsRules {
  clampVolume(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  validate(settings: GameSettings): GameSettings {
    return {
      audio: {
        masterVolume: this.clampVolume(settings.audio.masterVolume),
        musicVolume: this.clampVolume(settings.audio.musicVolume),
        sfxVolume: this.clampVolume(settings.audio.sfxVolume),
      },
      video: {
        fullscreen: settings.video.fullscreen,
      },
      controls: {
        keyBindings: { ...settings.controls.keyBindings },
      },
      cosmetics: {
        playerSkinId: settings.cosmetics.playerSkinId,
      },
    };
  }

  merge(current: GameSettings, patch: GameSettingsPatch): GameSettings {
    return {
      audio: { ...current.audio, ...patch.audio },
      video: { ...current.video, ...patch.video },
      controls: {
        keyBindings: {
          ...current.controls.keyBindings,
          ...patch.controls?.keyBindings,
        },
      },
      cosmetics: { ...current.cosmetics, ...patch.cosmetics },
    };
  }

  parseStored(value: unknown): GameSettings {
    if (typeof value !== 'object' || value === null) {
      return { ...DEFAULT_SETTINGS };
    }

    const record = value as Record<string, unknown>;
    const settings = record.settings;

    if (typeof settings !== 'object' || settings === null) {
      return { ...DEFAULT_SETTINGS };
    }

    const candidate = settings as Partial<GameSettings>;

    return this.validate({
      audio: {
        masterVolume: Number(candidate.audio?.masterVolume ?? DEFAULT_SETTINGS.audio.masterVolume),
        musicVolume: Number(candidate.audio?.musicVolume ?? DEFAULT_SETTINGS.audio.musicVolume),
        sfxVolume: Number(candidate.audio?.sfxVolume ?? DEFAULT_SETTINGS.audio.sfxVolume),
      },
      video: {
        fullscreen: Boolean(candidate.video?.fullscreen ?? DEFAULT_SETTINGS.video.fullscreen),
      },
      controls: {
        keyBindings: {
          ...DEFAULT_SETTINGS.controls.keyBindings,
          ...candidate.controls?.keyBindings,
        },
      },
      cosmetics: {
        playerSkinId: String(
          candidate.cosmetics?.playerSkinId ?? DEFAULT_SETTINGS.cosmetics.playerSkinId,
        ),
      },
    });
  }
}
