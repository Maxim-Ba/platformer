import type { RoomDefinition } from '@domain/entities/RoomDefinition';

export interface ILevelRepository {
  load(levelId: string): Promise<RoomDefinition>;
}
