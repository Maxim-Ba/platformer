import type { IInputPort } from '@application/ports/IInputPort';

export class PlaceholderInputAdapter implements IInputPort {
  isLeftPressed(): boolean {
    return false;
  }

  isRightPressed(): boolean {
    return false;
  }

  isJumpPressed(): boolean {
    return false;
  }

  isAttackPressed(): boolean {
    return false;
  }

  isInteractPressed(): boolean {
    return false;
  }

  isDashPressed(): boolean {
    return false;
  }
}
