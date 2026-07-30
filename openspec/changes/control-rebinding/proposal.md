## Why

Схема настроек уже содержит `controls.keyBindings`, но `PhaserInputAdapter` и системные хоткеи (пауза, меню персонажа) захардкожены — игрок не может переназначить управление. Для комфортной игры на разных раскладках и подготовки к геймпаду (`gamepad-input`) нужен UI ребиндинга в настройках из главного меню и паузы.

## What Changes

- **Экран «Управление»** в SettingsScene (или отдельная подсекция): список игровых действий с текущей привязкой и режимом «нажмите клавишу»
- **Персистентность** через существующие `ISettingsPort` / `UpdateSettings` — обновление `controls.keyBindings`
- **Применение биндингов** в `PhaserInputAdapter` и системных хоткеях GameScene вместо хардкода
- **Расширяемая схема** `controls`: keyboard-биндинги сейчас; зарезервированное поле/структура для будущих gamepad-биндингов (без UI ребиндинга геймпада в этом change)
- **Валидация**: запрет дубликатов, отмена по Escape, сброс к дефолтам
- **Документированный каталог действий**: move left/right, jump, dash, attack, pause, character menu tabs (минимум геймплейные + pause)
- Обновление подсказки HUD с актуальными клавишами из настроек

**Non-goals:** UI ребиндинга кнопок геймпада, мёртвые зоны, профили контроллеров, touch-контролы, ребиндинг навигации в меню (стрелки/Enter остаются фиксированными).

## Capabilities

### New Capabilities

- `control-rebinding`: каталог игровых действий, UI переназначения клавиш, валидация и применение биндингов в runtime

### Modified Capabilities

- `game-settings`: SettingsScene MUST expose control rebinding; schema MUST document action ids and support future gamepad slot
- `infrastructure-adapters`: input adapter MUST read key bindings from settings, not hardcoded key codes
- `player-dash`: dash input MUST respect configured binding from settings
- `melee-combat`: attack input MUST respect configured binding from settings
- `pause-menu`: pause hotkey MUST respect configured binding from settings
- `game-hud`: controls hint MUST reflect current key bindings

## Impact

- `src/domain/types/GameSettings.ts` — типизированные action ids, опционально `gamepadBindings` placeholder
- `src/domain/constants/` — каталог `INPUT_ACTIONS`, дефолтные биндинги, лейблы для UI
- `src/domain/services/SettingsRules.ts` — валидация биндингов (уникальность, известные action ids)
- `src/infrastructure/phaser/PhaserInputAdapter.ts` — динамические клавиши из settings
- `src/presentation/scenes/SettingsScene.ts` — секция/режим «Управление»
- `src/presentation/scenes/GameScene.ts` — pause и character-menu hotkeys из settings
- `src/presentation/ui/hud/ControlsHintWidget.ts` — динамический текст
- `src/game/composition-root.ts` — передача settings в input adapter (или подписка на изменения)
- Связь с `gamepad-input`: composite adapter будет читать keyboard из settings; gamepad-маппинг остаётся в отдельном change
