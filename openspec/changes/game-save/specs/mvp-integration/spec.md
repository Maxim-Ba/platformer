## MODIFIED Requirements

### Requirement: End-to-end MVP loop

The MVP MUST support a complete session from main menu through level completion or game over, including New Game, Load, manual Save, and Settings flows.

#### Scenario: Full session from load

- **WHEN** player loads an existing save from LoadGameScene
- **THEN** GameScene MUST start at the saved level with restored progression, inventory, and skills

## ADDED Requirements

### Requirement: Manual save round trip

The MVP MUST support saving progress during gameplay and continuing from that save after reload.

#### Scenario: Save during level and continue

- **WHEN** player opens pause menu, selects Save, returns to main menu, and chooses Load
- **THEN** the loaded session MUST reflect the saved level and character state including skills changed before save
