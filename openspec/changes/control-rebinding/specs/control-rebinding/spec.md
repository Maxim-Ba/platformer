## ADDED Requirements

### Requirement: Input action catalog

The game MUST define a documented catalog of rebindable gameplay actions with stable string identifiers (`InputActionId`) in the domain layer.

#### Scenario: Catalog includes core gameplay actions

- **WHEN** control rebinding is initialized
- **THEN** the catalog MUST include at minimum: `moveLeft`, `moveRight`, `jump`, `dash`, `attack`, and `pause`

#### Scenario: Catalog includes character menu hotkeys

- **WHEN** control rebinding is initialized
- **THEN** the catalog MUST include character menu tab actions: `charMenuInventory`, `charMenuSkills`, `charMenuStats`, `charMenuUpgrades`, and `charMenuMap`

### Requirement: Controls settings screen

SettingsScene MUST provide a dedicated controls subsection reachable from the main settings list.

#### Scenario: Open controls from main menu settings

- **WHEN** player opens SettingsScene from MainMenuScene and selects the controls entry
- **THEN** the game MUST show a list of rebindable actions with human-readable labels and current key assignments

#### Scenario: Open controls from pause settings

- **WHEN** player opens SettingsScene from the in-game pause menu and selects the controls entry
- **THEN** the same controls subsection MUST be available and MUST preserve pause return context when exiting settings

### Requirement: Key capture rebinding flow

The controls subsection MUST allow the player to reassign keyboard bindings per action.

#### Scenario: Enter listen mode

- **WHEN** player confirms a rebindable action row
- **THEN** the UI MUST enter listen mode and prompt the player to press a key

#### Scenario: Assign captured key

- **WHEN** player presses a keyboard key in listen mode (other than Escape)
- **THEN** `UpdateSettings` MUST persist the new `KeyboardEvent.code` for that action via `controls.keyBindings`

#### Scenario: Cancel listen mode

- **WHEN** player presses Escape in listen mode
- **THEN** the assignment MUST be cancelled and the previous binding MUST remain unchanged

### Requirement: Reset controls to defaults

The controls subsection MUST allow restoring default keyboard bindings.

#### Scenario: Reset all bindings

- **WHEN** player selects reset-to-defaults in the controls subsection
- **THEN** all `controls.keyBindings` MUST be restored to documented defaults and persisted

### Requirement: Binding uniqueness validation

The system MUST reject keyboard bindings that assign the same key code to multiple gameplay actions.

#### Scenario: Duplicate key rejected

- **WHEN** player assigns a key code already bound to another action
- **THEN** the update MUST NOT be persisted and the UI MUST indicate the conflict

### Requirement: Gamepad binding schema placeholder

Settings schema MUST reserve optional `controls.gamepadBindings` for future gamepad rebinding without breaking persisted saves.

#### Scenario: Gamepad field preserved on patch

- **WHEN** settings are updated with a partial patch that does not include `gamepadBindings`
- **THEN** any existing `gamepadBindings` value MUST remain unchanged

#### Scenario: No gamepad rebinding UI in v1

- **WHEN** player opens the controls subsection
- **THEN** the UI MUST NOT expose gamepad button assignment in this change
