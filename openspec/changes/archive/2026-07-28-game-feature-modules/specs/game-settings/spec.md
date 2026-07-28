## ADDED Requirements

### Requirement: Settings port interface

The game settings subsystem MUST expose an `ISettingsPort` interface in `src/application/ports/` for reading and updating player preferences.

#### Scenario: Consumer depends on abstraction

- **WHEN** a module needs audio volume, video options, key bindings, or cosmetic skin id
- **THEN** it MUST read settings via `ISettingsPort`, not from localStorage or concrete adapter directly

#### Scenario: Implementation is swappable

- **WHEN** settings storage backend changes (localStorage, file, cloud)
- **THEN** only the composition root binding MUST change

### Requirement: Extensible settings schema

Settings MUST support categories: audio, video, controls, and cosmetics (skins), each with typed fields.

#### Scenario: Audio settings

- **WHEN** settings are loaded
- **THEN** audio category MUST include master, music, and sfx volume values in range 0–1

#### Scenario: Video settings

- **WHEN** settings are loaded
- **THEN** video category MUST include at least a fullscreen boolean flag

#### Scenario: Control bindings

- **WHEN** settings are loaded
- **THEN** controls category MUST include a key-bindings map for documented actions (move, jump)

#### Scenario: Cosmetic skin selection

- **WHEN** settings are loaded
- **THEN** cosmetics category MUST include a `playerSkinId` string

### Requirement: Settings persistence

Default settings adapter MUST persist settings across browser sessions.

#### Scenario: Settings survive reload

- **WHEN** player updates settings and reloads the page
- **THEN** previously saved settings MUST be restored

#### Scenario: Corrupt storage fallback

- **WHEN** persisted settings cannot be parsed
- **THEN** system MUST fall back to documented defaults without crashing

### Requirement: Partial settings update

Consumers MUST be able to update a subset of settings without overwriting unrelated fields.

#### Scenario: Patch update

- **WHEN** `updateSettings` is called with a partial patch (e.g. only master volume)
- **THEN** only specified fields MUST change; other settings MUST remain unchanged
