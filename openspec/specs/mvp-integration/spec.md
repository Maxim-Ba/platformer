# mvp-integration

## Purpose

MVP polish: placeholder player visuals, camera follow, death/respawn с fade, end-to-end playable loop и contributor documentation.

## Requirements

### Requirement: Placeholder player visuals

The MVP MUST display a visible player representation (sprite or placeholder) synced to movement state.

#### Scenario: Player visible on level

- **WHEN** GameScene is running
- **THEN** a player sprite or equivalent MUST be visible and track movement state

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

The MVP MUST support a complete session from main menu through level completion or game over.

#### Scenario: Full session

- **WHEN** player starts from MainMenuScene
- **THEN** they MUST be able to reach level exit or GameOverScene through documented hazard and respawn flow

### Requirement: Contributor documentation

README MUST document Tiled export workflow and Blasphemous-inspired scope boundaries for the pet project.

#### Scenario: Tiled workflow documented

- **WHEN** a developer reads README
- **THEN** they MUST find steps to export Tiled maps to `public/assets/maps/`
