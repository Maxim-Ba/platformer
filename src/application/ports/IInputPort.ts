export interface IInputPort {
  isLeftPressed(): boolean;
  isRightPressed(): boolean;
  isJumpPressed(): boolean;
  isAttackPressed(): boolean;
  isInteractPressed(): boolean;
  isDashPressed(): boolean;
}
