# scene-lifecycle

## Purpose

Phaser-сцены и правила переходов: Boot → Preload → MainMenu → Game → LevelComplete / GameOver. Сцены остаются thin и делегируют gameplay-логику use cases.

## Requirements

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

#### Scenario: Pause does not trigger game over

- **WHEN** player presses Escape during active GameScene gameplay
- **THEN** the game MUST show the pause overlay and MUST NOT transition to GameOverScene

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

### Requirement: Thin presentation scenes

Phaser scenes MUST delegate gameplay decisions to application use cases and MUST NOT contain domain rules.

#### Scenario: GameScene update loop

- **WHEN** GameScene `update()` runs each frame
- **THEN** it MUST call use cases for input and movement, then sync presentation sprites from resulting state

### Requirement: Scene registry

All scenes MUST be registered in a central game bootstrap module with stable string keys.

#### Scenario: Scene key consistency

- **WHEN** a scene transition is requested
- **THEN** it MUST use registered scene keys defined in one module to avoid string duplication across files

### Requirement: Scene registry for menu scenes

SettingsScene and LoadGameScene MUST be registered in the central game bootstrap module with stable string keys.

#### Scenario: New scene keys

- **WHEN** a transition to Settings or LoadGame is requested
- **THEN** it MUST use keys defined in `scene-keys.ts`

### Requirement: Loading feedback

PreloadScene MUST display loading progress while foundation assets are fetched.

#### Scenario: Progress indicator visible

- **WHEN** assets are loading
- **THEN** PreloadScene MUST reflect load progress numerically or via progress bar

### Requirement: Character menu overlay lifecycle

GameScene MUST support opening and closing a character menu overlay without scene transition.

#### Scenario: Overlay does not change scene

- **WHEN** player opens or closes the character menu during gameplay
- **THEN** GameScene MUST remain the active scene and MUST NOT transition to another scene

#### Scenario: Overlay cleanup on shutdown

- **WHEN** GameScene shuts down while character menu is open
- **THEN** overlay game objects and input listeners MUST be destroyed without leaks
