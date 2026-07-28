export interface LevelData {
  id: string;
  width: number;
  height: number;
}

export interface ILevelRepository {
  load(levelId: string): Promise<LevelData>;
}
