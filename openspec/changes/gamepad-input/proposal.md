## Why

Сейчас вся игра управляется только с клавиатуры: `PhaserInputAdapter` читает A/D, стрелки и Space; меню (`MenuList`, `SettingsScene`, `LoadGameScene`, меню персонажа) слушают `window keydown`. На диване или с геймпада играть нельзя — это базовый UX-гэп для платформера, особенно после появления HUD, главного меню, паузы и меню персонажа. Поддержка геймпада — естественное расширение `IInputPort` и presentation-слоя без изменения domain rules.

## What Changes

- **Подключение геймпада** через Phaser Gamepad Plugin (pad index 0, hot-plug при подключении)
- **Расширение `IInputPort`** — геймпад как равноправный источник ввода наряду с клавиатурой (composite adapter в composition root)
- **Геймплей**: левый стик / D-pad — движение; **A** — прыжок; **Start** — пауза; **B** — закрыть overlay; горячие кнопки меню персонажа через **LB/RB** (цикл табов) и **Back/View** (открыть/закрыть меню на последнем табе)
- **Меню** (MainMenu, LoadGame, Settings, Pause, Character menu): D-pad ↑↓ — навигация; D-pad ←→ — переключение табов (character menu); **A** — подтверждение; **B** — назад/закрыть
- **Общий presentation-хелпер** для menu/gamepad input вместо дублирования `keydown` в каждой сцене
- Обновление подсказки управления в HUD и README
- Будущие методы `IInputPort` (attack, dash) автоматически покрываются тем же composite-паттерном

**Non-goals:** ребиндинг кнопок в UI, поддержка нескольких геймпадов, вибрация, аналоговый триггер для атаки, touch-контролы, PlayStation-специфичные иконки в подсказках.

## Capabilities

### New Capabilities

- `gamepad-input`: подключение геймпада, маппинг кнопок, composite input и навигация в меню

### Modified Capabilities

- `infrastructure-adapters`: `IInputPort` MUST агрегировать keyboard + gamepad; документированный маппинг кнопок
- `game-hud`: подсказка управления MUST упоминать геймпад
- `scene-lifecycle`: сцены с меню MUST поддерживать gamepad-навигацию наравне с клавиатурой
- `mvp-integration`: end-to-end сессия MUST быть проходима с геймпада; README MUST документировать раскладку

## Impact

- `src/infrastructure/phaser/PhaserGamepadReader.ts` — новый модуль чтения pad state
- `src/infrastructure/phaser/CompositeInputAdapter.ts` — объединение keyboard + gamepad
- `src/infrastructure/phaser/PhaserInputAdapter.ts` — рефакторинг (только keyboard) или оставить как есть
- `src/application/ports/IInputPort.ts` — при необходимости расширение (attack/dash из других changes)
- `src/presentation/input/` — `GamepadButtonMap`, `createMenuInputHandler`, `pollGamepadJustDown`
- `src/presentation/ui/MenuList.ts`, `CharacterMenuOverlay.ts` — gamepad navigation
- `src/presentation/scenes/GameScene.ts` — system actions (pause, character menu) с геймпада
- `src/presentation/scenes/MainMenuScene.ts`, `SettingsScene.ts`, `LoadGameScene.ts` — gamepad в меню
- `src/presentation/ui/hud/ControlsHintWidget.ts` — обновить текст
- `src/game/composition-root.ts` — wiring composite adapter
- `src/game/bootstrap.ts` — включить Phaser gamepad plugin при необходимости
- README — секция controls (gamepad layout)
