## ADDED Requirements

### Requirement: Save port interface

The game MUST expose an `ISavePort` interface in `src/application/ports/` for persisting and loading game progress.

#### Scenario: Consumer depends on abstraction

- **WHEN** a module needs to save or load game state
- **THEN** it MUST use `ISavePort`, not localStorage or concrete adapter directly

#### Scenario: Implementation is swappable

- **WHEN** save storage backend changes (localStorage, file, cloud)
- **THEN** only the composition root binding MUST change

### Requirement: Game save domain model

The system MUST define a typed `GameSave` structure containing at minimum: version, levelId, savedAt timestamp, progression state, and inventory state.

#### Scenario: Save contains level context

- **WHEN** a game is saved
- **THEN** the save data MUST include the current `levelId` so Load can resume at the correct level

#### Scenario: Save contains feature module state

- **WHEN** a game is saved
- **THEN** progression and inventory state MUST be serialized into the save payload

### Requirement: Save persistence adapter

Default save adapter MUST persist game saves across browser sessions using localStorage.

#### Scenario: Save survives reload

- **WHEN** player saves a game and reloads the browser
- **THEN** the save MUST be available via `ISavePort.load()`

#### Scenario: Corrupt save fallback

- **WHEN** persisted save data cannot be parsed
- **THEN** `ISavePort.load()` MUST return null without crashing

### Requirement: Start new game use case

`StartNewGame` use case MUST reset runtime progression and inventory to initial state and return the default starting level id.

#### Scenario: Fresh game state

- **WHEN** `StartNewGame` is executed
- **THEN** progression and inventory ports MUST be reset to documented defaults
- **AND** the result MUST include `DEFAULT_LEVEL_ID`

### Requirement: Save game use case

`SaveGame` use case MUST snapshot current progression, inventory, and level id into the specified save slot.

#### Scenario: Persist current progress

- **WHEN** `SaveGame` is called with a valid slot id and level id
- **THEN** `ISavePort.save()` MUST be called with a complete `GameSave` payload

### Requirement: Load game use case

`LoadGame` use case MUST restore progression and inventory from a save slot and return the saved level id.

#### Scenario: Restore saved progress

- **WHEN** `LoadGame` is called with a slot that contains valid save data
- **THEN** progression and inventory ports MUST be restored from the save
- **AND** the saved `levelId` MUST be returned

#### Scenario: Missing save

- **WHEN** `LoadGame` is called with a slot that has no valid save
- **THEN** the use case MUST return null without modifying current state

### Requirement: List save slots use case

`ListSaveSlots` use case MUST return metadata for all available save slots.

#### Scenario: Empty slots

- **WHEN** no saves exist
- **THEN** `ListSaveSlots` MUST return an empty array

#### Scenario: Existing save metadata

- **WHEN** a save exists in a slot
- **THEN** `ListSaveSlots` MUST return slot id, level id, and savedAt timestamp

### Requirement: Port state restoration

`IProgressionPort` and `IInventoryPort` MUST expose methods to restore state from serialized snapshots for load operations.

#### Scenario: Progression restore

- **WHEN** `LoadGame` restores a save
- **THEN** `IProgressionPort.restoreProgression()` MUST replace current progression with saved state

#### Scenario: Inventory restore

- **WHEN** `LoadGame` restores a save
- **THEN** `IInventoryPort.restoreInventory()` MUST replace current inventory with saved state

### Requirement: Auto-save on menu return

When player returns to MainMenuScene from GameOverScene or LevelCompleteScene, the game MUST auto-save current progress to the default save slot.

#### Scenario: Auto-save before menu

- **WHEN** player navigates to Main Menu from game over or level complete screens
- **THEN** `SaveGame` MUST be called for the default slot before scene transition
