## 1. Pause overlay UI

- [x] 1.1 Create `src/presentation/ui/PauseMenuOverlay.ts` with dim background, title «Пауза», and `MenuList` items: Настройки, Начать с контрольной точки, Выход
- [x] 1.2 Expose `createPauseMenuOverlay(scene, callbacks)` with `destroy()` lifecycle
- [x] 1.3 Set overlay depth above HUD and `scrollFactor(0)` for screen-fixed positioning

## 2. GameScene pause state

- [x] 2.1 Add `isPaused` flag and `pauseMenuOverlay` reference to `GameScene`
- [x] 2.2 Replace Esc → `goToGameOver()` with `togglePauseMenu()` / `openPauseMenu()` / `closePauseMenu()`
- [x] 2.3 Extend `update()` guard to skip gameplay simulation when `isPaused` (movement, hazards, checkpoints, exit, health tick, camera, hud update optional)
- [x] 2.4 Block pause open during `isRespawning` and `isCompleting`

## 3. Pause menu actions

- [x] 3.1 **Настройки** → `scene.launch(Settings, { returnScene: Game })` + `scene.pause()`
- [x] 3.2 **Начать с контрольной точки** → close pause + call existing `respawnPlayer()`
- [x] 3.3 **Выход** → `saveGame.execute({ slotId, levelId })` + `scene.start(MainMenu)`

## 4. SettingsScene return context

- [x] 4.1 Add `SettingsSceneData` with optional `returnScene` to `scene-data.ts`
- [x] 4.2 Update `SettingsScene.init(data)` to store return target (default: `MainMenu`)
- [x] 4.3 On Escape: if launched from pause → `scene.stop()` + `scene.resume(Game)`; else → `scene.start(MainMenu)` as before
- [x] 4.4 Register `resume` handler in `GameScene` to keep pause overlay visible after settings close

## 5. HUD & docs

- [x] 5.1 Update `ControlsHintWidget` text: `Esc — pause` instead of `Esc — game over`
- [x] 5.2 Update README controls section (Esc = pause menu)

## 6. Quality gate

- [x] 6.1 `npm run build` — zero errors
- [x] 6.2 `npm run lint` — zero errors
- [x] 6.3 `npm test` — existing tests pass
- [ ] 6.4 Manual playtest: Esc opens/closes pause, gameplay freezes/resumes
- [ ] 6.5 Manual playtest: Settings from pause returns to pause menu
- [ ] 6.6 Manual playtest: Checkpoint restart respawns at last checkpoint with fade
- [ ] 6.7 Manual playtest: Exit saves and returns to MainMenu; Load resumes session
- [ ] 6.8 Manual playtest: Hazard death still goes to GameOver (Esc does not)
