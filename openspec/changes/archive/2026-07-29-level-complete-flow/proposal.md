## Why

Сейчас выход с уровня (`level_exit`) ведёт на `GameOverScene` — игрок воспринимает победу как поражение. Game loop незавершён: нет награды за прохождение, нет различия между смертью и успехом. Это быстрый polish-change с высоким ROI: одна новая сцена и правка перехода в `GameScene` делают loop цельным и мотивируют идти дальше (следующий уровень или меню).

## What Changes

- Новая сцена **`LevelCompleteScene`** — экран победы с fade-переходом
- `level_exit` overlap → **Level Complete** (не Game Over)
- **Game Over** остаётся только для смерти (0 HP / Esc debug)
- Передача контекста: `levelId`, опционально `nextLevelId`, время прохождения
- Навигация с экрана победы: **Next Level** (если есть), **Retry**, **Main Menu**
- Конфигурация progression: ordered list уровней (`level-01` → `level-02` → …)
- Fade-out при входе на exit (как при respawn) для плавности
- Обновление scene lifecycle spec и README controls/flow

**Non-goals:** star rating, leaderboard, cutscenes, полноценный level select UI, save slots.

## Capabilities

### New Capabilities

- `level-complete-flow`: victory scene, exit transition, level progression chain

### Modified Capabilities

- `scene-lifecycle`: добавить LevelCompleteScene и правила переходов
- `level-pipeline`: `level_exit` MUST trigger level complete flow, not game over
- `mvp-integration`: end-to-end session MUST distinguish level completion from game over

## Impact

- `src/presentation/scenes/LevelCompleteScene.ts` — новая сцена
- `src/game/scene-keys.ts` — `LevelComplete` key
- `src/game/bootstrap.ts` — регистрация сцены
- `src/game/constants.ts` — `LEVEL_PROGRESSION` ordered list
- `src/presentation/scenes/GameScene.ts` — exit → `goToLevelComplete()` вместо `goToGameOver()`
- `src/presentation/index.ts` — export
- README — обновить controls и game flow
