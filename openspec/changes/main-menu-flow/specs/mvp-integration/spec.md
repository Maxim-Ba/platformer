## MODIFIED Requirements

### Requirement: End-to-end MVP loop

The MVP MUST support a complete session from main menu through level completion or game over, including New Game, Load, and Settings flows.

#### Scenario: Full session from new game

- **WHEN** player selects «Новая игра» from MainMenuScene
- **THEN** they MUST be able to reach level exit or GameOverScene through documented hazard and respawn flow

#### Scenario: Full session from load

- **WHEN** player loads an existing save from LoadGameScene
- **THEN** GameScene MUST start at the saved level with restored progression and inventory

#### Scenario: Settings round trip

- **WHEN** player opens Settings from main menu, changes a setting, and returns
- **THEN** the changed setting MUST persist after returning to MainMenuScene and after page reload

#### Scenario: Auto-save enables load

- **WHEN** player plays a session and returns to Main Menu via game over or level complete
- **THEN** «Загрузка» MUST offer the auto-saved progress for continuation
