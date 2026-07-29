## MODIFIED Requirements

### Requirement: Controls hint preserved

The game MUST continue showing movement/control hints during gameplay as a separate HUD widget or equivalent module.

#### Scenario: Controls visible

- **WHEN** GameScene is running
- **THEN** control hints MUST remain visible on screen

#### Scenario: Gamepad hint text

- **WHEN** control hints are displayed during gameplay
- **THEN** the hint MUST document primary gamepad controls (stick/D-pad move, A jump, Start pause, Back character menu) in addition to keyboard bindings
