## 1. Configuration & scene registry

- [x] 1.1 Add `LevelComplete` to `SceneKeys`
- [x] 1.2 Add `LEVEL_PROGRESSION` array and `getNextLevelId()` to `constants.ts`
- [x] 1.3 Define `LevelCompleteSceneData` type (levelId, nextLevelId?)

## 2. LevelCompleteScene

- [x] 2.1 Create `src/presentation/scenes/LevelCompleteScene.ts`
- [x] 2.2 Victory UI: title, completed level id, next level hint (if applicable)
- [x] 2.3 Keyboard: N/Enter → next level, R → retry, M → main menu
- [x] 2.4 Hide/disable Next Level when `nextLevelId` is undefined
- [x] 2.5 Export from `presentation/index.ts`
- [x] 2.6 Register scene in `bootstrap.ts`

## 3. GameScene integration

- [x] 3.1 Add `isCompleting` guard flag
- [x] 3.2 Replace exit overlap `goToGameOver()` with `completeLevel()`
- [x] 3.3 Implement `completeLevel()`: fade out → start LevelCompleteScene with scene data
- [x] 3.4 Ensure death path (Esc / future 0 HP) still uses `goToGameOver()`
- [x] 3.5 Block game update during level complete transition

## 4. Documentation

- [x] 4.1 Update README controls table (N — next level on victory screen)
- [x] 4.2 Update README game flow section (victory vs game over)

## 5. Quality gate

- [x] 5.1 `npm run build` — zero errors
- [x] 5.2 `npm run lint` — zero errors
- [x] 5.3 `npm test` — existing tests pass
- [ ] 5.4 Manual playtest: reach exit → Level Complete (not Game Over)
- [ ] 5.5 Manual playtest: Esc → Game Over; Retry/Menu/Next from victory screen work
