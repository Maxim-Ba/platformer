# pause-menu

## Purpose

In-game pause overlay: Esc открывает меню паузы в GameScene, заморозка геймплея, настройки, рестарт с чекпоинта и выход в главное меню.

## Requirements

### Requirement: Pause on Escape during gameplay

The game MUST open a pause menu when the player presses Escape during active gameplay in GameScene, instead of transitioning to GameOverScene.

#### Scenario: Open pause menu

- **WHEN** player presses Escape while GameScene is running and gameplay is not in respawn or level-complete transition
- **THEN** the game MUST show a pause menu overlay and MUST NOT transition to GameOverScene

#### Scenario: Close pause menu with Escape

- **WHEN** pause menu is visible and player presses Escape
- **THEN** the pause menu MUST close and gameplay MUST resume

### Requirement: Pause menu items

The pause menu MUST provide four actions: Save, Settings, Restart from checkpoint, and Exit.

#### Scenario: Menu items visible

- **WHEN** pause menu is open
- **THEN** player MUST see menu items for Save, Settings, Restart from checkpoint, and Exit

#### Scenario: Keyboard navigation

- **WHEN** pause menu is open
- **THEN** player MUST navigate items with Arrow Up/Down and confirm with Enter or Space

### Requirement: Manual save from pause

Selecting Save from the pause menu MUST persist current progress without closing the pause menu or ending the level.

#### Scenario: Save from pause

- **WHEN** player selects Save from the pause menu
- **THEN** the game MUST call `SaveGame` for the default slot and MUST NOT transition to another scene

#### Scenario: Pause remains open after save

- **WHEN** manual save completes from the pause menu
- **THEN** the pause menu MUST remain visible and gameplay MUST stay frozen

### Requirement: Gameplay freeze while paused

While the pause menu is open, core gameplay simulation MUST be frozen.

#### Scenario: Movement frozen

- **WHEN** pause menu is open
- **THEN** player movement, hazard damage, checkpoint activation, and level exit detection MUST NOT advance

#### Scenario: Resource ticks frozen

- **WHEN** pause menu is open
- **THEN** health invulnerability timers and other gameplay tick logic in GameScene update MUST NOT advance

#### Scenario: Camera frozen

- **WHEN** pause menu is open
- **THEN** camera follow MUST NOT update

### Requirement: Settings from pause

Selecting Settings from the pause menu MUST open the settings screen and return to the paused game session afterward.

#### Scenario: Open settings from pause

- **WHEN** player selects Settings from the pause menu
- **THEN** SettingsScene MUST open and GameScene MUST remain paused in the background

#### Scenario: Return from settings to pause

- **WHEN** player presses Escape in SettingsScene opened from pause
- **THEN** the game MUST return to GameScene with the pause menu still visible

### Requirement: Restart from checkpoint

Selecting Restart from checkpoint MUST respawn the player at the last activated checkpoint position, or at level spawn if no checkpoint was activated.

#### Scenario: Respawn at activated checkpoint

- **WHEN** player selects Restart from checkpoint and at least one checkpoint was activated
- **THEN** player MUST respawn at the last activated checkpoint with the documented fade transition

#### Scenario: Respawn at level spawn without checkpoint

- **WHEN** player selects Restart from checkpoint and no checkpoint was activated
- **THEN** player MUST respawn at the level `player_spawn` position with the documented fade transition

#### Scenario: Pause closes before respawn

- **WHEN** player confirms Restart from checkpoint
- **THEN** pause menu MUST close before respawn fade begins

### Requirement: Exit to main menu from pause

Selecting Exit from the pause menu MUST save progress and return to MainMenuScene.

#### Scenario: Exit saves and leaves level

- **WHEN** player selects Exit from the pause menu
- **THEN** the game MUST persist current progress via `SaveGame` to the default save slot and transition to MainMenuScene

### Requirement: Configurable pause key

Pause MUST respect the keyboard binding configured in `controls.keyBindings.pause`.

#### Scenario: Open pause with configured key

- **WHEN** player presses the key bound to `pause` during active gameplay in GameScene
- **THEN** the pause menu MUST open as if Escape were pressed

#### Scenario: Close pause with configured key

- **WHEN** pause menu is visible and player presses the key bound to `pause`
- **THEN** the pause menu MUST close and gameplay MUST resume

### Requirement: Death flow unchanged

Escape pause MUST NOT replace the documented death and game over flow.

#### Scenario: Lethal hazard still game over

- **WHEN** player HP reaches zero from hazard damage
- **THEN** the game MUST transition to GameOverScene as before

#### Scenario: Esc is not game over

- **WHEN** player presses Escape during normal gameplay with HP above zero
- **THEN** GameOverScene MUST NOT be shown
