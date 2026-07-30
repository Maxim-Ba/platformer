## ADDED Requirements

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
