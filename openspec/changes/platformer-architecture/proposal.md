## Why

После bootstrap (этап 1) нужно заложить Clean Architecture и SOLID до написания gameplay — иначе Phaser-логика «просачивается» в domain и проект становится сложно тестировать и расширять.

## What Changes

- Создание слоёв: `domain/`, `application/`, `infrastructure/`, `presentation/`, `game/`.
- Port interfaces: `IInputPort`, `IPhysicsPort`, `ILevelRepository`.
- Composition Root с placeholder bindings.
- ESLint guard против `phaser` imports в domain/application.
- Vitest skeleton для domain-тестов.

## Capabilities

### New Capabilities

- `architecture-foundation`: слои CA, SOLID, composition root, directory structure.

### Modified Capabilities

- _(нет)_

## Impact

- **Файлы**: структура `src/` по слоям, `composition-root.ts`, port interfaces, eslint rule, vitest config.
- **Следующий change**: `platformer-player-movement`.
- **Prerequisite**: `platformer-scaffold` (apply complete).

## Prerequisites

- Change `platformer-scaffold` MUST be applied and archived (or tasks complete).
