# level-pipeline

## Purpose

Загрузка уровней из Tiled JSON: tilemap rendering, collision по custom properties, object layers (spawn, exit, hazard, checkpoint).

## Requirements

### Requirement: Tiled JSON level loading

Levels MUST be authored in Tiled, exported as JSON, and loaded at runtime through a level repository adapter. The adapter MUST fetch map JSON from the configured asset base URL plus `assets/maps/{levelId}.json` (empty base in local Vite, `/media/` in production).

#### Scenario: Load tilemap from public assets

- **WHEN** GameScene starts with a configured level id
- **THEN** TiledLevelRepository MUST load the corresponding JSON from `{assetBaseUrl}assets/maps/{levelId}.json`

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

### Requirement: Door object parsing

Tiled object layers MUST support `door` objects parsed into domain `DoorDefinition` entries on room definitions.

#### Scenario: Parse door with required properties

- **WHEN** level JSON contains object type `door` with properties `doorId`, `targetRoom`, `targetDoor`, and `facing`
- **THEN** parsed room definition MUST include a door entry with matching ids and transition targets

#### Scenario: Parse optional fade property

- **WHEN** `door` object includes `fadeMs` as integer
- **THEN** parsed door MUST include that fade duration

#### Scenario: Default fade when omitted

- **WHEN** `door` object omits `fadeMs`
- **THEN** parsed door MUST default `fadeMs` to 150

### Requirement: Room definition superset

`ILevelRepository` MUST support loading room maps that extend the level definition model with a `doors` collection while preserving existing spawn, hazard, checkpoint, and enemy fields.

#### Scenario: Room includes doors array

- **WHEN** a map contains one or more `door` objects
- **THEN** parsed `RoomDefinition` MUST expose `doors` as a readonly array alongside existing level fields

#### Scenario: Room without doors

- **WHEN** a legacy map such as `level-01` has no `door` objects
- **THEN** parser MUST return an empty `doors` array without error

### Requirement: Mock room Tiled sources

Interconnected world playtest rooms MUST have Tiled sources under `tiled/` with documented export paths to `public/assets/maps/`.

#### Scenario: Mock room sources exist

- **WHEN** interconnected-world change is applied
- **THEN** `tiled/room-a.tmx` and `tiled/room-b.tmx` MUST exist and export to `room-a.json` and `room-b.json`

### Requirement: Pre-runtime map validation

Contributors MUST run map validation after exporting Tiled JSON to `public/assets/maps/` when objects, doors, or world graph entries change.

#### Scenario: Validation after export

- **WHEN** a developer exports or edits `public/assets/maps/*.json`
- **THEN** they MUST run `npm run validate:maps` before considering the level ready for playtest

#### Scenario: Parser errors surfaced at validation time

- **WHEN** exported JSON is missing `player_spawn` or `objects` layer
- **THEN** `validate:maps` MUST surface the same class of errors as runtime `TiledLevelRepository.parseMap`

### Requirement: Door objects in level pipeline

Tiled JSON maps MAY include `door` objects; validation MUST verify door wiring when doors are present.

#### Scenario: Door properties parsed

- **WHEN** level JSON contains object type `door` with properties `doorId`, `targetRoom`, `targetDoor`, and `facing`
- **THEN** `TiledLevelRepository` MUST parse them into `RoomDefinition.doors` and `validate:maps` MUST verify targets
