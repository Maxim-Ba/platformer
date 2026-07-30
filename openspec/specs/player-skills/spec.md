# player-skills

## Purpose

Доменная модель бинарных деревьев скилов (физические, энергетические, магические), порт `ISkillsPort` для unlock/loadout, mock-данные и UI вкладки **Скилы** в меню персонажа.

## Requirements

### Requirement: Skills port interface

The player skills subsystem MUST expose an `ISkillsPort` interface in `src/application/ports/` for skill tree definitions, unlock state, and selected loadout.

#### Scenario: Consumer depends on abstraction

- **WHEN** HUD or character menu reads or updates selected skills
- **THEN** it MUST use `ISkillsPort`, not a concrete adapter

#### Scenario: Implementation is swappable

- **WHEN** skills storage or unlock backend changes
- **THEN** only composition root MUST be updated

### Requirement: Three skill tree categories

The system MUST define three skill tree categories with Russian labels: **Физические** (`physical`), **Энергетические** (`energy`), and **Магические** (`magical`).

#### Scenario: All categories available

- **WHEN** consumer calls `getTrees()` on `ISkillsPort`
- **THEN** exactly three tree definitions MUST be returned, one per category

### Requirement: Binary growing tree topology

Each skill tree MUST have four depth levels with node counts per level of 1, 2, 3, and 4 respectively (10 nodes total per tree).

#### Scenario: Root level

- **WHEN** a skill tree definition is inspected
- **THEN** level 1 MUST contain exactly one root node with no parent

#### Scenario: Deepest level width

- **WHEN** a skill tree definition is inspected
- **THEN** level 4 MUST contain exactly four nodes

#### Scenario: Binary parent-child constraint

- **WHEN** a skill tree definition is inspected
- **THEN** each non-root node MUST have exactly one parent
- **AND** each node MUST have at most two children

### Requirement: Mock unlock state

On v1, skill node unlock state MUST be provided by mock data without spending experience points.

#### Scenario: Locked node not selectable

- **WHEN** player attempts to select a node that is not unlocked
- **THEN** `ISkillsPort.selectNode` MUST return false and loadout MUST NOT change

#### Scenario: Unlocked node selectable

- **WHEN** player selects an unlocked node and loadout slots are available
- **THEN** node id MUST appear in `getSelectedNodeIds()`

### Requirement: Selected skills loadout

`ISkillsPort` MUST maintain an ordered list of selected skill node ids with a configurable maximum slot count.

#### Scenario: Slot limit enforced

- **WHEN** player attempts to select a node while all slots are filled
- **THEN** `selectNode` MUST return false unless the node is already selected

#### Scenario: Deselect node

- **WHEN** player deselects a selected node
- **THEN** node id MUST be removed from `getSelectedNodeIds()`

#### Scenario: Session reset

- **WHEN** `StartNewGame` or equivalent session reset runs
- **THEN** skills port MUST reset unlock and selected state per adapter rules

### Requirement: Skills tab tree UI

The character menu **Скилы** tab MUST render interactive skill trees instead of placeholder text.

#### Scenario: Category switching

- **WHEN** **Скилы** tab is active
- **THEN** player MUST switch between the three skill categories (Физические, Энергетические, Магические)

#### Scenario: Tree visualization

- **WHEN** a category is selected
- **THEN** nodes and parent-child links for that tree MUST be visible in the content area

#### Scenario: Visual node states

- **WHEN** tree is displayed
- **THEN** locked, unlocked, and selected nodes MUST be visually distinguishable

#### Scenario: Toggle selection in menu

- **WHEN** player confirms selection on an unlocked node in the skills tab
- **THEN** loadout MUST update through `ISkillsPort`

### Requirement: Domain-driven skill tree definitions

Static skill tree topology and node metadata MUST live in domain or game constants, not in Phaser presentation code.

#### Scenario: Presentation reads definitions via port

- **WHEN** `SkillsTabPanel` is rendered
- **THEN** tree structure MUST be obtained from `ISkillsPort.getTrees()`, not hardcoded in the Phaser module
