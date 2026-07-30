## Why

Change `interconnected-world` добавил двери и граф комнат, но ошибки в Tiled JSON (битые `targetRoom`, дубли `doorId`, отсутствующие слои) обнаруживаются только в runtime — при загрузке уровня или при входе в дверь. В `design.md` interconnected-world build-time валидация отложена («Future: validate all `targetRoom` references at build time»). С ростом числа комнат ручной playtest перестаёт масштабироваться; нужен автоматический gate перед коммитом/CI.

## What Changes

- **Модуль валидации карт** — парсинг всех `public/assets/maps/*.json` через `TiledLevelRepository.parseMap` и набор правил
- **6 проверок:**
  1. Успешный parse каждого JSON (структура, `player_spawn`, слой `objects`)
  2. Уникальность `doorId` внутри комнаты
  3. Для каждой двери: `targetRoom.json` существует и содержит `targetDoor`
  4. Опционально (warning): обратная парность дверей A↔B
  5. Наличие слоёв `ground`, `decor`, `objects` и ожидаемых имён тайлсетов (`platformer`, `beast_soldier`)
  6. Сверка `WORLD_GRAPH` / `WORLD_ENTRY_ROOM_ID` с реальными файлами карт
- **CLI-скрипт** `npm run validate:maps` — exit code 1 при ошибках, warnings в stdout
- **Unit-тесты** валидатора на фикстурах (валидные/битые карты)
- **Документация** в `docs/level-authoring.md` и README — когда запускать валидацию

**Non-goals:** валидация геометрии (spawn на полу, reachability), визуальный preview, автогенерация TMX.

## Capabilities

### New Capabilities

- `map-validation`: build-time проверка Tiled JSON в `public/assets/maps/` — parse, doors, world graph, layers/tilesets

### Modified Capabilities

- `level-pipeline`: MUST document and enforce pre-runtime validation of exported maps
- `quality-gate`: MUST include `validate:maps` in verification checklist alongside build/lint/test

## Impact

- `src/infrastructure/tiled/MapValidator.ts` (или `src/domain/services/MapValidationRules.ts` + infrastructure runner)
- `scripts/validate-maps.ts` / `.mjs` — entry point
- `package.json` — script `validate:maps`
- `src/infrastructure/tiled/MapValidator.test.ts`
- `docs/level-authoring.md`, `README.md`
- Prerequisite: `interconnected-world` (door parsing, `WORLD_GRAPH`) MUST be applied
