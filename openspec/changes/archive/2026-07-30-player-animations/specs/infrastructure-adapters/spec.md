## MODIFIED Requirements

### Requirement: Player presentation sprite

Presentation layer MUST provide `PlayerSprite` that reflects domain/use-case player state without embedding movement rules.

#### Scenario: Sprite sync from state

- **WHEN** UpdatePlayerMovement produces updated PlayerState
- **THEN** PlayerSprite MUST update its visual position and facing from that state

#### Scenario: Animation playback from state

- **WHEN** PlayerSprite syncs from PlayerState
- **THEN** it MUST play the resolved frame animation (idle, run, jump, fall) instead of placeholder scale or tint effects
