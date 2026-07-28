import type { GameSettings } from '../types/GameSettings';

export const SETTINGS_STORAGE_KEY = 'platformer:settings';
export const SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    masterVolume: 1,
    musicVolume: 0.8,
    sfxVolume: 1,
  },
  video: {
    fullscreen: false,
  },
  controls: {
    keyBindings: {
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight',
      jump: 'Space',
    },
  },
  cosmetics: {
    playerSkinId: 'default',
  },
};
