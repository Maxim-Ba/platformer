## MODIFIED Requirements

### Requirement: Core scene set

The game MUST implement Boot, Preload, MainMenu, Game, GameOver, LevelComplete, Settings, and LoadGame scenes with documented transition rules.

#### Scenario: Boot to Preload transition

- **WHEN** the game starts
- **THEN** BootScene MUST initialize configuration and transition to PreloadScene automatically

#### Scenario: Preload to MainMenu transition

- **WHEN** all foundation assets finish loading
- **THEN** PreloadScene MUST transition to MainMenuScene

#### Scenario: Start game from menu

- **WHEN** player selects «Новая игра» from MainMenuScene
- **THEN** GameScene MUST load with the default first level after `StartNewGame` resets runtime state

#### Scenario: Load game from menu

- **WHEN** player selects a valid save from LoadGameScene
- **THEN** GameScene MUST start with the saved `levelId` and restored progression/inventory state

#### Scenario: Settings from menu

- **WHEN** player selects «Настройки» from MainMenuScene
- **THEN** SettingsScene MUST open
- **AND** pressing Escape MUST return to MainMenuScene

#### Scenario: Game over flow

- **WHEN** player dies or selects restart from GameOverScene
- **THEN** the game MUST transition to GameScene or MainMenuScene according to documented rules

#### Scenario: Level complete flow

- **WHEN** player reaches level exit and LevelCompleteScene is shown
- **THEN** player MUST be able to navigate to next level, retry, or main menu per level-complete-flow rules

## ADDED Requirements

### Requirement: Scene registry for menu scenes

SettingsScene and LoadGameScene MUST be registered in the central game bootstrap module with stable string keys.

#### Scenario: New scene keys

- **WHEN** a transition to Settings or LoadGame is requested
- **THEN** it MUST use keys defined in `scene-keys.ts`
