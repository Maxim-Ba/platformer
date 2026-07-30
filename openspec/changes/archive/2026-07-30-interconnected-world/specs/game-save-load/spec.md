## MODIFIED Requirements

### Requirement: Game save domain model

The system MUST define a typed `GameSave` structure with version, `savedAt` timestamp, a `game` section for session/level context, and a `character` section for player progress snapshots.

#### Scenario: Save contains game context

- **WHEN** a game is saved
- **THEN** `game.levelId` MUST be present so Load can resume at the correct level

#### Scenario: Save contains current room for world playtest

- **WHEN** a game is saved during room-based gameplay
- **THEN** `game.currentRoomId` MUST be present with the active room id

#### Scenario: Save contains character snapshots

- **WHEN** a game is saved
- **THEN** `character` MUST include progression, inventory, and skills state serialized into the save payload

#### Scenario: Character section is extensible

- **WHEN** new character subsystems are added in future changes
- **THEN** they MUST be added as new optional fields under `character` without changing the top-level `ISavePort` contract

## ADDED Requirements

### Requirement: Load game restores current room

`LoadGame` MUST restore the saved room id for room-based worlds when present in the save payload.

#### Scenario: Restore saved room

- **WHEN** `LoadGame` restores a save containing `game.currentRoomId`
- **THEN** the result MUST include `currentRoomId` for `GameScene` to load that room

#### Scenario: Legacy save without room id

- **WHEN** `LoadGame` restores a save without `currentRoomId`
- **THEN** `GameScene` MUST fall back to `game.levelId` as the room to load
