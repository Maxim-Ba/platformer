## Why

Change `melee-combat` вводит один базовый враг с patrol и contact damage — этого недостаточно для разнообразного боя в Blasphemous-inspired платформере. Игроку нужны разные угрозы: наземные «танки», летающие преследователи, маги с дистанционной атакой. Без системы типов врагов каждый новый враг потребует копипасты логики и усложнит `GameScene`. Сейчас — правильный момент заложить archetype + behavior каркас, пока врагов мало.

## What Changes

- **Каталог archetypes** (`EnemyArchetype`): HP, размер hitbox, скорость, XP за kill, sprite key, ссылки на movement/attack behavior
- **Три стартовых типа** для playtest:
  - `grunt` — наземный patrol, contact damage, средний размер, 1–2 HP
  - `flyer` — полёт по синусоиде/патрулю в воздухе, contact damage, малый hitbox
  - `caster` — стоит на платформе, периодически выпускает magic projectile в сторону игрока
- **Единый контракт `Enemy`** (интерфейс / базовый тип): все виды врагов — экземпляры одной модели; различия задаются archetype + behaviors, а не отдельными классами в use cases
- **Лёгкое пополнение**: новый тип = запись в каталог archetypes + (при необходимости) регистрация behavior + `enemyType` в Tiled — без правок `GameScene`, `UpdateEnemies` и `IEnemyPort` consumers
- **Pluggable behaviors** в domain: `MovementBehavior` и `AttackBehavior` — чистые функции/strategy, тестируемые без Phaser
- **Расширение `EnemySpawn`**: обязательное свойство `enemyType`; опциональные override (`patrolDistance`, `aggroRange`)
- **Расширение `IEnemyPort`**: spawn по archetype, per-enemy behavior state, projectile registry для ranged attacks
- **Tiled**: `enemy_spawn` object type получает custom property `enemyType` (string enum)
- **Presentation**: placeholder-спрайты разного размера/цвета per archetype; `EnemySprite` factory по типу
- **Интеграция**: contact и projectile damage → `IHealthPort`; kill → `IProgressionPort` (XP из archetype)
- Unit-тесты: archetype resolution, movement behaviors, attack behaviors, projectile collision

**Non-goals:** боссы и multi-phase fights, pathfinding/navmesh, прыгающие враги, combo-реакции врагов, полноценные death/attack анимации, loot drops, spawn waves.

## Capabilities

### New Capabilities

- `enemy-archetypes`: единый интерфейс `Enemy`, каталог типов врагов — stats, dimensions, Tiled mapping, archetype resolution при spawn, data-driven extensibility
- `enemy-behaviors`: pluggable movement и attack strategies (patrol ground, fly hover, ranged cast), projectile domain rules

### Modified Capabilities

- `enemy-ai`: единый patrol-враг заменяется behavior-driven update; contact damage сохраняется, добавляются projectile attacks
- `level-pipeline`: `enemy_spawn` MUST поддерживать `enemyType` и опциональные behavior overrides
- `melee-combat`: kill reward и damage MUST учитывать per-archetype HP и XP (без изменения player attack rules)

## Impact

- `src/domain/` — `EnemyArchetype`, behavior interfaces, `ProjectileState`, расширение `EnemyRules`
- `src/domain/constants/enemies.ts` — archetype catalog
- `src/application/ports/IEnemyPort.ts` — расширение API (projectiles, archetype spawn)
- `src/application/use-cases/UpdateEnemies.ts` — делегирование в behaviors
- `src/infrastructure/adapters/InMemoryEnemyAdapter.ts` — behavior dispatch, projectile registry
- `src/infrastructure/tiled/TiledLevelRepository.ts` — парсинг `enemyType`
- `src/presentation/entities/EnemySprite.ts` — factory по archetype, размеры
- `src/presentation/entities/ProjectileSprite.ts` — новый (placeholder)
- `src/presentation/scenes/GameScene.ts` — sync projectiles
- `tiled/level-01.tmx` — несколько enemy_spawn с разными типами
- **Prerequisite:** `melee-combat` MUST быть применён (базовый `IEnemyPort`, combat loop)
