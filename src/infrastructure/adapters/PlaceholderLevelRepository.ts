import type { ILevelRepository, LevelData } from '@application/ports/ILevelRepository';

export class PlaceholderLevelRepository implements ILevelRepository {
  async load(levelId: string): Promise<LevelData> {
    return { id: levelId, width: 0, height: 0 };
  }
}
