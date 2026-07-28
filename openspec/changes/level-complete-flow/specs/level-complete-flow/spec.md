## ADDED Requirements

### Requirement: Level complete scene

The game MUST provide a dedicated LevelCompleteScene displayed when the player reaches a level exit.

#### Scenario: Victory screen on exit

- **WHEN** player overlaps `level_exit` object
- **THEN** game MUST transition to LevelCompleteScene, not GameOverScene

#### Scenario: Victory visual identity

- **WHEN** LevelCompleteScene is displayed
- **THEN** it MUST show a victory title distinct from the game over screen

### Requirement: Level complete fade transition

Level completion MUST use a brief camera fade transition before showing the victory screen.

#### Scenario: Fade on level exit

- **WHEN** player triggers level completion
- **THEN** camera MUST fade out before LevelCompleteScene starts

### Requirement: Level complete navigation

LevelCompleteScene MUST offer documented navigation options after level completion.

#### Scenario: Retry completed level

- **WHEN** player presses R on LevelCompleteScene
- **THEN** game MUST restart the completed level in GameScene

#### Scenario: Return to main menu

- **WHEN** player presses M on LevelCompleteScene
- **THEN** game MUST transition to MainMenuScene

#### Scenario: Continue to next level

- **WHEN** a next level exists in progression config and player presses N or Enter
- **THEN** game MUST start GameScene with the next level id

#### Scenario: No next level available

- **WHEN** completed level is the last in progression config
- **THEN** next-level navigation MUST be hidden or disabled; retry and main menu MUST remain available

### Requirement: Level progression configuration

An ordered level progression list MUST define which level follows each completed level.

#### Scenario: Resolve next level

- **WHEN** level `level-01` is completed and `level-02` is in progression list
- **THEN** `getNextLevelId('level-01')` MUST return `level-02`

#### Scenario: Last level has no successor

- **WHEN** the last level in progression is completed
- **THEN** `getNextLevelId` MUST return undefined

### Requirement: Death and victory separation

Game over and level complete MUST be separate flows with distinct scenes.

#### Scenario: Death does not show victory

- **WHEN** player dies (game over trigger)
- **THEN** GameOverScene MUST be shown, not LevelCompleteScene

#### Scenario: Victory does not show game over

- **WHEN** player completes a level via exit
- **THEN** LevelCompleteScene MUST be shown, not GameOverScene
