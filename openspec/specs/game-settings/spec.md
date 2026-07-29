# game-settings

## Purpose

Подсистема настроек игрока: порт `ISettingsPort`, типизированная схема (audio, video, controls, cosmetics), персистентность и use case для частичных обновлений.

## Requirements

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

### Requirement: Settings UI scene

The game MUST provide a SettingsScene that allows the player to view and modify settings through `ISettingsPort` and `UpdateSettings` use case.

#### Scenario: Open settings from menu

- **WHEN** player opens SettingsScene from MainMenuScene
- **THEN** current settings MUST be loaded via `ISettingsPort.getSettings()`

#### Scenario: Adjust audio volume

- **WHEN** player changes master, music, or sfx volume in SettingsScene
- **THEN** `UpdateSettings` MUST persist the change via `ISettingsPort`

#### Scenario: Toggle fullscreen

- **WHEN** player toggles fullscreen in SettingsScene
- **THEN** the game MUST apply fullscreen mode and persist the `video.fullscreen` setting

#### Scenario: Return to main menu

- **WHEN** player presses Escape in SettingsScene
- **THEN** the game MUST transition back to MainMenuScene without losing saved settings changes

### Requirement: Settings return context

SettingsScene MUST support a configurable return destination so it can be opened from both MainMenuScene and paused GameScene.

#### Scenario: Return to main menu by default

- **WHEN** SettingsScene is opened from MainMenuScene without explicit return context
- **THEN** pressing Escape MUST return to MainMenuScene

#### Scenario: Return to paused game from pause

- **WHEN** SettingsScene is opened from the in-game pause menu with return context pointing to GameScene
- **THEN** pressing Escape MUST close SettingsScene and resume paused GameScene without transitioning to MainMenuScene

### Requirement: Settings scene uses application dependencies

SettingsScene MUST access `ISettingsPort` and `UpdateSettings` via `AppDependencies` from scene registry.

#### Scenario: No direct adapter usage

- **WHEN** SettingsScene reads or updates settings
- **THEN** it MUST use registry-provided `settingsPort` and `updateSettings`, not concrete adapters
