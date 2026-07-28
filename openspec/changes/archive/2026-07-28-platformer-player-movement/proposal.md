## Why

Этап 3: domain/application логика движения игрока — сердце platformer feel. Должна быть чистой (без Phaser) и покрытой unit-тестами, в духе точного управления *Blasphemous*.

## What Changes

- Value objects: `Vector2`, `Velocity`, `PlayerState`.
- Domain service `MovementRules`.
- Use case `UpdatePlayerMovement` с coyote time и jump buffer.
- Constants module для баланса.
- Unit-тесты movement edge cases.

## Capabilities

### New Capabilities

- `player-movement`: domain rules и use case движения (без Phaser).

### Modified Capabilities

- _(нет)_

## Impact

- **Файлы**: `src/domain/`, `src/application/use-cases/`, tests.
- **Prerequisite**: `platformer-architecture`.
- **Следующий change**: `platformer-infrastructure-adapters`.

## Prerequisites

- Changes `platformer-scaffold`, `platformer-architecture` MUST be complete.
