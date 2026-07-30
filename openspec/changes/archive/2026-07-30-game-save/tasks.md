## 1. Domain model and constants

- [x] 1.1 Add `GameSaveGameState` and `GameSaveCharacterState` types; refactor `GameSave` to v2 nested structure in `src/domain/types/GameSave.ts`
- [x] 1.2 Add `SkillsState` value object (or snapshot type) with `initial()` factory in `src/domain/value-objects/`
- [x] 1.3 Bump `SAVE_VERSION` to `2`, add `SAVE_FILE_PATH_PREFIX = 'saves/'` in `src/domain/constants/save.ts`
- [x] 1.4 Export new types from `src/domain/index.ts`

## 2. Skills port snapshot API

- [x] 2.1 Extend `ISkillsPort` with `getState(): SkillsState` and `restoreState(state: SkillsState): void`
- [x] 2.2 Implement snapshot/restore in `InMemorySkillsAdapter`; keep `reset()` for `StartNewGame`
- [x] 2.3 Optionally include `PlayerStatsState` in save when `IPlayerStatsPort` is wired (use existing `getState`/`restoreState`)

## 3. JSON file save adapter

- [x] 3.1 Create `JsonFileSaveAdapter` implementing `ISavePort` with virtual paths `saves/{slotId}.json`
- [x] 3.2 Extract shared parsers (`parseProgressionState`, `parseInventoryState`, `parseSkillsState`) from existing adapter logic
- [x] 3.3 Implement `normalizeGameSave()` — accept v2 and migrate legacy v1 flat format
- [x] 3.4 Persist pretty-printed JSON (`JSON.stringify(data, null, 2)`)
- [x] 3.5 Replace `LocalStorageSaveAdapter` binding with `JsonFileSaveAdapter` in `composition-root.ts`
- [x] 3.6 Update `src/infrastructure/index.ts` exports

## 4. Save / Load use cases

- [x] 4.1 Update `SaveGame` to build v2 payload (`game.levelId`, `character.*`) and inject `ISkillsPort` (+ optional stats port)
- [x] 4.2 Update `LoadGame` to restore skills (and stats when present); read `game.levelId` from v2 save
- [x] 4.3 Update `ListSaveSlots` / adapter metadata to resolve level id from nested `game` section
- [x] 4.4 Update `save-load-use-cases.test.ts` — v2 round-trip, v1 migration, skills restore

## 5. Pause menu UI

- [x] 5.1 Add menu item `{ id: 'save', label: 'Сохранить' }` to `PauseMenuOverlay`
- [x] 5.2 Add `onSave` callback to `PauseMenuOverlayCallbacks` and wire in `GameScene`
- [x] 5.3 On save: call `saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId })` without closing pause
- [x] 5.4 Show brief «Сохранено» feedback on overlay (~1.5s), gameplay stays frozen

## 6. Quality gate

- [x] 6.1 `npm run build` — zero errors
- [x] 6.2 `npm run lint` — zero errors
- [x] 6.3 `npm test` — save/load tests pass
- [ ] 6.4 Manual: new game → change skills → pause → Save → reload browser → Load → skills and level restored
- [ ] 6.5 Manual: legacy v1 save (if present) still loads after migration
