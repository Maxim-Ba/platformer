## MODIFIED Requirements

### Requirement: Game save domain model

The system MUST define a typed `GameSave` structure with version, `savedAt` timestamp, a `game` section for session/level context, and a `character` section for player progress snapshots.

#### Scenario: Save contains game context

- **WHEN** a game is saved
- **THEN** `game.levelId` MUST be present so Load can resume at the correct level

#### Scenario: Save contains character snapshots

- **WHEN** a game is saved
- **THEN** `character` MUST include progression, inventory, and skills state serialized into the save payload

#### Scenario: Character section is extensible

- **WHEN** new character subsystems are added in future changes
- **THEN** they MUST be added as new optional fields under `character` without changing the top-level `ISavePort` contract

### Requirement: Save persistence adapter

Default save adapter MUST persist one JSON document per slot at virtual path `saves/{slotId}.json` and MUST keep saves available across browser sessions.

#### Scenario: Save survives reload

- **WHEN** player saves a game and reloads the browser
- **THEN** the save MUST be available via `ISavePort.load()`

#### Scenario: JSON document format

- **WHEN** a save is written
- **THEN** the persisted payload MUST be valid JSON representing the `GameSave` schema

#### Scenario: Corrupt save fallback

- **WHEN** persisted save data cannot be parsed
- **THEN** `ISavePort.load()` MUST return null without crashing

#### Scenario: Legacy v1 save migration

- **WHEN** persisted data uses legacy flat `GameSave` version 1 format
- **THEN** the adapter MUST normalize it into the v2 `game` + `character` structure or return null if normalization fails

### Requirement: Save game use case

`SaveGame` use case MUST snapshot current `game` context and all supported `character` ports into the specified save slot.

#### Scenario: Persist current progress

- **WHEN** `SaveGame` is called with a valid slot id and level id
- **THEN** `ISavePort.save()` MUST be called with a complete `GameSave` payload including progression, inventory, and skills

### Requirement: Load game use case

`LoadGame` use case MUST restore progression, inventory, and skills from a save slot and return the saved level id.

#### Scenario: Restore saved progress

- **WHEN** `LoadGame` is called with a slot that contains valid save data
- **THEN** progression, inventory, and skills ports MUST be restored from the save
- **AND** the saved `game.levelId` MUST be returned

#### Scenario: Missing save

- **WHEN** `LoadGame` is called with a slot that has no valid save
- **THEN** the use case MUST return null without modifying current state

### Requirement: Port state restoration

`IProgressionPort`, `IInventoryPort`, and `ISkillsPort` MUST expose methods to restore state from serialized snapshots for load operations.

#### Scenario: Progression restore

- **WHEN** `LoadGame` restores a save
- **THEN** `IProgressionPort.restoreProgression()` MUST replace current progression with saved state

#### Scenario: Inventory restore

- **WHEN** `LoadGame` restores a save
- **THEN** `IInventoryPort.restoreInventory()` MUST replace current inventory with saved state

#### Scenario: Skills restore

- **WHEN** `LoadGame` restores a save
- **THEN** `ISkillsPort.restoreState()` MUST replace current skills with saved state

## ADDED Requirements

### Requirement: Manual save from gameplay

The game MUST allow the player to trigger an explicit save during an active level without leaving the level.

#### Scenario: Manual save persists slot

- **WHEN** player triggers manual save from the pause menu during GameScene
- **THEN** `SaveGame` MUST be called for the default save slot with the current level id and character snapshots

#### Scenario: Manual save feedback

- **WHEN** manual save completes successfully
- **THEN** the game MUST show brief non-blocking confirmation feedback while the pause menu remains open
