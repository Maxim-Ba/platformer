## Why

Foundation MVP даёт exploration loop (движение, hazards, checkpoints), но без боя игра не ощущается как Blasphemous-inspired platformer — нет риска при встрече с врагом и награды за победу. Melee combat — первый gameplay-depth change после foundation: минимальный, но ощутимый скачок. Архитектурный каркас (ports, use cases, Tiled pipeline) готов; combat вводится по тому же interface-first паттерну, что и `game-feature-modules`.

## What Changes

- **Player melee attack**: клавиша атаки, hitbox перед игроком, cooldown, domain rules
- **Один тип врага**: patrol по платформе, contact damage игроку, 1 HP (умирает от одного удара)
- **Combat ports**: `ICombatPort` (attack state/cooldown), `IEnemyPort` (registry, update, damage) — consumers зависят только от интерфейсов
- **Tiled**: новый object type `enemy_spawn` с опциональными свойствами (`patrolDistance`)
- **Input**: расширение `IInputPort` методом `isAttackPressed()`
- **Интеграция**: contact damage врага → `IHealthPort` (если `game-feature-modules` применён) или временный inline damage
- **Награда**: XP за убийство через `IProgressionPort` (если доступен)
- **Presentation**: `EnemySprite` placeholder, attack hitbox debug rect (опционально)
- Unit-тесты: `CombatRules`, `EnemyRules`, `ExecuteMeleeAttack`, `UpdateEnemies`

**Non-goals в этом change**: боссы, combo system, block/parry, ranged attacks, сложный AI (преследование, прыжки), анимации атаки (placeholder VFX достаточно).

## Capabilities

### New Capabilities

- `melee-combat`: правила ближнего боя игрока — атака, hitbox, cooldown, урон врагам
- `enemy-ai`: враг с patrol AI, contact damage, смерть при получении урона

### Modified Capabilities

- `level-pipeline`: object type `enemy_spawn` в Tiled и парсинг в `LevelDefinition`
- `infrastructure-adapters`: attack input в `IInputPort` и `PhaserInputAdapter`
- `game-vision`: post-foundation combat scope — melee combat как следующая фаза развития

## Impact

- `src/domain/` — `CombatRules`, `EnemyRules`, entities (`EnemyDefinition`, `AttackState`)
- `src/application/ports/` — `ICombatPort`, `IEnemyPort`; расширение `IInputPort`
- `src/application/use-cases/` — `ExecuteMeleeAttack`, `UpdateEnemies`
- `src/infrastructure/` — `InMemoryCombatAdapter`, `InMemoryEnemyAdapter`
- `src/presentation/` — `EnemySprite`, attack VFX; изменения `GameScene`
- `src/game/composition-root.ts` — bindings
- `tiled/level-01.tmx` — добавить enemy_spawn для playtest
- Зависимость: рекомендуется после `game-feature-modules` (IHealthPort, IProgressionPort), но реализуемо с fallback
