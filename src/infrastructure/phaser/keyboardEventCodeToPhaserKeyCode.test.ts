import { describe, expect, it } from 'vitest';

import { keyboardEventCodeToPhaserKeyCode } from './keyboardEventCodeToPhaserKeyCode';

describe('keyboardEventCodeToPhaserKeyCode', () => {
  it('maps letter keys', () => {
    expect(keyboardEventCodeToPhaserKeyCode('KeyA')).toBe(65);
    expect(keyboardEventCodeToPhaserKeyCode('KeyJ')).toBe(74);
  });

  it('maps arrow and space keys', () => {
    expect(keyboardEventCodeToPhaserKeyCode('ArrowLeft')).toBe(37);
    expect(keyboardEventCodeToPhaserKeyCode('ArrowRight')).toBe(39);
    expect(keyboardEventCodeToPhaserKeyCode('Space')).toBe(32);
  });

  it('maps escape and shift keys', () => {
    expect(keyboardEventCodeToPhaserKeyCode('Escape')).toBe(27);
    expect(keyboardEventCodeToPhaserKeyCode('ShiftLeft')).toBe(16);
  });
});
