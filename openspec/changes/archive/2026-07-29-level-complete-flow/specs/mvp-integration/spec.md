## MODIFIED Requirements

### Requirement: End-to-end MVP loop

The MVP MUST support a complete session from main menu through level completion or game over.

#### Scenario: Full session

- **WHEN** player starts from MainMenuScene
- **THEN** they MUST be able to reach level exit and see LevelCompleteScene, or reach GameOverScene through documented death flow

#### Scenario: Victory distinct from defeat

- **WHEN** player completes a level by reaching exit
- **THEN** they MUST NOT see the game over screen
