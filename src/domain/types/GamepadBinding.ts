export interface GamepadBinding {
  kind: 'button' | 'axis';
  index: number;
  /** для axis: -1 | 1 */
  direction?: -1 | 1;
}
