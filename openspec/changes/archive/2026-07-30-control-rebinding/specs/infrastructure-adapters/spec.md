## MODIFIED Requirements

### Requirement: Phaser input adapter

Infrastructure MUST provide `PhaserInputAdapter` implementing `IInputPort` for keyboard controls.

#### Scenario: Keyboard movement

- **WHEN** player holds keys bound to `moveLeft` or `moveRight` in current settings
- **THEN** input adapter MUST report horizontal direction to consumers

#### Scenario: Keyboard jump

- **WHEN** player presses a key bound to `jump` in current settings
- **THEN** input adapter MUST report jump pressed for the current frame

### Requirement: Attack input in input port

`IInputPort` MUST expose melee attack input in addition to movement and jump.

#### Scenario: Attack key in adapter

- **WHEN** player presses a key bound to `attack` in current settings
- **THEN** `PhaserInputAdapter` MUST return true from `isAttackPressed()` for that frame

#### Scenario: Input port interface segregation

- **WHEN** `IInputPort` is defined
- **THEN** attack method MUST be part of the port interface, not read directly from Phaser in scenes

### Requirement: Dash keyboard input

`PhaserInputAdapter` MUST report dash input for configured keyboard keys.

#### Scenario: Dash key detection

- **WHEN** player presses a key bound to `dash` in current settings
- **THEN** `isDashPressed()` MUST return true for that frame

#### Scenario: Dash key not held

- **WHEN** no key bound to `dash` is pressed this frame
- **THEN** `isDashPressed()` MUST return false
