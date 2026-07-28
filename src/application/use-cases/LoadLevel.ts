import type { LevelDefinition } from '@domain/entities/LevelDefinition';

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

  async execute(levelId: string): Promise<LevelDefinition> {
    return this.tiledRepository.load(levelId);
  }

  fromTiledMap(levelId: string, map: TiledMapJson): LevelDefinition {
    return this.tiledRepository.parseMap(levelId, map);
  }
}
