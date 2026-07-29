## MODIFIED Requirements

### Requirement: Core scene set

The game MUST implement Boot, Preload, MainMenu, Game, GameOver, and LevelComplete scenes with documented transition rules.

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
