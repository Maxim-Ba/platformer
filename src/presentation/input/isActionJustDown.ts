import Phaser from 'phaser';

import { keyboardEventCodeToPhaserKeyCode } from '@infrastructure/phaser/keyboardEventCodeToPhaserKeyCode';

export function isActionJustDown(
  keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
  codes: string | string[],
  keyCache: Map<string, Phaser.Input.Keyboard.Key>,
): boolean {
  const normalized = Array.isArray(codes) ? codes : [codes];

  return normalized.some((code) => {
    let key = keyCache.get(code);

    if (!key) {
      key = keyboard.addKey(keyboardEventCodeToPhaserKeyCode(code));
      keyCache.set(code, key);
    }

    return Phaser.Input.Keyboard.JustDown(key);
  });
}
