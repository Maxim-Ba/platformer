## 1. Gamepad bindings and reader

- [ ] 1.1 Create `src/game/gamepad-bindings.ts` with W3C button indices (A, B, X, Y, LB, RB, Back, Start, D-pad)
- [ ] 1.2 Create `src/infrastructure/phaser/PhaserGamepadReader.ts` — pad 0 connection, `update()`, stick threshold 0.5, `wasButtonJustPressed(index)`
- [ ] 1.3 Enable gamepad in Phaser game config (`input.gamepad: true`) in `bootstrap.ts` if not already enabled
- [ ] 1.4 Handle hot-plug via `gamepad.connected` event

## 2. Composite IInputPort

- [ ] 2.1 Refactor existing `PhaserInputAdapter` to keyboard-only (rename to `PhaserKeyboardInputAdapter` or keep name with clear scope)
- [ ] 2.2 Create `CompositeInputAdapter` implementing `IInputPort` — OR keyboard + gamepad for `isLeftPressed`, `isRightPressed`, `isJumpPressed`
- [ ] 2.3 Wire composite adapter in `composition-root.ts` instead of direct `PhaserInputAdapter`
- [ ] 2.4 If `isDashPressed` / `isAttackPressed` exist on `IInputPort`, aggregate Y and X gamepad buttons in composite

## 3. Menu input handler

- [ ] 3.1 Create `src/presentation/input/createMenuInputHandler.ts` — keyboard + per-frame gamepad poll for Up/Down/Left/Right/Confirm/Cancel
- [ ] 3.2 Add D-pad repeat debounce (~150ms) for held navigation
- [ ] 3.3 Migrate `MenuList.ts` to use `createMenuInputHandler`
- [ ] 3.4 Migrate `CharacterMenuOverlay.ts` horizontal tab navigation to shared handler
- [ ] 3.5 Migrate `SettingsScene.ts` and `LoadGameScene.ts` keyboard handlers to shared handler

## 4. GameScene system actions

- [ ] 4.1 Instantiate or inject `PhaserGamepadReader` in `GameScene` (via scene deps or local instance)
- [ ] 4.2 Map Start button to pause toggle (same as Esc when pause-menu is applied)
- [ ] 4.3 Map Back button to character menu toggle
- [ ] 4.4 Map LB/RB to cycle character menu tabs when menu is open
- [ ] 4.5 Call `gamepadReader.update()` each frame in `GameScene.update()`

## 5. HUD and documentation

- [ ] 5.1 Update `ControlsHintWidget` text with gamepad bindings
- [ ] 5.2 Update README controls section with full gamepad layout table

## 6. Quality gate

- [ ] 6.1 `npm run build` — zero errors
- [ ] 6.2 `npm run lint` — zero errors
- [ ] 6.3 `npm test` — existing tests pass; add unit test for `CompositeInputAdapter` OR gamepad reader button edge detection
- [ ] 6.4 Manual playtest: movement and jump with stick and D-pad
- [ ] 6.5 Manual playtest: MainMenu → New Game → level with gamepad only
- [ ] 6.6 Manual playtest: pause menu open/close with Start
- [ ] 6.7 Manual playtest: character menu tabs with LB/RB and D-pad Left/Right
- [ ] 6.8 Manual playtest: hot-plug gamepad mid-session
