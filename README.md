# Platformer

Pet-проект 2D-платформера в духе тёмного фэнтези (*Blasphemous* как референс). Стек: TypeScript, Vite, Phaser 3.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (рекомендуется LTS)
- npm 10+

## Install

```bash
npm install
```

## Runtime assets (MinIO)

Runtime-файлы (png, svg, json-карты, аудио) **не в git**: каталоги под `public/assets/` в gitignore, остаются только `.gitkeep`. Источник правды — MinIO. `tiled/` остаётся в репозитории.

Clone → pull → dev:

```bash
git clone <repo>
npm install
npm run assets:pull
npm run dev
```

Git hook (`pre-push` runs `assets:push` → s3manager HTTPS):

```bash
git config core.hooksPath scripts/git-hooks
```

Credentials: `S3MANAGER_USER` / `S3MANAGER_PASSWORD` in `.env.local` (same as UI BasicAuth) for **both** `assets:push` and `assets:pull`. If they are missing, a terminal prompt asks. Git GUI without TTY: fill `.env.local` or `git push --no-verify`.

Одноразовые шаги оператора (не из CI):

- Seed: browser UI or `npm run assets:push` into prefix `assets/` (= `public/assets/`).
- Untrack: after prod playtest from `/media/`, `git rm --cached` runtime blobs, commit gitignore + `.gitkeep` (do not rewrite history).
- Local verify: `npm run assets:pull`, `npm run validate:maps`, `npm test`, `npm run build`.
- Cluster verify: MinIO Ready; `curl -sfI` map JSON on `/media/`; body is Tiled JSON not HTML; game loads sprites/maps from MinIO in the browser.

Browser UI: `https://minio-adminer.balashov-maxim.ru/` (BasicAuth / HTTP login). HTTP login ≠ MinIO root unless the operator reuses the password.

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

## Validate maps

Проверка Tiled JSON в `public/assets/maps/` (parse, двери, слои, граф мира):

```bash
npm run validate:maps
```

Запускайте после экспорта карт или правок `world-graph.ts`. Exit code `1` при errors; warnings не блокируют.

## Quality gate

Перед коммитом изменений в карты или игровой код:

```bash
npm run validate:maps
npm run quality
```

`npm run quality` = lint + test + `tsc`. Vitest не проверяет типы: ошибки вроде `TS2322` (`Uint8Array` vs DOM `Blob`) видны только компилятору. Полный паритет с Docker Quality: `npm run lint && npm run test && npm run build`.

## Project structure

```
├── public/
│   └── assets/          # runtime-файлы локально и в MinIO (gitignore png/svg/json/audio; в git только .gitkeep)
│       ├── maps/        # Tiled карты (JSON); в проде канонический URL /media/assets/maps/...
│       ├── images/      # спрайты, тайлсеты
│       │   └── player-sheet.png  # spritesheet игрока (см. Player assets)
│       ├── sprite/      # исходники анимаций (до сборки в sheet)
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
| Пауза | Esc (открыть/закрыть меню паузы в игре) |
| Меню персонажа (вкладки) | I — инвентарь, K — скилы, C — характеристики, U — умения, M — карта |
| Навигация по вкладкам меню персонажа | ← / → |
| Закрыть меню персонажа | Esc или повтор той же клавиши вкладки |
| Restart (на экране Game Over) | R / Enter |
| Retry (на экране Level Complete) | R |
| Next Level (на экране Level Complete, если есть следующий уровень) | N / Enter |
| Main Menu | M |
| Навигация по меню | ↑ / ↓ |
| Подтверждение в меню | Enter / Space |
| Настройки: громкость | ← / → (±0.1) |
| Настройки: fullscreen | Space |
| Назад (Настройки / Загрузка) | Esc |
| Пауза: навигация по пунктам | ↑ / ↓ |
| Пауза: подтверждение | Enter / Space |
| Пауза: Настройки | пункт «Настройки» (возврат в меню паузы по Esc) |
| Пауза: рестарт с чекпоинта | пункт «Начать с контрольной точки» |
| Пауза: выход в главное меню | пункт «Выход» (сохранение в slot-1) |

### Геймпад (Xbox / W3C layout, pad 0)

| Действие | Кнопка |
|----------|--------|
| Движение | Левый стик / D-pad ←→ |
| Прыжок | A |
| Рывок (dash) | Y |
| Атака | X |
| Пауза | Start |
| Меню персонажа (toggle) | Back / View |
| Переключение вкладок меню персонажа | LB / RB или D-pad ←→ |
| Закрыть меню / overlay | B |
| Навигация по меню | D-pad ↑↓ |
| Подтверждение в меню | A |
| Назад в меню | B |
| Настройки: громкость | D-pad ←→ |
| Настройки: fullscreen | A |

## Game flow

```
Main Menu
  ├─ Новая игра → Game (DEFAULT_LEVEL_ID, сброс progression/inventory)
  ├─ Загрузка → LoadGameScene → Game (восстановленный levelId и прогресс)
  └─ Настройки → SettingsScene → Main Menu (Esc)

Game → Level Complete (победа: выход level_exit)
     → Game Over (смерть: hazard, HP = 0)
     → Pause menu (Esc): Настройки / рестарт с чекпоинта / Выход → Main Menu
```

- **Главное меню:** три пункта — «Новая игра», «Загрузка», «Настройки». Навигация ↑↓, подтверждение Enter/Space.
- **Новая игра:** сброс progression/inventory через `StartNewGame`, старт с `DEFAULT_LEVEL_ID` (legacy) или `room-a` при включённом playtest мира.
- **Загрузка:** один quick-save слот (`slot-1`). Если сохранения нет — «Нет сохранений». Enter загружает прогресс.
- **Настройки:** master/music/sfx volume (← →), fullscreen (Space). Изменения сохраняются в localStorage.
- **Автосохранение:** при переходе в Main Menu с экранов Game Over / Level Complete (M) текущий прогресс сохраняется в слот `slot-1`.

- **Победа:** overlap с `level_exit` → fade-out → экран **Level Complete** (зелёный). Доступны Retry (R), Main Menu (M), Next Level (N/Enter — только если в `LEVEL_PROGRESSION` есть следующий уровень).
- **Поражение:** смерть от hazard (HP = 0) → экран **Game Over** (красный). Restart (R/Enter) или Main Menu (M).
- **Пауза:** Esc в игре открывает overlay с пунктами «Настройки», «Начать с контрольной точки», «Выход». Геймплей заморожен. Повторный Esc закрывает паузу. Настройки из паузы возвращают в меню паузы.

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
7. Валидация: `npm run validate:maps` — проверка parse, слоёв, дверей и графа мира (см. [level-authoring.md](docs/level-authoring.md#валидация-карт-npm-runvalidatemaps)).
8. Прод: `npm run assets:push` (или UI на `minio-adminer`) — иначе GitHub обновится, а бакет останется со старой картой.

При добавлении нового уровня: экспортируйте `level-02.json` и передайте `levelId` в `GameScene` (см. `DEFAULT_LEVEL_ID` в `src/game/constants.ts`).

### Mock room world playtest

Change `interconnected-world` добавляет связанные комнаты `room-a` ↔ `room-b` / `room-c` и арену `room-d` (все типы врагов) с переходом через объект Tiled `door` (без `LevelCompleteScene`).

| Флаг | Файл | Поведение |
|------|------|-----------|
| `WORLD_PLAYTEST_ENABLED` | `src/game/world-graph.ts` | `true` — «Новая игра» стартует в `room-a`; `false` — legacy `level-01` |

Исходники: `tiled/room-a.tmx` … `tiled/room-d.tmx`. Экспорт: `public/assets/maps/room-a.json` … `room-d.json`.

Проверка: `npm run dev` → Новая игра → дверь слева от спавна → `room-d` (grunt / flyer / caster). Правая дверь / край — `room-b`, нижний край — `room-c`. Сохранение в паузе пишет `currentRoomId` в save.

Чтобы вернуться к demo `level-01`, установите `WORLD_PLAYTEST_ENABLED = false` в `src/game/world-graph.ts`.

## Player assets

Игрок использует spritesheet `public/assets/images/player-sheet.png` (ключ текстуры: `player-sheet`).

| Параметр | Значение |
|----------|----------|
| Размер кадра | 172×172 px |
| Кадров в sheet | 18 (idle 8 + run 6 + jump 1 + fall 1 + attack 2) |
| Display size в игре | 32×48 px (`PlayerSprite`) |

### Диапазоны кадров анимаций

Конфигурация в `src/presentation/animation/playerSheetConfig.ts`:

| Анимация | Phaser key | Кадры | FPS | Повтор |
|----------|------------|-------|-----|--------|
| idle | `player-idle` | 0–7 | 8 | loop |
| run | `player-run` | 8–13 | 10 | loop |
| jump | `player-jump` | 14 | 1 | once |
| fall | `player-fall` | 15 | 1 | once |
| attack | `player-attack` | 16–17 | 12 | once |

Анимации сгенерированы в SpriteCook и собраны в `public/assets/images/player-sheet.png` через `scripts/build-player-sheet.py`.

### SpriteCook (генерация анимаций)

Базовый персонаж и анимации сгенерированы в SpriteCook:

| Роль | asset_id | Локальный файл |
|------|----------|----------------|
| Base character | `e885968f-c6b3-4246-8439-194f6863fc9a` | — |
| Idle (8 кадров) | `295e8bdc-d4bd-4195-8bf7-f2f1746182b8` | `public/assets/sprite/player-idle.png` |
| Run (10 кадров) | `fed0a14d-3b12-4b38-a1c8-adb13745421d` | `public/assets/sprite/player-run.png` |
| Jump (8 кадров) | `945ccaa7-4b73-4c64-9a95-e006369d66c0` | `public/assets/sprite/player-jump.png` |
| Fall | `9868e9a4-fb2e-4015-acc7-9da080e71623` | `public/assets/sprite/player-fall.png` |
| Attack (8 кадров) | `9345af40-1cba-4a74-8b4a-bfa812e68b53` | `public/assets/sprite/player-attack.png` |

Манифест: `spritecook-assets.json`.

После скачивания новых strips из SpriteCook:

1. Положить PNG в `public/assets/sprite/`.
2. Пересобрать sheet: `python3 scripts/build-player-sheet.py` (нужен Pillow).
3. При изменении раскладки кадров обновить `PLAYER_ANIM_FRAME_RANGES` в `playerSheetConfig.ts`.

### Замена spritesheet

1. Обновите `public/assets/sprite/player-idle.png` (8 кадров в горизонтальной полосе).
2. Скопируйте в `public/assets/images/player-sheet.png` или пересоберите через `python3 scripts/build-player-sheet.py` (требует Pillow).
3. При изменении размера кадра обновите `PLAYER_SHEET_FRAME_WIDTH` / `PLAYER_SHEET_FRAME_HEIGHT` в `playerSheetConfig.ts`.
4. Обновите `PLAYER_ANIM_FRAME_RANGES`, если меняется раскладка кадров.

Резолвер анимаций (`resolvePlayerAnimation`) — чистая функция без Phaser; тесты: `src/presentation/animation/resolvePlayerAnimation.test.ts`.

## Next steps

После scaffold — change `platformer-architecture` (Clean Architecture слои, Composition Root).
