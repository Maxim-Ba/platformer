import type { RoomDefinition } from '@domain/entities/RoomDefinition';

import type { ILevelRepository } from '../ports/ILevelRepository';
import type { TiledMapJson } from '@infrastructure/tiled/TiledTypes';
import { TiledLevelRepository } from '@infrastructure/tiled/TiledLevelRepository';

export class LoadLevel {
  private readonly tiledRepository: TiledLevelRepository;

  constructor(levelRepository: ILevelRepository) {
    if (!(levelRepository instanceof TiledLevelRepository)) {
      throw new Error('LoadLevel requires TiledLevelRepository.');
    }

    this.tiledRepository = levelRepository;
  }

  async execute(levelId: string): Promise<RoomDefinition> {
    return this.tiledRepository.load(levelId);
  }

  fromTiledMap(levelId: string, map: TiledMapJson): RoomDefinition {
    return this.tiledRepository.parseMap(levelId, map);
  }
}
