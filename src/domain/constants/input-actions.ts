import type { InputActionId } from '../types/InputActionId';

export const INPUT_ACTION_IDS: readonly InputActionId[] = [
  'moveLeft',
  'moveRight',
  'jump',
  'dash',
  'attack',
  'interact',
  'pause',
  'charMenuInventory',
  'charMenuSkills',
  'charMenuStats',
  'charMenuUpgrades',
  'charMenuMap',
] as const;

export const DEFAULT_KEY_BINDINGS: Record<InputActionId, string | string[]> = {
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  jump: 'Space',
  dash: ['ShiftLeft', 'KeyL'],
  attack: ['KeyJ', 'KeyX'],
  interact: 'KeyE',
  pause: 'Escape',
  charMenuInventory: 'KeyI',
  charMenuSkills: 'KeyK',
  charMenuStats: 'KeyC',
  charMenuUpgrades: 'KeyU',
  charMenuMap: 'KeyM',
};

export function isInputActionId(value: string): value is InputActionId {
  return (INPUT_ACTION_IDS as readonly string[]).includes(value);
}
