import type {
  BoundaryExitDefinition,
  DoorDefinition,
  DoorFacing,
  MapEdge,
  RoomDefinition,
  RoomEntryResolution,
} from '../entities/RoomDefinition';
import { Vector2 } from '../value-objects/Vector2';

const DEFAULT_FADE_MS = 150;
const FACING_NUDGE_PX = 8;
const BOUNDARY_ENTRY_NUDGE_PX = 40;

export class RoomTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomTransitionError';
  }
}

export class RoomTransitionRules {
  validateDoor(door: DoorDefinition): void {
    if (!door.id.trim()) {
      throw new RoomTransitionError('Door id must not be empty.');
    }

    if (!door.targetRoom.trim()) {
      throw new RoomTransitionError(`Door "${door.id}" is missing targetRoom.`);
    }

    if (!door.targetDoor.trim()) {
      throw new RoomTransitionError(`Door "${door.id}" is missing targetDoor.`);
    }

    if (door.facing !== 'left' && door.facing !== 'right') {
      throw new RoomTransitionError(`Door "${door.id}" has invalid facing "${door.facing}".`);
    }

    if (door.fadeMs <= 0) {
      throw new RoomTransitionError(`Door "${door.id}" fadeMs must be positive.`);
    }
  }

  resolveEntryPosition(room: RoomDefinition, targetDoorId: string): RoomEntryResolution {
    const door = room.doors.find((entry) => entry.id === targetDoorId);

    if (!door) {
      throw new RoomTransitionError(
        `Target door "${targetDoorId}" was not found in room "${room.id}".`,
      );
    }

    this.validateDoor(door);

    return {
      position: this.entryPositionAtDoor(door),
      facing: door.facing,
    };
  }

  entryPositionAtDoor(door: DoorDefinition): Vector2 {
    const centerX = door.bounds.x + door.bounds.width / 2;
    const feetY = door.bounds.y + door.bounds.height;
    const nudge = door.facing === 'right' ? FACING_NUDGE_PX : -FACING_NUDGE_PX;

    return new Vector2(centerX + nudge, feetY);
  }

  validateBoundaryExit(exit: BoundaryExitDefinition): void {
    if (!exit.id.trim()) {
      throw new RoomTransitionError('Boundary exit id must not be empty.');
    }

    if (!exit.targetRoom.trim()) {
      throw new RoomTransitionError(`Boundary exit "${exit.id}" is missing targetRoom.`);
    }

    if (!exit.targetExitId.trim()) {
      throw new RoomTransitionError(`Boundary exit "${exit.id}" is missing targetExitId.`);
    }

    if (!isMapEdge(exit.edge)) {
      throw new RoomTransitionError(`Boundary exit "${exit.id}" has invalid edge "${exit.edge}".`);
    }

    if (exit.facing !== 'left' && exit.facing !== 'right') {
      throw new RoomTransitionError(`Boundary exit "${exit.id}" has invalid facing "${exit.facing}".`);
    }

    if (exit.fadeMs <= 0) {
      throw new RoomTransitionError(`Boundary exit "${exit.id}" fadeMs must be positive.`);
    }
  }

  resolveBoundaryEntryPosition(room: RoomDefinition, targetExitId: string): RoomEntryResolution {
    const exit = room.boundaryExits.find((entry) => entry.id === targetExitId);

    if (!exit) {
      throw new RoomTransitionError(
        `Target boundary exit "${targetExitId}" was not found in room "${room.id}".`,
      );
    }

    this.validateBoundaryExit(exit);

    return {
      position: this.entryPositionAtBoundaryExit(exit),
      facing: exit.facing,
    };
  }

  entryPositionAtBoundaryExit(exit: BoundaryExitDefinition): Vector2 {
    const centerX = exit.bounds.x + exit.bounds.width / 2;
    const feetY = exit.bounds.y + exit.bounds.height;

    switch (exit.edge) {
      case 'left':
        return new Vector2(centerX + BOUNDARY_ENTRY_NUDGE_PX, feetY);
      case 'right':
        return new Vector2(centerX - BOUNDARY_ENTRY_NUDGE_PX, feetY);
      case 'top':
        return new Vector2(centerX, feetY + BOUNDARY_ENTRY_NUDGE_PX);
      case 'bottom':
        return new Vector2(centerX, exit.bounds.y - BOUNDARY_ENTRY_NUDGE_PX);
      default:
        throw new RoomTransitionError(`Boundary exit "${exit.id}" has invalid edge "${exit.edge}".`);
    }
  }

  static defaultFadeMs(): number {
    return DEFAULT_FADE_MS;
  }
}

export function isDoorFacing(value: string): value is DoorFacing {
  return value === 'left' || value === 'right';
}

export function isMapEdge(value: string): value is MapEdge {
  return value === 'left' || value === 'right' || value === 'top' || value === 'bottom';
}
