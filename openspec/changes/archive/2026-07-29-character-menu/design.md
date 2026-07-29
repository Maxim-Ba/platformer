## Context

В проекте есть `MenuList` для вертикальной навигации (главное меню, пауза), `GameHud` с виджетами ресурсов и `IInventoryPort` в application layer. UI-экрана персонажа нет — игрок не может открыть инвентарь, скилы или карту во время уровня.

По аналогии с `pause-menu` (in-scene overlay, freeze через early return в `update()`), меню персонажа должно жить внутри `GameScene` без отдельной Phaser-сцены. Контент вкладок на v1 — mock, чтобы не блокировать реализацию на отсутствии систем скилов/карты.

## Goals / Non-Goals

**Goals:**

- Overlay-меню персонажа с 5 вкладками-табами: **Инвентарь**, **Скилы**, **Характеристики**, **Активные умения**, **Карта**
- Горизонтальная навигация между табами стрелками **Left/Right** (wrap-around)
- Отдельная горячая клавиша на каждую вкладку — открывает меню сразу на нужном табе
- **Esc** или повторное нажатие той же hotkey — закрывает меню
- Заморозка геймплея на время открытого меню
- Mock-контент в области под табами (placeholder-текст)
- Обновление `ControlsHintWidget`

**Non-Goals:**

- Реальные данные из `IInventoryPort`, progression, skills
- Мини-карта уровня, drag-and-drop, анимации
- Отдельная `CharacterMenuScene`
- Пауза во время respawn fade / level complete
- Конфликт с pause menu (если оба change применены — character menu и pause menu используют разные клавиши; Esc остаётся за pause menu)

## Decisions

### In-scene overlay (не отдельная сцена)

```
GameScene (running)
  │
  ├─ Hotkey (I/K/C/U/M) ──► isCharacterMenuOpen = true, activeTab = <tab>
  │
  ├─ Left/Right (while open) ──► switch tab
  │
  ├─ Esc or same hotkey ──► close overlay
  │
  └─ update() early return while isCharacterMenuOpen (same pattern as pause)
```

**Почему:** состояние уровня остаётся в `GameScene`; overlay не требует сериализации. Согласовано с `PauseMenuOverlay`.

### Tab bar UI (не MenuList)

`MenuList` рассчитан на вертикальный список. Для табов создаём `TabBar`:

- Горизонтальный ряд из 5 label'ов
- Выделение активного таба цветом (как в `MenuList`: `#f8fafc` / `#64748b`)
- `setActiveTab(index)` переключает highlight и content panel

Контент — `CharacterMenuContent` с 5 mock-панелями (`createMockTabPanel(scene, tabId)`).

### Hotkey mapping

Константы в `src/game/character-menu-config.ts`:

| id | label | Phaser key | Key code |
|----|-------|------------|----------|
| `inventory` | Инвентарь | `I` | KeyCodes.I |
| `skills` | Скилы | `K` | KeyCodes.K |
| `stats` | Характеристики | `C` | KeyCodes.C |
| `abilities` | Активные умения | `U` | KeyCodes.U |
| `map` | Карта | `M` | KeyCodes.M |

**Почему K для скилов:** `S` может конфликтовать с save/settings в будущем; `K` = s**K**ills mnemonic.

**Поведение hotkey:**
- Меню закрыто → открыть на соответствующем табе, заморозить геймплей
- Меню открыто на том же табе → закрыть
- Меню открыто на другом табе → переключить таб (не закрывать)

### Arrow navigation (horizontal only)

Пока меню открыто, **ArrowLeft** / **ArrowRight** переключают таб (wrap-around). **ArrowUp/Down** не используются — контент mock, вертикальной навигации нет.

Обработка через `window.addEventListener('keydown', ...)` в overlay (как `MenuList`), с `preventDefault()` для стрелок.

### Gameplay freeze

Флаг `isCharacterMenuOpen: boolean`. В `GameScene.update()`:

```typescript
if (this.isCharacterMenuOpen || this.isPaused || this.isRespawning || ...) {
  // handle Esc / hotkeys for menu
  return;
}
```

Movement, hazard damage, camera follow, resource ticks — не обновляются.

### `CharacterMenuOverlay` component

Новый модуль `src/presentation/ui/CharacterMenuOverlay.ts`:

- Полупрозрачный fullscreen rect (`setScrollFactor(0)`, depth выше HUD)
- Заголовок «Персонаж» (опционально)
- `TabBar` — 5 табов
- `contentContainer` — одна видимая mock-панель
- API: `setActiveTab(tabId)`, `getActiveTab()`, `destroy()`
- Не обрабатывает Esc — `GameScene` владеет open/close lifecycle

### Layout (1920×1080)

- Overlay panel: centered, ~1400×800 px, тёмный фон `#0f172a` @ 0.92 alpha
- Tab bar: top of panel, равномерное распределение 5 табов
- Content area: below tab bar, placeholder monospace text per tab

### Controls hint update

`ControlsHintWidget` — добавить краткую подсказку:

```
I/K/C/U/M — character menu tabs
```

(или сокращённо `I — inventory, M — map, ...` если строка не влезает)

### Coexistence with pause menu

Если `pause-menu` уже применён: `isPaused` и `isCharacterMenuOpen` — взаимоисключающие. Открытие одного блокирует hotkeys другого. Приоритет: если оба флага не должны быть true одновременно — `openCharacterMenu()` проверяет `!isPaused`.

## Risks / Trade-offs

- **[Risk] Конфликт M с movement** → `M` не используется для движения (A/D/arrows); при открытом меню input блокируется
- **[Risk] Длинная строка hints** → сократить до `I/K/C/U/M — menu` или двухстрочный hint
- **[Risk] Дублирование freeze logic с pause menu** → вынести общий guard `isGameplayFrozen()` при рефакторинге; v1 — дублировать минимально
- **[Trade-off] Mock-контент** → позже заменяется реальными виджетами без смены TabBar API
- **[Trade-off] Нет вертикальной навигации внутри вкладок** → добавится при реальном инвентаре

## Migration Plan

1. Добавить `character-menu-config.ts` с tab definitions и key codes
2. Создать `TabBar`, mock panels, `CharacterMenuOverlay`
3. Интегрировать в `GameScene`: hotkeys, freeze, open/close
4. Обновить `ControlsHintWidget`
5. Ручная проверка: каждая hotkey открывает нужный таб, стрелки переключают, Esc закрывает, геймплей заморожен

Rollback: удалить overlay integration из `GameScene` — единственная breaking surface.

## Open Questions

- Нужна ли общая клавиша «открыть меню на последнем табе» (например Tab)? **v1: нет** — только per-tab hotkeys.
- Блокировать ли character menu во время pause? **v1: да** — mutually exclusive.
