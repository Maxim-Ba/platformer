## MODIFIED Requirements

### Requirement: Camera follow

The game MUST follow the player with a smooth camera that keeps the player centered in the viewport, applies follow slack when horizontal movement direction changes sharply, and constrains scroll to level world bounds.

#### Scenario: Camera tracks player

- **WHEN** player moves within a loaded level
- **THEN** the main camera MUST smoothly follow the player, keep the player centered in the viewport, and remain within documented world bounds

#### Scenario: Direction-change slack

- **WHEN** player sharply reverses horizontal movement direction
- **THEN** the camera MUST exhibit brief follow lag before re-centering on the player
