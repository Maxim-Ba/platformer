## ADDED Requirements

### Requirement: In-game pause overlay flow

GameScene MUST support an in-scene pause overlay without leaving the active level session.

#### Scenario: Pause does not destroy GameScene

- **WHEN** player opens the pause menu during gameplay
- **THEN** GameScene MUST remain active and MUST preserve level state including activated checkpoints and current resources

#### Scenario: Settings launched from pause

- **WHEN** player opens Settings from the pause menu
- **THEN** SettingsScene MUST be launched on top of paused GameScene and MUST return to paused GameScene on back navigation

#### Scenario: Exit from pause to main menu

- **WHEN** player selects Exit from the pause menu
- **THEN** the game MUST transition from GameScene to MainMenuScene after saving progress

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

- **WHEN** player confirms start from MainMenuScene
- **THEN** GameScene MUST load with the configured first level

#### Scenario: Game over flow

- **WHEN** player dies or selects restart from GameOverScene
- **THEN** the game MUST transition to GameScene or MainMenuScene according to documented rules

#### Scenario: Level complete flow

- **WHEN** player reaches level exit and LevelCompleteScene is shown
- **THEN** player MUST be able to navigate to next level, retry, or main menu per level-complete-flow rules

#### Scenario: Pause does not trigger game over

- **WHEN** player presses Escape during active GameScene gameplay
- **THEN** the game MUST show the pause overlay and MUST NOT transition to GameOverScene
