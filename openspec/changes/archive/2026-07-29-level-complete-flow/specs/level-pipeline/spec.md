## MODIFIED Requirements

### Requirement: Object layer spawning

Object layers MUST define typed spawn points parsed into domain-level level objects.

#### Scenario: Player spawn

- **WHEN** level contains object type `player_spawn`
- **THEN** player MUST initialize at that object's coordinates

#### Scenario: Level exit

- **WHEN** player overlaps object type `level_exit`
- **THEN** level complete flow MUST trigger via LevelCompleteScene

#### Scenario: Hazard placement

- **WHEN** level contains object type `hazard`
- **THEN** hazard zones MUST be instantiated and detect player overlap for damage

#### Scenario: Checkpoint placement

- **WHEN** level contains object type `checkpoint`
- **THEN** activating checkpoint MUST update respawn position for subsequent deaths
