# Platformer

Pet-проект 2D-платформера в духе тёмного фэнтези (*Blasphemous* как референс). Стек: TypeScript, Vite, Phaser 3.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (рекомендуется LTS)
- npm 10+

## Install

```bash
npm install
```

## Development

Запуск dev-сервера с hot reload:

```bash
npm run dev
```

Откройте в браузере URL из терминала (обычно `http://localhost:5173`). Phaser canvas 1920×1080 с scale mode FIT.

## Build

```bash
npm run build
```

Статические файлы собираются в `dist/`.

Превью production-сборки:

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Project structure

```
├── public/
│   └── assets/          # статические игровые ассеты
│       ├── maps/        # Tiled карты (JSON)
│       ├── images/      # спрайты, тайлсеты
│       └── audio/
│           ├── sfx/     # звуковые эффекты
│           └── music/   # музыка
├── src/
│   └── main.ts          # точка входа, Phaser GameConfig
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Path aliases (для будущих слоёв Clean Architecture):

| Alias | Path |
|-------|------|
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@presentation/*` | `src/presentation/*` |
| `@game/*` | `src/game/*` |

## Game vision

- 2D platformer, тёмная фэнтези-атмосфера, точное движение и exploration.
- Pet-проект для изучения workflow и границ технологий.
- **Non-goals**: multiplayer, procedural generation, коммерческий паритет с Blasphemous, custom physics engine.

## Next steps

После scaffold — change `platformer-architecture` (Clean Architecture слои, Composition Root).
