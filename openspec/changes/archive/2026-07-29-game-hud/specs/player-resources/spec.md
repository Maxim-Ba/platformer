## ADDED Requirements

### Requirement: Mana port interface

The player mana subsystem MUST expose an `IManaPort` interface in `src/application/ports/` for mana state read access.

#### Scenario: Consumer depends on abstraction

- **WHEN** a scene or HUD widget needs mana state
- **THEN** it MUST depend on `IManaPort`, not a concrete adapter class

#### Scenario: Implementation is swappable

- **WHEN** a new mana adapter is introduced
- **THEN** only the composition root MUST change

### Requirement: Energy port interface

The player energy subsystem MUST expose an `IEnergyPort` interface in `src/application/ports/` for energy state read access.

#### Scenario: Consumer depends on abstraction

- **WHEN** a scene or HUD widget needs energy state
- **THEN** it MUST depend on `IEnergyPort`, not a concrete adapter class

#### Scenario: Implementation is swappable

- **WHEN** a new energy adapter is introduced
- **THEN** only the composition root MUST change

### Requirement: Mana and energy domain state

Mana and energy MUST be represented as value objects with `current` and `max` numeric fields, testable without Phaser.

#### Scenario: Initial values

- **WHEN** mana or energy port is reset for a new level session
- **THEN** current MUST equal configured max per domain constants

### Requirement: In-memory adapters

Mana and energy MUST have in-memory adapter implementations suitable for session-scoped display.

#### Scenario: Read current state

- **WHEN** HUD calls `getMana()` or `getEnergy()`
- **THEN** adapter MUST return current `ManaState` or `EnergyState` without side effects

### Requirement: Composition root binding

Mana and energy ports MUST be wired in composition root and made available to GameScene HUD dependencies.

#### Scenario: Per-scene reset

- **WHEN** a new GameScene level session starts
- **THEN** mana and energy ports MUST reset to initial values
