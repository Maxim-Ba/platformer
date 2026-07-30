## Context

В проекте есть модульный `GameHud` (`HudWidget`, `hud-layout.ts`), `IProgressionPort` с unlock registry и change `character-menu` с вкладкой **Скилы** (mock placeholder). Системы скилов, деревьев прогрессии и loadout в коде нет.

Пользователь запросил:
- HUD справа внизу с **выбранными** скиллами
- Контент вкладки **Скилы**: 3 mock-дерева (**Физические**, **Энергетические**, **Магические**), открываемые за XP (пока mock unlock)
- **Бинарное разрастающееся** дерево: 4 уровня, уровень 1 — 1 корень, уровень 4 — 4 узла

Зависимость: change `character-menu` MUST быть применён (или применяться вместе) — `SkillsTabPanel` встраивается в `CharacterMenuOverlay` вместо текстовой заглушки.

## Goals / Non-Goals

**Goals:**

- Порт `ISkillsPort` в application layer: деревья, unlock state, selected loadout
- Три mock-дерева с фиксированной топологией (10 узлов на дерево: уровни 1→2→3→4 по ширине)
- UI вкладки **Скилы**: переключение категории, визуализация узлов и связей, выбор слотов loadout
- HUD-виджет `SelectedSkillsHudWidget` в правом нижнем углу
- Mock unlock (предустановленный набор открытых узлов) без траты XP
- Clean Architecture: Phaser только в presentation, данные деревьев — domain/constants

**Non-Goals:**

- Реальная разблокировка за XP через `IProgressionPort`
- Боевые эффекты выбранных скилов
- Сохранение loadout в `GameSave`
- Вкладка **Активные умения** (отдельный change)
- Иконки/спрайты скилов (текстовые/геометрические узлы на v1)
- Pan/zoom дерева, tooltips с описанием эффектов

## Decisions

### Skill tree topology (binary growing, 4 levels)

Каждое из трёх деревьев использует **одинаковую форму**, разные id/labels:

| Уровень | Узлов на уровне | Примечание |
|---------|-----------------|------------|
| 1 | 1 | корень |
| 2 | 2 | оба дочерних от корня |
| 3 | 3 | один родитель с одним ребёнком (дерево остаётся бинарным: ≤2 детей) |
| 4 | 4 | листья |

**Итого:** 10 узлов на дерево. Связи задаются статически в `src/domain/constants/skill-trees.ts` (или `src/game/skill-tree-definitions.ts`).

Пример связей (индексы уровней):

```
        [0]                 L1
       /   \
     [0]   [1]              L2
    /  \     \
  [0] [1]   [2]             L3
 / \ / \ / \
[0][1][2][3]                L4 (4 листа)
```

Узел L3[2] имеет одного ребёнка на L4 — допустимо для бинарного дерева.

**Альтернатива:** полное бинарное дерево (1-2-4-8) — отвергнута: пользователь явно указал 4 узла на последнем уровне, не 8.

### Skill categories

```typescript
type SkillCategory = 'physical' | 'energy' | 'magical';
```

| category | RU label |
|----------|----------|
| `physical` | Физические |
| `energy` | Энергетические |
| `magical` | Магические |

### `ISkillsPort` contract

```typescript
interface ISkillsPort {
  getTrees(): readonly SkillTreeDefinition[];
  getUnlockedNodeIds(): readonly string[];
  getSelectedNodeIds(): readonly string[];
  getMaxSelectedSlots(): number;
  selectNode(nodeId: string): boolean;   // false if locked / slots full
  deselectNode(nodeId: string): boolean;
  isNodeUnlocked(nodeId: string): boolean;
  reset(): void;
}
```

- `SkillTreeDefinition`: `{ category, label, nodes: SkillNodeDef[] }`
- `SkillNodeDef`: `{ id, label, level, parentId: string | null, childIds: [string] | [string, string] }`

**Почему порт, а не прямой импорт constants:** HUD и character menu читают одно состояние; позже — XP unlock и save.

### Mock unlock state

`InMemorySkillsAdapter` при `reset()`:
- Разблокирует корень + первые 2 уровня каждого дерева (или фиксированный preset из constants)
- Selected slots: пусто или 1–2 предустановленных для демо HUD

Без вызова `IProgressionPort.addExperience` на v1.

### Loadout slots

`MAX_SELECTED_SKILLS = 4` — совпадает с 4 листьями последнего уровня; игрок может выбрать до 4 скилов из любых открытых узлов (не только листья — любой unlocked узел, если открыт).

**Альтернатива:** только листья — отвергнута для гибкости mock; можно ограничить в domain rule позже.

### Skills tab UI (`SkillsTabPanel`)

Компонент в `src/presentation/ui/character-menu/SkillsTabPanel.ts`:

- **Category selector** — горизонтальные под-табы или `MenuList`-подобный ряд: Физические / Энергетические / Магические
- **Tree viewport** — Phaser `Graphics` для рёбер + `Text`/rect для узлов
- Layout узлов: x по уровню (columns 1–4), y равномерно внутри уровня
- Состояния узла: locked (серый), unlocked (белый), selected (акцент `#38bdf8`)
- **Enter / Space / Click** на focused узле — toggle select/deselect через `ISkillsPort`
- Навигация **ArrowUp/Down/Left/Right** между узлами внутри вкладки (character menu уже использует Left/Right для табов — **только когда Skills tab active**, стрелки влияют на дерево; переключение табов меню — через hotkeys)

**Конфликт стрелок:** пока активна вкладка Скилы, Left/Right навигируют по дереву, не по табам character menu. Переключение табов меню — hotkeys `I/K/C/U/M`. Документировать в character-menu integration.

### HUD widget (`SelectedSkillsHudWidget`)

```typescript
createSelectedSkillsHudWidget(scene, {
  skillsPort: ISkillsPort,
  getNodeLabel: (id) => ..., // lookup from tree defs
});
```

- Anchor: `bottom-right`, offset `(-24, -24)` в `HUD_LAYOUT.selectedSkills`
- Отображение: до `MAX_SELECTED_SKILLS` слотов, пустой слот — `—`
- Формат строки: `Skill1 | Skill2 | Skill3 | Skill4` или столбец (lineHeight 28)
- Реализует `HudWidget`; обновляется в `GameHud.update()`

### Integration points

```
composition root (GameScene factory)
  ├─ InMemorySkillsAdapter (session-scoped, reset on level start)
  ├─ createGameHud(..., skillsPort)
  └─ CharacterMenuOverlay(..., skillsPort)

SkillsTabPanel ──reads/writes──► ISkillsPort ◄──reads── SelectedSkillsHudWidget
```

`StartNewGame` / level reset: `skillsPort.reset()` alongside inventory/progression reset (если loadout не персистится — полный reset).

### File layout

| Path | Role |
|------|------|
| `src/domain/types/SkillTree.ts` | `SkillNodeDef`, `SkillTreeDefinition`, `SkillCategory` |
| `src/domain/constants/skill-trees.ts` | 3 static tree definitions |
| `src/application/ports/ISkillsPort.ts` | port interface |
| `src/infrastructure/adapters/InMemorySkillsAdapter.ts` | mock state |
| `src/presentation/ui/character-menu/SkillsTabPanel.ts` | tree UI |
| `src/presentation/ui/hud/SelectedSkillsHudWidget.ts` | HUD loadout |
| `src/presentation/ui/hud/hud-layout.ts` | add `selectedSkills` anchor |

## Risks / Trade-offs

- **[Risk] Конфликт Arrow Left/Right** между табами меню и деревом → на вкладке Скилы стрелки только для дерева; табы меню — hotkeys
- **[Risk] Переполнение HUD при длинных названиях** → короткие mock labels (`Удар I`, `Щит II`); truncate при необходимости
- **[Risk] character-menu не применён** → `SkillsTabPanel` не к чему подключить; apply order: `character-menu` first
- **[Trade-off] Mock unlock** → позже заменяется на `IProgressionPort` unlock ids без смены UI API
- **[Trade-off] Текстовые узлы** → позже заменяются спрайтами внутри `SkillsTabPanel`

## Migration Plan

1. Добавить domain types + static tree definitions (3×10 nodes)
2. Добавить `ISkillsPort` + `InMemorySkillsAdapter`
3. Реализовать `SkillsTabPanel`, подключить в `CharacterMenuOverlay` вместо mock skills placeholder
4. Реализовать `SelectedSkillsHudWidget`, расширить `HUD_LAYOUT` и `GameHud`
5. Wire `skillsPort` в composition root, `reset()` on new game
6. Ручная проверка: выбор скилов в меню отражается в HUD, locked узлы не выбираются

Rollback: удалить widget и port wiring; character menu fallback на простой placeholder.

## Open Questions

- Ограничивать выбор только листьями (L4)? **v1: нет** — любой unlocked узел.
- Сколько слотов loadout? **v1: 4** (как ширина последнего уровня).
- Общий reset loadout при смерти? **v1: нет** — loadout сохраняется в сессии до `StartNewGame`.
