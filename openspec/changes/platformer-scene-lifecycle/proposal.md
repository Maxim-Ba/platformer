## Why

Этап 5: игровой цикл через Phaser Scenes — Boot → Preload → Menu → Game → GameOver. Scenes остаются thin и делегируют логику use cases.

## What Changes

- Реализация 5 сцен с documented transitions.
- Central scene registry.
- PreloadScene с progress bar.
- GameScene update loop вызывает movement use case.

## Capabilities

### New Capabilities

- `scene-lifecycle`: сцены и правила переходов.

### Modified Capabilities

- _(нет)_

## Impact

- **Файлы**: `src/presentation/scenes/`, scene keys module, обновление game bootstrap.
- **Prerequisite**: `platformer-infrastructure-adapters`.
- **Следующий change**: `platformer-level-pipeline`.

## Prerequisites

- Changes through `platformer-infrastructure-adapters` MUST be complete.
