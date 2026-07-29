## ADDED Requirements

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

### Requirement: Settings scene uses application dependencies

SettingsScene MUST access `ISettingsPort` and `UpdateSettings` via `AppDependencies` from scene registry.

#### Scenario: No direct adapter usage

- **WHEN** SettingsScene reads or updates settings
- **THEN** it MUST use registry-provided `settingsPort` and `updateSettings`, not concrete adapters
