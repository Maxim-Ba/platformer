## Context

`GameSettings.controls.keyBindings` уже есть в domain-схеме и `DEFAULT_SETTINGS`, но не используется: `PhaserInputAdapter` жёстко привязан к A/D, стрелкам, Space, J/X, Shift/L; `GameScene` — к Esc и I/K/C/U/M. SettingsScene показывает только audio/video. Change `gamepad-input` планирует composite adapter и фиксированный маппинг кнопок геймпада — без UI ребиндинга.

Игроку нужно менять клавиши из главного меню и из паузы (Settings → Управление). Архитектура должна позволить позже добавить `gamepadBindings` без ломки схемы.

## Goals / Non-Goals

**Goals:**

- Типизированный каталог игровых действий (`InputActionId`) в domain layer
- UI ребиндинга в SettingsScene, доступный из MainMenu и pause flow
- Персистентность и валидация через `SettingsRules` + `UpdateSettings`
- `PhaserInputAdapter` и системные хоткеи GameScene читают актуальные биндинги
- HUD-подсказка отражает текущие клавиши
- Схема `controls` с placeholder для будущих gamepad-биндингов

**Non-Goals:**

- UI назначения кнопок геймпада (отдельный этап после `gamepad-input`)
- Ребиндинг навигации меню (стрелки, Enter, Space для UI)
- Мёртвые зоны, профили, импорт/экспорт раскладок
- Mouse/touch

## Decisions

### InputActionId — единый каталог в domain

Файл `src/domain/constants/input-actions.ts`:

| Action id | Default keys | Label (RU) |
|-----------|--------------|------------|
| `moveLeft` | ArrowLeft, KeyA | Влево |
| `moveRight` | ArrowRight, KeyD | Вправо |
| `jump` | Space | Прыжок |
| `dash` | ShiftLeft, KeyL | Рывок |
| `attack` | KeyJ, KeyX | Атака |
| `pause` | Escape | Пауза |
| `charMenuInventory` | KeyI | Меню: инвентарь |
| `charMenuSkills` | KeyK | Меню: навыки |
| `charMenuStats` | KeyC | Меню: характеристики |
| `charMenuUpgrades` | KeyU | Меню: улучшения |
| `charMenuMap` | KeyM | Меню: карта |

**Почему domain, а не presentation:** use cases и `SettingsRules` валидируют action ids; UI только отображает лейблы из `input-action-labels.ts`.

**Формат значения:** `string | string[]` (KeyboardEvent.code). Массив сохраняет текущее поведение «стрелка или буква» для движения/dash/attack.

### Расширение GameSettings.controls

```typescript
export interface GamepadBinding {
  kind: 'button' | 'axis';
  index: number;
  /** для axis: -1 | 1 */
  direction?: -1 | 1;
}

controls: {
  keyBindings: Record<InputActionId, string | string[]>;
  gamepadBindings?: Partial<Record<InputActionId, GamepadBinding | GamepadBinding[]>>;
};
```

`gamepadBindings` — опционально, без UI и без чтения в этом change. `SettingsRules.merge` сохраняет поле при patch. Будущий `gamepad-input` добавит дефолты и composite reader.

**Альтернатива:** отдельная таблица `bindings: { keyboard, gamepad }[]` — отклонено как избыточно для v1.

### SettingsRules — валидация биндингов

Новые правила в `SettingsRules`:

- Каждый ключ patch MUST быть известным `InputActionId`
- Значение: непустая строка или непустой массив строк (KeyboardEvent.code)
- Глобальная уникальность: один `code` не может быть назначен двум разным action (при конфликте — отклонить patch, вернуть предыдущее состояние)
- `resetControlsToDefaults()` через patch всех keyBindings к `DEFAULT_SETTINGS`

Unit-тесты в `SettingsRules.test.ts`.

### PhaserInputAdapter — settings-aware

Адаптер получает `() => GameSettings['controls']` (или `ISettingsPort`) при создании в composition root:

```typescript
class PhaserInputAdapter {
  constructor(scene, getControls: () => GameSettings['controls']) { ... }

  private isActionDown(action: InputActionId): boolean {
    const codes = normalizeCodes(this.getControls().keyBindings[action]);
    return codes.some(code => this.isKeyDown(code));
  }
}
```

- Динамически регистрирует Phaser keys при первом обращении (lazy cache по code)
- При смене биндинга в settings cache инвалидируется (простой `version` counter в adapter или re-read each frame — предпочтительно read each frame для простоты, Phaser `addKey` кэширует)
- Shift: dash слушает все коды из `dash` binding (ShiftLeft + KeyL по умолчанию)

**Почему не пересоздавать adapter при каждом update:** GameScene живёт долго; callback дешевле.

### GameScene system hotkeys

Pause и character menu tabs читают `settingsPort.getSettings().controls.keyBindings` вместо hardcoded KeyCodes. Логика `JustDown` остаётся в presentation; domain не знает про Phaser.

Character menu: при открытии таба по hotkey — тот же toggle что сейчас, но key из settings.

### SettingsScene — двухуровневая навигация

**Уровень 1 (существующий):** master, music, sfx, fullscreen + новая строка **«Управление»**.

**Уровень 2 (Controls sub-screen):** список `InputActionId` с отображаемым label и текущим key label (human-readable: `Space`, `←`, `A` via `formatKeyCode()` в presentation).

Взаимодействие:

- ↑↓ — выбор действия
- Enter / Space — войти в режим «Нажмите клавишу…»
- В режиме listen: первое `keydown` (кроме Escape) → назначить; Escape → отмена
- Кнопка/строка «Сброс по умолчанию» (Enter на выделенной или отдельный пункт внизу)
- Escape на уровне 2 → назад к audio/video
- Escape на уровне 1 → return scene (как сейчас)

Return context из pause menu не меняется.

**Альтернатива:** отдельная `ControlsScene` — отклонено; достаточно state machine внутри SettingsScene.

### formatKeyCode — presentation helper

`src/presentation/input/formatKeyCode.ts` — маппинг `KeyboardEvent.code` → короткая подпись для UI и HUD. Не в domain (локализация UI).

### ControlsHintWidget — динамический текст

Принимает `GameSettings['controls']` или форматированный snapshot; строит строку из `INPUT_ACTIONS` + `formatKeyCode`. Character menu tabs — перечисление актуальных клавиш.

### Связь с gamepad-input

- `control-rebinding` поставляется **до** или **параллельно** с `gamepad-input`
- Composite adapter: keyboard branch читает `keyBindings`; gamepad branch позже читает `gamepadBindings` или дефолтный `gamepad-bindings.ts`
- Ребиндинг геймпада вынесен в follow-up change после базового gamepad support

## Risks / Trade-offs

- **[Risk] Конфликт клавиш при ребиндинге** → валидация уникальности в `SettingsRules`; UI показывает сообщение «Клавиша уже занята»
- **[Risk] Назначение Esc/Escape ломает выход из меню** → запретить назначать Escape на gameplay actions кроме `pause`; или разрешить pause=Escape только
- **[Risk] Phaser key cache устаревает** → callback `getControls()` каждый кадр; lazy `addKey` по code
- **[Risk] Модификаторы (Shift/Ctrl)** → v1: только `event.code` целиком; ShiftLeft/ShiftRight — отдельные коды
- **[Trade-off] Нет ребиндинга UI-навигации** → меньше сложности; геймпад-навигация в меню остаётся фиксированной в `gamepad-input`

## Migration Plan

1. Добавить `InputActionId`, лейблы, расширить `DEFAULT_SETTINGS` (полный набор actions)
2. Обновить `SettingsRules` + тесты
3. Рефакторинг `PhaserInputAdapter` на settings callback
4. Обновить `GameScene` hotkeys
5. UI в `SettingsScene` (sub-screen)
6. `ControlsHintWidget` + composition root wiring
7. Bump `SETTINGS_VERSION` при необходимости merge старых saves

Rollback: вернуть hardcoded keys в adapter; старые saves с custom bindings игнорируются через defaults merge.

## Open Questions

- Показывать ли предупреждение при назначении клавиши, уже используемой UI (Escape, ArrowUp)? → v1: блокировать только дубликаты между gameplay actions; Escape разрешён только для `pause`
- Нужен ли отдельный пункт «Сброс всех» vs сброс одного action? → v1: сброс всех к дефолту одной строкой меню
