## Context

`MainMenuScene` сейчас — placeholder: заголовок и «Press SPACE to start», без выбора действий. `AppDependencies` передаётся через registry в `BootScene`, но используется только в `GameScene`. Подсистема настроек полностью реализована на уровне domain/application/infrastructure (`ISettingsPort`, `UpdateSettings`, `LocalStorageSettingsAdapter`), но UI отсутствует. Progression и inventory — in-memory singletons в composition root, не персистятся. Save/load не существует.

Архитектурный паттерн проекта: порты в `application/ports/`, use cases в `application/use-cases/`, адаптеры только в `composition-root.ts`. Новые фичи MUST следовать этому паттерну.

## Goals / Non-Goals

**Goals:**

- Главное меню с тремя пунктами: **Новая игра**, **Загрузка**, **Настройки**
- Навигация клавиатурой (↑↓, Enter, Escape)
- `SettingsScene` с базовыми настройками через `ISettingsPort` / `UpdateSettings`
- Save/load подсистема: `ISavePort` + `LocalStorageSaveAdapter` + use cases
- `StartNewGame` — сброс progression/inventory и старт с `DEFAULT_LEVEL_ID`
- `LoadGame` — восстановление состояния и переход в `GameScene`
- `MainMenuScene`, `SettingsScene`, `LoadGameScene` читают `AppDependencies` из registry
- Один quick-save слот (автосохранение при возврате в меню)

**Non-Goals:**

- Множественные save slots (v1: один слот `slot-1`)
- Level select с картой мира
- Key rebinding UI (только volume + fullscreen в v1)
- Звуки и анимации меню
- Облачные сохранения
- Подтверждение «перезаписать прогресс?» при New Game

## Decisions

### Scene flow diagram

```
                    ┌─────────────┐
                    │  MainMenu   │
                    └──┬──┬──┬────┘
           New Game    │  │  │ Settings
              ┌───────┘  │  └──────┐
              ▼          │         ▼
       ┌─────────────┐   │  ┌──────────────┐
       │    Game     │   │  │  Settings    │
       └─────────────┘   │  └──────┬───────┘
                         │         │ Esc
              Load       │         ▼
              ┌──────────┘   ┌─────────────┐
              ▼              │  MainMenu   │
       ┌──────────────┐      └─────────────┘
       │  LoadGame    │
       └──────┬───────┘
              │ select slot / Esc
              ▼
       ┌─────────────┐
       │    Game     │  (restored levelId + state)
       └─────────────┘
```

### Reuse existing modules

| Модуль | Статус | Использование |
|--------|--------|---------------|
| `ISettingsPort` + `UpdateSettings` | ✅ готов | SettingsScene читает/обновляет настройки |
| `IProgressionPort` | ✅ готов | Сериализуется в `GameSave`, восстанавливается при Load |
| `IInventoryPort` | ✅ готов | Сериализуется в `GameSave`, восстанавливается при Load |
| `LoadLevel` | ✅ готов | GameScene загружает уровень по `levelId` из save или default |
| `MainMenuScene` | ⚠️ placeholder | Переработать UI, подключить use cases |

### Save/load architecture (port pattern)

```
Domain                    Application              Infrastructure
────────                  ───────────              ──────────────
GameSave (type)     →     ISavePort (interface) →  LocalStorageSaveAdapter
SaveSlot (type)           StartNewGame (UC)
                          SaveGame (UC)
                          LoadGame (UC)
                          ListSaveSlots (UC)
```

**`ISavePort` interface:**

```typescript
interface ISavePort {
  listSlots(): SaveSlotMeta[];
  save(slotId: string, data: GameSave): void;
  load(slotId: string): GameSave | null;
  delete(slotId: string): void;
  hasSave(slotId: string): boolean;
}
```

**`GameSave` domain type:**

```typescript
interface GameSave {
  version: number;
  levelId: string;
  savedAt: string; // ISO timestamp
  progression: ProgressionState;
  inventory: InventoryState;
}
```

**Storage key:** `platformer:save:{slotId}` (аналогично `platformer:settings`).

### Use cases

| Use case | Input | Output | Действие |
|----------|-------|--------|----------|
| `StartNewGame` | — | `{ levelId }` | Сброс progression/inventory ports → `DEFAULT_LEVEL_ID` |
| `SaveGame` | `{ slotId, levelId }` | void | Снимок текущего state → `ISavePort.save()` |
| `LoadGame` | `{ slotId }` | `{ levelId }` \| null | Читает save → восстанавливает ports |
| `ListSaveSlots` | — | `SaveSlotMeta[]` | Делегирует `ISavePort.listSlots()` |

`StartNewGame` и `LoadGame` инжектят `IProgressionPort`, `IInventoryPort` и `ISavePort` — оркестрация сброса/восстановления в application layer, не в сценах.

### Port restore methods

`IProgressionPort` и `IInventoryPort` нуждаются в методах восстановления состояния:

```typescript
// IProgressionPort — ADD
restoreProgression(state: ProgressionState): void;

// IInventoryPort — ADD
restoreInventory(state: InventoryState): void;
```

Адаптеры `InMemoryProgressionAdapter` / `InMemoryInventoryAdapter` реализуют replace-state. Это минимальное расширение существующих портов без нарушения DIP.

### Menu UI approach

Отдельная UI-библиотека не нужна (YAGNI). Переиспользуемый helper `createMenuList(scene, items, onSelect)` в `src/presentation/ui/MenuList.ts` — thin presentation utility, не domain.

**MainMenuScene items:**

```typescript
const MENU_ITEMS = [
  { id: 'new-game', label: 'Новая игра' },
  { id: 'load', label: 'Загрузка' },
  { id: 'settings', label: 'Настройки' },
] as const;
```

Выделенный пункт — яркий цвет (`#f8fafc`), остальные — приглушённый (`#64748b`). ↑↓ меняют `selectedIndex`, Enter вызывает action.

### SettingsScene design

- Background: `#1e1b4b` (как MainMenu)
- Title: «Настройки»
- Строки: Master Volume, Music Volume, SFX Volume (← → для ±0.1), Fullscreen (toggle Space)
- Escape → MainMenu
- Изменения применяются сразу через `updateSettings.execute(patch)`
- Fullscreen: `scene.scale.startFullscreen()` / `stopFullscreen()` + patch `video.fullscreen`

### LoadGameScene design

- Background: `#1e1b4b`
- Title: «Загрузка»
- Если `ListSaveSlots` пуст → «Нет сохранений» + Escape
- Если есть слот → показать `levelId`, дату сохранения; Enter → `LoadGame` → `GameScene`
- Escape → MainMenu

### Auto-save on menu return

При переходе `GameOverScene` / `LevelCompleteScene` → Main Menu:
- Вызов `SaveGame({ slotId: 'slot-1', levelId })` перед `scene.start(MainMenu)`
- Это даёт рабочий Load без ручного save

### Composition root changes

```typescript
interface AppDependencies {
  // ... existing
  savePort: ISavePort;
  startNewGame: StartNewGame;
  saveGame: SaveGame;
  loadGame: LoadGame;
  listSaveSlots: ListSaveSlots;
}
```

Singleton `savePort` по аналогии с `settingsPort`.

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Inline settings в MainMenu (без отдельной сцены) | Перегружает меню; сложнее расширять |
| Save state только levelId (без inventory/progression) | Неполная загрузка; progression уже есть как порт |
| `IGameStatePort` monolith вместо ISavePort | Over-abstraction; save — отдельная concern |
| Zustand/Redux для menu state | Phaser scenes + registry достаточно |
| Отдельный `SaveGameScene` для ручного save | v1: auto-save при выходе в меню достаточно |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| In-memory ports не синхронизированы с save | `SaveGame`/`LoadGame` — единственная точка snapshot/restore |
| Corrupt save data | `LocalStorageSaveAdapter` → fallback null + «Нет сохранений» |
| Settings fullscreen не откатывается при Esc | Patch сохраняется в localStorage — корректное поведение |
| New Game без подтверждения перезаписывает in-memory state | Auto-save уже в slot; Load восстановит если нужно |
| Health не в save (per-scene port) | Ожидаемо: при Load — fresh health для уровня |

## Migration Plan

1. Domain types: `GameSave`, `SaveSlotMeta`
2. Port: `ISavePort` + restore methods на progression/inventory ports
3. Adapter: `LocalStorageSaveAdapter`
4. Use cases: `StartNewGame`, `SaveGame`, `LoadGame`, `ListSaveSlots`
5. Composition root binding
6. Presentation: `MenuList` helper, переработка `MainMenuScene`
7. `SettingsScene`, `LoadGameScene`
8. Scene keys + bootstrap registration
9. Auto-save hook в GameOver/LevelComplete → MainMenu
10. README update
11. Manual playtest

Rollback: revert MainMenuScene к placeholder; удалить новые сцены и save module.

## Open Questions

- Количество save slots в v1 — **один (`slot-1`)**
- Русские лейблы в меню — **да, по запросу пользователя**
- Применение audio volume в runtime — **v1: сохранять значения; Phaser audio integration — follow-up**
