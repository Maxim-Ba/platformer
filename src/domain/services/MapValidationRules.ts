import type { DoorDefinition, RoomDefinition } from '../entities/RoomDefinition';
import type { MapValidationIssue } from '../types/MapValidation';

/** Must match `GameScene.buildRoomLayers` tileset names. */
export const REQUIRED_TILESET_NAMES = ['platformer', 'beast_soldier'] as const;

const REQUIRED_TILE_LAYERS = ['ground', 'decor'] as const;
const REQUIRED_OBJECT_LAYER = 'objects';

export interface MapLayerSnapshot {
  readonly name: string;
  readonly type: 'tilelayer' | 'objectgroup';
}

export interface MapTilesetSnapshot {
  readonly name: string;
}

export interface MapStructureSnapshot {
  readonly layers: readonly MapLayerSnapshot[];
  readonly tilesets: readonly MapTilesetSnapshot[];
}

function issue(
  level: MapValidationIssue['level'],
  roomId: string,
  message: string,
): MapValidationIssue {
  return { level, roomId, message };
}

export function validateUniqueDoorIds(room: RoomDefinition): MapValidationIssue[] {
  const seen = new Map<string, number>();

  for (const door of room.doors) {
    seen.set(door.id, (seen.get(door.id) ?? 0) + 1);
  }

  const issues: MapValidationIssue[] = [];

  for (const [doorId, count] of seen) {
    if (count > 1) {
      issues.push(
        issue('error', room.id, `duplicate doorId "${doorId}" in ${room.id}`),
      );
    }
  }

  return issues;
}

export function validateDoorTarget(
  maps: ReadonlyMap<string, RoomDefinition>,
  door: DoorDefinition,
  sourceRoomId: string,
): MapValidationIssue[] {
  const issues: MapValidationIssue[] = [];

  if (!door.targetRoom.trim()) {
    issues.push(
      issue(
        'error',
        sourceRoomId,
        `door "${sourceRoomId}/${door.id}" is missing targetRoom`,
      ),
    );
    return issues;
  }

  if (!door.targetDoor.trim()) {
    issues.push(
      issue(
        'error',
        sourceRoomId,
        `door "${sourceRoomId}/${door.id}" is missing targetDoor`,
      ),
    );
    return issues;
  }

  const targetRoom = maps.get(door.targetRoom);

  if (!targetRoom) {
    issues.push(
      issue(
        'error',
        sourceRoomId,
        `door "${sourceRoomId}/${door.id}" references missing target room "${door.targetRoom}"`,
      ),
    );
    return issues;
  }

  const targetDoor = targetRoom.doors.find((entry) => entry.id === door.targetDoor);

  if (!targetDoor) {
    issues.push(
      issue(
        'error',
        sourceRoomId,
        `door "${sourceRoomId}/${door.id}" → "${door.targetRoom}/${door.targetDoor}" — target door not found`,
      ),
    );
  }

  return issues;
}

export function validateBidirectionalPair(
  maps: ReadonlyMap<string, RoomDefinition>,
): MapValidationIssue[] {
  const issues: MapValidationIssue[] = [];

  for (const room of maps.values()) {
    for (const door of room.doors) {
      const targetRoom = maps.get(door.targetRoom);

      if (!targetRoom) {
        continue;
      }

      const reverseDoor = targetRoom.doors.find((entry) => entry.id === door.targetDoor);

      if (
        !reverseDoor ||
        reverseDoor.targetRoom !== room.id ||
        reverseDoor.targetDoor !== door.id
      ) {
        issues.push(
          issue(
            'warning',
            room.id,
            `door "${room.id}/${door.id}" → "${door.targetRoom}/${door.targetDoor}" has no reverse pair`,
          ),
        );
      }
    }
  }

  return issues;
}

export function validateLayersAndTilesets(
  roomId: string,
  map: MapStructureSnapshot,
): MapValidationIssue[] {
  const issues: MapValidationIssue[] = [];

  for (const layerName of REQUIRED_TILE_LAYERS) {
    const layer = map.layers.find(
      (entry) => entry.type === 'tilelayer' && entry.name === layerName,
    );

    if (!layer) {
      issues.push(
        issue('error', roomId, `missing required tile layer "${layerName}"`),
      );
    }
  }

  const objectsLayer = map.layers.find(
    (entry) => entry.type === 'objectgroup' && entry.name === REQUIRED_OBJECT_LAYER,
  );

  if (!objectsLayer) {
    issues.push(
      issue('error', roomId, `missing required object layer "${REQUIRED_OBJECT_LAYER}"`),
    );
  }

  for (const tilesetName of REQUIRED_TILESET_NAMES) {
    const tileset = map.tilesets.find((entry) => entry.name === tilesetName);

    if (!tileset) {
      issues.push(
        issue('error', roomId, `missing required tileset "${tilesetName}"`),
      );
    }
  }

  return issues;
}

export function validateWorldGraph(
  graphRoomIds: readonly string[],
  entryRoomId: string,
  mapIds: ReadonlySet<string>,
): MapValidationIssue[] {
  const issues: MapValidationIssue[] = [];
  const graphIds = new Set(graphRoomIds);

  for (const roomId of graphRoomIds) {
    if (!mapIds.has(roomId)) {
      issues.push(
        issue(
          'error',
          roomId,
          `WORLD_GRAPH room "${roomId}" has no map file public/assets/maps/${roomId}.json`,
        ),
      );
    }
  }

  if (!mapIds.has(entryRoomId)) {
    issues.push(
      issue(
        'error',
        entryRoomId,
        `WORLD_ENTRY_ROOM_ID "${entryRoomId}" has no map file public/assets/maps/${entryRoomId}.json`,
      ),
    );
  }

  for (const mapId of mapIds) {
    if (mapId.startsWith('room-') && !graphIds.has(mapId)) {
      issues.push(
        issue(
          'warning',
          mapId,
          `map file "${mapId}.json" is not listed in WORLD_GRAPH`,
        ),
      );
    }
  }

  return issues;
}
