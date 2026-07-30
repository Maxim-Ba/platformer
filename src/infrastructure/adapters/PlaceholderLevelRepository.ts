import type { RoomDefinition } from '@domain/entities/RoomDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import type { ILevelRepository } from '@application/ports/ILevelRepository';

export class PlaceholderLevelRepository implements ILevelRepository {
  async load(levelId: string): Promise<RoomDefinition> {
    return {
      id: levelId,
      bounds: {
        width: 0,
        height: 0,
        tileWidth: 32,
        tileHeight: 32,
      },
      playerSpawn: {
        kind: 'player_spawn',
        position: new Vector2(0, 0),
      },
      exits: [],
      hazards: [],
      checkpoints: [],
      enemySpawns: [],
      doors: [],
      boundaryExits: [],
    };
  }
}
