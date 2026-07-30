## MODIFIED Requirements

### Requirement: Controls hint preserved

The game MUST continue showing movement/control hints during gameplay as a separate HUD widget or equivalent module.

#### Scenario: Controls visible

- **WHEN** GameScene is running
- **THEN** control hints MUST remain visible on screen

#### Scenario: Character menu hotkeys documented

- **WHEN** control hints are displayed during gameplay
- **THEN** the hint MUST document current character menu tab key bindings from settings

#### Scenario: Pause hint text

- **WHEN** control hints are displayed during gameplay
- **THEN** the hint MUST document the current `pause` key binding as opening pause, not as triggering game over

#### Scenario: Rebound keys reflected

- **WHEN** player changes key bindings in settings and returns to gameplay
- **THEN** control hints MUST reflect the updated bindings without requiring a page reload
