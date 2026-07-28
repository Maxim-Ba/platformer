## Context

Этап 5 из 8. Adapters и movement wired; добавляем полный scene flow.

## Goals / Non-Goals

**Goals:**

- Все 5 сцен работают с переходами.
- GameScene — thin: update → use case → sync sprite.
- Stable scene keys в одном модуле.

**Non-Goals:**

- Tiled levels (этап 6) — GameScene может использовать placeholder platforms.
- HUD, lives (этап 7).

## Decisions

### Scene flow

```
Boot → Preload → MainMenu → Game → GameOver
                  ↑__________________|
```

### Scene keys module

`src/game/scene-keys.ts` — единственный источник строковых ключей.

### PreloadScene

Progress bar + load minimal assets (placeholder sprite if any).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Fat GameScene | Lint/review: no domain rules in scene files |
