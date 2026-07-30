## Context

`platformer-level-pipeline` загружает один Tiled JSON на `levelId`, парсит `player_spawn`, `level_exit`, hazards, checkpoints, `enemy_spawn`. `GameScene` при overlap с `level_exit` делает fade и переходит в `LevelCompleteScene` — полный выход из игровой сессии.

Документ `docs/world-design.md` описывает целевую модель Blasphemous-style: граф комнат, двери, hot-swap без restart. Этот change реализует **минимальный вертикальный срез**: две mock-комнаты (`room-a`, `room-b`) с переходом туда-обратно и зафиксированными архитектурными правилами для будущего расширения.

Текущая камера clamp'ится к `level.bounds` целиком. Save хранит `game.levelId`, но не `roomId`.

## Goals / Non-Goals

**Goals:**

- Доменная модель комнаты и двери (`RoomDefinition`, `DoorDefinition`)
- Pure rules: resolve spawn position у парной двери, validate transition
- Use case `TransitionThroughDoor` — единая точка orchestration перехода
- Hot-swap комнаты внутри `GameScene` (fade, unload, load, reposition)
- Tiled `door` object type с `doorId`, `targetRoom`, `targetDoor`, `facing`, `fadeMs`
- Mock playtest: `room-a` ↔ `room-b`
- Архитектурные правила переходов (см. раздел ниже) — обязательны для всех future changes
- Unit-тесты `RoomTransitionRules` и `TransitionThroughDoor`
- Save: `game.currentRoomId` для room-based worlds

**Non-Goals:**

- Per-room enemy persistence (убитые враги при возврате)
- Preload соседних комнат в фоне
- World map UI, лифты, анимированные двери
- Замена `level_exit` / `LevelCompleteScene` (остаются для legacy и финала акта)
- Граф из 10+ комнат — только 2 mock-комнаты для proof-of-concept
- Отдельный `camera_bounds` object per sub-room внутри одной карты

## Decisions

### Architecture overview

```
GameScene.update()
  ├── overlap door zone → TransitionThroughDoor.execute()
  │     ├── RoomTransitionRules.resolveEntry(doors, targetDoorId)
  │     └── returns { targetRoomId, entryPosition, facing, fadeMs }
  ├── presentation: transitionRoom(result)
  │     ├── guard isTransitioning (как isRespawning)
  │     ├── camera fadeOut(fadeMs)
  │     ├── teardownRoomContent() — enemies, hazards, tilemap layers
  │     ├── loadRoom(targetRoomId) via ILevelRepository
  │     ├── spawnPlayer(entryPosition)
  │     ├── cameraPort.setBounds(room.bounds); cameraPort.reset()
  │     └── camera fadeIn(fadeMs)
  └── НЕ scene.start() — GameScene остаётся активной
```

### Room vs Level terminology

| Термин | Значение |
|--------|----------|
| `roomId` | Id Tiled-карты (`room-a`, `level-01`) — один JSON = одна комната |
| `levelId` | Legacy alias; для room-world `levelId` MAY equal `roomId` или zone id |
| `doorId` | Стабильный string id двери на карте (Tiled property) |
| `targetRoom` | `roomId` целевой карты |
| `targetDoor` | `doorId` парной двери на целевой карте |

`RoomDefinition` extends/reuses `LevelDefinition` fields + `doors: DoorDefinition[]`. Парсер MAY return `RoomDefinition` from same `TiledLevelRepository.parseMap(roomId, map)`.

### Door spawn resolution

```typescript
interface DoorDefinition {
  id: string;           // doorId from Tiled
  bounds: Rect;         // overlap trigger zone
  targetRoom: string;
  targetDoor: string;
  facing: 'left' | 'right';
  fadeMs: number;
}

// Entry position at target door:
// x = door.centerX
// y = door.feetY  (bottom of rect, same as player_spawn convention)
// optional nudge: ±8px from edge based on facing
```

`RoomTransitionRules.resolveEntryPosition(targetRoom, targetDoorId)` finds door by id; throws/returns error if missing.

### World graph config

`src/game/world-graph.ts`:

```typescript
export const WORLD_ENTRY_ROOM_ID = 'room-a';

export const WORLD_GRAPH = {
  'room-a': { displayName: 'Room A (West)' },
  'room-b': { displayName: 'Room B (East)' },
} as const;
```

Door connectivity is **data in Tiled** (not duplicated in graph) for v1. Graph only lists known rooms + entry point. Future: validate all `targetRoom` references at build time.

### Repository: extend ILevelRepository

**Decision:** extend existing `ILevelRepository.load(roomId)` — returns `RoomDefinition` (superset of `LevelDefinition`). No second repository for v1.

**Alternative rejected:** `IRoomRepository` separate — YAGNI; same Tiled JSON pipeline.

### Transition module layering

| Layer | Responsibility | MUST NOT |
|-------|----------------|----------|
| `domain/services/RoomTransitionRules.ts` | Validate door, resolve entry position/facing | Import Phaser, fetch JSON |
| `application/use-cases/TransitionThroughDoor.ts` | Load target room, call rules, return transition plan | Touch sprites, camera |
| `infrastructure/tiled/TiledLevelRepository.ts` | Parse `door` objects | Trigger transitions |
| `presentation/scenes/GameScene.ts` | Overlap detect, fade, teardown, load, sync | Domain rules inline |

### Architectural rules for room transitions

Эти правила обязательны для всех текущих и будущих изменений, связанных с комнатами.

#### Rule 1: Single scene session

Room transition MUST NOT call `scene.start(GameScene)` or `scene.restart()`. Player session (ports, inventory, progression) MUST persist across room swaps.

#### Rule 2: Use case owns transition plan

`GameScene` MUST call `TransitionThroughDoor.execute({ currentRoom, doorId })` and apply the returned plan. Overlap detection MAY live in presentation; spawn math MUST NOT.

#### Rule 3: Door pairing contract

Every `door` MUST have unique `doorId` within its room. `targetRoom` + `targetDoor` MUST reference an existing door on the target room JSON. Mock rooms MUST demonstrate bidirectional pair: A.`to-b` ↔ B.`from-a`.

#### Rule 4: Transition guard

`GameScene` MUST use `isTransitioning` flag (like `isRespawning` / `isCompleting`) to block input, damage, and double-trigger during fade + swap.

#### Rule 5: Teardown before load

On room swap, presentation MUST destroy: tilemap layers, enemy sprites, hazard/exit visuals, projectile sprites. Port adapters (`IEnemyPort`, etc.) MUST reset for the new room before spawn.

#### Rule 6: Camera rebinding

After swap, `ICameraPort.setBounds(room.bounds)` and `ICameraPort.reset()` MUST run before fade-in. Camera rules in `UpdateCameraFollow` stay unchanged.

#### Rule 7: Checkpoints are room-local

Activating checkpoint in room A MUST NOT affect respawn in room B until player activates checkpoint in B. `respawnPosition` resets on room entry from door (unless future change adds cross-room checkpoint).

#### Rule 8: level_exit is not a door

`level_exit` triggers `LevelCompleteScene` — unchanged. `door` triggers in-scene swap — never Level Complete.

#### Rule 9: Save records room

`GameSave.game.currentRoomId` MUST be written on save. `LoadGame` MUST start GameScene with saved room, not only `levelId`.

#### Rule 10: No Phaser in domain/application

`TransitionThroughDoor` and `RoomTransitionRules` MUST remain testable without Phaser imports.

### Tiled conventions for mock rooms

**room-a.tmx:**
- `player_spawn` at left area
- `door` id=`to-b`, targetRoom=`room-b`, targetDoor=`from-a`, facing=`right`, at right edge

**room-b.tmx:**
- `door` id=`from-a`, targetRoom=`room-a`, targetDoor=`to-b`, facing=`left`, at left edge
- optional second `door` or distinct decor so rooms are visually distinguishable

Export: `public/assets/maps/room-a.json`, `room-b.json`.

### New game entry

`StartNewGame` / Main Menu «Новая игра» for room-world playtest: start `GameScene` with `roomId = WORLD_ENTRY_ROOM_ID` (`room-a`). Legacy `level-01` flow preserved via separate menu path or constants flag — **decision:** add `DEFAULT_ROOM_ID` alongside `DEFAULT_LEVEL_ID`; world playtest uses `room-a` when `USE_ROOM_WORLD = true` or replace default for this change scope to `room-a` for verification.

**Decision for apply:** `DEFAULT_LEVEL_ID` remains `level-01` for backward compat; add `DEFAULT_ROOM_ID = 'room-a'` and `WORLD_PLAYTEST_ENABLED` constant. New game starts `room-a` when world playtest flag true (set true in this change for demo).

### Fade timing

Default `fadeMs = 150` from door property; fallback 150 if omitted. Reuse camera fade pattern from `completeLevel()` / `respawnPlayer()`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Double door trigger | `isTransitioning` guard + disable overlap until fade-in complete |
| Flicker on swap | Fade out fully before teardown; fade in after player positioned |
| Orphaned Phaser objects | `teardownRoomContent()` checklist in GameScene; shutdown hooks |
| Broken door pair in Tiled | Unit test with mock maps; documented pair checklist in tasks |
| level-01 regression | Keep `level-01` unchanged; mock rooms are separate files |
| Save v2 migration | `currentRoomId` optional field; default to `levelId` if missing |

## Migration Plan

1. Domain types + `RoomTransitionRules` + tests
2. Tiled parser: `door` objects
3. `TransitionThroughDoor` use case + tests
4. Mock `room-a`, `room-b` maps
5. `GameScene` integration: overlap, swap, guards
6. Save `currentRoomId`
7. Manual playtest: A→B→A, save/load in each room
8. Update `docs/world-design.md` with link to architectural rules

Rollback: set `WORLD_PLAYTEST_ENABLED = false`; remove door overlap handler; keep parser changes (harmless if no door objects).

## Open Questions

- Should «Новая игра» permanently switch to room world vs keep `level-01`? **Resolved for apply:** flag `WORLD_PLAYTEST_ENABLED = true` starts `room-a`; document in README.
- Preload adjacent room JSON during fade? **Deferred** — load on demand in v1.
