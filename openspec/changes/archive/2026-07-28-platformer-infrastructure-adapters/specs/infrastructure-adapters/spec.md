## ADDED Requirements

### Requirement: Phaser input adapter

Infrastructure MUST provide `PhaserInputAdapter` implementing `IInputPort` for keyboard controls.

#### Scenario: Keyboard movement

- **WHEN** player holds arrow keys or A/D
- **THEN** input adapter MUST report horizontal direction to consumers

#### Scenario: Keyboard jump

- **WHEN** player presses Space or configured jump key
- **THEN** input adapter MUST report jump pressed for the current frame

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
