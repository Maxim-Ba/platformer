# map-validation

## Purpose

Build-time проверка Tiled JSON в `public/assets/maps/`: parse, двери, world graph, слои и тайлсеты. Команда `npm run validate:maps` с ненулевым exit code при errors.

## Requirements

### Requirement: Build-time map validation command

The project MUST provide a documented CLI command that validates all Tiled JSON maps under `public/assets/maps/` before runtime.

#### Scenario: Validate all maps

- **WHEN** developer runs `npm run validate:maps`
- **THEN** the command MUST parse every `*.json` file in `public/assets/maps/` via `TiledLevelRepository.parseMap`

#### Scenario: Exit code on validation errors

- **WHEN** any map fails a validation rule marked as error
- **THEN** the command MUST exit with non-zero status code

#### Scenario: Warnings do not fail build

- **WHEN** only warning-level issues are found (e.g. missing reverse door pair)
- **THEN** the command MUST exit with code zero and print warnings to stdout

### Requirement: Door id uniqueness per room

Each room map MUST have unique `doorId` values among its `door` objects.

#### Scenario: Duplicate door id fails

- **WHEN** a room JSON contains two `door` objects with the same `doorId` property
- **THEN** validation MUST report an error naming the room and duplicate id

#### Scenario: Unique door ids pass

- **WHEN** all door ids within a room are distinct
- **THEN** validation MUST NOT report a duplicate-id error for that room

### Requirement: Door target room and door resolution

Every `door` object MUST reference an existing target map and door id on that map.

#### Scenario: Missing target room file

- **WHEN** a door's `targetRoom` property does not match any `public/assets/maps/{targetRoom}.json`
- **THEN** validation MUST report an error

#### Scenario: Missing target door on target room

- **WHEN** `targetRoom.json` exists but contains no `door` with `doorId` equal to `targetDoor`
- **THEN** validation MUST report an error naming source room, source door, target room, and target door id

#### Scenario: Valid door link passes

- **WHEN** `room-a` door `to-b` references `room-b` and door `from-a` exists on `room-b.json`
- **THEN** validation MUST NOT report target resolution errors for that link

### Requirement: Optional bidirectional door pairing warning

Validation SHOULD warn when a door transition lacks a reverse door link.

#### Scenario: One-way door warns

- **WHEN** room A has door to room B but room B has no door pointing back to A with paired ids
- **THEN** validation MUST emit a warning (not error) describing the asymmetric link

#### Scenario: Bidirectional pair silent

- **WHEN** `room-a.to-b` ↔ `room-b.from-a` and `room-b.from-a` ↔ `room-a.to-b` are correctly paired
- **THEN** validation MUST NOT emit a pairing warning for those doors

### Requirement: Required layers and tileset names

Every map JSON MUST contain layers and tilesets required by `GameScene` rendering.

#### Scenario: Required layers present

- **WHEN** map JSON is validated
- **THEN** it MUST contain tile layers named `ground` and `decor` and object layer named `objects`

#### Scenario: Required tileset names

- **WHEN** map JSON is validated
- **THEN** its `tilesets` MUST include entries named `platformer` and `beast_soldier`

#### Scenario: Missing layer fails

- **WHEN** a map JSON omits the `decor` layer
- **THEN** validation MUST report an error

### Requirement: World graph asset consistency

`WORLD_GRAPH` and `WORLD_ENTRY_ROOM_ID` MUST reference maps that exist on disk.

#### Scenario: Graph room missing file

- **WHEN** `WORLD_GRAPH` lists room id `room-x` but `public/assets/maps/room-x.json` does not exist
- **THEN** validation MUST report an error

#### Scenario: Entry room missing file

- **WHEN** `WORLD_ENTRY_ROOM_ID` is set to a room id with no corresponding JSON file
- **THEN** validation MUST report an error

#### Scenario: Orphan room file warns

- **WHEN** a map file exists for a room-based world (e.g. `room-c.json`) but that id is not listed in `WORLD_GRAPH`
- **THEN** validation MAY emit a warning (not error)

#### Scenario: Legacy level outside graph passes

- **WHEN** `level-01.json` exists but is not listed in `WORLD_GRAPH`
- **THEN** validation MUST NOT report an error solely for that omission
