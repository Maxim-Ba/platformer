import { describe, expect, it } from 'vitest';

import { DEFAULT_KEY_BINDINGS } from '../constants/input-actions';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { SettingsRules } from './SettingsRules';

describe('SettingsRules', () => {
  const rules = new SettingsRules();

  it('clamps volume values to 0-1', () => {
    const validated = rules.validate({
      ...DEFAULT_SETTINGS,
      audio: {
        masterVolume: 1.5,
        musicVolume: -0.2,
        sfxVolume: 0.5,
      },
    });

    expect(validated.audio.masterVolume).toBe(1);
    expect(validated.audio.musicVolume).toBe(0);
    expect(validated.audio.sfxVolume).toBe(0.5);
  });

  it('merges partial patches without overwriting unrelated fields', () => {
    const merged = rules.merge(DEFAULT_SETTINGS, {
      audio: { masterVolume: 0.5 },
    });

    expect(merged.audio.masterVolume).toBe(0.5);
    expect(merged.audio.musicVolume).toBe(DEFAULT_SETTINGS.audio.musicVolume);
    expect(merged.video.fullscreen).toBe(DEFAULT_SETTINGS.video.fullscreen);
  });

  it('falls back to defaults for corrupt stored payloads', () => {
    expect(rules.parseStored(null)).toEqual(DEFAULT_SETTINGS);
    expect(rules.parseStored({ settings: 'invalid' })).toEqual(DEFAULT_SETTINGS);
  });

  it('parses valid stored settings', () => {
    const parsed = rules.parseStored({
      version: 1,
      settings: {
        ...DEFAULT_SETTINGS,
        audio: { ...DEFAULT_SETTINGS.audio, masterVolume: 0.25 },
      },
    });

    expect(parsed.audio.masterVolume).toBe(0.25);
  });

  it('merges key binding patch for known action ids', () => {
    const merged = rules.merge(DEFAULT_SETTINGS, {
      controls: { keyBindings: { ...DEFAULT_KEY_BINDINGS, jump: 'KeyW' } },
    });

    expect(merged.controls.keyBindings.jump).toBe('KeyW');
    expect(merged.controls.keyBindings.moveLeft).toEqual(DEFAULT_KEY_BINDINGS.moveLeft);
  });

  it('rejects duplicate key binding patches', () => {
    const merged = rules.merge(DEFAULT_SETTINGS, {
      controls: { keyBindings: { ...DEFAULT_KEY_BINDINGS, jump: 'KeyA' } },
    });

    expect(merged.controls.keyBindings.jump).toBe(DEFAULT_KEY_BINDINGS.jump);
  });

  it('assigns a unique key binding', () => {
    const assigned = rules.assignKeyBinding(DEFAULT_SETTINGS, 'jump', 'KeyW');

    expect(assigned?.controls.keyBindings.jump).toBe('KeyW');
  });

  it('rejects conflicting key assignment', () => {
    const assigned = rules.assignKeyBinding(DEFAULT_SETTINGS, 'jump', 'KeyA');

    expect(assigned).toBeNull();
  });

  it('allows Escape only for pause action', () => {
    expect(rules.assignKeyBinding(DEFAULT_SETTINGS, 'pause', 'Escape')).not.toBeNull();
    expect(rules.assignKeyBinding(DEFAULT_SETTINGS, 'jump', 'Escape')).toBeNull();
  });

  it('resets controls to defaults', () => {
    const customized = rules.assignKeyBinding(DEFAULT_SETTINGS, 'jump', 'KeyW');
    const reset = rules.resetControlsToDefaults(customized!);

    expect(reset.controls.keyBindings).toEqual(DEFAULT_KEY_BINDINGS);
  });

  it('preserves gamepadBindings when controls are reset', () => {
    const withGamepad = rules.validate({
      ...DEFAULT_SETTINGS,
      controls: {
        keyBindings: { ...DEFAULT_KEY_BINDINGS },
        gamepadBindings: { jump: { kind: 'button', index: 0 } },
      },
    });
    const reset = rules.resetControlsToDefaults(withGamepad);

    expect(reset.controls.gamepadBindings).toEqual({ jump: { kind: 'button', index: 0 } });
  });

  it('preserves gamepadBindings on partial controls patch', () => {
    const withGamepad = rules.validate({
      ...DEFAULT_SETTINGS,
      controls: {
        keyBindings: { ...DEFAULT_KEY_BINDINGS },
        gamepadBindings: { jump: { kind: 'button', index: 0 } },
      },
    });
    const merged = rules.merge(withGamepad, {
      controls: { keyBindings: { ...DEFAULT_KEY_BINDINGS, jump: 'KeyW' } },
    });

    expect(merged.controls.gamepadBindings).toEqual({ jump: { kind: 'button', index: 0 } });
  });
});
