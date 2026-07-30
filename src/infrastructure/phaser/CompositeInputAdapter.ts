import type { IInputPort } from '@application/ports/IInputPort';

import type { PhaserGamepadReader } from './PhaserGamepadReader';

export class CompositeInputAdapter implements IInputPort {
  constructor(
    private readonly keyboard: IInputPort,
    private readonly gamepad: PhaserGamepadReader,
  ) {}

  isLeftPressed(): boolean {
    return this.keyboard.isLeftPressed() || this.gamepad.isLeftPressed();
  }

  isRightPressed(): boolean {
    return this.keyboard.isRightPressed() || this.gamepad.isRightPressed();
  }

  isJumpPressed(): boolean {
    return this.keyboard.isJumpPressed() || this.gamepad.isJumpPressed();
  }

  isAttackPressed(): boolean {
    return this.keyboard.isAttackPressed() || this.gamepad.isAttackPressed();
  }

  isInteractPressed(): boolean {
    return this.keyboard.isInteractPressed() || this.gamepad.isInteractPressed();
  }

  isDashPressed(): boolean {
    return this.keyboard.isDashPressed() || this.gamepad.isDashPressed();
  }
}
