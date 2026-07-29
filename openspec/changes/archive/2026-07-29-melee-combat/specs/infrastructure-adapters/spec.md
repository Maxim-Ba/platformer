## ADDED Requirements

### Requirement: Attack input in input port

`IInputPort` MUST expose melee attack input in addition to movement and jump.

#### Scenario: Attack key in adapter

- **WHEN** player presses J or X
- **THEN** `PhaserInputAdapter` MUST return true from `isAttackPressed()` for that frame

#### Scenario: Input port interface segregation

- **WHEN** `IInputPort` is defined
- **THEN** attack method MUST be part of the port interface, not read directly from Phaser in scenes
