## ADDED Requirements

### Requirement: In-game HUD during gameplay

The MVP gameplay session MUST display a modular HUD with player resources and score while GameScene is active.

#### Scenario: HUD visible during level

- **WHEN** player is playing a level in GameScene
- **THEN** HUD MUST show HP, Mana, Energy (bottom-left) and score (top-right) alongside control hints

#### Scenario: HUD hidden outside gameplay

- **WHEN** player is on MainMenuScene, GameOverScene, or LevelCompleteScene
- **THEN** in-game HUD widgets MUST NOT be present
