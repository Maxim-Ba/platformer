import type { IInputPort } from '@application/ports/IInputPort';
import type { GameSettings } from '@domain/types/GameSettings';
import type { InputActionId } from '@domain/types/InputActionId';
import { normalizeKeyCodes } from '@domain/utils/normalizeKeyCodes';
import Phaser from 'phaser';

import { keyboardEventCodeToPhaserKeyCode } from './keyboardEventCodeToPhaserKeyCode';

function isShiftKeyCode(code: string): boolean {
  return code === 'ShiftLeft' || code === 'ShiftRight';
}

export class PhaserKeyboardInputAdapter implements IInputPort {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly keyCache = new Map<string, Phaser.Input.Keyboard.Key>();
  private dashQueued = false;

  constructor(
    scene: Phaser.Scene,
    private readonly getControls: () => GameSettings['controls'],
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('PhaserKeyboardInputAdapter requires a keyboard-enabled scene.');
    }

    this.keyboard = keyboard;

    const handleKeyDown = (event: KeyboardEvent): void => {
      const dashCodes = normalizeKeyCodes(this.getControls().keyBindings.dash);

      if (dashCodes.includes(event.code) && isShiftKeyCode(event.code)) {
        this.dashQueued = true;
      }
    };

    keyboard.on('keydown', handleKeyDown);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown', handleKeyDown);
    });
  }

  isLeftPressed(): boolean {
    return this.isAnyDown('moveLeft');
  }

  isRightPressed(): boolean {
    return this.isAnyDown('moveRight');
  }

  isJumpPressed(): boolean {
    return this.isAnyJustDown('jump');
  }

  isAttackPressed(): boolean {
    return this.isAnyJustDown('attack');
  }

  isInteractPressed(): boolean {
    return this.isAnyJustDown('interact');
  }

  isDashPressed(): boolean {
    const dashCodes = normalizeKeyCodes(this.getControls().keyBindings.dash);
    const hasShiftBinding = dashCodes.some((code) => isShiftKeyCode(code));
    const shiftPressed = this.dashQueued && hasShiftBinding;
    this.dashQueued = false;

    const alternatePressed = dashCodes.some(
      (code) => !isShiftKeyCode(code) && this.isCodeJustDown(code),
    );

    return shiftPressed || alternatePressed;
  }

  private isAnyDown(action: InputActionId): boolean {
    const codes = normalizeKeyCodes(this.getControls().keyBindings[action]);
    return codes.some((code) => this.isCodeDown(code));
  }

  private isAnyJustDown(action: InputActionId): boolean {
    const codes = normalizeKeyCodes(this.getControls().keyBindings[action]);
    return codes.some((code) => this.isCodeJustDown(code));
  }

  private getKey(code: string): Phaser.Input.Keyboard.Key {
    let key = this.keyCache.get(code);

    if (!key) {
      key = this.keyboard.addKey(keyboardEventCodeToPhaserKeyCode(code));
      this.keyCache.set(code, key);
    }

    return key;
  }

  private isCodeDown(code: string): boolean {
    return this.getKey(code).isDown;
  }

  private isCodeJustDown(code: string): boolean {
    return Phaser.Input.Keyboard.JustDown(this.getKey(code));
  }
}
