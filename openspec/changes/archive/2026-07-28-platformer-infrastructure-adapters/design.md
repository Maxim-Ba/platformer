## Context

Этап 4 из 8. Domain movement готов; нужны Phaser adapters.

## Goals / Non-Goals

**Goals:**

- Единственное место вызова Phaser body API — physics adapter.
- Keyboard input через `IInputPort`.
- PlayerSprite синхронизируется с domain state.

**Non-Goals:**

- Полный scene flow (этап 5).
- Tilemap collision (этап 6).

## Decisions

### IInputPort

Methods: `getHorizontalAxis(): -1 | 0 | 1`, `isJumpPressed(): boolean`, `update()` per frame if needed.

Keys: Arrows or A/D, Space for jump.

### IPhysicsPort

- `applyVelocity(entityId, velocity)`
- `setPosition(entityId, position)`
- `syncFromDomain(state)` / `readGrounded(): boolean` — pragmatic bridge to Arcade

### PlayerSprite

Thin view: reads `PlayerState`, updates sprite position/flip. No movement rules inside.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Domain vs Arcade physics drift | Adapter owns sync; domain gets grounded flag from adapter feedback |
