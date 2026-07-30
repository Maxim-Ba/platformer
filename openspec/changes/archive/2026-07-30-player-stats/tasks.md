## 1. Domain Layer

- [x] 1.1 Create `AttributeId` and `DerivedStatId` types in `src/domain/types/player-stats.ts`
- [x] 1.2 Create `PlayerAttributes` value object with six attribute fields and `withAttribute(id, value)` helper
- [x] 1.3 Create `DerivedStats` value object with all derived stat fields
- [x] 1.4 Create `PlayerStatsState` (attributes + unallocatedPoints) for port restore
- [x] 1.5 Create `PlayerStatsRules` in `src/domain/services/` with `computeDerived(attributes)` and unit-testable formulas
- [x] 1.6 Add Russian label maps for attributes and derived stats in `src/domain/constants/player-stats-labels.ts`

## 2. Application Port & Adapter

- [x] 2.1 Create `IPlayerStatsPort` in `src/application/ports/IPlayerStatsPort.ts`
- [x] 2.2 Export port from `src/application/index.ts`
- [x] 2.3 Create `InMemoryPlayerStatsAdapter` with mock initial attributes and 3 unallocated points
- [x] 2.4 Implement `increaseAttribute` / `decreaseAttribute` with min attribute value of 1
- [x] 2.5 Wire singleton in `src/game/composition-root.ts` and expose via `getCompositionRoot()`

## 3. Stats Tab Panel UI

- [x] 3.1 Create `StatsTabPanel.ts` in `src/presentation/ui/character-menu/`
- [x] 3.2 Render unallocated points header and two-column layout (**Атрибуты** / **Параметры**)
- [x] 3.3 Render left column: six attributes with labels, values, and `[+]` / `[−]` controls
- [x] 3.4 Render right column: derived stats with labels and formatted values (crit as percent)
- [x] 3.5 Wire pointer handlers: increase/decrease call port and refresh display
- [x] 3.6 Disable `[+]` when no unallocated points; disable `[−]` at min attribute value
- [x] 3.7 Implement `destroy()` to clean up Phaser objects

## 4. Character Menu Integration

- [x] 4.1 Replace stats mock panel in `CharacterMenuOverlay` (or `MockTabPanels`) with `StatsTabPanel`
- [x] 4.2 Pass `IPlayerStatsPort` from `GameScene` into character menu overlay factory
- [x] 4.3 Verify `C` hotkey opens **Характеристики** tab with stats panel visible

## 5. Verification

- [x] 5.1 Manual test: left column shows all six attributes with correct Russian labels
- [x] 5.2 Manual test: right column shows derived stats and updates when attributes change
- [x] 5.3 Manual test: `[+]`/`[−]` correctly modify points and attribute values
- [x] 5.4 Add unit tests for `PlayerStatsRules.computeDerived`
- [x] 5.5 Run `npm run lint` and `npm run build`
