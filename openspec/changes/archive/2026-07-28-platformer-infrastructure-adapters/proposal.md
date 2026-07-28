## Why

Этап 4: связать domain movement с Phaser — input и physics через adapters (Dependency Inversion). Без этого use case остаётся мёртвым кодом.

## What Changes

- `PhaserInputAdapter` implements `IInputPort`.
- `PhaserPhysicsAdapter` implements `IPhysicsPort`.
- `PlayerSprite` presentation wrapper.
- Wiring в composition root (GameScene stub или minimal scene для проверки).

## Capabilities

### New Capabilities

- `infrastructure-adapters`: Phaser input/physics adapters и PlayerSprite.

### Modified Capabilities

- _(нет)_

## Impact

- **Файлы**: `src/infrastructure/phaser/`, `src/presentation/entities/`, обновление `composition-root.ts`.
- **Prerequisite**: `platformer-player-movement`.
- **Следующий change**: `platformer-scene-lifecycle`.

## Prerequisites

- Changes through `platformer-player-movement` MUST be complete.
