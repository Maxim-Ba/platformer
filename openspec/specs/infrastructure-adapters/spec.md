# infrastructure-adapters

## Purpose

Phaser adapters и presentation-обёртки, связывающие domain movement с input/physics через порты (Dependency Inversion): `PhaserInputAdapter`, `PhaserPhysicsAdapter`, `PlayerSprite` и wiring через composition root.

## Requirements

### Requirement: Phaser input adapter

Infrastructure MUST provide input adapters implementing `IInputPort` for keyboard and gamepad controls, composed so consumers receive a single port.

#### Scenario: Keyboard movement

- **WHEN** player holds arrow keys or A/D
- **THEN** input adapter MUST report horizontal direction to consumers

#### Scenario: Gamepad movement

- **WHEN** player holds left stick or D-pad horizontally beyond the documented threshold on a connected gamepad
- **THEN** input adapter MUST report horizontal direction to consumers

#### Scenario: Keyboard jump

- **WHEN** player presses Space or configured jump key
- **THEN** input adapter MUST report jump pressed for the current frame

#### Scenario: Gamepad jump

- **WHEN** player presses the documented gamepad jump button
- **THEN** input adapter MUST report jump pressed for the current frame

#### Scenario: Composite port wiring

- **WHEN** composition root creates scene dependencies
- **THEN** scenes MUST receive a composite `IInputPort` that merges keyboard and gamepad adapters

### Requirement: Attack input in input port

`IInputPort` MUST expose melee attack input in addition to movement and jump.

#### Scenario: Attack key in adapter

- **WHEN** player presses J or X
- **THEN** `PhaserInputAdapter` MUST return true from `isAttackPressed()` for that frame

#### Scenario: Input port interface segregation

- **WHEN** `IInputPort` is defined
- **THEN** attack method MUST be part of the port interface, not read directly from Phaser in scenes

### Requirement: Dash keyboard input

`PhaserInputAdapter` MUST report dash input for configured keyboard keys.

#### Scenario: Dash key detection

- **WHEN** player presses Left Shift
- **THEN** `isDashPressed()` MUST return true for that frame

#### Scenario: Dash key not held

- **WHEN** Left Shift is not pressed this frame
- **THEN** `isDashPressed()` MUST return false

### Requirement: Phaser physics adapter

Infrastructure MUST provide an adapter implementing `IPhysicsPort` that applies domain state to Phaser Arcade bodies and reads collision feedback.

#### Scenario: Adapter boundary

- **WHEN** presentation synchronizes player position
- **THEN** only the physics adapter MUST call Phaser body APIs; use cases MUST NOT reference Phaser types

### Requirement: Player presentation sprite

Presentation layer MUST provide `PlayerSprite` that reflects domain/use-case player state without embedding movement rules.

#### Scenario: Sprite sync from state

- **WHEN** UpdatePlayerMovement produces updated PlayerState
- **THEN** PlayerSprite MUST update its visual position and facing from that state

### Requirement: Composition root wiring

Adapters MUST be registered in composition root and injected into scenes that consume them.

#### Scenario: No ad-hoc adapter construction in scenes

- **WHEN** GameScene is created
- **THEN** it MUST receive `IInputPort` and `IPhysicsPort` from composition root, not instantiate adapters internally
