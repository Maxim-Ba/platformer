## Why

Сейчас камера в `GameScene` напрямую вызывает `cameras.main.startFollow()` с фиксированным lerp — без отдельного модуля, без настраиваемого люфта при смене направления и без возможности подменить реализацию. Для улучшения «ощущения» платформера и согласованности с Clean Architecture (ports + composition root) нужен изолированный camera-модуль: потребители зависят от `ICameraPort`, а плавное слежение с задержкой при резкой смене направления реализуется в adapter.

## What Changes

- Ввести feature-модуль **Player Camera** с port-интерфейсом `ICameraPort` в `src/application/ports/`
- Реализация `PhaserSmoothCameraAdapter` в `src/infrastructure/phaser/` — плавное слежение, игрок в центре viewport, люфт при резкой смене горизонтального направления
- Domain value object `CameraFollowConfig` — параметры сглаживания (base lerp, direction-change dampening)
- Use case `UpdateCameraFollow` — чистая логика расчёта целевой позиции scroll с учётом смены направления (тестируемая без Phaser)
- Wiring в `composition-root.ts`; `GameScene` использует только `ICameraPort`, не Phaser camera API напрямую
- Убрать прямой вызов `startFollow` из `GameScene.setupCameraFollow()`
- Обновить requirement **Camera follow** в `mvp-integration`: центрирование игрока, плавность, люфт при смене направления
- Unit-тесты для `UpdateCameraFollow` (смена направления, clamp к bounds)

## Capabilities

### New Capabilities

- `player-camera`: плавное слежение камеры за игроком через port/adapter, центрирование, люфт при резкой смене направления, clamp к границам уровня

### Modified Capabilities

- `mvp-integration`: уточнить requirement Camera follow — плавное слежение с игроком в центре и люфтом при смене направления (вместо базового follow)

## Impact

- `src/application/ports/ICameraPort.ts` — новый интерфейс
- `src/domain/value-objects/CameraFollowConfig.ts` — конфигурация сглаживания
- `src/application/use-cases/UpdateCameraFollow.ts` — логика follow
- `src/infrastructure/phaser/PhaserSmoothCameraAdapter.ts` — Phaser adapter
- `src/game/composition-root.ts` — binding `ICameraPort`
- `src/presentation/scenes/GameScene.ts` — делегирование камеры в port
- `openspec/specs/mvp-integration/spec.md` — delta через change spec
- Тесты: `UpdateCameraFollow.test.ts`
