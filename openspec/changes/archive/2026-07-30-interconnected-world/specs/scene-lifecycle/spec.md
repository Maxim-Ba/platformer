## ADDED Requirements

### Requirement: In-scene room transition lifecycle

`GameScene` MUST support room-to-room transitions as an in-scene lifecycle distinct from scene transitions to LevelComplete or GameOver.

#### Scenario: Room transition preserves session

- **WHEN** player transitions from `room-a` to `room-b` via a door
- **THEN** `GameScene` MUST remain the active scene
- **AND** character progression and inventory ports MUST retain their current state

#### Scenario: Room transition does not open pause or menus

- **WHEN** `isTransitioning` is true during a door transition
- **THEN** pause menu and character menu MUST NOT open

#### Scenario: Shutdown cleans transition state

- **WHEN** `GameScene` shuts down during or after a room transition
- **THEN** transition listeners, fade callbacks, and room visuals MUST be destroyed without leaks
