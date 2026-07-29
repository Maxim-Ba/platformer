## ADDED Requirements

### Requirement: Dash keyboard input

`PhaserInputAdapter` MUST report dash input for configured keyboard keys.

#### Scenario: Dash key detection

- **WHEN** player presses Left Shift
- **THEN** `isDashPressed()` MUST return true for that frame

#### Scenario: Dash key not held

- **WHEN** Left Shift is not pressed this frame
- **THEN** `isDashPressed()` MUST return false
