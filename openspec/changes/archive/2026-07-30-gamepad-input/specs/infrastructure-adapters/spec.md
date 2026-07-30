## MODIFIED Requirements

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
