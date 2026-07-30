import type { IInputPort } from '@application/ports/IInputPort';
import { describe, expect, it } from 'vitest';

import { CompositeInputAdapter } from './CompositeInputAdapter';
import type { PhaserGamepadReader } from './PhaserGamepadReader';

function createKeyboardStub(values: Partial<Record<keyof IInputPort, boolean>>): IInputPort {
  return {
    isLeftPressed: () => values.isLeftPressed ?? false,
    isRightPressed: () => values.isRightPressed ?? false,
    isJumpPressed: () => values.isJumpPressed ?? false,
    isAttackPressed: () => values.isAttackPressed ?? false,
    isDashPressed: () => values.isDashPressed ?? false,
  };
}

function createGamepadStub(values: Partial<Record<keyof IInputPort, boolean>>): PhaserGamepadReader {
  return {
    update: () => {},
    wasButtonJustPressed: () => false,
    isButtonPressed: () => false,
    isLeftPressed: () => values.isLeftPressed ?? false,
    isRightPressed: () => values.isRightPressed ?? false,
    isJumpPressed: () => values.isJumpPressed ?? false,
    isAttackPressed: () => values.isAttackPressed ?? false,
    isDashPressed: () => values.isDashPressed ?? false,
  } as unknown as PhaserGamepadReader;
}

describe('CompositeInputAdapter', () => {
  it('returns true when keyboard triggers an action', () => {
    const adapter = new CompositeInputAdapter(
      createKeyboardStub({ isJumpPressed: true }),
      createGamepadStub({}),
    );

    expect(adapter.isJumpPressed()).toBe(true);
    expect(adapter.isLeftPressed()).toBe(false);
  });

  it('returns true when gamepad triggers an action', () => {
    const adapter = new CompositeInputAdapter(
      createKeyboardStub({}),
      createGamepadStub({ isRightPressed: true, isAttackPressed: true }),
    );

    expect(adapter.isRightPressed()).toBe(true);
    expect(adapter.isAttackPressed()).toBe(true);
    expect(adapter.isJumpPressed()).toBe(false);
  });

  it('aggregates keyboard and gamepad with OR logic', () => {
    const adapter = new CompositeInputAdapter(
      createKeyboardStub({ isLeftPressed: true }),
      createGamepadStub({ isDashPressed: true }),
    );

    expect(adapter.isLeftPressed()).toBe(true);
    expect(adapter.isDashPressed()).toBe(true);
    expect(adapter.isRightPressed()).toBe(false);
  });
});
