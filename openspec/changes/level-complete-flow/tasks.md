## 1. Configuration & scene registry

- [ ] 1.1 Add `LevelComplete` to `SceneKeys`
- [ ] 1.2 Add `LEVEL_PROGRESSION` array and `getNextLevelId()` to `constants.ts`
- [ ] 1.3 Define `LevelCompleteSceneData` type (levelId, nextLevelId?)

## 2. LevelCompleteScene

- [ ] 2.1 Create `src/presentation/scenes/LevelCompleteScene.ts`
- [ ] 2.2 Victory UI: title, completed level id, next level hint (if applicable)
- [ ] 2.3 Keyboard: N/Enter → next level, R → retry, M → main menu
- [ ] 2.4 Hide/disable Next Level when `nextLevelId` is undefined
- [ ] 2.5 Export from `presentation/index.ts`
- [ ] 2.6 Register scene in `bootstrap.ts`

## 3. GameScene integration

- [ ] 3.1 Add `isCompleting` guard flag
- [ ] 3.2 Replace exit overlap `goToGameOver()` with `completeLevel()`
- [ ] 3.3 Implement `completeLevel()`: fade out → start LevelCompleteScene with scene data
- [ ] 3.4 Ensure death path (Esc / future 0 HP) still uses `goToGameOver()`
- [ ] 3.5 Block game update during level complete transition

## 4. Documentation

- [ ] 4.1 Update README controls table (N — next level on victory screen)
- [ ] 4.2 Update README game flow section (victory vs game over)

## 5. Quality gate

- [ ] 5.1 `npm run build` — zero errors
- [ ] 5.2 `npm run lint` — zero errors
- [ ] 5.3 `npm test` — existing tests pass
- [ ] 5.4 Manual playtest: reach exit → Level Complete (not Game Over)
- [ ] 5.5 Manual playtest: Esc → Game Over; Retry/Menu/Next from victory screen work
