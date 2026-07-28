## MODIFIED Requirements

### Requirement: Placeholder player visuals

The MVP MUST display a visible player representation (sprite or placeholder) synced to movement state.

#### Scenario: Player visible on level

- **WHEN** GameScene is running
- **THEN** a player sprite or equivalent MUST be visible and track movement state

#### Scenario: Animated movement feedback

- **WHEN** player moves, jumps, or falls
- **THEN** player sprite MUST display distinct frame animations for idle, run, jump, and fall states
