## Context

Этап 6 из 8. Scene flow готов; GameScene переходит на Tiled-authored levels.

## Goals / Non-Goals

**Goals:**

- level-01 загружается из JSON.
- Collision via `solid: true` tile property.
- Object types: player_spawn, level_exit, hazard, checkpoint.

**Non-Goals:**

- Camera polish, respawn fade (этап 7).
- Multiple levels (level-02+ post-MVP).

## Decisions

### Tiled conventions

- Export: JSON
- Layers: `ground`, `decor`, `objects`
- Tile property: `solid: true`
- Object types as listed in proposal

### LoadLevel use case

Returns `LevelDefinition` — spawn, exits, hazards, checkpoints as domain types.

### Hazard/checkpoint/exit

Basic overlap detection in GameScene or dedicated use case; handlers extensible (Open/Closed).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Manual Tiled export | Document workflow in README (этап 7) |
