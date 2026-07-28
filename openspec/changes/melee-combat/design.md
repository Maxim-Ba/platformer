## Context

Foundation MVP завершён. `game-feature-modules` (in-progress) вводит `IHealthPort` и `IProgressionPort`. Сейчас в игре нет combat: hazard — единственный источник урона, врагов нет.

Blasphemous-inspired combat для pet-project: точный timing, короткий cooldown, один удар — один kill на базовом враге. Не full combat system.

## Goals / Non-Goals

**Goals:**

- Игрок атакует клавишей (J или X), hitbox наносит урон врагам в зоне
- Один enemy archetype: horizontal patrol, contact damage, 1 HP
- Domain rules testable без Phaser
- Ports `ICombatPort`, `IEnemyPort` — interface-first, wiring в composition root
- Tiled `enemy_spawn` → spawn врагов на уровне
- Интеграция с `IHealthPort` для contact damage
- XP reward через `IProgressionPort` при kill

**Non-Goals:**

- Combo chains, charged attacks, weapon switching
- Boss fights, multi-phase enemies
- Pathfinding, jumping enemies, ranged enemies
- Full attack animation spritesheet (placeholder flash/hitbox rect)
- Knockback physics (можно добавить позже)
- Multiplayer hit detection

## Decisions

### Combat architecture

```
GameScene.update()
  ├── UpdatePlayerMovement (existing)
  ├── ExecuteMeleeAttack (if attack input)
  │     └── CombatRules → ICombatPort + IEnemyPort.applyDamage
  ├── UpdateEnemies (patrol + contact check)
  │     └── EnemyRules → IEnemyPort + IHealthPort.applyDamage
  └── sync sprites
```

### Port interfaces

**ICombatPort** — состояние атаки игрока:
- `getAttackState(): AttackState` (cooldown remaining, isAttacking)
- `startAttack(facingDirection): void`
- `tick(deltaMs): void`

**IEnemyPort** — registry врагов на сцене:
- `spawnEnemies(definitions: EnemySpawn[]): void`
- `getEnemies(): EnemyState[]`
- `applyDamage(enemyId, amount): boolean` (returns true if killed)
- `update(deltaMs): void` (patrol movement)
- `removeEnemy(enemyId): void`

Consumers (GameScene, use cases) — только interfaces.

### Domain models

```typescript
// AttackState
{ cooldownRemainingMs: number; attackActiveMs: number; facingDirection: -1 | 1 }

// EnemyState  
{ id: string; position: Vector2; hp: number; patrolDirection: -1 | 1; 
  patrolMinX: number; patrolMaxX: number; speed: number }

// EnemySpawn (from LevelDefinition)
{ id: string; position: Vector2; patrolDistance: number }
```

### CombatRules (pure)

- Attack cooldown: 400ms (configurable constant)
- Attack active window: 150ms (hitbox active)
- Hitbox: 48×32 px offset in facing direction from player feet
- Damage per hit: 1 (one-shot basic enemy)

### EnemyRules (pure)

- Patrol: move horizontally at `ENEMY_SPEED`, reverse at patrol bounds
- Patrol bounds: spawn X ± `patrolDistance` (default 120px)
- Contact damage: 1 HP to player on AABB overlap (respects player invulnerability)
- Enemy HP default: 1

### Input extension

`IInputPort.isAttackPressed(): boolean` — J key (and X as alternate).

Extend `InputSnapshot` optionally, or read attack directly in use case via port.

### Tiled conventions

New object type on `objects` layer:

| Type | Required props | Optional props |
|------|----------------|----------------|
| `enemy_spawn` | position | `patrolDistance` (number, default 120) |

Parser in `TiledLevelRepository` → `LevelDefinition.enemySpawns`.

### Health / Progression integration

**If `game-feature-modules` applied:**
- Enemy contact → `healthPort.applyDamage(ENEMY_CONTACT_DAMAGE)`
- Enemy kill → `progressionPort.addExperience(ENEMY_KILL_XP)` (e.g. 25 XP)

**Fallback (if health port not yet wired):**
- GameScene keeps existing hazard-style respawn for enemy contact
- Design documents this as temporary; tasks assume health port exists

**Prerequisite recommendation:** apply `game-feature-modules` before or in parallel with melee-combat tasks 7.x (integration).

### Presentation

- `EnemySprite`: colored rectangle/sprite, flip on patrol direction
- Attack feedback: brief white flash on player or semi-transparent hitbox rect during active window
- Enemy death: destroy sprite, remove from registry (no death animation in v1)

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Phaser overlap for hit detection only | Domain rules untestable; split: rules in domain, AABB check in use case |
| Single `ICombatPort` for player + enemies | Violates Interface Segregation |
| Enemy as Phaser Group without domain state | Can't unit test patrol/damage |
| ECS library | Over-engineering for pet project |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Scope creep toward full combat system | Strict non-goals; 1 enemy type, no combos |
| game-feature-modules not applied yet | Document fallback; integration tasks marked as conditional |
| GameScene complexity | Extract use cases; enemy update not inline in scene |
| Hitbox feel wrong | Expose constants; manual playtest task |

## Migration Plan

1. Domain + ports (no scene changes)
2. Input extension + adapters
3. Tiled parsing + level definition
4. Enemy spawn/render
5. Attack + damage flow
6. Contact damage + XP
7. Tests + playtest

Rollback: remove enemy_spawn from level; disable attack input binding.

## Open Questions

- Attack key: J primary, X secondary — **confirmed in design**
- Enemy contact while attacking? — Both can happen same frame; process attack before enemy contact update
