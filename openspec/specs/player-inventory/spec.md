# player-inventory

## Purpose

Подсистема инвентаря игрока: порт `IInventoryPort`, domain entities/rules (слоты, стакинг), use cases `AddItem`/`RemoveItem`/`UseItem` и in-memory adapter как каркас.

## Requirements

### Requirement: Inventory port interface

The player inventory subsystem MUST expose an `IInventoryPort` interface in `src/application/ports/` for item management.

#### Scenario: Consumer depends on abstraction

- **WHEN** gameplay adds, removes, or uses items
- **THEN** it MUST use `IInventoryPort`, not a concrete adapter

#### Scenario: Implementation is swappable

- **WHEN** inventory backend changes (in-memory, persisted, server-synced)
- **THEN** only composition root MUST be updated

### Requirement: Fixed-slot inventory model

Inventory MUST use a fixed maximum slot count with typed items.

#### Scenario: Add item to inventory

- **WHEN** `addItem` is called and free slot or stack space exists
- **THEN** item MUST be stored and inventory state MUST reflect the addition

#### Scenario: Inventory full

- **WHEN** `addItem` is called and no slot or stack space is available
- **THEN** operation MUST fail gracefully without corrupting existing items

#### Scenario: Remove item

- **WHEN** `removeItem` is called with valid item id
- **THEN** item MUST be removed and slot freed

### Requirement: Item entity model

Items MUST be represented as domain entities with id, type, quantity, and optional metadata.

#### Scenario: Stackable items

- **WHEN** adding an item of the same type as an existing stack with room
- **THEN** quantity MUST increase in the existing slot instead of occupying a new slot

### Requirement: Domain-driven inventory rules

Slot limits, stacking, and validation MUST be pure domain logic testable without Phaser.

#### Scenario: Unit test without runtime

- **WHEN** inventory unit tests run
- **THEN** they MUST execute against domain/application code only
