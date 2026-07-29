## Why

В progression уже заложен unlock `dash` на 2 уровне, но сама механика рывка не реализована — игрок не получает награду за прогрессию и не может использовать dodge как основной инструмент выживания в platformer. Рывок с неуязвимостью на время действия — стандартная механика для Blasphemous-inspired combat loop: позволяет проходить hazards и врагов с точным таймингом, не ломая существующую систему HP/invulnerability frames.

## What Changes

- **Dash ability**: быстрый рывок в направлении взгляда (или последнего горизонтального ввода), фиксированная дистанция/скорость и длительность
- **Invulnerability during dash**: пока активен рывок, игрок не получает урон от hazards и (при наличии) contact damage врагов
- **Progression gate**: рывок доступен только если `IProgressionPort.isUnlocked('dash')`
- **Cooldown**: после рывка — перезарядка, настраиваемая константа
- **Input**: новая клавиша рывка (Shift / K) через `IInputPort`
- **Domain layer**: `DashRules`, `DashState`, use case `ExecuteDash` / интеграция в movement loop
- **Port**: `IDashPort` для состояния рывка и cooldown (interface-first)
- **Presentation**: визуальный feedback (tint/alpha) во время рывка; без полноценной анимации в v1
- Unit-тесты: `DashRules`, `ExecuteDash`, интеграция с invulnerability

**Non-goals в этом change**: air dash, multi-dash chains, dash attack, stamina cost, dash через стены, анимация dash spritesheet, dash cancel into attack.

## Capabilities

### New Capabilities

- `player-dash`: правила рывка — активация, направление, длительность, cooldown, неуязвимость на время рывка

### Modified Capabilities

- `player-movement`: movement loop учитывает активный dash (override velocity, блокировка обычного управления)
- `player-health`: dash MUST grant invulnerability for dash duration via health port
- `player-progression`: dash input/action MUST respect unlock id `dash`
- `infrastructure-adapters`: `isDashPressed()` в `IInputPort` и `PhaserInputAdapter`

## Impact

- `src/domain/` — `DashRules`, `DashState`, constants (`DASH_SPEED`, `DASH_DURATION_MS`, `DASH_COOLDOWN_MS`)
- `src/application/ports/` — `IDashPort`; расширение `IInputPort`
- `src/application/use-cases/` — `ExecuteDash`, изменения `UpdatePlayerMovement` или отдельный `UpdatePlayerDash`
- `src/infrastructure/` — `InMemoryDashAdapter`
- `src/presentation/` — изменения `GameScene` (dash tick, invulnerability grant, hazard skip)
- `src/game/composition-root.ts` — bindings
- Зависимости: `player-health`, `player-progression`, `player-movement` (уже в main specs)
