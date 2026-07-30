import type { GamepadBinding } from './GamepadBinding';
import type { InputActionId } from './InputActionId';

export interface GameSettings {
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  };
  video: {
    fullscreen: boolean;
  };
  controls: {
    keyBindings: Record<InputActionId, string | string[]>;
    gamepadBindings?: Partial<Record<InputActionId, GamepadBinding | GamepadBinding[]>>;
  };
  cosmetics: {
    playerSkinId: string;
  };
}

export type GameSettingsPatch = {
  audio?: Partial<GameSettings['audio']>;
  video?: Partial<GameSettings['video']>;
  controls?: Partial<GameSettings['controls']>;
  cosmetics?: Partial<GameSettings['cosmetics']>;
};
