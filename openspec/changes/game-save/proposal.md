## Why

Сохранение уже работает через `SaveGame` и `localStorage`, но только неявно — при выходе из паузы, game over и level complete. Игрок не может сохраниться вручную в любой момент. Модель `GameSave` плоская (`progression`, `inventory` на верхнем уровне) и не покрывает новые подсистемы персонажа (скилы, характеристики); при загрузке скилы сбрасываются. Первая итерация нужна, чтобы дать явное действие «Сохранить» в меню и заложить расширяемый JSON-документ с разделением состояния игры и персонажа.

## What Changes

- **Пункт «Сохранить»** в меню паузы: ручное сохранение текущей сессии в слот по умолчанию с краткой обратной связью («Сохранено»)
- **Расширяемая схема `GameSave`**: верхний уровень `version`, `savedAt`; вложенные секции `game` (контекст уровня/сессии) и `character` (прогресс персонажа)
- **Секция `character`** в первой итерации: `progression`, `inventory`, `skills`; `stats` — опциональное поле с заглушкой/сериализацией, если порт уже доступен
- **JSON-файл как единица хранения**: адаптер сохраняет один документ `saves/{slotId}.json` (pretty-printed JSON); реализация v1 — `localStorage` с путём-ключом (смена бэкенда на реальную ФС/Electron — только в composition root)
- **Миграция v1 → v2**: парсер принимает старый плоский формат и нормализует в новую схему
- **`SaveGame` / `LoadGame`** собирают и восстанавливают все секции `character`, включая скилы
- **Метаданные слота** (`ListSaveSlots`) — без изменений по контракту (slotId, levelId, savedAt)

**Non-goals:** несколько слотов с UI выбора, автосохранение по таймеру, сохранение позиции игрока/чекпоинтов внутри уровня, экспорт/импорт файла через диалог ОС, облачные сохранения, сохранение настроек управления (остаётся в `game-settings`).

## Capabilities

### New Capabilities

_(нет — расширяем существующую capability)_

### Modified Capabilities

- `game-save-load`: расширяемая JSON-схема `game` + `character`, file-path адаптер, миграция формата, snapshot/restore скилов (и stats при наличии), ручное сохранение
- `pause-menu`: новый пункт «Сохранить» с вызовом `SaveGame` и feedback без выхода из уровня
- `mvp-integration`: end-to-end сценарий ручного сохранения из паузы и продолжения через «Загрузка»

## Impact

- `src/domain/types/GameSave.ts` — новая вложенная структура, типы `GameSaveGameState`, `GameSaveCharacterState`
- `src/domain/constants/save.ts` — `SAVE_VERSION = 2`, префикс путей `saves/`
- `src/infrastructure/adapters/LocalStorageSaveAdapter.ts` → `JsonFileSaveAdapter` (или рефакторинг с сохранением имени)
- `src/application/use-cases/SaveGame.ts`, `LoadGame.ts` — skills port (+ stats port)
- `src/application/ports/ISkillsPort.ts` — `getState()` / `restoreState()` для сериализации
- `src/presentation/ui/PauseMenuOverlay.ts`, `GameScene.ts` — пункт «Сохранить», toast/feedback
- `src/application/use-cases/save-load-use-cases.test.ts` — тесты новой схемы и миграции
- `openspec/specs/game-save-load`, `pause-menu`, `mvp-integration` — delta specs
