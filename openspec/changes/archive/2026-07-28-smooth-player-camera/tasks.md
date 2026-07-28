## 1. Domain layer

- [x] 1.1 Add `CameraFollowConfig` value object with defaults (`baseLerp`, `directionChangeLerp`, `directionChangeDurationMs`)
- [x] 1.2 Add `CameraScrollState` value object (`scrollX`, `scrollY`, `lastHorizontalSign`, `dampeningRemainingMs`, `previousPlayerX`)

## 2. Application layer

- [x] 2.1 Create `ICameraPort` in `src/application/ports/` (`attach`, `setBounds`, `setViewportSize`, `update`, `reset`)
- [x] 2.2 Implement `UpdateCameraFollow` use case: centered target, frame-rate-independent lerp, horizontal direction-change dampening, bounds clamp
- [x] 2.3 Add `UpdateCameraFollow.test.ts` — steady movement, direction reversal dampening, bounds clamp, dampening timer decay

## 3. Infrastructure adapter

- [x] 3.1 Implement `PhaserSmoothCameraAdapter` — manual `setScroll`, target resolver callback, delegates math to `UpdateCameraFollow`
- [x] 3.2 Ensure `roundPixels` preserved on main camera; stop using `startFollow`

## 4. Composition root & scene integration

- [x] 4.1 Wire `cameraPort: ICameraPort` in `SceneDependencies` and `createSceneDependencies`
- [x] 4.2 Refactor `GameScene.setupCameraFollow` to use `cameraPort.attach` + `setBounds` + `setViewportSize` (remove `startFollow`)
- [x] 4.3 Call `cameraPort.update(delta)` in `GameScene.update` after player position sync
- [x] 4.4 Call `cameraPort.reset()` in respawn flow before fade-in

## 5. Verification

- [x] 5.1 Run `npm run test`, `npm run build`, `npm run lint`
- [x] 5.2 Manual playtest: horizontal direction reversals show follow slack; player stays centered; edges clamp; respawn without scroll jump
