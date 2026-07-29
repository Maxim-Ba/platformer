## 1. Player resources scaffold (mana/energy)

- [x] 1.1 Add `ManaState` and `EnergyState` value objects in `src/domain/value-objects/`
- [x] 1.2 Add domain constants for default max mana/energy in `src/domain/constants/`
- [x] 1.3 Add `IManaPort` and `IEnergyPort` in `src/application/ports/`
- [x] 1.4 Implement `InMemoryManaAdapter` and `InMemoryEnergyAdapter` in `src/infrastructure/adapters/`
- [x] 1.5 Wire mana/energy ports in `composition-root.ts` (per-scene factory, reset on level start)
- [x] 1.6 Extend `SceneDependencies` or `GameHudDependencies` to expose mana/energy ports

## 2. HUD widget modules

- [x] 2.1 Create `src/presentation/ui/hud/HudWidget.ts` — shared interface
- [x] 2.2 Create `src/presentation/ui/hud/hud-layout.ts` — anchor/position config
- [x] 2.3 Create `src/presentation/ui/hud/ResourceHudWidget.ts` — parameterized HP/Mana/Energy display
- [x] 2.4 Create `src/presentation/ui/hud/ScoreHudWidget.ts` — level + XP from `IProgressionPort`
- [x] 2.5 Create `src/presentation/ui/hud/ControlsHintWidget.ts` — extract controls text from GameScene
- [x] 2.6 Create `src/presentation/ui/hud/GameHud.ts` — orchestrator with `create`, `update`, `destroy`

## 3. GameScene integration

- [x] 3.1 Replace inline `add.text` controls hint with `createGameHud()` in `initializeLevel()`
- [x] 3.2 Call `hud.update()` in `GameScene.update()`
- [x] 3.3 Destroy HUD on scene shutdown
- [x] 3.4 Pass `IHealthPort`, `IManaPort`, `IEnergyPort` from scene deps and `IProgressionPort` from app deps

## 4. Tests

- [x] 4.1 Unit tests for `ManaState`/`EnergyState` initial values and adapter reset
- [x] 4.2 Verify existing health/progression tests still pass

## 5. Quality gate

- [x] 5.1 `npm run build` — zero errors
- [x] 5.2 `npm run lint` — zero errors
- [x] 5.3 `npm test` — all tests pass
- [x] 5.4 Manual playtest: HUD shows HP/Mana/Energy bottom-left, score top-right
- [x] 5.5 Manual playtest: HP decreases on hazard, XP increases on checkpoint
