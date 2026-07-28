## Why

Этап 7: собрать playable MVP loop — sprite, camera, death/respawn, полный проход уровня. Здесь реализуется «ощущение игры» из game vision.

## What Changes

- Placeholder player sprite / animations optional.
- Camera follow + world bounds.
- Death + respawn at checkpoint с fade.
- End-to-end verification: Menu → level → death → respawn → exit → GameOver.
- README: Tiled workflow + scope notes.

## Capabilities

### New Capabilities

- `mvp-integration`: camera, respawn, placeholder art, full loop, docs.

### Modified Capabilities

- `game-vision`: добавляются MVP scope boundary и success metrics (delta).

## Impact

- **Файлы**: GameScene enhancements, camera, respawn logic, README updates.
- **Prerequisite**: `platformer-level-pipeline`.
- **Следующий change**: `platformer-quality-gate`.

## Prerequisites

- Changes through `platformer-level-pipeline` MUST be complete.
