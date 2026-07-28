## 1. Architecture — feature module pattern

- [x] 1.1 Verify architecture-foundation delta spec requirements are understood before coding
- [x] 1.2 Establish folder convention: `src/domain/` rules, `src/application/ports/`, `src/infrastructure/adapters/` per module

## 2. Player Health module

- [x] 2.1 Add domain types: `HealthState` value object, `HealthRules` service, constants (`MAX_HP`, `HAZARD_DAMAGE`, `INVULNERABILITY_MS`)
- [x] 2.2 Add `IHealthPort` interface in `src/application/ports/IHealthPort.ts`
- [x] 2.3 Add `ApplyDamage` use case orchestrating `HealthRules` + port
- [x] 2.4 Implement `InMemoryHealthAdapter` in `src/infrastructure/adapters/`
- [x] 2.5 Unit tests: `HealthRules.test.ts`, `ApplyDamage.test.ts`
- [x] 2.6 Wire health port factory in `composition-root.ts` (per-scene reset)

## 3. Game Settings module

- [x] 3.1 Add domain types: `GameSettings` type, `DEFAULT_SETTINGS`, `SettingsRules` (validation/clamp)
- [x] 3.2 Add `ISettingsPort` interface in `src/application/ports/ISettingsPort.ts`
- [x] 3.3 Add `UpdateSettings` use case for partial patch updates
- [x] 3.4 Implement `LocalStorageSettingsAdapter` with version field and corrupt-storage fallback
- [x] 3.5 Unit tests: `SettingsRules.test.ts`, `UpdateSettings.test.ts`
- [x] 3.6 Wire `ISettingsPort` as app-level singleton in composition root

## 4. Player Progression module

- [x] 4.1 Add domain types: `ProgressionState`, `ProgressionRules` (XP curve, level-up)
- [x] 4.2 Add `IProgressionPort` interface in `src/application/ports/IProgressionPort.ts`
- [x] 4.3 Add `AddExperience` use case
- [x] 4.4 Implement `InMemoryProgressionAdapter`
- [x] 4.5 Unit tests: `ProgressionRules.test.ts`, `AddExperience.test.ts`
- [x] 4.6 Wire `IProgressionPort` as app-level singleton in composition root

## 5. Player Inventory module

- [x] 5.1 Add domain types: `InventoryItem` entity, `InventoryState`, `InventoryRules` (slots, stacking)
- [x] 5.2 Add `IInventoryPort` interface in `src/application/ports/IInventoryPort.ts`
- [x] 5.3 Add use cases: `AddItem`, `RemoveItem`, `UseItem`
- [x] 5.4 Implement `InMemoryInventoryAdapter`
- [x] 5.5 Unit tests: `InventoryRules.test.ts`, inventory use case tests
- [x] 5.6 Wire `IInventoryPort` as app-level singleton in composition root

## 6. Composition Root & SceneDependencies

- [x] 6.1 Extend `AppDependencies` with settings, progression, inventory ports
- [x] 6.2 Extend `SceneDependencies` with health port and `applyDamage` use case
- [x] 6.3 Ensure no `new ConcreteAdapter()` outside composition root (audit presentation + application)

## 7. GameScene integration

- [x] 7.1 Refactor hazard overlap: call `applyDamage` via health port instead of direct `respawnPlayer()`
- [x] 7.2 On survivable damage: respawn at checkpoint + invulnerability via health port
- [x] 7.3 On lethal damage (HP = 0): transition to GameOverScene
- [x] 7.4 Remove duplicate `hazardInvulnerabilityRemainingMs` from GameScene (delegate to health module)
- [x] 7.5 Demo integration: award XP on checkpoint activation via `IProgressionPort`

## 8. Quality gate

- [x] 8.1 `npm run build` — zero errors
- [x] 8.2 `npm run lint` — zero errors
- [x] 8.3 `npm test` — all domain/application tests pass
- [x] 8.4 Manual playtest: hazard damage reduces HP, respawn works, game over at 0 HP
- [x] 8.5 Import audit: presentation/application import only port interfaces, not concrete adapters
