# level-pipeline

## Purpose

Загрузка уровней из Tiled JSON: tilemap rendering, collision по custom properties, object layers (spawn, exit, hazard, checkpoint).

## Requirements

### Requirement: Tiled JSON level loading

Levels MUST be authored in Tiled, exported as JSON, and loaded at runtime through a level repository adapter.

#### Scenario: Load tilemap from public assets

- **WHEN** GameScene starts with a configured level id
- **THEN** TiledLevelRepository MUST load the corresponding JSON from `public/assets/maps/`

#### Scenario: Render tile layers

- **WHEN** level load succeeds
- **THEN** `ground` and `decor` tile layers MUST be rendered in documented draw order

### Requirement: Tile collision from custom properties

Solid tiles MUST be determined by Tiled custom property `solid: true` on tileset tiles.

#### Scenario: Player collides with solid ground

- **WHEN** player moves against tiles marked solid
- **THEN** physics adapter MUST prevent penetration using tilemap collision

#### Scenario: Decor passes through

- **WHEN** player overlaps non-solid decor tiles
- **THEN** no collision MUST block movement

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

### Requirement: Level definition port

Application layer MUST load levels through `ILevelRepository` returning domain `LevelDefinition` without Phaser types.

#### Scenario: Use case consumes domain level model

- **WHEN** LoadLevel use case executes
- **THEN** it MUST receive spawn points, exits, hazards, checkpoints, and enemy spawns as domain structures

### Requirement: Tiled project conventions

Tiled source files MUST live under `tiled/` with documented layer names, object types, and export path to `public/assets/maps/`.

#### Scenario: Contributor adds new level

- **WHEN** a developer authors `level-02.tmx`
- **THEN** export workflow MUST produce `public/assets/maps/level-02.json` following the same conventions as foundation levels
