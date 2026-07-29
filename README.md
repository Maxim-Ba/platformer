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

## Test

```bash
npm test
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

### MVP scope (Blasphemous-inspired, упрощённо)

MVP фокусируется на **ощущении игры**, а не на полном клоне Blasphemous:

| В MVP | Вне MVP (позже) |
|-------|-----------------|
| Движение и прыжок | Melee combat |
| Hazard damage + respawn на checkpoint | Боссы и сложный AI врагов |
| Один Tiled-уровень от spawn до exit | Несколько уровней, HUD жизней |
| Camera follow, fade при смерти | Аудио, полноценные анимации |

**Успех foundation:** рабочий dev pipeline (`npm run dev`), разделение слоёв Clean Architecture, хотя бы один unit-тест доменного правила (`npm test`), один Tiled-уровень загружается в runtime.

## Controls

| Действие | Клавиши |
|----------|---------|
| Движение | A/D или стрелки |
| Прыжок | Space |
| Game Over (отладка) | Esc |
| Restart (на экране Game Over) | R / Enter |
| Retry (на экране Level Complete) | R |
| Next Level (на экране Level Complete, если есть следующий уровень) | N / Enter |
| Main Menu | M |
| Навигация по меню | ↑ / ↓ |
| Подтверждение в меню | Enter / Space |
| Настройки: громкость | ← / → (±0.1) |
| Настройки: fullscreen | Space |
| Назад (Настройки / Загрузка) | Esc |

## Game flow

```
Main Menu
  ├─ Новая игра → Game (DEFAULT_LEVEL_ID, сброс progression/inventory)
  ├─ Загрузка → LoadGameScene → Game (восстановленный levelId и прогресс)
  └─ Настройки → SettingsScene → Main Menu (Esc)

Game → Level Complete (победа: выход level_exit)
     → Game Over (смерть: hazard / Esc)
```

- **Главное меню:** три пункта — «Новая игра», «Загрузка», «Настройки». Навигация ↑↓, подтверждение Enter/Space.
- **Новая игра:** сброс progression/inventory через `StartNewGame`, старт с `DEFAULT_LEVEL_ID`.
- **Загрузка:** один quick-save слот (`slot-1`). Если сохранения нет — «Нет сохранений». Enter загружает прогресс.
- **Настройки:** master/music/sfx volume (← →), fullscreen (Space). Изменения сохраняются в localStorage.
- **Автосохранение:** при переходе в Main Menu с экранов Game Over / Level Complete (M) текущий прогресс сохраняется в слот `slot-1`.

- **Победа:** overlap с `level_exit` → fade-out → экран **Level Complete** (зелёный). Доступны Retry (R), Main Menu (M), Next Level (N/Enter — только если в `LEVEL_PROGRESSION` есть следующий уровень).
- **Поражение:** смерть от hazard или Esc (отладка) → экран **Game Over** (красный). Restart (R/Enter) или Main Menu (M).

Порядок уровней задаётся в `src/game/constants.ts` (`LEVEL_PROGRESSION`).

## Tiled workflow

Исходники карт лежат в `tiled/`, runtime-экспорт — в `public/assets/maps/`.

1. Откройте проект `tiled/platformer.tiled-project` в [Tiled Map Editor](https://www.mapeditor.org/).
2. Редактируйте `tiled/level-01.tmx` (слои `ground`, `decor`, object layer `objects`).
3. **Object types** на слое `objects` (обязательные для парсера):
   - `player_spawn` — ровно один объект старта
   - `checkpoint` — точки респавна
   - `hazard` — зоны урона
   - `level_exit` — выход с уровня
4. Экспорт: **File → Export As…** → JSON → сохранить как `public/assets/maps/level-01.json`.
5. Тайлсет: PNG в `public/assets/tilesets/platformer-tiles.png` (источник — `tiled/tilesets/`).
6. Проверка: `npm run dev` → Main Menu → уровень загружается из `assets/maps/level-01.json`.

При добавлении нового уровня: экспортируйте `level-02.json` и передайте `levelId` в `GameScene` (см. `DEFAULT_LEVEL_ID` в `src/game/constants.ts`).

## Next steps

После scaffold — change `platformer-architecture` (Clean Architecture слои, Composition Root).
