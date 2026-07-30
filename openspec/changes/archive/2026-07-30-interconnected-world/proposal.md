## Why

Текущий pipeline — один Tiled-уровень на `levelId` с выходом через `level_exit` и перезагрузкой `GameScene`. Это не масштабируется на Blasphemous-inspired мир: большие локации собираются из сети комнат с переходами через двери, без экрана победы и без полного restart сцены. Сейчас — правильный момент заложить граф комнат и модуль переходов, пока контент ограничен `level-01`, и проверить связку на двух mock-комнатах (туда и обратно).

## What Changes

- **Граф комнат** как доменная модель: `RoomId`, `DoorDefinition`, связи `targetRoom` + `targetDoor`, spawn у парной двери
- **Модуль перехода** (application + domain): use case `TransitionThroughDoor` — валидация двери, resolve целевой комнаты и позиции входа, без Phaser-типов
- **Hot-swap комнаты в `GameScene`**: fade → unload текущей tilemap/entities → load соседней комнаты → reposition player → обновить camera bounds — **без** `LevelCompleteScene`
- **Tiled object type `door`** на слое `objects` с custom properties: `doorId`, `targetRoom`, `targetDoor`, `facing`, `fadeMs`
- **Mock playtest**: `room-a` и `room-b` — две Tiled-карты с парными дверями; игрок может пройти A→B→A
- **Архитектурные правила** переходов: документированы в `design.md` и delta spec `room-transitions` (слои, порты, запреты, lifecycle)
- **Расширение save/progression**: `currentRoomId` в save state (минимально — room id для возврата после load)
- Сохранение существующего `level_exit` / `LevelCompleteScene` для финала акта и legacy `level-01` — не **BREAKING** для текущего demo flow

**Non-goals:** per-room enemy persistence (убитые враги помнятся между визитами), preload соседних комнат, world map UI, лифты/анимации дверей, нелинейный граф из 10+ комнат, замена `LEVEL_PROGRESSION` целиком.

## Capabilities

### New Capabilities

- `room-transitions`: доменные правила и контракт перехода между комнатами (door parsing, paired doors, spawn resolution, transition lifecycle, architectural constraints)
- `world-graph`: конфигурация связанных комнат, entry room для новой игры, resolve `targetRoom`/`targetDoor`

### Modified Capabilities

- `level-pipeline`: парсинг `door` objects; `LevelDefinition` или соседняя `RoomDefinition` MUST expose doors; загрузка по `roomId` (не только legacy `levelId`)
- `scene-lifecycle`: `GameScene` MUST support in-scene room swap без restart; transition guard flags (как `isRespawning`)
- `game-save-load`: save MUST persist `currentRoomId` alongside `levelId` for room-based worlds
- `player-camera`: camera bounds MUST update on room transition to new room bounds

## Impact

- `src/domain/entities/` — `RoomDefinition`, `DoorDefinition`, transition result types
- `src/domain/services/RoomTransitionRules.ts` — pure rules (resolve entry position, validate door pair)
- `src/application/ports/IRoomRepository.ts` или расширение `ILevelRepository` — load room by id
- `src/application/use-cases/TransitionThroughDoor.ts` — orchestration
- `src/infrastructure/tiled/TiledLevelRepository.ts` — parse `door` objects, `doorId` property
- `src/presentation/scenes/GameScene.ts` — door overlap, `swapRoom()`, fade during transition
- `src/game/constants.ts` — `WORLD_ENTRY_ROOM_ID`, mock room ids
- `tiled/room-a.tmx`, `tiled/room-b.tmx` + `public/assets/maps/room-a.json`, `room-b.json`
- `docs/world-design.md` — cross-reference to OpenSpec rules
- **Prerequisite:** `platformer-level-pipeline`, `player-camera`, `scene-lifecycle`, `game-save-load` MUST be in place
