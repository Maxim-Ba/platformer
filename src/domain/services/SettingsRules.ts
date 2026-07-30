import { DEFAULT_KEY_BINDINGS, INPUT_ACTION_IDS, isInputActionId } from '../constants/input-actions';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { GameSettings, GameSettingsPatch } from '../types/GameSettings';
import type { InputActionId } from '../types/InputActionId';
import { normalizeKeyCodes } from '../utils/normalizeKeyCodes';

export class SettingsRules {
  clampVolume(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  validate(settings: GameSettings): GameSettings {
    const keyBindings = this.sanitizeKeyBindings(settings.controls.keyBindings);

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
        keyBindings,
        gamepadBindings: settings.controls.gamepadBindings
          ? { ...settings.controls.gamepadBindings }
          : undefined,
      },
      cosmetics: {
        playerSkinId: settings.cosmetics.playerSkinId,
      },
    };
  }

  merge(current: GameSettings, patch: GameSettingsPatch): GameSettings {
    const mergedKeyBindings = patch.controls?.keyBindings
      ? this.mergeKeyBindings(current.controls.keyBindings, patch.controls.keyBindings)
      : current.controls.keyBindings;

    return {
      audio: { ...current.audio, ...patch.audio },
      video: { ...current.video, ...patch.video },
      controls: {
        keyBindings: mergedKeyBindings,
        gamepadBindings:
          patch.controls?.gamepadBindings !== undefined
            ? { ...current.controls.gamepadBindings, ...patch.controls.gamepadBindings }
            : current.controls.gamepadBindings,
      },
      cosmetics: { ...current.cosmetics, ...patch.cosmetics },
    };
  }

  assignKeyBinding(
    current: GameSettings,
    actionId: InputActionId,
    code: string,
  ): GameSettings | null {
    if (!this.isValidKeyCode(code) || !this.isEscapeAllowedForAction(code, actionId)) {
      return null;
    }

    const nextBindings = { ...current.controls.keyBindings, [actionId]: code };

    if (!this.areKeyBindingsUnique(nextBindings)) {
      return null;
    }

    return this.validate({
      ...current,
      controls: {
        ...current.controls,
        keyBindings: nextBindings,
      },
    });
  }

  resetControlsToDefaults(current: GameSettings): GameSettings {
    return this.validate({
      ...current,
      controls: {
        keyBindings: { ...DEFAULT_KEY_BINDINGS },
        gamepadBindings: current.controls.gamepadBindings,
      },
    });
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
        gamepadBindings: candidate.controls?.gamepadBindings,
      },
      cosmetics: {
        playerSkinId: String(
          candidate.cosmetics?.playerSkinId ?? DEFAULT_SETTINGS.cosmetics.playerSkinId,
        ),
      },
    });
  }

  private mergeKeyBindings(
    current: Record<InputActionId, string | string[]>,
    patch: Partial<Record<InputActionId, string | string[]>>,
  ): Record<InputActionId, string | string[]> {
    const filteredPatch: Partial<Record<InputActionId, string | string[]>> = {};

    for (const [key, value] of Object.entries(patch)) {
      if (!isInputActionId(key) || !this.isValidBindingValue(value)) {
        continue;
      }

      filteredPatch[key] = value;
    }

    const merged = { ...current, ...filteredPatch };

    if (!this.areKeyBindingsUnique(merged)) {
      return current;
    }

    return merged;
  }

  private sanitizeKeyBindings(
    bindings: Partial<Record<InputActionId, string | string[]>>,
  ): Record<InputActionId, string | string[]> {
    const result = { ...DEFAULT_KEY_BINDINGS };

    for (const actionId of INPUT_ACTION_IDS) {
      const binding = bindings[actionId];

      if (this.isValidBindingValue(binding)) {
        result[actionId] = binding!;
      }
    }

    return result;
  }

  private areKeyBindingsUnique(
    bindings: Record<InputActionId, string | string[]>,
  ): boolean {
    const usedCodes = new Set<string>();

    for (const actionId of INPUT_ACTION_IDS) {
      for (const code of normalizeKeyCodes(bindings[actionId])) {
        if (!this.isValidKeyCode(code)) {
          return false;
        }

        if (!this.isEscapeAllowedForAction(code, actionId)) {
          return false;
        }

        if (usedCodes.has(code)) {
          return false;
        }

        usedCodes.add(code);
      }
    }

    return true;
  }

  private isValidBindingValue(value: unknown): value is string | string[] {
    if (typeof value === 'string') {
      return value.length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0 && value.every((code) => typeof code === 'string' && code.length > 0);
    }

    return false;
  }

  private isValidKeyCode(code: string): boolean {
    return code.length > 0;
  }

  private isEscapeAllowedForAction(code: string, actionId: InputActionId): boolean {
    if (code !== 'Escape') {
      return true;
    }

    return actionId === 'pause';
  }
}
