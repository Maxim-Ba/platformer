## Why

Этап 8: финальная проверка foundation — build, lint, tests, playtest, архитектурный audit. Закрывает MVP перед archive и sync specs.

## What Changes

- `npm run build` и `npm run lint` без ошибок.
- Unit tests pass.
- Manual playtest checklist.
- Review: no Phaser in domain/application.

## Capabilities

### New Capabilities

- `quality-gate`: verification checklist для foundation MVP.

### Modified Capabilities

- _(нет)_

## Impact

- **Действия**: CI-ready verification, no new features.
- **Prerequisite**: `platformer-mvp-integration`.
- **После apply**: archive each change + sync specs.

## Prerequisites

- Changes through `platformer-mvp-integration` MUST be complete.
