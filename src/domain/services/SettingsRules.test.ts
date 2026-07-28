import { describe, expect, it } from 'vitest';

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
});
