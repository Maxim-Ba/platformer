## Context

`GameScene` сейчас рендерит единственный HUD-элемент — текст подсказки по управлению в координатах `(24, 24)` через прямой вызов `this.add.text()`. Подсистемы health (`IHealthPort`) и progression (`IProgressionPort`) уже подключены в composition root, но не отображаются. Маны и энергии в domain/application слоях нет.

Пользователь запросил модульный HUD: блоки ресурсов слева внизу, очки справа вверху, с возможностью позже переместить и сменить внешний вид без масштабного рефакторинга.

Разрешение игры: 1920×1080, `scale.mode = FIT` — HUD-координаты задаются в screen space с `setScrollFactor(0)`.

## Goals / Non-Goals

**Goals:**

- Модульная архитектура HUD: каждый блок — отдельный виджет с единым интерфейсом
- Отображение HP, Mana, Energy (слева внизу) и Score (справа вверху) во время gameplay
- Данные из портов (`IHealthPort`, `IManaPort`, `IEnergyPort`, `IProgressionPort`) — presentation не знает об адаптерах
- Layout-конфиг отделён от логики виджетов: смена позиции = правка `hud-layout.ts`
- Стиль виджета инкапсулирован внутри модуля: смена внешнего вида = правка одного файла виджета
- `GameHud` как единственная точка интеграции в `GameScene`

**Non-Goals:**

- Полоски/иконки/анимации (только текстовый MVP-вид)
- Геймплейная механика траты/восстановления маны и энергии
- Настройки HUD в Settings
- Drag-and-drop layout editor
- Отдельный score counter, независимый от progression (XP = очки)

## Decisions

### Widget contract (`HudWidget`)

Единый интерфейс для всех HUD-блоков:

```typescript
export interface HudWidget {
  readonly id: string;
  update(): void;
  setPosition(x: number, y: number): void;
  destroy(): void;
}
```

- `update()` — перечитывает порт и обновляет отображение (вызывается из `GameScene.update`)
- `setPosition()` — перемещает корневой Phaser-контейнер виджета
- `destroy()` — очистка при shutdown сцены

**Почему не Phaser Container subclass:** функциональный стиль (`createXxxWidget()`) совпадает с `createMenuList()` и проще тестировать контракт.

### Layout config (`hud-layout.ts`)

```typescript
export const HUD_LAYOUT = {
  resources: { anchor: 'bottom-left', x: 24, y: -24, lineHeight: 32 },
  score: { anchor: 'top-right', x: -24, y: 24 },
  controls: { anchor: 'top-left', x: 24, y: 24 },
} as const;
```

`GameHud` при `create()` вычисляет абсолютные координаты из `scene.scale.width/height` и anchor. При resize (если понадобится) — один вызов `relayout()`.

**Альтернатива:** хардкод в GameScene — отвергнута, т.к. пользователь явно просил лёгкий рефакторинг позиций.

### Resource widget (`ResourceHudWidget`)

Один модуль для HP/Mana/Energy — параметризуется label и getter:

```typescript
createResourceHudWidget(scene, {
  id: 'health',
  label: 'HP',
  getValue: () => healthPort.getHealth(),
  format: (state) => `${state.currentHp}/${state.maxHp}`,
});
```

Три экземпляра с разными портами — без дублирования кода.

### Score widget (`ScoreHudWidget`)

Отображает `Level {level}  XP {experience}` из `IProgressionPort.getProgression()`. XP = «очки» для MVP.

### Mana/Energy scaffold (`player-resources`)

По паттерну health module:

| Component | Responsibility |
|-----------|----------------|
| `ManaState` / `EnergyState` | `current`, `max` value objects |
| `IManaPort` / `IEnergyPort` | `getMana()`, `getEnergy()`, `reset()` |
| `InMemoryManaAdapter` / `InMemoryEnergyAdapter` | session defaults (e.g. 100/100) |
| composition root | per-scene factory, reset on level start |

Без use cases траты/восстановления — только read-only display.

### GameHud orchestrator

```typescript
export interface GameHud {
  update(): void;
  destroy(): void;
}

export function createGameHud(scene, deps: GameHudDependencies): GameHud
```

`GameHudDependencies` — только нужные порты (ISP). `GameScene` создаёт HUD в `initializeLevel()`, вызывает `hud.update()` в `update()`, `hud.destroy()` на shutdown.

### Depth and scroll

Все HUD game objects: `setScrollFactor(0)`, `setDepth(100)` (выше уровня, ниже overlay-сцен).

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Один монолитный `HudRenderer` class | Смена одного блока затрагивает весь класс |
| Phaser DOM Element / HTML overlay | Нарушает pixelArt pipeline, усложняет FIT scaling |
| Единый `IResourcePort` для HP/Mana/Energy | Нарушает ISP; разные lifecycle (health per-scene, mana future mechanics) |
| Score как отдельный `IScorePort` | Дублирует progression; XP уже начисляется за чекпоинты |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| HUD не пересчитывает позицию при resize | `relayout()` в `GameHud`; вызов при `resize` event (опционально в tasks) |
| `update()` каждый кадр — лишние `setText` | Текстовый MVP дешёв; позже — dirty flag при изменении state |
| Mana/Energy без геймплея — «фейковые» 100/100 | Явно документировано как scaffold; виджет готов к реальным значениям |
| GameScene получает progression через AppDependencies | `getAppDependenciesFromRegistry(scene)` уже используется в menu scenes |

## Migration Plan

1. Добавить domain/application/infrastructure для mana/energy (no breaking changes)
2. Создать HUD-модули в `presentation/ui/hud/`
3. В `GameScene`: заменить inline `add.text` на `createGameHud()`
4. Проверить: HUD виден, HP уменьшается при hazard, XP растёт при checkpoint
5. `npm run build && npm run lint && npm test`

Rollback: вернуть inline text в GameScene; HUD-модули остаются unused.

## Open Questions

- Нужен ли `relayout` на resize в этом change? → **Нет**, FIT mode стабилен; заложить метод, вызов — optional task
- Формат score: только XP или Level + XP? → **Level + XP** (больше контекста для игрока)
