## Why

Первый этап pet-проекта 2D-платформера (TypeScript + Vite + Phaser 3 + Tiled, референс *Blasphemous*). Репозиторий пустой — нужен рабочий bootstrap: сборка, dev-сервер, Phaser canvas, структура ассетов и документация.

## What Changes

- Инициализация Vite + TypeScript проекта.
- Подключение Phaser 3 с базовым `GameConfig` (1920×1080 Full HD, FIT, arcade physics, pixelArt).
- Layout `public/assets/` и ESLint + Prettier.
- README с инструкциями запуска.
- Фиксация game vision и non-goals проекта (контекст для последующих changes).

## Capabilities

### New Capabilities

- `project-scaffold`: Vite, TypeScript, Phaser bootstrap, tooling, README.
- `game-vision`: видение pet-проекта, референс Blasphemous, non-goals, метрики успеха.

### Modified Capabilities

- _(нет)_

## Impact

- **Зависимости**: `phaser`, `vite`, `typescript`, eslint, prettier.
- **Файлы**: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.ts`, `index.html`, `README.md`.
- **Следующий change**: `platformer-architecture` (требует готовый scaffold).

## Prerequisites

- Нет (первый change в цепочке из 8 этапов).
