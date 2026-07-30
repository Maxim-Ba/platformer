import type { Enemy } from './Enemy';

export interface EnemyState extends Enemy {
  /** Y-центр hover для fly-hover behavior */
  readonly hoverCenterY: number;
}
