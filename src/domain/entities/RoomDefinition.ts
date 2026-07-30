import type { LevelDefinition } from './LevelDefinition';
import type { Vector2 } from '../value-objects/Vector2';

export type DoorFacing = 'left' | 'right';

export type MapEdge = 'left' | 'right' | 'top' | 'bottom';

export interface DoorBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DoorDefinition {
  readonly kind: 'door';
  readonly id: string;
  readonly bounds: DoorBounds;
  readonly targetRoom: string;
  readonly targetDoor: string;
  readonly facing: DoorFacing;
  readonly fadeMs: number;
}

export interface BoundaryExitDefinition {
  readonly kind: 'boundary_exit';
  readonly id: string;
  readonly bounds: DoorBounds;
  readonly edge: MapEdge;
  readonly targetRoom: string;
  readonly targetExitId: string;
  readonly facing: DoorFacing;
  readonly fadeMs: number;
}

export interface RoomDefinition extends LevelDefinition {
  readonly doors: readonly DoorDefinition[];
  readonly boundaryExits: readonly BoundaryExitDefinition[];
}

export interface RoomEntryResolution {
  readonly position: Vector2;
  readonly facing: DoorFacing;
}
