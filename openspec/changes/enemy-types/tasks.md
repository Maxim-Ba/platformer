## 0. Prerequisite

- [ ] 0.1 Verify `melee-combat` change is applied (`IEnemyPort`, `ICombatPort`, `enemy_spawn` parsing, `UpdateEnemies`, `ExecuteMeleeAttack`)

## 1. Domain — archetypes & models

- [ ] 1.1 Add unified `Enemy` interface (base contract for all kinds), `EnemyTypeId` type, and `EnemyArchetype` interface in domain; `EnemyState` MUST implement `Enemy`
- [ ] 1.2 Create `src/domain/constants/enemies.ts` with `grunt`, `flyer`, `caster` catalog and `resolveArchetype(typeId)` with unknown-type fallback
- [ ] 1.3 Extend `EnemySpawn` with required `enemyType` and optional `patrolDistance` override
- [ ] 1.4 Extend `EnemyState` with `archetypeId`, `behaviorTimerMs`; remove hardcoded 1 HP assumption
- [ ] 1.5 Add `ProjectileState`, `ProjectileSpawn` domain types and projectile constants (speed, lifetime, cast interval, aggro range, per-caster cap)
- [ ] 1.6 Unit tests: `resolveArchetype.test.ts`, archetype dimensions and HP defaults
- [ ] 1.7 Unit test: new archetype catalog entry spawns valid `Enemy` without consumer code changes (extensibility smoke test)

## 2. Domain — behaviors

- [ ] 2.1 Create `src/domain/enemy-behaviors/types.ts` — `MovementContext`, `AttackContext`, `AttackTickResult`, behavior function types
- [ ] 2.2 Implement `groundPatrolBehavior` — extract/refactor from existing `EnemyRules.patrolStep`
- [ ] 2.3 Implement `flyHoverBehavior` — horizontal patrol + sinusoidal Y offset
- [ ] 2.4 Implement `contactAttackBehavior` — no-op tick (contact handled in use case)
- [ ] 2.5 Implement `rangedCastBehavior` — cooldown, aggro check, spawn projectile toward player
- [ ] 2.6 Create `behaviorRegistry.ts` mapping behavior ids to functions
- [ ] 2.7 Add `ProjectileRules` — move, expire, player overlap AABB
- [ ] 2.8 Unit tests: `groundPatrolBehavior.test.ts`, `flyHoverBehavior.test.ts`, `rangedCastBehavior.test.ts`, `ProjectileRules.test.ts`

## 3. Application ports & use cases

- [ ] 3.1 Extend `IEnemyPort` — `getProjectiles()`, archetype-aware spawn, `tickProjectiles(deltaMs)`
- [ ] 3.2 Refactor `UpdateEnemies` — dispatch movement/attack behaviors per archetype; contact damage with per-archetype hitbox; projectile-player collision via `IHealthPort`
- [ ] 3.3 Update kill reward — use `archetype.killXp` instead of flat constant
- [ ] 3.4 Update `ExecuteMeleeAttack` — overlap test uses per-enemy archetype dimensions
- [ ] 3.5 Unit tests: `UpdateEnemies.test.ts` (mixed types, projectile hit, multi-HP grunt), update `ExecuteMeleeAttack.test.ts` for archetype hitboxes

## 4. Infrastructure adapters

- [ ] 4.1 Extend `InMemoryEnemyAdapter` — archetype resolution on spawn, behavior state, projectile registry, tick projectiles
- [ ] 4.2 Update `TiledLevelRepository` — parse `enemyType` on `enemy_spawn`; default to `grunt` if missing
- [ ] 4.3 Update `TiledLevelRepository.test.ts` — fixtures for each enemy type and missing-type default

## 5. Presentation

- [ ] 5.1 Refactor `EnemySprite` — factory by `archetypeId`, size/color from archetype, flip on patrol direction
- [ ] 5.2 Create `ProjectileSprite` placeholder (small purple rect/circle)
- [ ] 5.3 Update `GameScene` — sync projectiles each frame; destroy sprites on projectile removal

## 6. Level authoring & playtest

- [ ] 6.1 Add three `enemy_spawn` objects to `tiled/level-01.tmx` — one `grunt`, one `flyer`, one `caster` with documented properties
- [ ] 6.2 Export `public/assets/maps/level-01.json`
- [ ] 6.3 Manual playtest: grunt takes 2 hits; flyer hovers and contact-damages; caster fires projectiles; XP differs per type

## 7. Integration & quality

- [ ] 7.1 Verify composition root bindings unchanged except adapter internals
- [ ] 7.2 Run `npm run test` and `npm run lint`
- [ ] 7.3 Run `npm run build` — no type errors
