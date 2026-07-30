const DIGIT_KEY_CODES = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57] as const;

const EVENT_CODE_TO_KEY_CODE: Record<string, number> = {
  ArrowLeft: 37,
  ArrowRight: 39,
  ArrowUp: 38,
  ArrowDown: 40,
  Space: 32,
  Escape: 27,
  Enter: 13,
  Tab: 9,
  Backspace: 8,
  ShiftLeft: 16,
  ShiftRight: 16,
  ControlLeft: 17,
  ControlRight: 17,
  AltLeft: 18,
  AltRight: 18,
};

/**
 * Maps DOM `KeyboardEvent.code` values stored in settings to Phaser/DOM key codes.
 */
export function keyboardEventCodeToPhaserKeyCode(code: string): number {
  const direct = EVENT_CODE_TO_KEY_CODE[code];
  if (direct !== undefined) {
    return direct;
  }

  if (code.startsWith('Key') && code.length === 4) {
    return code.charCodeAt(3);
  }

  if (code.startsWith('Digit') && code.length === 6) {
    const digit = Number(code.slice(5));
    if (digit >= 0 && digit <= 9) {
      return DIGIT_KEY_CODES[digit];
    }
  }

  throw new Error(`Unsupported keyboard event code: ${code}`);
}
