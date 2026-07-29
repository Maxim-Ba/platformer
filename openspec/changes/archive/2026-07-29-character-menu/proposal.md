## Why

В игре уже есть доменный инвентарь (`IInventoryPort`), HUD ресурсов и прогрессии, но нет единого экрана персонажа для просмотра состояния героя во время уровня. Игроку нужен классический RPG-интерфейс с вкладками (инвентарь, скилы, характеристики, активные умения, карта), доступный по горячим клавишам без выхода из уровня. Сейчас — подходящий момент заложить UI-каркас с мок-контентом, чтобы позже подключить реальные данные без переделки навигации.

## What Changes

- **Меню персонажа** как in-scene overlay в `GameScene` (по аналогии с pause menu)
- **Пять вкладок-табов**: **Инвентарь**, **Скилы**, **Характеристики**, **Активные умения**, **Карта**
- **Горизонтальная навигация** между вкладками стрелками **Left/Right** (с wrap-around)
- **Отдельная горячая клавиша** для каждой вкладки — открывает меню сразу на нужном табе
- **Контент вкладок** — заглушки (placeholder-текст / mock-панели), без интеграции с реальными данными
- Повторное нажатие той же горячей клавиши или **Esc** закрывает меню
- На время открытого меню **геймплей замораживается** (movement, damage, camera, resource ticks)
- Обновление подсказки управления в HUD

**Non-goals:** реальное отображение предметов из `IInventoryPort`, система скилов/умений, мини-карта уровня, drag-and-drop в инвентаре, звуки/анимации открытия, пауза во время respawn/level complete.

## Capabilities

### New Capabilities

- `character-menu`: overlay-меню персонажа с табами, горячими клавишами, навигацией стрелками и mock-контентом вкладок

### Modified Capabilities

- `game-hud`: подсказка управления MUST включать горячие клавиши меню персонажа
- `scene-lifecycle`: документированные переходы Game ↔ character menu overlay
- `mvp-integration`: end-to-end flow с меню персонажа во время геймплея

## Impact

- `src/presentation/scenes/GameScene.ts` — обработка hotkeys, freeze state, open/close overlay
- `src/presentation/ui/` — новые `CharacterMenuOverlay`, `TabBar`, mock-панели вкладок
- `src/presentation/ui/hud/ControlsHintWidget.ts` — обновить текст подсказки
- `src/game/character-menu-keys.ts` (или аналог) — константы hotkeys и id вкладок
- `openspec/specs/game-hud`, `scene-lifecycle`, `mvp-integration` — delta specs
