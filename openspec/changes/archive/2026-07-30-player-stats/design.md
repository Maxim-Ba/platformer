## Context

В проекте есть `IProgressionPort` (level, XP), порты ресурсов (`IHealthPort`, `IManaPort`, `IEnergyPort`) и change `character-menu` с вкладкой **Характеристики** (текстовая заглушка). Системы распределяемых атрибутов и derived stats в коде нет.

Пользователь запросил двухколоночный экран:
- **Левая колонка** — атрибуты, на которые игрок распределяет очки при level-up: Сила, Ловкость, Интеллект, Удача, Грузоподъёмность, Здоровье
- **Правая колонка** — вычисляемые параметры: Магическая защита, Количество здоровья, Количество энергии, Количество маны, Шанс крит. удара, Физическая защита и др.

Зависимость: change `character-menu` MUST быть применён — `StatsTabPanel` встраивается в `CharacterMenuOverlay` вместо текстовой заглушки stats.

## Goals / Non-Goals

**Goals:**

- Порт `IPlayerStatsPort` в application layer: атрибуты, unallocated points, derived stats
- Domain value objects `PlayerAttributes`, `DerivedStats` и `PlayerStatsRules` для расчёта derived из атрибутов
- UI `StatsTabPanel`: две колонки, русские labels, +/- для атрибутов при наличии нераспределённых очков
- Mock initial state (базовые атрибуты + несколько unallocated points) без реального level-up
- Clean Architecture: Phaser только в presentation, формулы — domain

**Non-Goals:**

- Реальная выдача очков при level-up через `IProgressionPort`
- Синхронизация derived stats с `IHealthPort` / `IManaPort` / `IEnergyPort` в бою
- Сохранение атрибутов в `GameSave`
- Влияние атрибутов на damage, movement, inventory weight
- Tooltips с формулами, анимации, звуки
- Отдельный HUD-виджет характеристик (контент только во вкладке меню персонажа)

## Decisions

### Attribute ids and labels

```typescript
type AttributeId =
  | 'strength'      // Сила
  | 'agility'       // Ловкость
  | 'intellect'     // Интеллект
  | 'luck'          // Удача
  | 'carryCapacity' // Грузоподъёмность
  | 'vitality';     // Здоровье (атрибут, не current HP)
```

| id | RU label |
|----|----------|
| `strength` | Сила |
| `agility` | Ловкость |
| `intellect` | Интеллект |
| `luck` | Удача |
| `carryCapacity` | Грузоподъёмность |
| `vitality` | Здоровье |

**Почему `vitality` вместо `health`:** отличить распределяемый атрибут от current/max HP в derived stats.

### Derived stat ids and labels

```typescript
type DerivedStatId =
  | 'magicDefense'
  | 'maxHealth'
  | 'maxEnergy'
  | 'maxMana'
  | 'critChance'
  | 'physicalDefense'
  | 'attackPower'
  | 'magicPower';
```

| id | RU label |
|----|----------|
| `magicDefense` | Магическая защита |
| `maxHealth` | Количество здоровья |
| `maxEnergy` | Количество энергии |
| `maxMana` | Количество маны |
| `critChance` | Шанс крит. удара |
| `physicalDefense` | Физическая защита |
| `attackPower` | Сила атаки |
| `magicPower` | Магическая сила |

Дополнительные derived (`attackPower`, `magicPower`) — для полноты RPG-панели; пользователь указал «и др.»

### `PlayerStatsRules` (domain formulas, v1 mock)

Простые линейные формулы, тестируемые без Phaser:

```
maxHealth      = 50 + vitality * 10 + strength * 2
maxEnergy      = 30 + agility * 5
maxMana        = 20 + intellect * 8
physicalDefense= strength * 2 + vitality
magicDefense   = intellect * 3 + luck
critChance     = min(50, luck * 2 + agility)   // percent display
attackPower    = strength * 3 + agility
magicPower     = intellect * 4
carryCapacity display = base + carryCapacity attribute (from left column)
```

`PlayerStatsRules.computeDerived(attributes)` возвращает `DerivedStats`. Adapter хранит только attributes + unallocatedPoints; derived читается через rules при каждом `getDerivedStats()`.

**Альтернатива:** читать max HP из `IHealthPort` в UI — отвергнута: на v1 stats subsystem самодостаточен; синхронизация с боевыми портами — отдельный change.

### `IPlayerStatsPort` contract

```typescript
interface IPlayerStatsPort {
  getAttributes(): PlayerAttributes;
  getUnallocatedPoints(): number;
  getDerivedStats(): DerivedStats;
  increaseAttribute(id: AttributeId): boolean;  // false if no points or max
  decreaseAttribute(id: AttributeId): boolean;  // false if at min base
  restoreState(state: PlayerStatsState): void;   // for future save
}
```

Min attribute value: 1 (или 0 для mock — использовать 1 как RPG baseline). Max per attribute on v1: 99 (soft cap).

### `StatsTabPanel` layout (1920×1080, content area ~1300×650)

```
┌─────────────────────────────────────────────────────────┐
│  Нераспределённые очки: 3                             │
├──────────────────────┬──────────────────────────────────┤
│  АТРИБУТЫ            │  ПАРАМЕТРЫ                       │
│                      │                                  │
│  Сила        12 [+][-]│  Магическая защита      24      │
│  Ловкость     8 [+][-]│  Количество здоровья   142      │
│  ...                 │  ...                             │
└──────────────────────┴──────────────────────────────────┘
```

- Левая колонка ~45% ширины, правая ~55%
- Заголовки колонок: **Атрибуты**, **Параметры**
- `[+]` активен только при `unallocatedPoints > 0`
- `[-]` активен только когда атрибут > min и можно вернуть очко
- Клик по `[+]`/`[-]` или клавиши (опционально v1: только клик через Phaser pointer)

**Навигация:** вертикальная навигация внутри stats tab не требуется на v1 — клик по кнопкам. Character menu arrow keys остаются для переключения табов.

### Integration points

```
composition-root
  └─ InMemoryPlayerStatsAdapter (singleton)

CharacterMenuOverlay
  └─ StatsTabPanel(statsPort)  // replaces MockTabPanels stats entry

GameScene
  └─ pass statsPort to CharacterMenuOverlay factory (no HUD widget)
```

### Mock initial state

```typescript
attributes: { strength: 10, agility: 8, intellect: 6, luck: 5, carryCapacity: 10, vitality: 10 }
unallocatedPoints: 3
```

## Risks / Trade-offs

- **[Risk] Derived stats не совпадают с HUD ресурсов** → v1 ожидаемо; документировать в non-goals; будущий change синхронизирует ports
- **[Risk] Дублирование «Здоровье»** (атрибут vs количество здоровья) → разные labels и колонки; `vitality` vs `maxHealth`
- **[Risk] +/- кнопки мелкие на 1080p** → достаточный hit area (32×32 px), monospace labels
- **[Trade-off] Mock points без level-up** → UI и port готовы; `AddExperience` не трогаем
- **[Trade-off] Нет keyboard nav внутри панели** → добавится при полноценном level-up flow

## Migration Plan

1. Добавить domain types и `PlayerStatsRules`
2. Добавить `IPlayerStatsPort` и `InMemoryPlayerStatsAdapter`
3. Создать `StatsTabPanel`, подключить в `CharacterMenuOverlay`
4. Wire в `composition-root` и `GameScene`
5. Ручная проверка: C открывает stats tab, колонки видны, +/- работают, derived обновляются

Rollback: вернуть mock text panel в overlay — изолированная замена одной панели.

## Open Questions

- Минимальное значение атрибута: 1 или 0? **v1: min 1, decrease blocked at 1**
- Показывать carry capacity в правой колонке как derived? **v1: только в левой как атрибут; derived `maxEnergy` etc. в правой**
- Нужна ли клавиатурная +/- на v1? **v1: нет, только pointer click**
