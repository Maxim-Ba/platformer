import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SETTINGS } from '@domain/constants/settings';
import { LocalStorageSettingsAdapter } from '@infrastructure/adapters/LocalStorageSettingsAdapter';

import { UpdateSettings } from './UpdateSettings';

describe('UpdateSettings', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updates only the patched field', () => {
    const settingsPort = new LocalStorageSettingsAdapter('test:settings');
    const useCase = new UpdateSettings(settingsPort);

    const result = useCase.execute({ audio: { masterVolume: 0.4 } });

    expect(result.audio.masterVolume).toBe(0.4);
    expect(result.audio.musicVolume).toBe(DEFAULT_SETTINGS.audio.musicVolume);
    expect(settingsPort.getSettings().audio.masterVolume).toBe(0.4);
  });

  it('restores persisted settings after reload', () => {
    const settingsPort = new LocalStorageSettingsAdapter('test:settings');
    const useCase = new UpdateSettings(settingsPort);
    useCase.execute({ cosmetics: { playerSkinId: 'knight' } });

    const reloaded = new LocalStorageSettingsAdapter('test:settings');

    expect(reloaded.getSettings().cosmetics.playerSkinId).toBe('knight');
  });
});
