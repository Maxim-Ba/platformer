## ADDED Requirements

### Requirement: Enemy type property on spawn

Tiled `enemy_spawn` objects MUST support required custom property `enemyType` parsed into domain `EnemySpawn.enemyType`.

#### Scenario: Parse enemy type

- **WHEN** level JSON contains `enemy_spawn` with `enemyType` `caster`
- **THEN** `LevelDefinition` enemy spawn entry MUST include `enemyType` `caster`

#### Scenario: Missing enemy type defaults

- **WHEN** `enemy_spawn` omits `enemyType` for backward compatibility
- **THEN** parser MUST default to `grunt` and preserve spawn position and id

### Requirement: Playtest enemy variety on foundation level

Foundation playtest level MUST include at least one spawn per supported enemy type for manual verification.

#### Scenario: Level-01 enemy variety

- **WHEN** `level-01` is loaded after this change
- **THEN** it MUST contain `enemy_spawn` objects for `grunt`, `flyer`, and `caster` types
