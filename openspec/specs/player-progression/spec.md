# player-progression

## Purpose

Подсистема прогрессии игрока: порт `IProgressionPort`, domain rules (XP, level-up, unlocks), use case `AddExperience` и in-memory adapter как каркас.

## Requirements

### Requirement: Progression port interface

The player progression subsystem MUST expose an `IProgressionPort` interface in `src/application/ports/` for experience, levels, and unlocks.

#### Scenario: Consumer depends on abstraction

- **WHEN** gameplay awards experience or checks unlocked content
- **THEN** it MUST use `IProgressionPort`, not a concrete adapter

#### Scenario: Implementation is swappable

- **WHEN** progression storage changes (in-memory, localStorage, save file)
- **THEN** only composition root MUST be updated

### Requirement: Experience and leveling

Progression MUST track experience points and player level with domain rules for level-up thresholds.

#### Scenario: Experience gain

- **WHEN** `addExperience` is called with positive amount
- **THEN** experience total MUST increase and level MUST update when threshold is reached

#### Scenario: Level-up threshold

- **WHEN** accumulated experience meets or exceeds threshold for next level
- **THEN** player level MUST increment and excess experience MUST carry over per domain rules

### Requirement: Unlock registry

Progression MUST maintain a set of unlocked content identifiers.

#### Scenario: Unlock on level-up

- **WHEN** player reaches a configured level with associated unlock id
- **THEN** that unlock id MUST appear in `getUnlockedIds()`

#### Scenario: Query unlock status

- **WHEN** consumer checks whether content id is unlocked
- **THEN** port MUST return accurate unlock state without accessing adapter internals

### Requirement: Domain-driven progression rules

Level thresholds and XP calculations MUST be pure domain logic testable without Phaser.

#### Scenario: Unit test without runtime

- **WHEN** progression unit tests run
- **THEN** they MUST execute against domain/application code only
