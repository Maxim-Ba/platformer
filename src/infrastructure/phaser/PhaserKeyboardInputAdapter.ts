import type { IInputPort } from '@application/ports/IInputPort';
import Phaser from 'phaser';

function isShiftKeyCode(code: string): boolean {
  return code === 'ShiftLeft' || code === 'ShiftRight';
}

export class PhaserKeyboardInputAdapter implements IInputPort {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly keySpace: Phaser.Input.Keyboard.Key;
  private readonly keyJ: Phaser.Input.Keyboard.Key;
  private readonly keyX: Phaser.Input.Keyboard.Key;
  private readonly keyL: Phaser.Input.Keyboard.Key;
  private dashQueued = false;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('PhaserKeyboardInputAdapter requires a keyboard-enabled scene.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyX = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyL = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isShiftKeyCode(event.code)) {
        this.dashQueued = true;
      }
    };

    keyboard.on('keydown', handleKeyDown);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown', handleKeyDown);
    });
  }

  isLeftPressed(): boolean {
    return this.cursors.left.isDown || this.keyA.isDown;
  }

  isRightPressed(): boolean {
    return this.cursors.right.isDown || this.keyD.isDown;
  }

  isJumpPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keySpace);
  }

  isAttackPressed(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.keyJ) || Phaser.Input.Keyboard.JustDown(this.keyX)
    );
  }

  isDashPressed(): boolean {
    const shiftPressed = this.dashQueued;
    const alternatePressed = Phaser.Input.Keyboard.JustDown(this.keyL);

    this.dashQueued = false;

    return shiftPressed || alternatePressed;
  }
}
