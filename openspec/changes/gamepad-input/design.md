## Context

В проекте ввод изолирован за `IInputPort` (`isLeftPressed`, `isRightPressed`, `isJumpPressed`). Реализация — `PhaserInputAdapter` (только keyboard). Системные действия (Esc → pause/game over, I/K/C/U/M → character menu) обрабатываются напрямую в `GameScene` через `Phaser.Input.Keyboard`. UI-меню (`MenuList`, `SettingsScene`, `LoadGameScene`, `CharacterMenuOverlay`) слушают `window.addEventListener('keydown', ...)`.

Phaser 3 включает встроенный Gamepad Plugin (`scene.input.gamepad`). Кнопки нумеруются по стандарту W3C Gamepad API (Xbox-раскладка: 0=A, 1=B, 2=X, 3=Y, 4=LB, 5=RB, 8=Back, 9=Start, 12-15=D-pad).

Связанные changes (`player-dash`, `melee-combat`, `pause-menu`, `character-menu`) явно откладывали gamepad на отдельный этап — этот change закрывает этот долг единообразно.

## Goals / Non-Goals

**Goals:**

- Первый подключённый геймпад (index 0) работает без дополнительной настройки
- Keyboard и gamepad работают одновременно; приоритет не важен (OR-логика)
- Геймплей: движение, прыжок, пауза, меню персонажа
- Все существующие меню навигируются с D-pad и face buttons
- Gamepad-логика сосредоточена в infrastructure/presentation; domain и use cases не знают про Phaser Gamepad
- `JustDown` семантика для кнопок (jump, confirm, pause) — один раз за нажатие

**Non-Goals:**

- UI ребиндинга, профили контроллеров, мёртвые зоны в настройках
- Локальный multiplayer / второй геймпад
- Force feedback
- Нормализация под PlayStation (иконки △○□×) — только функциональный маппинг
- Аналоговые триггеры для геймплейных действий (только цифровые кнопки и стик с порогом)

## Decisions

### Composite adapter в composition root

```
composition-root
  ├── PhaserKeyboardInputAdapter   (existing PhaserInputAdapter, keyboard-only)
  ├── PhaserGamepadReader          (polls pad 0 each frame)
  └── CompositeInputAdapter        implements IInputPort
        isLeftPressed()  = keyboard.isLeftPressed()  || gamepad.isLeftPressed()
        isJumpPressed()  = keyboard.isJumpPressed()  || gamepad.isJumpPressed()
        ...
```

**Почему composite, а не монолитный `PhaserInputAdapter`:** разделение ответственности; keyboard-адаптер остаётся простым; gamepad reader тестируется отдельно; будущие источники ввода (touch) добавляются тем же паттерном.

**Альтернатива:** расширить `PhaserInputAdapter` напрямую — отклонено из-за роста класса и смешения keyboard/gamepad lifecycle.

### PhaserGamepadReader — infrastructure helper

Новый класс `PhaserGamepadReader` в `src/infrastructure/phaser/`:

- В конструкторе: `scene.input.gamepad?.once('connected', ...)` + проверка уже подключённых pads
- Хранит ссылку на `Phaser.Input.Gamepad.Gamepad` (pad 0)
- Метод `update()` вызывается из адаптера/scene каждый кадр (или внутри `CompositeInputAdapter` при poll)
- Порог стика: `Math.abs(axis) > 0.5` для left/right
- D-pad: кнопки 12-15 как альтернатива стику
- `wasButtonJustPressed(index)` — через `button.justDown` Phaser или snapshot предыдущего кадра

### GamepadButtonMap — единый маппинг

Константы в `src/presentation/input/GamepadButtonMap.ts` (presentation, т.к. привязаны к UX, не к domain):

| Действие | Кнопка (Xbox index) |
|----------|---------------------|
| Jump / Confirm | 0 (A) |
| Back / Close menu | 1 (B) |
| Attack (future) | 2 (X) |
| Dash (future) | 3 (Y) |
| Character menu prev tab | 4 (LB) |
| Character menu next tab | 5 (RB) |
| Character menu toggle | 8 (Back/View) |
| Pause | 9 (Start) |
| D-pad Up/Down/Left/Right | 12/13/14/15 |

Infrastructure reader использует эти индексы через import из presentation **или** дублирует как `GAMEPAD_BUTTON` enum в infrastructure с re-export — предпочтительно один файл `src/game/input-bindings.ts` на уровне game layer, доступный и infrastructure, и presentation.

**Решение:** `src/game/gamepad-bindings.ts` — единый источник индексов (game layer, без Phaser-типов).

### Menu input handler

Новый `createMenuInputHandler(scene, options)` в `src/presentation/input/createMenuInputHandler.ts`:

```typescript
createMenuInputHandler(scene, {
  onUp, onDown, onLeft, onRight, onConfirm, onCancel,
});
```

- Слушает keyboard (Arrow keys, Enter, Space, Escape) как сейчас
- Каждый кадр (через `scene.events.on('update')`) опрашивает `PhaserGamepadReader` для D-pad и A/B
- `MenuList`, `CharacterMenuOverlay`, `SettingsScene`, `LoadGameScene` мигрируют на этот хелпер

**Почему не только `window keydown`:** gamepad не генерирует keyboard events; нужен poll loop.

### GameScene system actions

`GameScene` получает `PhaserGamepadReader` (через deps или scene-scoped instance) параллельно keyboard:

```typescript
// pause
if (JustDown(keyEsc) || gamepad.wasButtonJustPressed(PAUSE)) { ... }

// character menu toggle
if (gamepad.wasButtonJustPressed(BACK)) { toggleCharacterMenu(); }
if (gamepad.wasButtonJustPressed(LB/RB)) { cycleTab(-1/+1); }
```

Keyboard hotkeys (I/K/C/U/M) остаются; gamepad использует LB/RB/Back как дополнение, не замену буквенных клавиш на PC.

### Gamepad plugin bootstrap

В `bootstrap.ts` / game config:

```typescript
input: {
  gamepad: true,
}
```

Проверить, что Phaser 3.60+ gamepad включён по умолчанию; явно задокументировать в config.

### Расширение IInputPort для dash/attack

Если `isDashPressed()` / `isAttackPressed()` уже добавлены другими changes — `CompositeInputAdapter` агрегирует их аналогично. Если ещё нет — добавить в этом change с gamepad-маппингом Y/X, чтобы не возвращаться позже.

## Risks / Trade-offs

- **[Risk] Геймпад не подключён при старте** → Reader возвращает `false` для всех методов; при `connected` event подхватывает pad 0 без перезагрузки
- **[Risk] Разные раскладки (PlayStation)** → W3C API нормализует индексы к Xbox-порядку в большинстве браузеров; на редких драйверах маппинг может отличаться → документировать тестирование на целевой платформе
- **[Risk] Дребезг D-pad в меню** → использовать `justDown` / debounce 150ms для repeat navigation при удержании
- **[Risk] Стик drift** → порог 0.5; не использовать стик для menu navigation (только D-pad)
- **[Trade-off] Один геймпад** → упрощает API; локальный co-op вне scope

## Migration Plan

1. Добавить `gamepad-bindings.ts` и `PhaserGamepadReader`
2. Ввести `CompositeInputAdapter`, переключить composition root
3. Мигрировать `MenuList` и overlays на `createMenuInputHandler`
4. Добавить gamepad в `GameScene` system actions
5. Обновить HUD hint и README
6. Ручной тест: Xbox-совместимый геймпад в Chrome/Edge

Rollback: вернуть прямой `PhaserInputAdapter` в composition root; menu handler fallback на keyboard-only.

## Open Questions

- Нужен ли visual indicator «геймпад подключён» в HUD? → v1: нет, только обновить текст подсказки
- Открывать character menu на Back с запоминанием последнего таба или всегда на Inventory? → последний активный таб (как toggle Esc на клавиатуре)
