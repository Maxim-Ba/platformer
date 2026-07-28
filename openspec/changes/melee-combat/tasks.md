## 1. Domain — combat & enemy rules

- [ ] 1.1 Add combat constants: cooldown, active window, hitbox size, damage
- [ ] 1.2 Add `AttackState` value object and `CombatRules` service
- [ ] 1.3 Add `EnemyState` entity, `EnemySpawn` type, `EnemyRules` service
- [ ] 1.4 Extend `LevelDefinition` with `enemySpawns` array
- [ ] 1.5 Unit tests: `CombatRules.test.ts`, `EnemyRules.test.ts`

## 2. Application ports & use cases

- [ ] 2.1 Add `ICombatPort` interface
- [ ] 2.2 Add `IEnemyPort` interface
- [ ] 2.3 Extend `IInputPort` with `isAttackPressed()`
- [ ] 2.4 Add `ExecuteMeleeAttack` use case
- [ ] 2.5 Add `UpdateEnemies` use case (patrol + contact damage via `IHealthPort`)
- [ ] 2.6 Unit tests: `ExecuteMeleeAttack.test.ts`, `UpdateEnemies.test.ts`

## 3. Infrastructure adapters

- [ ] 3.1 Implement `InMemoryCombatAdapter` (implements `ICombatPort`)
- [ ] 3.2 Implement `InMemoryEnemyAdapter` (implements `IEnemyPort`)
- [ ] 3.3 Update `PhaserInputAdapter` — J/X attack keys
- [ ] 3.4 Update `PlaceholderInputAdapter` if used in tests

## 4. Tiled level pipeline

- [ ] 4.1 Parse `enemy_spawn` objects in `TiledLevelRepository`
- [ ] 4.2 Support optional `patrolDistance` custom property
- [ ] 4.3 Update `TiledLevelRepository.test.ts` with enemy_spawn fixture
- [ ] 4.4 Add `enemy_spawn` to `tiled/level-01.tmx` for playtest
- [ ] 4.5 Export `level-01.json` with enemy placement

## 5. Presentation

- [ ] 5.1 Create `EnemySprite` (placeholder visual, flip on direction)
- [ ] 5.2 Add attack feedback (brief hitbox flash or player tint during active window)
- [ ] 5.3 Sync enemy sprites from `IEnemyPort` state each frame

## 6. Composition root

- [ ] 6.1 Wire `ICombatPort` and `IEnemyPort` in `composition-root.ts`
- [ ] 6.2 Extend `SceneDependencies` with combat ports and use cases
- [ ] 6.3 Audit: no concrete adapter imports in presentation/application

## 7. GameScene integration

- [ ] 7.1 Spawn enemies from `LevelDefinition.enemySpawns` on level init
- [ ] 7.2 Call `ExecuteMeleeAttack` when attack input detected
- [ ] 7.3 Call `UpdateEnemies` each frame (patrol movement)
- [ ] 7.4 Process enemy contact damage via `IHealthPort` (requires `game-feature-modules`)
- [ ] 7.5 Award XP on kill via `IProgressionPort` (requires `game-feature-modules`)
- [ ] 7.6 Update on-screen controls hint (add attack key)
- [ ] 7.7 Destroy enemy sprites on kill

## 8. Quality gate

- [ ] 8.1 `npm run build` — zero errors
- [ ] 8.2 `npm run lint` — zero errors
- [ ] 8.3 `npm test` — all tests pass
- [ ] 8.4 Manual playtest: patrol enemy, attack kill, contact damage, respawn/game over
- [ ] 8.5 Import audit: combat consumers use port interfaces only
