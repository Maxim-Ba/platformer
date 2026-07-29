export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  MainMenu: 'MainMenuScene',
  Game: 'GameScene',
  GameOver: 'GameOverScene',
  LevelComplete: 'LevelCompleteScene',
  Settings: 'SettingsScene',
  LoadGame: 'LoadGameScene',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
