## 1. Domain & ports

- [x] 1.1 Create `GameSave` and `SaveSlotMeta` types in `src/domain/types/GameSave.ts`
- [x] 1.2 Add save constants (`SAVE_VERSION`, `DEFAULT_SAVE_SLOT_ID`, storage key prefix) in `src/domain/constants/save.ts`
- [x] 1.3 Create `ISavePort` in `src/application/ports/ISavePort.ts`
- [x] 1.4 Add `restoreProgression(state)` to `IProgressionPort` and `InMemoryProgressionAdapter`
- [x] 1.5 Add `restoreInventory(state)` to `IInventoryPort` and `InMemoryInventoryAdapter`
- [x] 1.6 Export new types and port from `domain/index.ts` and `application/index.ts`

## 2. Save/load infrastructure

- [x] 2.1 Create `LocalStorageSaveAdapter` implementing `ISavePort`
- [x] 2.2 Handle corrupt/missing save data gracefully (return null)
- [x] 2.3 Export adapter from `infrastructure/index.ts`

## 3. Use cases

- [x] 3.1 Create `StartNewGame` use case (reset ports → return `DEFAULT_LEVEL_ID`)
- [x] 3.2 Create `SaveGame` use case (snapshot progression + inventory + levelId → `ISavePort`)
- [x] 3.3 Create `LoadGame` use case (restore ports from save → return levelId or null)
- [x] 3.4 Create `ListSaveSlots` use case (delegate to `ISavePort.listSlots()`)
- [x] 3.5 Add unit tests for `StartNewGame`, `SaveGame`, `LoadGame`

## 4. Composition root

- [x] 4.1 Add `savePort`, `startNewGame`, `saveGame`, `loadGame`, `listSaveSlots` to `AppDependencies`
- [x] 4.2 Wire `LocalStorageSaveAdapter` singleton in `createAppDependencies()`
- [x] 4.3 Inject ports into use cases (no concrete adapters outside composition root)

## 5. Scene registry & keys

- [x] 5.1 Add `Settings` and `LoadGame` to `SceneKeys`
- [x] 5.2 Register `SettingsScene` and `LoadGameScene` in `bootstrap.ts`
- [x] 5.3 Export new scenes from `presentation/index.ts`

## 6. Menu UI helper

- [x] 6.1 Create `src/presentation/ui/MenuList.ts` — reusable keyboard-navigable menu list
- [x] 6.2 Support ↑↓ wrap-around, Enter/Space confirm, visual highlight for selected item

## 7. MainMenuScene

- [x] 7.1 Refactor `MainMenuScene` to use `MenuList` with items: Новая игра, Загрузка, Настройки
- [x] 7.2 Read `AppDependencies` from registry via `getAppDependenciesFromRegistry()`
- [x] 7.3 «Новая игра» → `startNewGame.execute()` → `GameScene` with returned levelId
- [x] 7.4 «Загрузка» → `LoadGameScene`
- [x] 7.5 «Настройки» → `SettingsScene`

## 8. SettingsScene

- [x] 8.1 Create `SettingsScene` with title «Настройки»
- [x] 8.2 Display and edit master/music/sfx volume via `updateSettings` (← → ±0.1)
- [x] 8.3 Toggle fullscreen via `scene.scale` + persist `video.fullscreen` patch
- [x] 8.4 Escape → `MainMenuScene`

## 9. LoadGameScene

- [x] 9.1 Create `LoadGameScene` with title «Загрузка»
- [x] 9.2 Show «Нет сохранений» when `listSaveSlots` returns empty
- [x] 9.3 Show slot metadata (levelId, savedAt) when save exists
- [x] 9.4 Enter on slot → `loadGame.execute()` → `GameScene` with restored levelId
- [x] 9.5 Escape → `MainMenuScene`

## 10. Auto-save integration

- [x] 10.1 Call `saveGame` before Main Menu transition in `GameOverScene`
- [x] 10.2 Call `saveGame` before Main Menu transition in `LevelCompleteScene`

## 11. Documentation & quality gate

- [x] 11.1 Update README controls table and game flow (menu, settings, load)
- [x] 11.2 `npm run build` — zero errors
- [x] 11.3 `npm run lint` — zero errors
- [x] 11.4 `npm test` — existing and new tests pass
- [ ] 11.5 Manual playtest: New Game → play → Menu → Load resumes progress
- [ ] 11.6 Manual playtest: Settings persist after reload
