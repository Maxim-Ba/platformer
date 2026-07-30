## Context

`TiledLevelRepository.parseMap` уже валидирует минимум: слой `objects`, ровно один `player_spawn`. Двери парсятся без проверки связей. `WORLD_GRAPH` и `WORLD_ENTRY_ROOM_ID` в `src/game/world-graph.ts` не сверяются с файловой системой.

Runtime-ошибки перехода (`RoomTransitionError`) срабатывают только при overlap с дверью — поздно для контент-автора.

## Goals / Non-Goals

**Goals:**

- Единая точка build-time валидации всех `public/assets/maps/*.json`
- 6 правил из proposal — errors vs warnings чётко разделены
- Переиспользование `TiledLevelRepository.parseMap` (не дублировать парсинг)
- `npm run validate:maps` с ненулевым exit code при errors
- Unit-тесты на изолированных JSON-фикстурах (без чтения всего `public/` в тестах, кроме integration smoke)

**Non-Goals:**

- Проверка что игрок не застрянет, что двери на краю карты
- Валидация `.tmx` исходников (только runtime JSON)
- Обязательная обратная парность — только **warning**
- Pre-commit hook (можно добавить позже вручную)

## Decisions

### Layering

| Layer | Responsibility |
|-------|----------------|
| `domain/services/MapValidationRules.ts` | Pure rules: unique door ids, door target resolution, graph vs files, layer/tileset names. Input: parsed `RoomDefinition` + raw `TiledMapJson` metadata |
| `infrastructure/tiled/MapValidator.ts` | Orchestration: glob `public/assets/maps/*.json`, `parseMap`, call rules, aggregate errors/warnings |
| `scripts/validate-maps.mjs` | Thin CLI: instantiate validator, print report, `process.exit(1)` on errors |

**Alternative rejected:** валидация только в vitest без CLI — контент-авторам нужна одна команда без запуска всего test suite.

### Validation severity

| Rule | Severity |
|------|----------|
| parseMap throws | **error** |
| duplicate doorId in room | **error** |
| targetRoom file missing | **error** |
| targetDoor not found in target room | **error** |
| missing ground/decor/objects layer | **error** |
| missing tileset name `platformer` or `beast_soldier` | **error** |
| WORLD_GRAPH room id without JSON file | **error** |
| WORLD_ENTRY_ROOM_ID without JSON file | **error** |
| JSON file for room in graph but not listed in WORLD_GRAPH | **warning** (orphan room asset) |
| door A→B without B→A | **warning** |
| WORLD_GRAPH lists room with no doors (legacy level like level-01) | **no check** — graph only validates listed ids have files |

**Decision:** `level-01` exists on disk but not in `WORLD_GRAPH` — OK. Rooms **in** `WORLD_GRAPH` MUST have `{id}.json`.

### Door pairing algorithm (warning)

After all maps parsed into `Map<string, RoomDefinition>`:

For each door `d` in room `R`:
- Find target room `T = maps[d.targetRoom]`
- If `T` has door `d.targetDoor` pointing back to `R.id` and `d.id` — symmetric pair OK
- Else emit warning: `Door "${R.id}/${d.id}" → "${d.targetRoom}/${d.targetDoor}" has no reverse pair`

### Layer / tileset checks

On raw `TiledMapJson` before or after parse:

- `layers` MUST contain tilelayer named `ground`, `decor`, objectgroup named `objects`
- `tilesets` MUST include entry with `name === 'platformer'` and `name === 'beast_soldier'` (matches `GameScene.buildRoomLayers`)

### CLI output format

```
✓ room-a.json
✗ room-b.json
  ERROR: duplicate doorId "to-b" in room-b
  WARNING: door room-b/from-a → room-a/to-b has no reverse pair

Validated 4 maps: 3 passed, 1 failed (1 error, 1 warning)
```

Exit code: `1` if any error; `0` if only warnings or all pass.

### Integration with quality gate

Add to README and `quality-gate` spec: run `npm run validate:maps` before commit when maps change. Optional future: `npm test` includes validator unit tests always.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| False positive on legacy `level-01` without doors | Graph check scoped to `WORLD_GRAPH` keys only |
| Validator drifts from `GameScene` tileset names | Single constant `REQUIRED_TILESET_NAMES` shared or duplicated with comment |
| Slow on 100+ maps | Acceptable for pet-project; glob + parse is fast |
| Warnings ignored | Document that warnings SHOULD be fixed before merge |

## Migration Plan

1. Implement `MapValidationRules` + tests
2. Implement `MapValidator` + CLI
3. Run against current maps (`level-01`, `room-a`, `room-b`) — fix any failures
4. Document in level-authoring checklist
5. Add `validate:maps` to README quality section

Rollback: remove script; no runtime impact.

## Open Questions

- Include `validate:maps` in `npm test`? **Resolved:** separate script; unit tests cover rules; README documents when to run.
- Fail on warnings in CI? **Resolved:** errors only fail exit code; warnings printed.
