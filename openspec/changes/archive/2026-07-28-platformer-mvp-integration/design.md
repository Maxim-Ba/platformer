## Context

Этап 7 из 8. Level pipeline работает; интегрируем polish для MVP demo.

## Goals / Non-Goals

**Goals:**

- Full playable loop verifiable manually.
- Camera follows player, clamped to level bounds.
- Checkpoint respawn with brief fade (Blasphemous-inspired death loop, simplified).

**Non-Goals:**

- Combat, audio, HUD lives counter.
- Multiple levels.

## Decisions

### Camera

`main.cameras.main.startFollow(playerSprite)`, `setBounds(0, 0, levelWidth, levelHeight)`.

### Respawn

On hazard damage: fade out → teleport to last checkpoint → fade in. Initial spawn from `player_spawn`.

### Placeholder art

Kenney assets or colored rectangle; animations optional.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Scope creep into combat | Stick to hazard + respawn only |
