import type { IInputPort } from '@application/ports/IInputPort';
import Phaser from 'phaser';

export class PhaserInputAdapter implements IInputPort {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly keySpace: Phaser.Input.Keyboard.Key;
  private readonly keyJ: Phaser.Input.Keyboard.Key;
  private readonly keyX: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('PhaserInputAdapter requires a keyboard-enabled scene.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyX = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
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
}
