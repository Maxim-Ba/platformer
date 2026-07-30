## ADDED Requirements

### Requirement: Unified enemy interface

All enemy instances on a level MUST conform to a single domain `Enemy` interface (or equivalent base type) shared by every enemy kind.

#### Scenario: Port returns common type

- **WHEN** a consumer calls `IEnemyPort.getEnemies()`
- **THEN** it MUST receive a homogeneous list of `Enemy` instances regardless of archetype

#### Scenario: Behaviors accept common type

- **WHEN** movement or attack behavior executes
- **THEN** it MUST accept `Enemy` state and resolved `EnemyArchetype` without type-specific subclasses

### Requirement: Data-driven enemy extensibility

Adding a new enemy kind MUST require only catalog and behavior registration changes, not modifications to gameplay consumers.

#### Scenario: New type without consumer edits

- **WHEN** a developer adds a new `EnemyTypeId` entry to the archetype catalog and registers required behaviors
- **THEN** `GameScene`, `UpdateEnemies`, `ExecuteMeleeAttack`, and `IEnemyPort` method signatures MUST remain unchanged

#### Scenario: New type spawns from Tiled

- **WHEN** level JSON contains `enemy_spawn` with the new `enemyType` value
- **THEN** the enemy MUST spawn as `Enemy` using catalog stats and behaviors without special-case code for that type in use cases

### Requirement: Enemy archetype catalog

The domain layer MUST define a catalog of `EnemyArchetype` entries keyed by `EnemyTypeId` with combat stats, hitbox dimensions, movement behavior id, attack behavior id, kill XP, and presentation sprite key.

#### Scenario: Resolve archetype by type id

- **WHEN** an enemy spawn specifies `enemyType` `grunt`
- **THEN** the system MUST resolve stats from the archetype catalog without hardcoding values in use cases

#### Scenario: Unknown type fallback

- **WHEN** spawn specifies an unknown `enemyType`
- **THEN** the system MUST fall back to `grunt` archetype and emit a developer-visible warning

### Requirement: Per-archetype hitbox dimensions

Each archetype MUST define width and height used for player contact, melee hit detection, and presentation sync.

#### Scenario: Flyer smaller hitbox

- **WHEN** a `flyer` enemy exists on the level
- **THEN** its AABB MUST use flyer archetype dimensions, not grunt defaults

#### Scenario: Grunt larger hitbox

- **WHEN** a `grunt` enemy overlaps the player
- **THEN** contact detection MUST use grunt archetype width and height

### Requirement: Per-archetype HP and rewards

Enemy max HP and kill XP MUST come from the resolved archetype.

#### Scenario: Grunt survives first hit

- **WHEN** player melee attack deals 1 damage to a `grunt` with 2 max HP
- **THEN** the grunt MUST remain alive with 1 HP

#### Scenario: Kill XP from archetype

- **WHEN** an enemy is killed
- **THEN** experience awarded MUST equal the killed enemy archetype `killXp` value via `IProgressionPort` when available

### Requirement: Archetype-driven spawn

`IEnemyPort.spawnEnemies` MUST initialize each enemy from `EnemySpawn.enemyType` and archetype defaults, applying optional spawn overrides.

#### Scenario: Spawn with type and patrol override

- **WHEN** `EnemySpawn` has `enemyType` `flyer` and `patrolDistance` 200
- **THEN** spawned enemy MUST use flyer archetype with patrol bounds spawn X ± 200

#### Scenario: Spawn without patrol override

- **WHEN** `EnemySpawn` omits `patrolDistance`
- **THEN** patrol bounds MUST use archetype-specific documented default
