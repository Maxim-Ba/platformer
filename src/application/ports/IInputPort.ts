export interface IInputPort {
  isLeftPressed(): boolean;
  isRightPressed(): boolean;
  isJumpPressed(): boolean;
  isAttackPressed(): boolean;
  isDashPressed(): boolean;
}
