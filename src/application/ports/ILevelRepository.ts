import type { LevelDefinition } from '@domain/entities/LevelDefinition';

export interface ILevelRepository {
  load(levelId: string): Promise<LevelDefinition>;
}
