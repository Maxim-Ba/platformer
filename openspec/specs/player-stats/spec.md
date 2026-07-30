# player-stats

## Purpose

Подсистема характеристик игрока: распределяемые атрибуты, нераспределённые очки, вычисляемые боевые параметры, порт `IPlayerStatsPort`, domain rules и UI-панель вкладки **Характеристики** в меню персонажа.

## Requirements

### Requirement: Player stats port interface

The player stats subsystem MUST expose an `IPlayerStatsPort` interface in `src/application/ports/` for allocatable attributes, unallocated points, and derived combat parameters.

#### Scenario: Consumer depends on abstraction

- **WHEN** character menu stats panel reads or updates attributes
- **THEN** it MUST use `IPlayerStatsPort`, not a concrete adapter

#### Scenario: Implementation is swappable

- **WHEN** stats storage or formula backend changes
- **THEN** only composition root MUST be updated

### Requirement: Allocatable attributes

The system MUST define six allocatable attributes with Russian labels: **Сила** (`strength`), **Ловкость** (`agility`), **Интеллект** (`intellect`), **Удача** (`luck`), **Грузоподъёмность** (`carryCapacity`), and **Здоровье** (`vitality`).

#### Scenario: All attributes readable

- **WHEN** consumer calls `getAttributes()` on `IPlayerStatsPort`
- **THEN** all six attribute ids MUST be present with non-negative integer values

#### Scenario: Attribute increase with points

- **WHEN** `increaseAttribute` is called for a valid id and `unallocatedPoints > 0`
- **THEN** that attribute value MUST increment by 1 and unallocated points MUST decrement by 1

#### Scenario: Attribute increase blocked without points

- **WHEN** `increaseAttribute` is called and `unallocatedPoints` is 0
- **THEN** the call MUST return false and attribute values MUST NOT change

#### Scenario: Attribute decrease returns point

- **WHEN** `decreaseAttribute` is called for an attribute above minimum allowed value
- **THEN** that attribute MUST decrement by 1 and unallocated points MUST increment by 1

#### Scenario: Attribute decrease at minimum

- **WHEN** `decreaseAttribute` is called for an attribute at minimum allowed value
- **THEN** the call MUST return false and unallocated points MUST NOT change

### Requirement: Unallocated attribute points

The system MUST track a pool of unallocated attribute points separate from attribute values.

#### Scenario: Unallocated points visible

- **WHEN** consumer calls `getUnallocatedPoints()`
- **THEN** returned value MUST be a non-negative integer representing points available for distribution

#### Scenario: Mock initial pool on v1

- **WHEN** a new game session starts with in-memory adapter
- **THEN** unallocated points MUST be initialized to a positive mock value without requiring level-up events

### Requirement: Derived combat parameters

Derived stats MUST be computed from current attributes using pure domain rules in `PlayerStatsRules`, not stored independently in the adapter.

#### Scenario: Required derived stats

- **WHEN** consumer calls `getDerivedStats()`
- **THEN** result MUST include at minimum: **Магическая защита** (`magicDefense`), **Количество здоровья** (`maxHealth`), **Количество энергии** (`maxEnergy`), **Количество маны** (`maxMana`), **Шанс крит. удара** (`critChance`), and **Физическая защита** (`physicalDefense`)

#### Scenario: Additional derived stats

- **WHEN** consumer calls `getDerivedStats()`
- **THEN** result MUST also include **Сила атаки** (`attackPower`) and **Магическая сила** (`magicPower`)

#### Scenario: Derived updates on attribute change

- **WHEN** an attribute is increased or decreased
- **THEN** subsequent `getDerivedStats()` MUST reflect recalculated values per domain rules

#### Scenario: Domain-only formula tests

- **WHEN** unit tests run against `PlayerStatsRules`
- **THEN** they MUST execute without Phaser or adapter dependencies

### Requirement: Stats tab panel layout

The **Характеристики** tab MUST render a two-column panel inside character menu content area.

#### Scenario: Left column attributes

- **WHEN** **Характеристики** tab is active
- **THEN** left column MUST list all six allocatable attributes with Russian labels and current values

#### Scenario: Right column parameters

- **WHEN** **Характеристики** tab is active
- **THEN** right column MUST list derived parameters with Russian labels and computed values

#### Scenario: Column headers

- **WHEN** stats panel is visible
- **THEN** left column header MUST read **Атрибуты** and right column header MUST read **Параметры**

#### Scenario: Unallocated points indicator

- **WHEN** stats panel is visible
- **THEN** unallocated points count MUST be displayed above the two columns

### Requirement: Attribute adjustment controls

The stats panel MUST provide increase and decrease controls for each allocatable attribute.

#### Scenario: Increase control enabled

- **WHEN** unallocated points are greater than zero
- **THEN** increase controls MUST be interactive for all attributes

#### Scenario: Increase control disabled

- **WHEN** unallocated points are zero
- **THEN** increase controls MUST NOT apply attribute changes

#### Scenario: Decrease control at minimum

- **WHEN** an attribute is at minimum allowed value
- **THEN** decrease control for that attribute MUST NOT apply further decreases

#### Scenario: Crit chance display format

- **WHEN** **Шанс крит. удара** is shown in the right column
- **THEN** value MUST be displayed as a percentage (e.g. `12%`)
