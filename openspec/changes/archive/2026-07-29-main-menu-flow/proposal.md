## Why

Сейчас `MainMenuScene` — заглушка с одним действием «Press SPACE to start». Игрок не может выбрать новую игру, загрузить прогресс или изменить настройки. Backend настроек (`ISettingsPort`, `LocalStorageSettingsAdapter`) уже реализован, но не подключён к UI. Save/load отсутствует полностью. Полноценное главное меню — естественный следующий шаг после level-complete-flow: завершает entry point игры и даёт основу для персистентного прогресса.

## What Changes

- **`MainMenuScene`** — интерактивное меню с пунктами: **Новая игра**, **Загрузка**, **Настройки**
- Навигация по пунктам: стрелки ↑↓, Enter/Space для выбора, Escape — назад (в подменю)
- **`SettingsScene`** — экран настроек с базовыми опциями (громкость master/music/sfx, fullscreen toggle)
- Подменю **Загрузка** — список слотов сохранений или сообщение «Нет сохранений»
- Новая подсистема **save/load** по паттерну портов: `ISavePort` → domain `GameSave` → `LocalStorageSaveAdapter` → use cases `StartNewGame`, `SaveGame`, `LoadGame`, `ListSaveSlots`
- Use case **`StartNewGame`** — сброс runtime-состояния (progression, inventory) и старт с `DEFAULT_LEVEL_ID`
- Use case **`LoadGame`** — восстановление состояния из слота и переход в `GameScene` с сохранённым `levelId`
- `MainMenuScene` и `SettingsScene` получают `AppDependencies` через registry (как `GameScene`)
- Автосохранение при выходе в Main Menu из `GameOverScene` / `LevelCompleteScene` (опционально, один quick-save слот)
- Обновление scene lifecycle и mvp-integration specs

**Non-goals:** level select с картой мира, несколько профилей игрока, облачные сохранения, полный key rebinding UI, анимированные кнопки/спрайты меню, звуки меню.

## Capabilities

### New Capabilities

- `main-menu-ui`: интерактивное главное меню с навигацией и переходами в Game/Load/Settings
- `game-save-load`: порт сохранений, domain-модель, localStorage-адаптер, use cases для новой игры и загрузки

### Modified Capabilities

- `scene-lifecycle`: MainMenu с пунктами меню, новая SettingsScene, переходы Load → Game
- `game-settings`: требование UI-сцены настроек, подключённой к `ISettingsPort`
- `mvp-integration`: полный session flow через меню (New Game / Load / Settings / Back)

## Impact

- `src/presentation/scenes/MainMenuScene.ts` — переработка UI
- `src/presentation/scenes/SettingsScene.ts` — новая сцена
- `src/presentation/scenes/LoadGameScene.ts` — новая сцена (или inline submenu в MainMenu)
- `src/application/ports/ISavePort.ts` — новый порт
- `src/domain/types/GameSave.ts` — domain type
- `src/infrastructure/adapters/LocalStorageSaveAdapter.ts` — новый адаптер
- `src/application/use-cases/StartNewGame.ts`, `SaveGame.ts`, `LoadGame.ts`, `ListSaveSlots.ts` — новые use cases
- `src/game/composition-root.ts` — binding портов и use cases
- `src/game/scene-keys.ts`, `src/game/bootstrap.ts` — регистрация новых сцен
- `src/presentation/index.ts` — exports
- README — обновить controls и game flow
