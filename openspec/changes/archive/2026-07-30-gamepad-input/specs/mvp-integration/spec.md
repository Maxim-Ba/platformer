## MODIFIED Requirements

### Requirement: Contributor documentation

README MUST document Tiled export workflow and Blasphemous-inspired scope boundaries for the pet project.

#### Scenario: Tiled workflow documented

- **WHEN** a developer reads README
- **THEN** they MUST find steps to export Tiled maps to `public/assets/maps/`

#### Scenario: Gamepad controls documented

- **WHEN** a developer or player reads README controls section
- **THEN** they MUST find the gamepad button map for gameplay and menus

## ADDED Requirements

### Requirement: Gamepad end-to-end session

The MVP session MUST be completable using a gamepad as the sole input device.

#### Scenario: Full session on gamepad

- **WHEN** player uses only a connected gamepad from MainMenuScene
- **THEN** they MUST be able to start a game, play a level, open pause and character menu, and reach LevelCompleteScene or GameOverScene through documented flows
