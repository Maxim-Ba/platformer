# scene-lifecycle

## Purpose

Phaser-сцены и правила переходов: Boot → Preload → MainMenu → Game → LevelComplete / GameOver. Сцены остаются thin и делегируют gameplay-логику use cases.

## Requirements

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

### Requirement: Loading feedback

PreloadScene MUST display loading progress while foundation assets are fetched.

#### Scenario: Progress indicator visible

- **WHEN** assets are loading
- **THEN** PreloadScene MUST reflect load progress numerically or via progress bar
