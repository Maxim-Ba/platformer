## ADDED Requirements

### Requirement: Gamepad connection

The game MUST detect and use the first connected gamepad (player index 0) without requiring user configuration.

#### Scenario: Pad connected at startup

- **WHEN** a compatible gamepad is connected before GameScene starts
- **THEN** gamepad input MUST be available on the first gameplay frame

#### Scenario: Hot-plug pad

- **WHEN** player connects a gamepad after the game has started
- **THEN** the game MUST begin accepting gamepad input without reloading the page

#### Scenario: No pad connected

- **WHEN** no gamepad is connected
- **THEN** keyboard-only controls MUST continue to work unchanged

### Requirement: Gamepad gameplay controls

During active gameplay in GameScene, the gamepad MUST support movement, jump, pause, and character menu actions using the documented button map.

#### Scenario: Stick movement

- **WHEN** player holds left stick or D-pad horizontally beyond the documented dead-zone threshold
- **THEN** horizontal movement MUST match keyboard left/right input

#### Scenario: Jump

- **WHEN** player presses the documented jump button (A / button 0)
- **THEN** jump MUST trigger with the same semantics as Space (once per press)

#### Scenario: Pause

- **WHEN** player presses the documented pause button (Start / button 9) during gameplay
- **THEN** the game MUST open or close the pause menu using the same rules as Escape

#### Scenario: Character menu toggle

- **WHEN** player presses the documented character menu button (Back / View / button 8)
- **THEN** character menu MUST toggle open/closed with gameplay frozen per character-menu rules

#### Scenario: Character menu tab cycle

- **WHEN** character menu is open and player presses LB or RB (buttons 4 and 5)
- **THEN** active tab MUST change to the previous or next tab with wrap-around

### Requirement: Gamepad menu navigation

All interactive menu screens MUST support gamepad navigation equivalent to keyboard navigation.

#### Scenario: Vertical menu navigation

- **WHEN** a menu using MenuList (or equivalent) is visible
- **THEN** player MUST move selection with D-pad Up/Down

#### Scenario: Confirm menu item

- **WHEN** a menu item is highlighted
- **THEN** pressing A (button 0) MUST invoke the same action as Enter or Space

#### Scenario: Cancel or go back

- **WHEN** a menu or overlay supports Escape to close or go back
- **THEN** pressing B (button 1) MUST perform the same back/close action

#### Scenario: Horizontal tab navigation

- **WHEN** character menu is open
- **THEN** D-pad Left/Right MUST switch tabs with the same behavior as keyboard Arrow Left/Right

### Requirement: Composite input port

`IInputPort` implementations used in production MUST aggregate keyboard and gamepad sources so use cases remain unaware of input device.

#### Scenario: Either device triggers action

- **WHEN** jump is bound to Space and gamepad A
- **THEN** `isJumpPressed()` MUST return true when either input is pressed on the current frame

#### Scenario: Use case isolation

- **WHEN** `UpdatePlayerMovement` consumes `InputSnapshot`
- **THEN** it MUST NOT reference Phaser gamepad types directly

### Requirement: Documented button map

The project MUST define a single shared button map module used by infrastructure and presentation layers.

#### Scenario: Central bindings

- **WHEN** a developer changes gamepad mapping
- **THEN** they MUST update only the shared bindings module and README controls section
