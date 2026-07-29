## ADDED Requirements

### Requirement: Settings return context

SettingsScene MUST support a configurable return destination so it can be opened from both MainMenuScene and paused GameScene.

#### Scenario: Return to main menu by default

- **WHEN** SettingsScene is opened from MainMenuScene without explicit return context
- **THEN** pressing Escape MUST return to MainMenuScene

#### Scenario: Return to paused game from pause

- **WHEN** SettingsScene is opened from the in-game pause menu with return context pointing to GameScene
- **THEN** pressing Escape MUST close SettingsScene and resume paused GameScene without transitioning to MainMenuScene
