## Why

Сейчас клавиша Esc в `GameScene` сразу переводит игрока на `GameOverScene` — это воспринимается как завершение уровня, а не как пауза. После появления HUD, главного меню и настроек ожидаемое поведение Esc — остановить геймплей и дать выбор: изменить настройки, вернуться к последней контрольной точке или выйти в главное меню. Пауза — базовый UX-паттерн для платформера и естественное дополнение к `main-menu-flow`.

## What Changes

- **Esc в `GameScene`** открывает меню паузы вместо перехода в `GameOverScene`
- **Повторный Esc** закрывает меню паузы и возобновляет игру
- **Меню паузы** с пунктами: **Настройки**, **Начать с контрольной точки**, **Выход**
- При паузе геймплей **замораживается**: движение, урон, таймеры здоровья и камера не обновляются
- **Настройки** из паузы открывают экран настроек с возвратом обратно в игру (не в главное меню)
- **Начать с контрольной точки** — respawn на последней активированной контрольной точке (или на `player_spawn`, если чекпоинт не активирован), с fade как при уроне
- **Выход** — переход в `MainMenuScene` (с опциональным quick-save, если `main-menu-flow` уже реализован)
- Обновление подсказки управления: `Esc — пауза` вместо `Esc — game over`
- Смерть от hazard / 0 HP по-прежнему ведёт в `GameOverScene` (Esc не заменяет death flow)

**Non-goals:** пауза во время fade/respawn/level complete, отдельная сцена сохранения из паузы, подтверждение «Вы уверены?» при выходе, звуки/анимации меню паузы.

## Capabilities

### New Capabilities

- `pause-menu`: пауза геймплея по Esc, overlay-меню с навигацией и действиями (настройки, respawn, выход)

### Modified Capabilities

- `scene-lifecycle`: документированные переходы Game ↔ pause overlay ↔ Settings (in-game) ↔ MainMenu
- `mvp-integration`: Esc больше не является путём к GameOver; обновлён end-to-end flow с паузой
- `game-hud`: текст подсказки управления отражает паузу вместо game over
- `game-settings`: SettingsScene MUST поддерживать возврат в GameScene при открытии из паузы

## Impact

- `src/presentation/scenes/GameScene.ts` — pause state, overlay, обработка Esc
- `src/presentation/ui/` — новый `PauseMenuOverlay` (или аналог) на базе `MenuList`
- `src/presentation/scenes/SettingsScene.ts` — параметр `returnTo` / `previousScene` для возврата в Game
- `src/presentation/ui/hud/ControlsHintWidget.ts` — обновить текст подсказки
- `src/game/scene-data.ts` — тип данных для SettingsScene return context (при необходимости)
- `openspec/specs/scene-lifecycle`, `mvp-integration`, `game-hud`, `game-settings` — delta specs
- README — controls section (Esc = pause)
