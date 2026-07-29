import type { SceneKey } from '@game/scene-keys';

export interface LevelCompleteSceneData {
  levelId: string;
  nextLevelId?: string;
}

export interface GameOverSceneData {
  levelId: string;
}

export interface SettingsSceneData {
  returnScene?: SceneKey;
}
