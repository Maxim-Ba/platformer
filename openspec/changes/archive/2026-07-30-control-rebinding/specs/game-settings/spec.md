## MODIFIED Requirements

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
- **THEN** controls category MUST include a key-bindings map keyed by documented `InputActionId` values with `KeyboardEvent.code` string or string array per action

#### Scenario: Gamepad bindings placeholder

- **WHEN** settings are loaded
- **THEN** controls category MAY include an optional `gamepadBindings` map for future gamepad assignment without requiring UI in this change

#### Scenario: Cosmetic skin selection

- **WHEN** settings are loaded
- **THEN** cosmetics category MUST include a `playerSkinId` string

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

#### Scenario: Rebind controls

- **WHEN** player changes a key binding in the controls subsection of SettingsScene
- **THEN** `UpdateSettings` MUST persist the change to `controls.keyBindings` via `ISettingsPort`

#### Scenario: Return to main menu

- **WHEN** player presses Escape in SettingsScene
- **THEN** the game MUST transition back to MainMenuScene without losing saved settings changes
