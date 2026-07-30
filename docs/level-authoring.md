# Руководство по созданию уровней

Это руководство описывает, как проектировать и подключать уровни в platformer. На момент написания в игре есть один playtest-уровень (`level-01`); вы можете использовать его как шаблон для своего первого уровня.

## Как устроен пайплайн

```
tiled/level-XX.tmx          ← исходник в Tiled (рекомендуется)
        ↓ экспорт JSON
public/assets/maps/level-XX.json   ← runtime-файл, который грузит игра
        ↓
TiledLevelRepository        ← парсит объекты в LevelDefinition
        ↓
GameScene                   ← рендерит тайлы + спавнит игрока, врагов, hazard и т.д.
```

Игра загружает карту по `levelId`: файл `public/assets/maps/{levelId}.json`. Порядок уровней в кампании задаётся в `src/game/constants.ts` (`LEVEL_PROGRESSION`).

---

## Способы создания уровня

### 1. Tiled Map Editor (основной, рекомендуемый)

Единственный полноценный способ для production-уровней: визуальный редактор, тайлы, объекты, экспорт в JSON.

**Плюсы:** быстрое прототипирование, видно геометрию и объекты, совпадает с тем, что ожидает `GameScene`.

**Минусы:** нужно установить [Tiled](https://www.mapeditor.org/) и не забывать экспортировать JSON после правок.

### 2. Ручное редактирование Tiled JSON

Можно создать или скопировать `public/assets/maps/level-02.json` и править JSON напрямую (или сгенерировать скриптом). Формат — стандартный [Tiled JSON map format](https://doc.mapeditor.org/en/stable/reference/json-map-format/).

**Когда имеет смысл:** автогенерация уровней, массовые правки, CI-скрипты.

**Минусы:** легко ошибиться в `firstgid`, размерах слоя, типах объектов; нет визуального превью. Для первого уровня не рекомендуется.

Минимально валидная карта должна содержать:

- слои `ground` и `decor` (tilelayer);
- слой `objects` (objectgroup);
- ровно один объект `player_spawn`;
- tileset с property `solid: true` на коллизионных тайлах.

### 3. Дублирование существующего уровня

Самый быстрый старт для первого собственного уровня:

1. Скопировать `tiled/level-01.tmx` → `tiled/level-02.tmx`.
2. Скопировать экспорт → `public/assets/maps/level-02.json`.
3. Править копию в Tiled.

Так вы сохраняете все слои, тайлсеты и object types.

### 4. PlaceholderLevelRepository (только для разработки/тестов)

В коде есть `PlaceholderLevelRepository` — заглушка без геометрии (пустые bounds, spawn в `(0, 0)`). Она **не подключена** в `composition-root.ts` и **не подходит** для игровых уровней: `GameScene` всё равно ожидает загруженный tilemap JSON.

Используется в unit-тестах application-слоя, когда нужен `LevelDefinition` без ассетов.

### 5. Процедурная генерация

В vision проекта procedural generation указан как **non-goal**. Отдельного генератора уровней в репозитории нет. Теоретически можно писать скрипт, который выдаёт Tiled JSON (см. способ 2), но это отдельная задача.

---

## Подготовка окружения

1. Установите [Tiled Map Editor](https://www.mapeditor.org/) (в проекте использовалась 1.10+).
2. Откройте проект: `tiled/platformer.tiled-project`.
3. Убедитесь, что dev-сервер запущен:

```bash
npm run dev
```

4. Проверьте, что текущий уровень грузится: Main Menu → Новая игра.

---

## Пошагово: первый уровень в Tiled

### Шаг 1. Создать карту

1. **File → New → New Map…**
   - Orientation: **Orthogonal**
   - Tile layer format: **CSV**
   - Tile render order: **Right Down**
   - Map size и **Tile size: 32×32** (размер тайла зафиксирован в проекте).

2. Сохраните как `tiled/level-02.tmx` (или другое имя; `levelId` = имя файла без расширения).

### Шаг 2. Подключить тайлсеты

В `level-01` используются два тайлсета:

| Имя в карте   | Файл тайлсета              | PNG                                      | Назначение        |
|---------------|----------------------------|------------------------------------------|-------------------|
| `platformer`  | `tiled/tilesets/platformer.tsx` | `public/assets/tilesets/platformer-tiles.png` | Базовая земля     |
| `beast_soldier` | внешний `.tsx` (см. level-01) | `public/assets/tilesets/beast_soldier.png`    | Декор, окружение  |

**Map → Add External Tileset…** и выберите `tiled/tilesets/platformer.tsx`.

Для декора скопируйте подключение `beast_soldier` из `level-01.tmx` или добавьте external tileset вручную, если у вас есть соответствующий `.tsx`.

### Шаг 3. Создать слои

Имена слоёв **обязательны** и чувствительны к регистру:

| Слой      | Тип          | Назначение                                      |
|-----------|--------------|-------------------------------------------------|
| `ground`  | Tile Layer   | Коллизионная геометрия (пол, стены, платформы) |
| `decor`   | Tile Layer   | Визуальный декор без коллизии                   |
| `objects` | Object Layer | Спавны, выход, hazard, checkpoint, враги        |

Порядок отрисовки в игре: `ground` (depth 0) → `decor` (depth 1) → игрок и объекты поверх.

### Шаг 4. Настроить коллизию тайлов

Коллизия определяется **custom property на тайле**, не на слое:

- Property: `solid`
- Type: `bool`
- Value: `true` — тайл блокирует игрока; `false` — проходимый.

В `platformer` тайл id 0 — solid, id 1 — не solid. Для тайлов из `beast_soldier` при необходимости задайте `solid: true` в Tileset Editor (Tiled: клик по тайлу → Custom Properties).

Слой `ground` ренерится с `setCollisionByProperty({ solid: true })`. Слой `decor` коллизии не даёт.

### Шаг 5. Разместить объекты на слое `objects`

Создайте **Object Layer** с именем `objects`. Для каждого объекта задайте поле **Type** (не только Name).

#### Обязательные и опциональные типы

| Type            | Количество | Описание |
|-----------------|------------|----------|
| `player_spawn`  | **ровно 1** | Старт игрока. Позиция = центр по X, низ прямоугольника по Y («ноги»). |
| `level_exit`    | ≥ 0        | Зона победы (прямоугольник). Overlap → Level Complete. |
| `checkpoint`    | ≥ 0        | Контрольная точка респавна после смерти. |
| `hazard`        | ≥ 0        | Зона урона (шипы, лава и т.п.). |
| `enemy_spawn`   | ≥ 0        | Точка появления врага. |

В `tiled/platformer.tiled-project` уже заведены типы `player_spawn`, `level_exit`, `hazard`, `checkpoint`. Тип `enemy_spawn` при необходимости добавьте в **Project → Project Properties → Object Types** (или задайте Type вручную в свойствах объекта).

#### Custom properties для `enemy_spawn`

| Property         | Type   | Обязательно | Значения / по умолчанию |
|------------------|--------|-------------|-------------------------|
| `enemyType`      | string | нет         | `grunt`, `flyer`, `caster`. По умолчанию: `grunt`. |
| `patrolDistance` | int    | нет         | Полуширина патруля от точки спавна (px). См. таблицу ниже. |

**Дефолтные `patrolDistance` по архетипу** (если property не задано):

| enemyType | defaultPatrolDistance | Поведение |
|-----------|----------------------|-----------|
| `grunt`   | 120                  | Патруль по земле |
| `flyer`   | 160                  | Парение в воздухе |
| `caster`  | 0                    | Стоит на месте, стреляет |

Размер прямоугольника `enemy_spawn` желательно согласовать с хитбоксом архетипа (`src/domain/constants/enemies.ts`).

#### Координаты объектов

- Tiled использует пиксели, origin объекта — **верхний левый угол**.
- Для `player_spawn` и `enemy_spawn` игра берёт позицию «ног»: `(x + width/2, y + height)`.
- Для `level_exit`, `hazard`, `checkpoint` — прямоугольник `(x, y, width, height)` как в Tiled.

Совет: выставляйте нижнюю грань spawn-объекта на поверхность платформы (как в `level-01`).

### Шаг 6. Настроить экспорт

В `level-01.tmx` задан путь экспорта:

```xml
<export target="../public/assets/maps/level-01.json" format="json"/>
```

Для нового уровня в Tiled: **Map → Map Properties → Export** (или через `editorsettings` в `.tmx`):

- Format: **JSON**
- Target: `../public/assets/maps/level-02.json`

Так исходник остаётся в `tiled/`, а игра читает JSON из `public/`.

### Шаг 7. Экспортировать и подключить уровень в игре

1. **File → Export As…** → сохранить в `public/assets/maps/level-02.json`.
2. Добавить id в прогрессию (`src/game/constants.ts`):

```ts
export const LEVEL_PROGRESSION: readonly string[] = ['level-01', 'level-02'] as const;
```

3. Чтобы стартовать с нового уровня (опционально):

```ts
export const DEFAULT_LEVEL_ID = 'level-02';
```

4. `npm run dev` → проверить загрузку, коллизии, spawn, exit.

Игра подгружает карту в `GameScene.preload`:

```ts
this.load.tilemapTiledJSON(mapCacheKey(this.levelId), `assets/maps/${this.levelId}.json`);
```

Имена тайлсетов в JSON (`platformer`, `beast_soldier`) должны совпадать с тем, что ожидает `GameScene` при `addTilesetImage`.

---

## Чеклист перед коммитом

- [ ] Есть `tiled/level-XX.tmx` (исходник).
- [ ] Экспортирован `public/assets/maps/level-XX.json`.
- [ ] Слои: `ground`, `decor`, `objects`.
- [ ] Ровно один `player_spawn`.
- [ ] Есть хотя бы один `level_exit` (иначе уровень нельзя «пройти»).
- [ ] Коллизионные тайлы помечены `solid: true`.
- [ ] `levelId` добавлен в `LEVEL_PROGRESSION`, если нужен в кампании.
- [ ] Playtest: spawn, прыжки, hazard, checkpoint, враги, выход.

---

## Типичные ошибки

| Симптом | Вероятная причина |
|---------|-------------------|
| `missing required object layer "objects"` | Нет слоя `objects` или другое имя слоя. |
| `must contain exactly one "player_spawn"` | Ноль или несколько spawn-объектов. |
| `Tilemap is not loaded` | Нет JSON в `public/assets/maps/` или неверный `levelId`. |
| `Failed to bind tilesets` | В JSON другое `name` тайлсета (не `platformer` / `beast_soldier`). |
| Игрок падает сквозь пол | Тайлы без `solid: true` или пол нарисован только на `decor`. |
| Враг не того типа | Неверное значение `enemyType` → fallback на `grunt` с warning в консоли. |
| Изменения в Tiled не видны в игре | Забыли экспорт JSON; нужен re-export в `public/assets/maps/`. |

---

## Справка: доменная модель уровня

Парсер (`TiledLevelRepository`) превращает JSON в `LevelDefinition`:

- `bounds` — размер карты в пикселях (`width × tilewidth`, `height × tileheight`).
- `playerSpawn` — одна точка.
- `exits`, `hazards`, `checkpoints`, `enemySpawns` — массивы.

Подробнее: `src/domain/entities/LevelDefinition.ts`, спека `openspec/specs/level-pipeline/spec.md`.

---

## Рекомендуемый workflow для новичка

1. Открыть `tiled/platformer.tiled-project`.
2. Duplicate `level-01.tmx` → свой `level-02.tmx`.
3. Упростить геометрию: пол, несколько платформ, один hazard, один checkpoint, exit справа.
4. Подвинуть `player_spawn` и один `enemy_spawn` (`grunt`).
5. Export → `public/assets/maps/level-02.json`.
6. Добавить `level-02` в `LEVEL_PROGRESSION`.
7. Playtest в браузере.

После первого проходного уровня можно усложнять: больше врагов (`flyer`, `caster`), декор из `beast_soldier`, длиннее карта (увеличить width/height карты в Tiled).

---

## Большой связанный мир (как в Blasphemous)

Текущий pipeline рассчитан на **отдельный уровень** с выходом через `level_exit` и экраном победы. Для большого мира с «бесшовными» переходами между локациями нужна другая модель: граф комнат, двери вместо линейного exit, смена карты без перезагрузки сцены.

Подробно: **[world-design.md](./world-design.md)** — стратегии (мега-карта / граф комнат / гибрид), workflow в Tiled, стыковка дверей, камера, что потребуется в коде.

---

## Связанные файлы

| Путь | Роль |
|------|------|
| `tiled/platformer.tiled-project` | Проект Tiled, object types |
| `tiled/level-01.tmx` | Образец уровня |
| `public/assets/maps/*.json` | Runtime-карты |
| `public/assets/tilesets/` | PNG тайлсетов |
| `src/infrastructure/tiled/TiledLevelRepository.ts` | Парсинг JSON |
| `src/presentation/scenes/GameScene.ts` | Рендер и геймплей |
| `src/game/constants.ts` | `DEFAULT_LEVEL_ID`, `LEVEL_PROGRESSION` |
