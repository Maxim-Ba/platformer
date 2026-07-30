## MODIFIED Requirements

### Requirement: Attack input binding

Player MUST be able to trigger melee attack via keyboard.

#### Scenario: Attack key pressed

- **WHEN** player presses a key bound to `attack` in current game settings
- **THEN** input port MUST report attack pressed for the current frame
