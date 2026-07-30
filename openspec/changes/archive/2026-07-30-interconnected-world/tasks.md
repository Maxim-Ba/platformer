## 1. Domain — room & door models

- [x] 1.1 Add `DoorDefinition` interface and `RoomDefinition` extending `LevelDefinition` with `doors` array in `src/domain/entities/`
- [x] 1.2 Create `src/domain/services/RoomTransitionRules.ts` — `resolveEntryPosition(room, targetDoorId)`, `validateDoor(door)`, feet-position convention
- [x] 1.3 Unit tests: `RoomTransitionRules.test.ts` — successful pair resolve, missing target door error, facing nudge

## 2. Application — transition use case

- [x] 2.1 Define `RoomTransitionPlan` result type (targetRoomId, entryPosition, facing, fadeMs)
- [x] 2.2 Implement `TransitionThroughDoor` use case — load target room via repository, call rules, return plan
- [x] 2.3 Unit tests: `TransitionThroughDoor.test.ts` — room-a `to-b` → room-b `from-a` entry; invalid door id

## 3. Infrastructure — Tiled parsing

- [x] 3.1 Extend `TiledLevelRepository` — parse `door` objects with properties `doorId`, `targetRoom`, `targetDoor`, `facing`, optional `fadeMs`
- [x] 3.2 Return `RoomDefinition` from `parseMap` (doors array; empty for legacy maps)
- [x] 3.3 Update `TiledLevelRepository.test.ts` — door parsing fixtures and defaults

## 4. World graph & constants

- [x] 4.1 Create `src/game/world-graph.ts` — `WORLD_ENTRY_ROOM_ID`, `WORLD_GRAPH`, `WORLD_PLAYTEST_ENABLED`
- [x] 4.2 Add `DEFAULT_ROOM_ID` to `src/game/constants.ts`; wire new game to `room-a` when playtest enabled
- [x] 4.3 Register `TransitionThroughDoor` in composition root / `SceneDependencies`

## 5. Mock Tiled rooms

- [x] 5.1 Create `tiled/room-a.tmx` — ground, decor, objects: `player_spawn`, `door` (`doorId=to-b`, `targetRoom=room-b`, `targetDoor=from-a`, `facing=right`)
- [x] 5.2 Create `tiled/room-b.tmx` — visually distinct decor, `door` (`doorId=from-a`, `targetRoom=room-a`, `targetDoor=to-b`, `facing=left`)
- [x] 5.3 Export `public/assets/maps/room-a.json` and `room-b.json`
- [x] 5.4 Add `door` object type to `tiled/platformer.tiled-project` (optional color)

## 6. GameScene — room swap module

- [x] 6.1 Add `currentRoomId`, `isTransitioning` state and door overlap detection (reuse hazard/exit pattern)
- [x] 6.2 Implement `teardownRoomContent()` — destroy tilemap layers, enemy/hazard/exit sprites, reset `IEnemyPort`
- [x] 6.3 Implement `transitionRoom(plan)` — fade out → teardown → load JSON → rebuild layers → spawn player at entry → `cameraPort.setBounds` + `reset` → fade in
- [x] 6.4 Guard gameplay input/damage while `isTransitioning` (mirror `isRespawning`)
- [x] 6.5 Ensure `level_exit` still triggers `completeLevel()` unchanged on legacy maps

## 7. Save / load

- [x] 7.1 Extend `GameSave.game` with optional `currentRoomId`
- [x] 7.2 Update `SaveGame` to persist active room id during gameplay
- [x] 7.3 Update `LoadGame` / `GameScene` init to restore `currentRoomId` with fallback to `levelId`

## 8. Documentation

- [x] 8.1 Add «Architectural rules» section reference in `docs/world-design.md` pointing to `design.md` Rule 1–10
- [x] 8.2 Document mock room playtest and `WORLD_PLAYTEST_ENABLED` in README

## 9. Integration & quality

- [x] 9.1 Manual playtest: new game → `room-a` → door right → `room-b` → door left → `room-a`
- [x] 9.2 Manual playtest: save in `room-b`, reload browser, load game → spawns in `room-b`
- [x] 9.3 Verify `level-01` still loads and completes via `level_exit` when playtest flag off
- [x] 9.4 Run `npm run test`, `npm run lint`, `npm run build`
