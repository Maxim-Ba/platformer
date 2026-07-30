# mvp-integration

## Purpose

MVP polish: placeholder player visuals, camera follow, death/respawn с fade, end-to-end playable loop и contributor documentation.

## Requirements

### Requirement: Placeholder player visuals

The MVP MUST display a visible player representation (sprite or placeholder) synced to movement state.

#### Scenario: Player visible on level

- **WHEN** GameScene is running
- **THEN** a player sprite or equivalent MUST be visible and track movement state

#### Scenario: Animated movement feedback

- **WHEN** player moves, jumps, or falls
- **THEN** player sprite MUST display distinct frame animations for idle, run, jump, and fall states

### Requirement: Camera follow

The game MUST follow the player with a smooth camera that keeps the player centered in the viewport, applies follow slack when horizontal movement direction changes sharply, and constrains scroll to level world bounds.

#### Scenario: Camera tracks player

- **WHEN** player moves within a loaded level
- **THEN** the main camera MUST smoothly follow the player, keep the player centered in the viewport, and remain within documented world bounds

#### Scenario: Direction-change slack

- **WHEN** player sharply reverses horizontal movement direction
- **THEN** the camera MUST exhibit brief follow lag before re-centering on the player

### Requirement: Death and checkpoint respawn

The game MUST respawn the player at the last activated checkpoint after hazard damage, with a brief fade transition.

#### Scenario: Respawn after hazard

- **WHEN** player takes damage from a hazard and a checkpoint was activated
- **THEN** player MUST respawn at checkpoint position after a brief fade

#### Scenario: Initial spawn

- **WHEN** level starts without activated checkpoint
- **THEN** player MUST spawn at `player_spawn` object coordinates

### Requirement: End-to-end MVP loop

The MVP MUST support a complete session from main menu through level completion or game over, including New Game, Load, manual Save, and Settings flows.

#### Scenario: Full session from new game

- **WHEN** player selects «Новая игра» from MainMenuScene
- **THEN** they MUST be able to reach level exit or GameOverScene through documented hazard and respawn flow

#### Scenario: Full session from load

- **WHEN** player loads an existing save from LoadGameScene
- **THEN** GameScene MUST start at the saved level with restored progression, inventory, and skills

#### Scenario: Settings round trip

- **WHEN** player opens Settings from main menu, changes a setting, and returns
- **THEN** the changed setting MUST persist after returning to MainMenuScene and after page reload

#### Scenario: Auto-save enables load

- **WHEN** player plays a session and returns to Main Menu via game over or level complete
- **THEN** «Загрузка» MUST offer the auto-saved progress for continuation

#### Scenario: Victory distinct from defeat

- **WHEN** player completes a level by reaching exit
- **THEN** they MUST NOT see the game over screen

#### Scenario: Pause available during level

- **WHEN** player is actively playing a level in GameScene
- **THEN** they MUST be able to open the pause menu with Escape and return to gameplay without ending the level

### Requirement: Manual save round trip

The MVP MUST support saving progress during gameplay and continuing from that save after reload.

#### Scenario: Save during level and continue

- **WHEN** player opens pause menu, selects Save, returns to main menu, and chooses Load
- **THEN** the loaded session MUST reflect the saved level and character state including skills changed before save

### Requirement: Contributor documentation

README MUST document Tiled export workflow and Blasphemous-inspired scope boundaries for the pet project.

#### Scenario: Tiled workflow documented

- **WHEN** a developer reads README
- **THEN** they MUST find steps to export Tiled maps to `public/assets/maps/`

#### Scenario: Gamepad controls documented

- **WHEN** a developer or player reads README controls section
- **THEN** they MUST find the gamepad button map for gameplay and menus

### Requirement: Gamepad end-to-end session

The MVP session MUST be completable using a gamepad as the sole input device.

#### Scenario: Full session on gamepad

- **WHEN** player uses only a connected gamepad from MainMenuScene
- **THEN** they MUST be able to start a game, play a level, open pause and character menu, and reach LevelCompleteScene or GameOverScene through documented flows

### Requirement: In-game HUD during gameplay

The MVP gameplay session MUST display a modular HUD with player resources and score while GameScene is active.

#### Scenario: HUD visible during level

- **WHEN** player is playing a level in GameScene
- **THEN** HUD MUST show HP, Mana, Energy (bottom-left) and score (top-right) alongside control hints

#### Scenario: HUD hidden outside gameplay

- **WHEN** player is on MainMenuScene, GameOverScene, or LevelCompleteScene
- **THEN** in-game HUD widgets MUST NOT be present

### Requirement: Character menu in gameplay session

The MVP gameplay session MUST allow the player to open the character menu during an active level without ending the session.

#### Scenario: Menu accessible mid-level

- **WHEN** player is playing a level in GameScene
- **THEN** they MUST be able to open the character menu via tab hotkeys and return to gameplay by closing it

#### Scenario: Session continues after menu close

- **WHEN** player closes the character menu
- **THEN** they MUST resume the same level session at the same game state (position, checkpoints, resources)
