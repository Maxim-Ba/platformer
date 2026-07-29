## Context

Change `melee-combat` (prerequisite) вводит `IEnemyPort`, один patrol-враг с contact damage и 1 HP. `game-feature-modules` даёт `IHealthPort` и `IProgressionPort`. Архитектура — Clean Architecture с interface-first ports; domain rules тестируются без Phaser.

Задача этого change — расширить врагов до **каталога archetypes** с разными размерами, движением и атаками, не ломая consumers (`ExecuteMeleeAttack`, `UpdateEnemies`, `GameScene`).

## Goals / Non-Goals

**Goals:**

- Каталог `EnemyArchetype` с HP, hitbox size, speed, XP, movement/attack behavior id
- Три playtest-типа: `grunt`, `flyer`, `caster`
- Pluggable movement behaviors: `ground-patrol`, `fly-hover`
- Pluggable attack behaviors: `contact`, `ranged-cast`
- Projectile domain model + registry в `IEnemyPort`
- Tiled `enemyType` на `enemy_spawn`
- Per-type placeholder visuals (размер/цвет)
- Единый domain-контракт `Enemy` — все экземпляры врагов реализуют один интерфейс; новые типы добавляются data-driven через каталог
- Unit-тесты behaviors и archetype resolution

**Non-Goals:**

- Боссы, фазы, loot
- Pathfinding, jumping enemies, melee enemy attacks
- Полноценные spritesheet-анимации врагов
- Knockback, status effects (poison, stun)
- Spawn waves / dynamic spawning

## Decisions

### Architecture overview

```
GameScene.update()
  ├── ExecuteMeleeAttack (unchanged contract; enemies may have >1 HP)
  ├── UpdateEnemies
  │     ├── for each enemy: MovementBehavior.tick(state, context)
  │     ├── for each enemy: AttackBehavior.tick(state, context) → may spawn projectile
  │     ├── contact overlap → IHealthPort
  │     └── projectile-player overlap → IHealthPort
  └── sync EnemySprite + ProjectileSprite from port state
```

### Unified Enemy interface (extensibility contract)

Все враги — экземпляры одного domain-интерфейса `Enemy` (или type alias `EnemyState`). Конкретный «вид» не выражается отдельным классом в application/presentation слоях.

```typescript
/** Общий контракт для любого врага на уровне */
interface Enemy {
  id: string;
  archetypeId: EnemyTypeId;
  position: Vector2;
  hp: number;
  patrolDirection: -1 | 1;
  patrolMinX: number;
  patrolMaxX: number;
  behaviorTimerMs: number;
}
```

`EnemyState` MUST satisfy `Enemy`. `IEnemyPort.getEnemies()` MUST return `Enemy[]`. Behaviors, contact check, melee overlap и spawn работают только с `Enemy` + resolved `EnemyArchetype` — без `instanceof` и без switch по типу в consumers.

**Добавление нового вида врага (целевой workflow):**

1. Добавить `EnemyTypeId` и запись в `ENEMY_ARCHETYPES` (stats, behavior ids, sprite key)
2. При новом движении/атаке — зарегистрировать behavior в `behaviorRegistry.ts`
3. Указать `enemyType` на `enemy_spawn` в Tiled

Не требуется: правки `GameScene`, `UpdateEnemies`, `ExecuteMeleeAttack`, `IEnemyPort` signature.

**Запрещено:** отдельные классы `GruntEnemy`, `FlyerEnemy` с дублированием полей и разной логикой update в presentation/infrastructure.

### Archetype catalog (domain constants)

```typescript
type EnemyTypeId = 'grunt' | 'flyer' | 'caster';

interface EnemyArchetype {
  id: EnemyTypeId;
  maxHp: number;
  width: number;   // hitbox px
  height: number;
  speed: number;
  killXp: number;
  movementBehaviorId: MovementBehaviorId;
  attackBehaviorId: AttackBehaviorId;
  spriteKey: string; // placeholder asset key
}
```

| Type | HP | Size (W×H) | Movement | Attack | XP |
|------|-----|------------|----------|--------|-----|
| `grunt` | 2 | 32×48 | `ground-patrol` | `contact` | 25 |
| `flyer` | 1 | 24×24 | `fly-hover` | `contact` | 30 |
| `caster` | 2 | 28×40 | `ground-patrol` (patrolDistance=0 → idle) | `ranged-cast` | 40 |

Default `grunt` preserves melee-combat feel; grunt needs 2 hits with default player damage=1.

### Behavior strategy pattern

Behaviors — **pure functions** in `src/domain/enemy-behaviors/`:

```typescript
interface MovementContext {
  deltaMs: number;
  patrolMinX: number;
  patrolMaxX: number;
  floorY?: number; // for flyers: hover center Y
}

interface AttackContext {
  deltaMs: number;
  playerPosition: Vector2;
  enemyPosition: Vector2;
}

type MovementBehavior = (state: EnemyState, ctx: MovementContext) => EnemyState;
type AttackBehavior = (state: EnemyState, ctx: AttackContext) => AttackTickResult;

interface AttackTickResult {
  state: EnemyState;
  spawnedProjectiles: ProjectileSpawn[];
}
```

Registry maps `behaviorId → function` in domain module `behaviorRegistry.ts`. Adapter/use case resolves by archetype, not by switch in GameScene.

**`ground-patrol`**: reuse existing `EnemyRules.patrolStep` logic.

**`fly-hover`**: horizontal patrol + vertical offset `sin(time) * amplitude` (amplitude default 24px). Ignores gravity; no tile collision for Y (presentation-only hover; X bounded by patrol).

**`contact`**: no tick action; contact checked in `UpdateEnemies` via AABB (existing flow).

**`ranged-cast`**: every `CAST_INTERVAL_MS` (2000ms), if player within `AGGRO_RANGE` (320px), spawn projectile toward player. Projectile speed 200px/s, damage 1, lifetime 3000ms.

### Extended domain models

```typescript
// EnemyState implements Enemy (см. unified interface выше)
interface EnemyState extends Enemy {}

interface EnemySpawn {
  id: string;
  position: Vector2;
  enemyType: EnemyTypeId;
  patrolDistance?: number; // override archetype default
}

interface ProjectileState {
  id: string;
  ownerEnemyId: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  remainingMs: number;
}
```

### IEnemyPort extensions

Add to existing port (from melee-combat):

- `getProjectiles(): ProjectileState[]`
- `spawnEnemies(spawns)` resolves archetype from `enemyType`
- `tickProjectiles(deltaMs): void` — move, expire, remove off-screen
- `applyDamage` unchanged; uses per-enemy `hp` from archetype

### Tiled conventions

Extend `enemy_spawn` from melee-combat:

| Property | Required | Default | Notes |
|----------|----------|---------|-------|
| `enemyType` | yes | — | `grunt` \| `flyer` \| `caster` |
| `patrolDistance` | no | archetype-specific | grunt: 120, flyer: 160, caster: 0 |

Unknown `enemyType` → parser logs warning, skips spawn (or defaults to `grunt` — **default to grunt with warning** for level author friendliness).

### Presentation

- `EnemySprite.create(archetypeId)` — colored rect, dimensions from archetype
- `ProjectileSprite` — small circle/rect, purple for caster
- Flip sprite on `patrolDirection` for ground types

### Melee combat integration

- `ExecuteMeleeAttack` unchanged; reads enemy AABB from `IEnemyPort.getEnemies()` which includes archetype dimensions
- Kill XP: `progressionPort.addExperience(archetype.killXp)` instead of flat constant
- Grunt 2 HP → two hits to kill (validates multi-HP path)

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Per-type class hierarchy (`GruntEnemy extends EnemyBase` с override update в каждом классе) | Дублирование, сложнее тесты; consumers завязаны на конкретные классы |
| Data-only различия без общего `Enemy` интерфейса | Нет единого контракта; каждый новый тип ломает port API |
| Phaser physics bodies per enemy type | Domain untestable; keep AABB in domain |
| Separate `IProjectilePort` | Over-segmentation for pet project; projectiles owned by enemy subsystem |
| ECS (bitecs) | Over-engineering at current scale |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Flyer without tile collision clips through walls | X-axis patrol bounds from spawn; Y hover local — acceptable for v1 |
| Projectile spam from multiple casters | Per-enemy cast cooldown; max 3 active projectiles per caster |
| melee-combat not applied yet | Document prerequisite; tasks assume base port exists |
| Behavior registry grows messy | One file per behavior; registry is thin map |
| Scope creep to boss fights | Strict non-goals; 3 types only |

## Migration Plan

1. Domain: archetypes, behaviors, projectile rules + tests
2. Extend `EnemySpawn`, `LevelDefinition`, `EnemyState`
3. Extend `IEnemyPort` + adapter
4. Tiled parsing + level-01 placements
5. `UpdateEnemies` refactor to behavior dispatch
6. Presentation: sprite factory, projectiles
7. Playtest all three types on level-01

Rollback: set all spawns to `grunt` or remove enemy_spawn objects.

## Open Questions

- Caster `patrolDistance=0` stands still — **confirmed** for v1
- Flyer contact damage while hovering — **yes**, same as melee-combat contact rules
- Default unknown enemyType — **grunt with console warning**
