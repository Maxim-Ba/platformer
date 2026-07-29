## Context

`GameScene.handleLevelInteractions()` при overlap с `level_exit` вызывает `goToGameOver()`. `GameOverScene` — красный экран «Game Over» с Restart и Main Menu. Смерть от hazard (после `game-feature-modules`) и победа визуально неразличимы.

Scene flow сейчас: `MainMenu → Game → GameOver`. Нужен: `MainMenu → Game → LevelComplete` (победа) и `MainMenu → Game → GameOver` (смерть).

## Goals / Non-Goals

**Goals:**

- Отдельный экран победы при достижении `level_exit`
- Fade transition при завершении уровня
- Разделение death flow и victory flow
- Переход на следующий уровень если он есть в progression list
- Retry текущего уровня и возврат в Main Menu
- Передача `levelId` в LevelCompleteScene через scene data

**Non-Goals:**

- Level select screen с картой мира
- Персистентный save progress (можно добавить позже через localStorage)
- Анимации победы, confetti, звуки
- Параллельные ветки уровней (только linear chain)
- Boss victory screen variants

## Decisions

### Scene flow diagram

```
                    ┌─────────────┐
                    │  MainMenu   │
                    └──────┬──────┘
                           │ start
                           ▼
                    ┌─────────────┐
          ┌────────│    Game     │────────┐
          │ death  └──────┬──────┘ victory│
          ▼               │               ▼
   ┌─────────────┐  level_exit    ┌──────────────────┐
   │  GameOver   │  overlap       │ LevelComplete    │
   └─────────────┘                └──────────────────┘
          │                               │
    R → Game                      N → next level (if any)
    M → MainMenu                  R → retry same level
                                  M → MainMenu
```

### LevelCompleteScene design

- Background: `#14532d` (dark green — victory, контраст с GameOver `#450a0a`)
- Title: «Level Complete»
- Subtitle: completed level id (e.g. `level-01`)
- Controls:
  - **N / Enter** — Next Level (only if `nextLevelId` exists)
  - **R** — Retry same level
  - **M** — Main Menu

### Scene data contract

```typescript
interface LevelCompleteSceneData {
  levelId: string;
  nextLevelId?: string;
}
```

Passed via `scene.start(SceneKeys.LevelComplete, data)`.

### Level progression config

`src/game/constants.ts`:

```typescript
export const LEVEL_PROGRESSION: readonly string[] = ['level-01'] as const;

export function getNextLevelId(currentLevelId: string): string | undefined {
  const index = LEVEL_PROGRESSION.indexOf(currentLevelId);
  if (index === -1 || index >= LEVEL_PROGRESSION.length - 1) return undefined;
  return LEVEL_PROGRESSION[index + 1];
}
```

When `level-02` is added later, append to array — no scene changes needed.

### GameScene exit handling

Replace:
```typescript
this.goToGameOver(); // on exit overlap
```

With:
```typescript
this.completeLevel(); // fade out → LevelCompleteScene
```

`completeLevel()`:
1. Guard against double-trigger (`isCompleting` flag, like `isRespawning`)
2. Camera fade out (200ms)
3. On complete: `scene.start(LevelComplete, { levelId, nextLevelId: getNextLevelId(levelId) })`

### Death vs victory separation

| Trigger | Destination |
|---------|-------------|
| `level_exit` overlap | LevelCompleteScene |
| HP = 0 (future) / hazard instant death (current) | GameOverScene |
| Esc debug key | GameOverScene (keep for dev) |

### Use case (optional, thin)

`CompleteLevel` use case не обязателен — переход чисто presentation. Если добавить:
- Input: `levelId`
- Output: `{ nextLevelId }` via `getNextLevelId`
- Keeps GameScene thin

Решение: **helper function** `getNextLevelId` в constants, без отдельного use case (YAGNI для pet project).

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Reuse GameOverScene with mode flag | Confusing UX; mixed responsibilities |
| Inline victory overlay in GameScene | No clean scene lifecycle; harder to extend |
| ILevelProgressPort + adapter | Over-engineering for v1; scene data sufficient |
| Auto-advance to next level | No player agency; feels rushed |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Only level-01 exists — Next Level hidden | UI shows only Retry + Menu when no next level |
| Double exit trigger | `isCompleting` guard |
| Fade blocks input during transition | Disable update loop during complete (like respawn) |

## Migration Plan

1. Add scene key + constants
2. Create LevelCompleteScene
3. Register in bootstrap
4. Refactor GameScene exit handler
5. Update README
6. Manual playtest: exit → victory, Esc → game over

Rollback: revert GameScene to `goToGameOver()` on exit.

## Open Questions

- Next level key: N — **confirmed**
- Show next level name on screen — **yes, as subtitle when next exists**
