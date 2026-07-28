## Why

Foundation MVP закрыт: движение, уровни, respawn работают, но hazard damage — мгновенный respawn без системы здоровья, нет настроек, прогрессии и инвентаря. Для развития игры в сторону Blasphemous-inspired loop (риск, награда, персистентность) нужны изолированные feature-модули с чёткими контрактами. Сейчас — правильный момент: архитектурный каркас (ports, composition root) уже есть, и новые подсистемы можно ввести по тому же паттерну до того, как GameScene разрастётся монолитом.

## What Changes

- Ввести четыре feature-модуля с port-интерфейсами в `src/application/ports/`:
  - **Player Health** — HP, урон, смерть, invulnerability frames
  - **Game Settings** — звук, видео, управление, скины (расширяемая схема)
  - **Player Progression** — опыт, уровни, разблокировки (минимальный каркас)
  - **Player Inventory** — предметы, слоты, add/remove/use (минимальный каркас)
- Каждый модуль: domain types/rules → application port + use cases → infrastructure adapter → wiring в composition root
- Потребители (scenes, use cases) зависят **только от интерфейсов**, не от конкретных классов
- Первичная интеграция: hazard damage проходит через `IHealthPort` вместо прямого respawn
- Placeholder-реализации для settings/progression/inventory (in-memory / localStorage), готовые к замене
- Обновить `architecture-foundation` spec: обязательное правило interface-first для feature-модулей
- Unit-тесты domain rules и use cases для health; smoke-тесты контрактов портов

## Capabilities

### New Capabilities

- `player-health`: управление здоровьем персонажа (HP, damage, death, invulnerability)
- `game-settings`: настройки игры (audio, video, controls, skins) с персистентностью
- `player-progression`: развитие персонажа (XP, levels, unlocks) — каркас
- `player-inventory`: инвентарь персонажа (items, slots, operations) — каркас

### Modified Capabilities

- `architecture-foundation`: добавить requirement о feature module ports и запрете прямых зависимостей от concrete implementations в consumers

## Impact

- `src/application/ports/` — 4 новых интерфейса
- `src/domain/` — entities/value objects/services для health, settings, progression, inventory
- `src/application/use-cases/` — use cases на каждый модуль
- `src/infrastructure/` — default adapters (InMemory, LocalStorage)
- `src/game/composition-root.ts` — bindings всех модулей
- `src/presentation/scenes/GameScene.ts` — hazard flow через health port
- `openspec/specs/` — 4 новых spec + delta для architecture-foundation
