## ADDED Requirements

### Requirement: Character menu in gameplay session

The MVP gameplay session MUST allow the player to open the character menu during an active level without ending the session.

#### Scenario: Menu accessible mid-level

- **WHEN** player is playing a level in GameScene
- **THEN** they MUST be able to open the character menu via tab hotkeys and return to gameplay by closing it

#### Scenario: Session continues after menu close

- **WHEN** player closes the character menu
- **THEN** they MUST resume the same level session at the same game state (position, checkpoints, resources)
