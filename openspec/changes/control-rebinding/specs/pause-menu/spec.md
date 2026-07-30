## ADDED Requirements

### Requirement: Configurable pause key

Pause MUST respect the keyboard binding configured in `controls.keyBindings.pause`.

#### Scenario: Open pause with configured key

- **WHEN** player presses the key bound to `pause` during active gameplay in GameScene
- **THEN** the pause menu MUST open as if Escape were pressed

#### Scenario: Close pause with configured key

- **WHEN** pause menu is visible and player presses the key bound to `pause`
- **THEN** the pause menu MUST close and gameplay MUST resume
