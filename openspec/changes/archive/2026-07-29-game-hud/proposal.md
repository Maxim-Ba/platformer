## Why

Во время игры `GameScene` показывает только подсказку по управлению. Игрок не видит состояние персонажа (здоровье, мана, энергия) и прогресс (очки). Без HUD игра ощущается как технический прототип, а не как играбельный платформер. Модули health и progression уже есть в composition root — осталось отобразить их в UI и добавить каркас для маны/энергии.

## What Changes

- **Модульный HUD** в `src/presentation/ui/hud/`: каждый блок — отдельный виджет с единым контрактом (`create`, `update`, `destroy`, `setPosition`)
- **Нижний левый угол**: виджеты **HP**, **Mana**, **Energy** — числовые значения current/max, обновляются каждый кадр из портов
- **Верхний правый угол**: виджет **Score** — очки (XP и уровень из `IProgressionPort`)
- **Каркас портов** `IManaPort` и `IEnergyPort` по паттерну feature modules (domain state → adapter → composition root), placeholder-значения до появления геймплейной механики
- **`GameHud`** — оркестратор: создаёт виджеты, задаёт начальные позиции из layout-конфига, вызывает `update()` в `GameScene`
- Подсказка по управлению остаётся (отдельный виджет или inline), не смешивается с ресурсными блоками
- Все HUD-элементы: `setScrollFactor(0)`, фиксированная глубина, не двигаются с камерой
- Layout-константы вынесены в один файл — смена позиции/стиля = правка конфига + виджет, без переписывания `GameScene`

**Non-goals:** анимированные полоски/спрайты, drag-and-drop layout editor, настройки HUD в Settings, звуки при изменении ресурсов, полноценная механика траты/восстановления маны и энергии.

## Capabilities

### New Capabilities

- `game-hud`: модульный in-game HUD — виджеты ресурсов и очков, layout-конфиг, интеграция в GameScene
- `player-resources`: порты маны и энергии (scaffold) — domain state, adapters, composition root binding

### Modified Capabilities

- `mvp-integration`: игровая сессия MUST отображать HUD с HP, mana, energy и score во время gameplay
- `player-health`: health state MUST быть доступен для HUD-виджета через `IHealthPort` (без изменения domain-логики)
- `player-progression`: progression state MUST быть доступен для score-виджета через `IProgressionPort`

## Impact

- `src/presentation/ui/hud/` — новые модули: `HudWidget`, `ResourceHudWidget`, `ScoreHudWidget`, `ControlsHintWidget`, `GameHud`, `hud-layout.ts`
- `src/application/ports/IManaPort.ts`, `IEnergyPort.ts` — новые порты
- `src/domain/value-objects/ManaState.ts`, `EnergyState.ts` — value objects
- `src/infrastructure/adapters/InMemoryManaAdapter.ts`, `InMemoryEnergyAdapter.ts` — adapters
- `src/game/composition-root.ts` — binding mana/energy ports; расширение `SceneDependencies` или доступ через `AppDependencies`
- `src/presentation/scenes/GameScene.ts` — замена inline `add.text` на `GameHud`
- `src/presentation/index.ts` — exports (при необходимости)
