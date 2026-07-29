## Context

В `GameScene` клавиша Esc вызывает `goToGameOver()`, что переводит игрока на экран поражения. Подсказка в `ControlsHintWidget` явно говорит «Esc — game over». При этом смерть от hazard уже обрабатывается отдельно (`handleHazardDamage` → `goToGameOver` или `respawnPlayer`), а checkpoint respawn реализован через `respawnPosition` и `activatedCheckpointIds`.

В проекте уже есть:
- `MenuList` — переиспользуемый UI для клавиатурной навигации по пунктам меню
- `SettingsScene` — экран настроек с возвратом в `MainMenuScene` по Esc
- `SaveGame` use case — quick-save перед выходом в главное меню (используется в `GameOverScene` / `LevelCompleteScene`)

Пауза должна заморозить геймплей без уничтожения состояния сцены (позиция игрока, активированные чекпоинты, ресурсы).

## Goals / Non-Goals

**Goals:**

- Esc открывает/закрывает меню паузы во время активного геймплея
- Пункты меню: **Настройки**, **Начать с контрольной точки**, **Выход**
- Геймплей замораживается на время паузы (update loop пропускает movement, damage, camera, resource ticks)
- Настройки открываются из паузы с возвратом в ту же игровую сессию
- Respawn с контрольной точки переиспользует существующий `respawnPlayer()` / `respawnPosition`
- Выход вызывает `saveGame` и переходит в `MainMenuScene`
- Обновить текст подсказки управления

**Non-Goals:**

- Отдельная Phaser-сцена `PauseScene` (overlay внутри `GameScene` проще и сохраняет state)
- Пауза во время fade respawn / level complete
- Подтверждение действий («Вы уверены?»)
- Сохранение игры как отдельный пункт меню паузы
- Звуки и анимации открытия/закрытия паузы

## Decisions

### Pause as in-scene overlay (not separate scene)

```
GameScene (running)
  │
  ├─ Esc ──► isPaused = true
  │            ├─ dim overlay (semi-transparent rect)
  │            └─ PauseMenuOverlay (MenuList)
  │
  ├─ Esc (while paused, menu visible) ──► isPaused = false, destroy overlay
  │
  └─ Menu actions:
       ├─ Settings ──► scene.launch(Settings) + scene.pause(Game)
       ├─ Checkpoint ──► close pause + respawnPlayer()
       └─ Exit ──► saveGame + scene.start(MainMenu)
```

**Почему overlay, а не `PauseScene`:** состояние уровня (чекпоинты, HP, позиция) уже живёт в `GameScene`. Overlay не требует сериализации/восстановления state и не ломает `GameHud` lifecycle.

**Альтернатива:** `scene.pause()` / `scene.resume()` для всей `GameScene` — отклонено, т.к. нужен частичный update (обработка Esc и overlay) и селективная заморозка без остановки Phaser timers целиком.

### Freeze via early return in `update()`

Добавить флаг `isPaused: boolean`. В начале `update()`:

```typescript
if (this.isPaused) {
  if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
    this.closePauseMenu();
  }
  return;
}
```

Также расширить существующий guard:

```typescript
if (this.isRespawning || this.isCompleting || this.isPaused || ...) return;
```

**Почему:** минимальный diff, согласован с уже существующими `isRespawning` / `isCompleting` guards.

### `PauseMenuOverlay` component

Новый модуль `src/presentation/ui/PauseMenuOverlay.ts`:

- Полупрозрачный fullscreen rect (`setScrollFactor(0)`, depth выше HUD)
- Заголовок «Пауза»
- `createMenuList` с тремя пунктами
- `destroy()` очищает overlay и отписывает listeners
- Esc в overlay: `GameScene` обрабатывает закрытие (не дублировать в MenuList)

Пункты меню (id → action):

| id | label | action |
|----|-------|--------|
| `settings` | Настройки | `openSettingsFromPause()` |
| `checkpoint` | Начать с контрольной точки | `closePauseMenu()` + `respawnPlayer()` |
| `exit` | Выход | `saveGame` + `scene.start(MainMenu)` |

### Settings from pause: scene launch with return context

Расширить `SettingsScene.init(data)`:

```typescript
interface SettingsSceneData {
  returnScene?: string; // default: MainMenu
}
```

- Из паузы: `this.scene.launch(SceneKeys.Settings, { returnScene: SceneKeys.Game })` + `this.scene.pause()`
- В `SettingsScene` Esc → `this.scene.stop()` + `this.scene.resume(returnScene)`
- `GameScene` слушает `resume` event → `isPaused` остаётся `true`, overlay видим (игрок возвращается в меню паузы, не в геймплей)

**Альтернатива:** inline settings в overlay — отклонено, дублирует `SettingsScene` и `UpdateSettings` wiring.

### Checkpoint restart semantics

«Начать с контрольной точки» вызывает существующий `respawnPlayer()`:

- Если чекпоинт активирован → `respawnPosition` уже указывает на него
- Если нет → respawn на `player_spawn` (начальная позиция уровня)
- Пауза закрывается до начала fade respawn
- HP/invulnerability: respawn после hazard сбрасывает позицию; при ручном restart из паузы HP не восстанавливается (только позиция) — **v1 поведение**: только reposition, без heal

**Альтернатива:** полный reset HP — отложено; не указано в требованиях.

### Exit to main menu

По аналогии с `GameOverScene`:

```typescript
dependencies.saveGame.execute({ slotId: DEFAULT_SAVE_SLOT_ID, levelId: this.levelId });
this.scene.start(SceneKeys.MainMenu);
```

### Controls hint update

`ControlsHintWidget`: `Esc — пауза` (или `Esc — pause` если проект на англ. в hints — в проекте hints на англ., но меню на русском; использовать `Esc — pause` для консистентности с `A/D or arrows`).

## Risks / Trade-offs

- **[Risk] SettingsScene pause/resume race** → `GameScene` регистрирует `this.events.on('resume', ...)` один раз в `create()`; overlay state синхронизируется явно
- **[Risk] Двойной Esc при открытом MenuList** → Esc обрабатывается только в `GameScene.update()`, не в `MenuList` window listener
- **[Risk] Input leak while paused** → `update()` early return блокирует movement; jump/attack keys игнорируются
- **[Trade-off] HP не восстанавливается при checkpoint restart из паузы** → документировано в spec; можно добавить позже
- **[Trade-off] Нет паузы во время respawn fade** → согласовано с non-goals

## Migration Plan

1. Добавить `PauseMenuOverlay` и pause state в `GameScene`
2. Заменить Esc → `goToGameOver()` на `togglePauseMenu()`
3. Расширить `SettingsScene` return context
4. Обновить `ControlsHintWidget`
5. Обновить README controls
6. Ручная проверка: Esc open/close, settings round-trip, checkpoint respawn, exit + reload save

Rollback: revert `GameScene` Esc handler к `goToGameOver()` — единственная breaking surface.

## Open Questions

- Нужно ли восстанавливать HP при «Начать с контрольной точки»? **v1: нет** (только reposition).
- Показывать ли HUD поверх overlay паузы? **v1: да** — HUD остаётся видимым под затемнением.
