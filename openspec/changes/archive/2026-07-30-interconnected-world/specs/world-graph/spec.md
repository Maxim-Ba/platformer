## ADDED Requirements

### Requirement: World entry room configuration

The game MUST define a documented entry `roomId` for starting a room-based world playtest.

#### Scenario: Entry room constant

- **WHEN** world playtest mode is enabled
- **THEN** `WORLD_ENTRY_ROOM_ID` MUST be defined in game constants with value `room-a`

#### Scenario: New game starts entry room

- **WHEN** player starts a new game with world playtest enabled
- **THEN** `GameScene` MUST load `WORLD_ENTRY_ROOM_ID` as the initial room

### Requirement: World graph registry

The game MUST maintain a world graph registry listing known room ids for the interconnected world slice.

#### Scenario: Known rooms listed

- **WHEN** world graph config is read
- **THEN** it MUST include entries for `room-a` and `room-b`

#### Scenario: Graph does not duplicate door wiring

- **WHEN** door connectivity is resolved at runtime
- **THEN** `targetRoom` and `targetDoor` MUST come from Tiled door properties, not from duplicated edges in the graph config for v1

### Requirement: Room id equals map asset id

Each room in the world graph MUST map one-to-one to a Tiled JSON file `public/assets/maps/{roomId}.json`.

#### Scenario: Load room by id

- **WHEN** `ILevelRepository.load('room-b')` is called
- **THEN** adapter MUST fetch `public/assets/maps/room-b.json`

#### Scenario: Mock room assets exist

- **WHEN** interconnected-world change is applied
- **THEN** `room-a.json` and `room-b.json` MUST exist under `public/assets/maps/`
