## ADDED Requirements

### Requirement: Door domain model

The system MUST define a `DoorDefinition` domain type with stable `id`, trigger bounds, `targetRoom`, `targetDoor`, `facing`, and `fadeMs` parsed from Tiled without Phaser types.

#### Scenario: Door includes transition targets

- **WHEN** a room is parsed from Tiled JSON
- **THEN** each `door` object MUST produce a `DoorDefinition` with `targetRoom` and `targetDoor` string ids

#### Scenario: Door includes fade configuration

- **WHEN** a `door` object omits `fadeMs`
- **THEN** parser MUST default `fadeMs` to 150

### Requirement: Room transition rules

Room transition spawn resolution MUST be implemented as pure domain rules in `RoomTransitionRules` without infrastructure dependencies.

#### Scenario: Resolve entry at target door

- **WHEN** `resolveEntryPosition` is called with a target room containing `doorId` `from-a`
- **THEN** rules MUST return player entry position at that door using the same feet-position convention as `player_spawn`

#### Scenario: Missing target door fails

- **WHEN** `targetDoor` does not exist on the target room
- **THEN** rules MUST return a documented error and MUST NOT produce a transition plan

### Requirement: TransitionThroughDoor use case

The application layer MUST provide `TransitionThroughDoor` that loads the target room, validates the door pair, and returns a transition plan for presentation to execute.

#### Scenario: Successful transition plan

- **WHEN** player triggers door `to-b` in `room-a` and target room `room-b` contains door `from-a`
- **THEN** use case MUST return `targetRoomId`, `entryPosition`, `facing`, and `fadeMs` without mutating presentation state

#### Scenario: Use case does not import Phaser

- **WHEN** `TransitionThroughDoor` is imported in unit tests
- **THEN** it MUST NOT transitively require Phaser modules

### Requirement: In-scene room swap

`GameScene` MUST perform room transitions by swapping room content inside the active scene session without restarting `GameScene`.

#### Scenario: No scene restart on door

- **WHEN** player overlaps a `door` trigger
- **THEN** game MUST NOT call `scene.start(GameScene)` or `scene.restart()` for the transition

#### Scenario: Fade wraps swap

- **WHEN** room transition begins
- **THEN** camera MUST fade out for `fadeMs`, swap room content, reposition player, update camera bounds, then fade in

#### Scenario: Transition guard blocks gameplay

- **WHEN** `isTransitioning` is true
- **THEN** player input, damage, and additional door triggers MUST be ignored until fade-in completes

### Requirement: Room teardown on transition

Presentation MUST destroy previous room content before loading the next room.

#### Scenario: Teardown entities

- **WHEN** room swap executes
- **THEN** tilemap layers, enemy sprites, hazard zones, and projectile visuals from the previous room MUST be destroyed

#### Scenario: Port reset for new room

- **WHEN** room swap executes
- **THEN** `IEnemyPort` and room-scoped runtime state MUST reset before spawning entities for the new room

### Requirement: Door does not trigger level complete

Objects of type `door` MUST NOT trigger `LevelCompleteScene`.

#### Scenario: Door vs level exit

- **WHEN** player overlaps `door`
- **THEN** in-scene room transition MUST occur
- **AND** `LevelCompleteScene` MUST NOT start

#### Scenario: Level exit unchanged

- **WHEN** player overlaps `level_exit` on maps that define it
- **THEN** existing level complete flow MUST still trigger

### Requirement: Architectural constraints for room transitions

All room transition implementations MUST follow documented layering: domain rules without Phaser, transition plan in application use case, JSON parsing in infrastructure, fade and sprite lifecycle in presentation only.

#### Scenario: No domain rules in GameScene

- **WHEN** entry position for a door transition is calculated
- **THEN** `GameScene` MUST delegate to `TransitionThroughDoor` or `RoomTransitionRules`, not compute spawn inline

#### Scenario: Unique door ids per room

- **WHEN** a room JSON is validated for playtest
- **THEN** each `doorId` within that room MUST be unique

### Requirement: Mock bidirectional room playtest

The repository MUST include two mock rooms demonstrating a working round-trip door transition.

#### Scenario: Forward transition

- **WHEN** player enters door `to-b` in `room-a`
- **THEN** game MUST load `room-b` and place player at door `from-a`

#### Scenario: Return transition

- **WHEN** player enters door `from-a` in `room-b`
- **THEN** game MUST load `room-a` and place player at door `to-b`
