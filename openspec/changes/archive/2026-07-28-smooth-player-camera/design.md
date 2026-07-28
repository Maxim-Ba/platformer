## Context

MVP использует прямой вызов Phaser `cameras.main.startFollow(sprite, true, 0.12, 0.12)` в `GameScene.setupCameraFollow()`. Это даёт базовое lerp-слежение, но:

- логика камеры зашита в сцену, нельзя подменить реализацию;
- нет явного люфта при резкой смене горизонтального направления;
- центрирование зависит от Phaser follow defaults без тестируемой логики.

Архитектурный каркас уже предусматривает ports (`IInputPort`, `IPhysicsPort`) и composition root. Camera-модуль следует тому же паттерну, что и `game-feature-modules`.

Текущий flow respawn: fade → `setupCameraFollow()` → fade in. Новый модуль должен поддерживать reset без скачка scroll.

## Goals / Non-Goals

**Goals:**

- `ICameraPort` + `PhaserSmoothCameraAdapter` с wiring в composition root
- Игрок в центре viewport (target scroll = player position − half viewport)
- Плавная интерполяция scroll каждый кадр
- Дополнительное dampening по оси X при детекции разворота направления
- Clamp scroll к `level.bounds`
- Pure use case `UpdateCameraFollow` + unit-тесты
- `GameScene` зависит только от `ICameraPort`

**Non-Goals:**

- Look-ahead (смещение игрока от центра в сторону движения)
- Screen shake, zoom, cinematic camera
- Настройки камеры в UI / `ISettingsPort` (hardcoded defaults в `CameraFollowConfig`)
- Вертикальный люфт при смене направления (только горизонтальный разворот)
- Отдельная camera scene или split-screen

## Decisions

### Module layout (как существующие ports)

```
domain/
  value-objects/CameraFollowConfig.ts   — baseLerp, directionChangeLerp, directionChangeDurationMs
  value-objects/CameraScrollState.ts    — current scrollX/Y, lastHorizontalSign, dampeningRemainingMs

application/
  ports/ICameraPort.ts                  — attach, setBounds, update, reset, applyScroll (internal)
  use-cases/UpdateCameraFollow.ts       — pure scroll target + dampening + clamp

infrastructure/
  phaser/PhaserSmoothCameraAdapter.ts   — implements ICameraPort, reads sprite position, calls use case

game/
  composition-root.ts                   — cameraPort binding in SceneDependencies

presentation/
  scenes/GameScene.ts                   — setupCameraFollow → cameraPort.attach/setBounds; update → cameraPort.update
```

### ICameraPort interface

```typescript
interface CameraBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CameraFollowTarget {
  x: number;
  y: number;
}

interface ICameraPort {
  attach(target: CameraFollowTarget | (() => CameraFollowTarget)): void;
  setBounds(bounds: CameraBounds): void;
  setViewportSize(width: number, height: number): void;
  update(deltaMs: number): void;
  reset(scrollX?: number, scrollY?: number): void;
}
```

`attach` принимает callback `() => ({ x, y })` чтобы adapter читал позицию sprite без протаскивания Phaser types в application layer. Альтернатива — передавать координаты из `GameScene.update`; выбран callback для инкапсуляции в adapter при attach к sprite.

### Smooth follow algorithm (UpdateCameraFollow)

1. **Target scroll** (центрирование):
   - `targetX = playerX - viewportWidth / 2`
   - `targetY = playerY - viewportHeight / 2`

2. **Direction-change dampening** (горизонталь):
   - `horizontalSign = sign(playerX - previousPlayerX)` (или из velocity, если доступна)
   - если `horizontalSign !== 0` и `horizontalSign !== lastHorizontalSign` → запустить таймер `dampeningRemainingMs = directionChangeDurationMs`
   - effective lerp X: `directionChangeLerp` пока таймер > 0, иначе `baseLerp`
   - lerp Y всегда `baseLerp` (платформер — основной люфт по X)

3. **Interpolation** (frame-rate independent):
   - `t = 1 - Math.pow(1 - lerp, deltaMs / 16.67)` — нормализация к ~60fps
   - `scrollX += (targetX - scrollX) * tX`
   - `scrollY += (targetY - scrollY) * tY`

4. **Clamp**:
   - `scrollX ∈ [0, bounds.width - viewportWidth]`
   - `scrollY ∈ [0, bounds.height - viewportHeight]`

**Альтернатива:** продолжать `startFollow` Phaser с dead zone — отклонена: мёртвая зона смещает игрока от центра, противоречит требованию.

**Альтернатива:** velocity look-ahead — отклонена (non-goal).

### PhaserSmoothCameraAdapter

- Хранит `CameraScrollState`, `CameraFollowConfig`, ссылку на `Phaser.Cameras.Scene2D.Camera`
- `attach`: сохраняет target resolver, **не** вызывает `startFollow` (manual scroll)
- `update`: resolve target → `UpdateCameraFollow.execute` → `camera.setScroll(result.x, result.y)`
- `reset`: синхронизирует state с текущим scroll (при respawn — snap к centered target на checkpoint)
- `roundPixels = true` на main camera (сохраняем текущее поведение)

### Default config

| Parameter | Default | Rationale |
|-----------|---------|-----------|
| `baseLerp` | `0.12` | совпадает с текущим MVP |
| `directionChangeLerp` | `0.04` | заметный люфт при развороте |
| `directionChangeDurationMs` | `200` | краткий, не раздражает |

### GameScene integration

- Удалить `startFollow` из `setupCameraFollow`
- `this.deps.cameraPort.attach(() => ({ x: sprite.x, y: sprite.y }))`
- `this.deps.cameraPort.setBounds(level.bounds)`
- `this.deps.cameraPort.setViewportSize(cam.width, cam.height)` в create
- `update()`: `this.deps.cameraPort.update(delta)` после движения игрока
- respawn: `cameraPort.reset()` перед fade in

### Testing

- `UpdateCameraFollow.test.ts`: steady move, direction reversal (slower X convergence), bounds clamp, dampening timer decay
- Adapter: smoke через manual mock camera object (optional, не блокер)

## Risks / Trade-offs

- **[Risk] Manual scroll vs Phaser follow** — теряем встроенные follow helpers → Mitigation: тонкий adapter, минимум логики в Phaser слое
- **[Risk] Callback attach читает sprite после physics step** → Mitigation: вызывать `cameraPort.update` после sync sprite position в GameScene (как сейчас)
- **[Risk] Respawn scroll jump** → Mitigation: `reset()` с immediate snap к centered target на respawn position
- **[Trade-off] Только горизонтальный люфт** — вертикальные развороты (падение/прыжок) без extra dampening; достаточно для platformer feel на этапе 1

## Migration Plan

1. Добавить port, domain types, use case + тесты
2. Реализовать adapter, wiring
3. Переключить GameScene, удалить `startFollow`
4. Ручная проверка: бег туда-сюда, края уровня, respawn fade
5. `npm run build && npm run test && npm run lint`

Rollback: вернуть `startFollow` в GameScene, удалить port (изолированное изменение).

## Open Questions

- Нет блокеров. Тонкая настройка `directionChangeLerp` / duration — после playtest, без отдельного settings UI.
