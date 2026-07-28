## 1. Architecture — feature module pattern

- [ ] 1.1 Verify architecture-foundation delta spec requirements are understood before coding
- [ ] 1.2 Establish folder convention: `src/domain/` rules, `src/application/ports/`, `src/infrastructure/adapters/` per module

## 2. Player Health module

- [ ] 2.1 Add domain types: `HealthState` value object, `HealthRules` service, constants (`MAX_HP`, `HAZARD_DAMAGE`, `INVULNERABILITY_MS`)
- [ ] 2.2 Add `IHealthPort` interface in `src/application/ports/IHealthPort.ts`
- [ ] 2.3 Add `ApplyDamage` use case orchestrating `HealthRules` + port
- [ ] 2.4 Implement `InMemoryHealthAdapter` in `src/infrastructure/adapters/`
- [ ] 2.5 Unit tests: `HealthRules.test.ts`, `ApplyDamage.test.ts`
- [ ] 2.6 Wire health port factory in `composition-root.ts` (per-scene reset)

## 3. Game Settings module

- [ ] 3.1 Add domain types: `GameSettings` type, `DEFAULT_SETTINGS`, `SettingsRules` (validation/clamp)
- [ ] 3.2 Add `ISettingsPort` interface in `src/application/ports/ISettingsPort.ts`
- [ ] 3.3 Add `UpdateSettings` use case for partial patch updates
- [ ] 3.4 Implement `LocalStorageSettingsAdapter` with version field and corrupt-storage fallback
- [ ] 3.5 Unit tests: `SettingsRules.test.ts`, `UpdateSettings.test.ts`
- [ ] 3.6 Wire `ISettingsPort` as app-level singleton in composition root

## 4. Player Progression module

- [ ] 4.1 Add domain types: `ProgressionState`, `ProgressionRules` (XP curve, level-up)
- [ ] 4.2 Add `IProgressionPort` interface in `src/application/ports/IProgressionPort.ts`
- [ ] 4.3 Add `AddExperience` use case
- [ ] 4.4 Implement `InMemoryProgressionAdapter`
- [ ] 4.5 Unit tests: `ProgressionRules.test.ts`, `AddExperience.test.ts`
- [ ] 4.6 Wire `IProgressionPort` as app-level singleton in composition root

## 5. Player Inventory module

- [ ] 5.1 Add domain types: `InventoryItem` entity, `InventoryState`, `InventoryRules` (slots, stacking)
- [ ] 5.2 Add `IInventoryPort` interface in `src/application/ports/IInventoryPort.ts`
- [ ] 5.3 Add use cases: `AddItem`, `RemoveItem`, `UseItem`
- [ ] 5.4 Implement `InMemoryInventoryAdapter`
- [ ] 5.5 Unit tests: `InventoryRules.test.ts`, inventory use case tests
- [ ] 5.6 Wire `IInventoryPort` as app-level singleton in composition root

## 6. Composition Root & SceneDependencies

- [ ] 6.1 Extend `AppDependencies` with settings, progression, inventory ports
- [ ] 6.2 Extend `SceneDependencies` with health port and `applyDamage` use case
- [ ] 6.3 Ensure no `new ConcreteAdapter()` outside composition root (audit presentation + application)

## 7. GameScene integration

- [ ] 7.1 Refactor hazard overlap: call `applyDamage` via health port instead of direct `respawnPlayer()`
- [ ] 7.2 On survivable damage: respawn at checkpoint + invulnerability via health port
- [ ] 7.3 On lethal damage (HP = 0): transition to GameOverScene
- [ ] 7.4 Remove duplicate `hazardInvulnerabilityRemainingMs` from GameScene (delegate to health module)
- [ ] 7.5 Demo integration: award XP on checkpoint activation via `IProgressionPort`

## 8. Quality gate

- [ ] 8.1 `npm run build` — zero errors
- [ ] 8.2 `npm run lint` — zero errors
- [ ] 8.3 `npm test` — all domain/application tests pass
- [ ] 8.4 Manual playtest: hazard damage reduces HP, respawn works, game over at 0 HP
- [ ] 8.5 Import audit: presentation/application import only port interfaces, not concrete adapters
