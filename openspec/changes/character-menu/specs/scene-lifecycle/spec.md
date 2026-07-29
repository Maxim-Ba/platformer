## ADDED Requirements

### Requirement: Character menu overlay lifecycle

GameScene MUST support opening and closing a character menu overlay without scene transition.

#### Scenario: Overlay does not change scene

- **WHEN** player opens or closes the character menu during gameplay
- **THEN** GameScene MUST remain the active scene and MUST NOT transition to another scene

#### Scenario: Overlay cleanup on shutdown

- **WHEN** GameScene shuts down while character menu is open
- **THEN** overlay game objects and input listeners MUST be destroyed without leaks
