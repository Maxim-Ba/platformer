## ADDED Requirements

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
