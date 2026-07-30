## Context

Слой сохранения уже реализован по Clean Architecture: `ISavePort`, `SaveGame`, `LoadGame`, `ListSaveSlots`, `LocalStorageSaveAdapter`. `GameSave` (v1) — плоский объект: `version`, `levelId`, `savedAt`, `progression`, `inventory`. Сохранение вызывается неявно при выходе из паузы, game over и level complete; ручного действия в UI нет.

Параллельно появились подсистемы персонажа: `ISkillsPort`, `IPlayerStatsPort`. `StartNewGame` сбрасывает скилы, но `LoadGame` их не восстанавливает — при загрузке прогресс частично теряется. Спека `game-save-load` требует localStorage; proposal меняет контракт на JSON-документ с секциями `game` и `character`.

## Goals / Non-Goals

**Goals:**

- Ручное сохранение из меню паузы одним действием
- Расширяемая JSON-схема с явным разделением `game` / `character`
- Первая итерация `character`: progression, inventory, skills; stats — если порт уже подключён в composition root
- Один JSON-документ на слот (`saves/{slotId}.json`), human-readable
- Обратная совместимость: загрузка старых v1-сохранений
- Сохранение/загрузка скилов через порт (без прямого доступа к адаптеру из presentation)

**Non-goals:**

- Несколько слотов с UI, удаление слотов, именованные сохранения
- In-level state: позиция игрока, активированные чекпоинты, HP в момент сохранения
- Реальная файловая система / Electron / облако
- Экспорт «Скачать .json» и импорт через file picker
- Сохранение настроек (`game-settings`) внутри `GameSave`
- Ребиндинг управления — отдельный change `control-rebinding` через `ISettingsPort` (`platformer:settings`)

## Decisions

### Вложенная схема `GameSave` v2

```typescript
interface GameSave {
  version: 2;
  savedAt: string; // ISO-8601
  game: {
    levelId: string;
    // будущее: checkpointId, playTimeMs, worldFlags
  };
  character: {
    progression: ProgressionStateSnapshot;
    inventory: InventoryStateSnapshot;
    skills: SkillsStateSnapshot;
    stats?: PlayerStatsStateSnapshot; // optional в v2
    // будущее: health, equipment, quests
  };
}
```

**Почему два раздела:** состояние уровня/сессии (`game`) и долгоживущий прогресс героя (`character`) эволюционируют независимо; новые поля добавляются в нужную секцию без ломки парсера всего документа.

**Альтернатива:** оставить плоскую структуру и добавлять поля на верхний уровень — отклонено: смешивает контекст уровня с персонажем, усложняет миграции.

### `SkillsStateSnapshot` и методы порта

Новый value object `SkillsState` в `src/domain/value-objects/` (или тип в `domain/types/`) с полями:

- `unlockedNodeIds: string[]`
- `selectedNodeIds: string[]`
- `availableSkillPoints: number`

`ISkillsPort` расширяется:

```typescript
getState(): SkillsState;
restoreState(state: SkillsState): void;
```

`InMemorySkillsAdapter` реализует snapshot/restore; `reset()` остаётся для `StartNewGame`.

**Почему через порт:** соответствует паттерну `IProgressionPort` / `IInventoryPort`; `SaveGame` не знает о внутренней структуре адаптера.

### `JsonFileSaveAdapter` вместо прямого localStorage

Новый адаптер `JsonFileSaveAdapter` в `src/infrastructure/adapters/`:

- Путь слота: `saves/{slotId}.json`
- Ключ хранения: `${STORAGE_PREFIX}saves/${slotId}.json` (тот же механизм, что localStorage)
- `save()`: `JSON.stringify(data, null, 2)` — читаемый JSON
- `load()`: парсинг + `normalizeGameSave(raw)` — миграция v1 → v2
- Реализует существующий `ISavePort` без изменения интерфейса

**Почему не настоящие файлы:** браузерный MVP без бэкенда; virtual path даёт единый контракт для будущего `FileSystemSaveAdapter`. Composition root меняет только binding.

**Альтернатива:** оставить `LocalStorageSaveAdapter` и только поменять схему — отклонено: proposal явно требует file-path семантику.

### Миграция v1 → v2 в адаптере

`normalizeGameSave(raw: unknown): GameSave | null`:

1. Если `version === 2` и валидная структура — вернуть как есть
2. Если `version === 1` с плоскими `levelId`, `progression`, `inventory` — обернуть:
   - `game.levelId` ← `levelId`
   - `character.progression` ← `progression`
   - `character.inventory` ← `inventory`
   - `character.skills` ← `SkillsState.initial()` (дефолт, т.к. в v1 скилов не было)
3. Иначе — `null`

При следующем `save()` документ перезаписывается уже в v2.

### Ручное сохранение в меню паузы

`PauseMenuOverlay` — новый пункт `{ id: 'save', label: 'Сохранить' }` (между «Настройки» и «Начать с контрольной точки»).

`GameScene` callback `onSave`:

1. `saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: this.levelId })`
2. Показать краткий feedback (текст «Сохранено» на overlay, 1.5 с, без закрытия паузы)
3. Геймплей остаётся на паузе

**Почему пауза, а не главное меню:** сохранение — in-session действие; в `MainMenuScene` нет активной сессии. Автосохранение при выходе из паузы сохраняется.

### Расширение use cases

`SaveGame` принимает дополнительные порты: `ISkillsPort`, опционально `IPlayerStatsPort`.

`LoadGame` восстанавливает те же секции; при отсутствии `stats` в save — не трогать текущий stats port (или сброс к initial — зафиксировать в тесте: **не трогать**, если поле отсутствует).

`ListSaveSlots` читает `game.levelId` из v2 или мигрированного v1.

## Risks / Trade-offs

- **[Risk] Потеря скилов при загрузке старых v1-сейвов** → Миграция подставляет `SkillsState.initial()`; игрок видит дефолтные скилы до первого v2-save
- **[Risk] Дублирование логики парсинга progression/inventory** → Вынести общие `parseProgressionState` / `parseInventoryState` в shared module внутри infrastructure
- **[Risk] `stats` не везде подключён** → Поле optional; `SaveGame` включает stats только если порт передан и `getState()` доступен
- **[Trade-off] localStorage вместо реальных файлов** → Проще для web MVP; путь `saves/*.json` — контракт для будущего адаптера

## Migration Plan

1. Поднять `SAVE_VERSION` до 2, добавить типы и `normalizeGameSave`
2. Заменить адаптер в composition root на `JsonFileSaveAdapter`
3. Расширить порты и use cases; обновить тесты
4. Добавить UI «Сохранить» в паузу
5. Ручная проверка: new game → learn skill → pause save → reload → load → skills restored

Откат: вернуть binding на старый адаптер; v2-сейвы несовместимы с v1-only парсером — при откате очистить localStorage ключи `platformer:saves:*`.

## Open Questions

- Включать ли `PlayerStatsState` в первую итерацию, если `player-stats` change ещё не в main — **решение:** включить, если порт уже в composition root; иначе поле опускается при save и игнорируется при load
- Нужен ли звук/анимация при сохранении — **отложено** (только текстовый feedback)
