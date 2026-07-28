## Why

Этап 6: уровни из Tiled вместо hardcoded platforms — ключ к исследованию мира в духе *Blasphemous* и к workflow game dev с редактором карт.

## What Changes

- Tiled project + `level-01.tmx` / JSON export.
- Domain `LevelDefinition`, `TiledLevelRepository`, `LoadLevel` use case.
- Tilemap rendering, collision, object layers (spawn, exit, hazard, checkpoint).

## Capabilities

### New Capabilities

- `level-pipeline`: Tiled JSON, collision, object layer parsing.

### Modified Capabilities

- _(нет)_

## Impact

- **Файлы**: `tiled/`, `public/assets/maps/`, domain/application/infrastructure level modules.
- **Prerequisite**: `platformer-scene-lifecycle`.
- **Следующий change**: `platformer-mvp-integration`.

## Prerequisites

- Changes through `platformer-scene-lifecycle` MUST be complete.
