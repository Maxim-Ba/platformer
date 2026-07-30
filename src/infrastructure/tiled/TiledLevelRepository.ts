import type {
  Checkpoint,
  EnemySpawn,
  HazardZone,
  LevelExit,
  PlayerSpawn,
} from '@domain/entities/LevelDefinition';
import type { DoorDefinition, BoundaryExitDefinition, RoomDefinition } from '@domain/entities/RoomDefinition';
import type { EnemyTypeId } from '@domain/entities/Enemy';
import { isDoorFacing, isMapEdge, RoomTransitionRules } from '@domain/services/RoomTransitionRules';
import { Vector2 } from '@domain/value-objects/Vector2';

import type { ILevelRepository } from '@application/ports/ILevelRepository';

import type { TiledMapJson, TiledObject, TiledObjectGroup } from './TiledTypes';

const OBJECTS_LAYER_NAME = 'objects';

export class TiledLevelRepository implements ILevelRepository {
  constructor(private readonly basePath = '/assets/maps') {}

  async load(levelId: string): Promise<RoomDefinition> {
    const response = await fetch(`${this.basePath}/${levelId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load level "${levelId}": ${response.status} ${response.statusText}`);
    }

    const map = (await response.json()) as TiledMapJson;
    return this.parseMap(levelId, map);
  }

  parseMap(levelId: string, map: TiledMapJson): RoomDefinition {
    const objectsLayer = map.layers.find(
      (layer): layer is TiledObjectGroup =>
        layer.type === 'objectgroup' && layer.name === OBJECTS_LAYER_NAME,
    );

    if (!objectsLayer) {
      throw new Error(`Level "${levelId}" is missing required object layer "${OBJECTS_LAYER_NAME}"`);
    }

    const playerSpawn = this.findSingleObject(objectsLayer.objects, 'player_spawn', levelId, (object) =>
      this.toPlayerSpawn(object),
    );

    const exits = objectsLayer.objects
      .filter((object) => object.type === 'level_exit')
      .map((object) => this.toLevelExit(object));

    const hazards = objectsLayer.objects
      .filter((object) => object.type === 'hazard')
      .map((object) => this.toHazardZone(object));

    const checkpoints = objectsLayer.objects
      .filter((object) => object.type === 'checkpoint')
      .map((object) => this.toCheckpoint(object));

    const enemySpawns = objectsLayer.objects
      .filter((object) => object.type === 'enemy_spawn')
      .map((object) => this.toEnemySpawn(object));

    const doors = objectsLayer.objects
      .filter((object) => object.type === 'door')
      .map((object) => this.toDoorDefinition(object));

    const boundaryExits = objectsLayer.objects
      .filter((object) => object.type === 'boundary_exit')
      .map((object) => this.toBoundaryExitDefinition(object));

    return {
      id: levelId,
      bounds: {
        width: map.width * map.tilewidth,
        height: map.height * map.tileheight,
        tileWidth: map.tilewidth,
        tileHeight: map.tileheight,
      },
      playerSpawn,
      exits,
      hazards,
      checkpoints,
      enemySpawns,
      doors,
      boundaryExits,
    };
  }

  private findSingleObject<T>(
    objects: readonly TiledObject[],
    type: string,
    levelId: string,
    mapObject: (object: TiledObject) => T,
  ): T {
    const matches = objects.filter((object) => object.type === type);
    if (matches.length !== 1) {
      throw new Error(
        `Level "${levelId}" must contain exactly one "${type}" object, found ${matches.length}`,
      );
    }

    return mapObject(matches[0]);
  }

  private toPlayerSpawn(object: TiledObject): PlayerSpawn {
    return {
      kind: 'player_spawn',
      position: this.objectFeetPosition(object),
    };
  }

  private toLevelExit(object: TiledObject): LevelExit {
    return {
      kind: 'level_exit',
      position: new Vector2(object.x, object.y),
      width: object.width,
      height: object.height,
    };
  }

  private toHazardZone(object: TiledObject): HazardZone {
    return {
      kind: 'hazard',
      position: new Vector2(object.x, object.y),
      width: object.width,
      height: object.height,
    };
  }

  private toCheckpoint(object: TiledObject): Checkpoint {
    return {
      kind: 'checkpoint',
      id: `checkpoint-${object.id}`,
      position: new Vector2(object.x, object.y),
      width: object.width,
      height: object.height,
    };
  }

  private toEnemySpawn(object: TiledObject): EnemySpawn {
    const enemyType = this.readStringProperty(object, 'enemyType', 'grunt') as EnemyTypeId;
    const patrolDistance = this.readOptionalNumberProperty(object, 'patrolDistance');

    return {
      kind: 'enemy_spawn',
      id: `enemy-${object.id}`,
      position: this.objectFeetPosition(object),
      enemyType,
      ...(patrolDistance !== undefined ? { patrolDistance } : {}),
    };
  }

  private toDoorDefinition(object: TiledObject): DoorDefinition {
    const doorId = this.readStringProperty(object, 'doorId', `door-${object.id}`);
    const targetRoom = this.readStringProperty(object, 'targetRoom', '');
    const targetDoor = this.readStringProperty(object, 'targetDoor', '');
    const facingRaw = this.readStringProperty(object, 'facing', 'right');
    const facing = isDoorFacing(facingRaw) ? facingRaw : 'right';
    const fadeMs =
      this.readOptionalNumberProperty(object, 'fadeMs') ?? RoomTransitionRules.defaultFadeMs();

    return {
      kind: 'door',
      id: doorId,
      bounds: {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      },
      targetRoom,
      targetDoor,
      facing,
      fadeMs,
    };
  }

  private toBoundaryExitDefinition(object: TiledObject): BoundaryExitDefinition {
    const exitId = this.readStringProperty(object, 'exitId', `exit-${object.id}`);
    const targetRoom = this.readStringProperty(object, 'targetRoom', '');
    const targetExitId = this.readStringProperty(object, 'targetExitId', '');
    const edgeRaw = this.readStringProperty(object, 'edge', 'right');
    const edge = isMapEdge(edgeRaw) ? edgeRaw : 'right';
    const facingRaw = this.readStringProperty(object, 'facing', 'right');
    const facing = isDoorFacing(facingRaw) ? facingRaw : 'right';
    const fadeMs =
      this.readOptionalNumberProperty(object, 'fadeMs') ?? RoomTransitionRules.defaultFadeMs();

    return {
      kind: 'boundary_exit',
      id: exitId,
      bounds: {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      },
      targetRoom,
      targetExitId,
      edge,
      facing,
      fadeMs,
    };
  }

  private readStringProperty(
    object: TiledObject,
    name: string,
    fallback: string,
  ): string {
    const property = object.properties?.find((entry) => entry.name === name);

    if (!property || typeof property.value !== 'string') {
      return fallback;
    }

    return property.value;
  }

  private readOptionalNumberProperty(
    object: TiledObject,
    name: string,
  ): number | undefined {
    const property = object.properties?.find((entry) => entry.name === name);

    if (!property || typeof property.value !== 'number') {
      return undefined;
    }

    return property.value;
  }

  private objectFeetPosition(object: TiledObject): Vector2 {
    return new Vector2(object.x + object.width / 2, object.y + object.height);
  }
}
