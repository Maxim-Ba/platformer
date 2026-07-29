## MODIFIED Requirements

### Requirement: Controls hint preserved

The game MUST continue showing movement/control hints during gameplay as a separate HUD widget or equivalent module.

#### Scenario: Controls visible

- **WHEN** GameScene is running
- **THEN** control hints MUST remain visible on screen

#### Scenario: Character menu hotkeys documented

- **WHEN** control hints are displayed during gameplay
- **THEN** the hint MUST document character menu tab hotkeys (`I`, `K`, `C`, `U`, `M`)
