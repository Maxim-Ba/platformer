## Context

Этап 3 из 8. Порты определены на этапе 2; реализуем pure movement logic.

## Goals / Non-Goals

**Goals:**

- Movement testable without Phaser/Vitest only.
- Coyote time + jump buffer для лучшего game feel.
- Constants вынесены из scenes.

**Non-Goals:**

- Phaser adapters (этап 4).
- Rendering, sprites (этапы 4–5).

## Decisions

### UpdatePlayerMovement flow

```
InputSnapshot + PlayerState + deltaMs
        ↓
   MovementRules (domain)
        ↓
   Updated PlayerState / Velocity
```

### Constants (defaults, tunable)

- `GRAVITY`, `PLAYER_SPEED`, `JUMP_VELOCITY`, `COYOTE_TIME_MS`, `JUMP_BUFFER_MS`

### Testing

Vitest tests for: grounded jump, coyote jump, coyote expiry, horizontal clamp, airborne movement.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Duplicating Phaser physics | Domain owns intent; adapter applies to Arcade body on stage 4 |
