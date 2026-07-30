import type { DoorFacing } from './RoomDefinition';
import type { Vector2 } from '../value-objects/Vector2';

export interface RoomTransitionPlan {
  readonly targetRoomId: string;
  readonly entryPosition: Vector2;
  readonly facing: DoorFacing;
  readonly fadeMs: number;
}
