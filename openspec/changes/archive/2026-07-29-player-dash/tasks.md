## 1. Domain — dash rules

- [x] 1.1 Add dash constants: `DASH_SPEED`, `DASH_DURATION_MS`, `DASH_COOLDOWN_MS` in `src/domain/constants/dash.ts`
- [x] 1.2 Add `DashState` value object and `DashRules` service
- [x] 1.3 Export dash types/constants from `src/domain/index.ts`
- [x] 1.4 Unit tests: `DashRules.test.ts`

## 2. Application ports & use cases

- [x] 2.1 Add `IDashPort` interface
- [x] 2.2 Extend `IInputPort` with `isDashPressed()`
- [x] 2.3 Extend `InputSnapshot` with `dashPressed: boolean`
- [x] 2.4 Add `ExecuteDash` use case (progression gate + invulnerability grant)
- [x] 2.5 Add `UpdatePlayerDash` use case (dash velocity + position)
- [x] 2.6 Unit tests: `ExecuteDash.test.ts`, `UpdatePlayerDash.test.ts`

## 3. Infrastructure adapters

- [x] 3.1 Implement `InMemoryDashAdapter` (implements `IDashPort`)
- [x] 3.2 Update `PhaserInputAdapter` — Left Shift dash key
- [x] 3.3 Update test/placeholder input adapters with `isDashPressed()`

## 4. Presentation

- [x] 4.1 Extend `PlayerSprite` with dash visual feedback (tint/alpha)
- [x] 4.2 Add `facingDirection` getter or expose facing for dash direction fallback

## 5. Composition root

- [x] 5.1 Wire `IDashPort`, `ExecuteDash`, `UpdatePlayerDash` in `composition-root.ts`
- [x] 5.2 Extend `SceneDependencies` with dash port and use cases
- [x] 5.3 Audit: no concrete dash adapter imports in presentation/application

## 6. GameScene integration

- [x] 6.1 Tick `dashPort` each frame (before movement)
- [x] 6.2 Call `ExecuteDash` when dash input detected
- [x] 6.3 Branch: `UpdatePlayerDash` when dashing, else `UpdatePlayerMovement`
- [x] 6.4 Pass dash direction from input or player facing
- [x] 6.5 Sync dash visual state on `PlayerSprite`
- [x] 6.6 Update controls hint widget (add Shift = Dash)

## 7. Quality gate

- [x] 7.1 `npm run build` — zero errors
- [x] 7.2 `npm run lint` — zero errors
- [x] 7.3 `npm test` — all tests pass
- [ ] 7.4 Manual playtest: dash with unlock, cooldown, invulnerability through hazard, movement resume after dash
- [x] 7.5 Import audit: dash consumers use port interfaces only
