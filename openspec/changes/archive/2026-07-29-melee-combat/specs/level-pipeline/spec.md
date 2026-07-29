## ADDED Requirements

### Requirement: Enemy spawn objects

Tiled object layers MUST support `enemy_spawn` objects parsed into domain level definitions.

#### Scenario: Parse enemy spawn

- **WHEN** level JSON contains object type `enemy_spawn`
- **THEN** `LevelDefinition` MUST include enemy spawn entries with position and id

#### Scenario: Optional patrol distance property

- **WHEN** `enemy_spawn` object has custom property `patrolDistance`
- **THEN** parsed spawn MUST include that value; otherwise documented default MUST apply

#### Scenario: Spawn enemies at level start

- **WHEN** GameScene loads a level with enemy spawns
- **THEN** enemies MUST be instantiated at parsed coordinates via `IEnemyPort`
