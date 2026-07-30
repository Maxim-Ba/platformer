# character-menu

## Purpose

In-scene overlay-меню персонажа в GameScene: вкладки (инвентарь, скилы, характеристики, умения, карта), горячие клавиши, горизонтальная навигация и заморозка геймплея. Контент большинства вкладок на v1 — mock; вкладка **Характеристики** использует `StatsTabPanel` из capability `player-stats`; вкладка **Скилы** — `SkillsTabPanel` из capability `player-skills`.

## Requirements

### Requirement: Character menu overlay during gameplay

The game MUST provide a character menu as an in-scene overlay in GameScene, accessible without leaving the current level.

#### Scenario: Open menu via tab hotkey

- **WHEN** player presses a configured hotkey for a character menu tab during active gameplay
- **THEN** the character menu overlay MUST appear with that tab selected

#### Scenario: Close menu with Escape

- **WHEN** character menu is open and player presses Escape
- **THEN** the overlay MUST close and gameplay MUST resume

#### Scenario: Close menu with same hotkey

- **WHEN** character menu is open on a tab and player presses that tab's hotkey again
- **THEN** the overlay MUST close and gameplay MUST resume

### Requirement: Character menu tabs

The character menu MUST display five tabs with Russian labels: **Инвентарь**, **Скилы**, **Характеристики**, **Активные умения**, and **Карта**.

#### Scenario: Tabs visible

- **WHEN** character menu is open
- **THEN** all five tab labels MUST be visible in a horizontal tab bar

#### Scenario: Active tab highlighted

- **WHEN** player switches tabs
- **THEN** the active tab MUST be visually distinguished from inactive tabs

### Requirement: Tab hotkey mapping

Each character menu tab MUST have a dedicated keyboard shortcut that opens the menu directly on that tab.

#### Scenario: Inventory hotkey

- **WHEN** player presses the `I` key during gameplay
- **THEN** character menu MUST open with the **Инвентарь** tab active

#### Scenario: Skills hotkey

- **WHEN** player presses the `K` key during gameplay
- **THEN** character menu MUST open with the **Скилы** tab active

#### Scenario: Stats hotkey

- **WHEN** player presses the `C` key during gameplay
- **THEN** character menu MUST open with the **Характеристики** tab active

#### Scenario: Abilities hotkey

- **WHEN** player presses the `U` key during gameplay
- **THEN** character menu MUST open with the **Активные умения** tab active

#### Scenario: Map hotkey

- **WHEN** player presses the `M` key during gameplay
- **THEN** character menu MUST open with the **Карта** tab active

#### Scenario: Switch tab via different hotkey

- **WHEN** character menu is already open and player presses a hotkey for a different tab
- **THEN** the menu MUST remain open and MUST switch to the requested tab

### Requirement: Horizontal tab navigation

While the character menu is open, player MUST navigate between tabs using horizontal arrow keys.

#### Scenario: Next tab

- **WHEN** character menu is open and player presses Arrow Right
- **THEN** the next tab MUST be selected with wrap-around at the last tab

#### Scenario: Previous tab

- **WHEN** character menu is open and player presses Arrow Left
- **THEN** the previous tab MUST be selected with wrap-around at the first tab

### Requirement: Mock tab content

Each tab MUST display placeholder content until real data integration is implemented, except:

- **Характеристики** — interactive stats panel from the `player-stats` capability
- **Скилы** — interactive skill trees from the `player-skills` capability

#### Scenario: Inventory placeholder

- **WHEN** **Инвентарь** tab is active
- **THEN** a mock inventory panel MUST be visible in the content area

#### Scenario: Skills tab with skill trees

- **WHEN** **Скилы** tab is active
- **THEN** the skills tab panel MUST display three category skill trees with interactive node selection per `player-skills` spec
- **AND** a plain text placeholder MUST NOT be the only content

#### Scenario: Stats panel

- **WHEN** **Характеристики** tab is active
- **THEN** `StatsTabPanel` MUST be visible with two-column attributes and derived parameters layout
- **AND** placeholder text panel MUST NOT be shown for this tab

#### Scenario: Abilities placeholder

- **WHEN** **Активные умения** tab is active
- **THEN** a mock abilities panel MUST be visible in the content area

#### Scenario: Map placeholder

- **WHEN** **Карта** tab is active
- **THEN** a mock map panel MUST be visible in the content area

### Requirement: Skills tab arrow navigation

While the **Скилы** tab is active, horizontal arrow keys MUST navigate skill tree nodes instead of character menu tabs.

#### Scenario: Arrows control tree on skills tab

- **WHEN** character menu is open on **Скилы** tab and player presses arrow keys
- **THEN** focus MUST move between skill tree nodes
- **AND** character menu tabs MUST NOT change

#### Scenario: Tab hotkeys still switch menu tabs

- **WHEN** character menu is open on **Скилы** tab and player presses a hotkey for another character menu tab
- **THEN** character menu MUST switch to that tab per existing tab hotkey rules

### Requirement: Gameplay freeze while character menu is open

While the character menu overlay is visible, core gameplay simulation MUST be frozen.

#### Scenario: Movement frozen

- **WHEN** character menu is open
- **THEN** player movement, hazard damage, checkpoint activation, and level exit detection MUST NOT advance

#### Scenario: Camera frozen

- **WHEN** character menu is open
- **THEN** camera follow MUST NOT update

#### Scenario: Resource ticks frozen

- **WHEN** character menu is open
- **THEN** gameplay tick logic in GameScene update MUST NOT advance

### Requirement: Character menu blocked during transitions

Character menu MUST NOT open during respawn fade or level-complete transition.

#### Scenario: Blocked during respawn

- **WHEN** GameScene is in respawn transition
- **THEN** character menu hotkeys MUST NOT open the overlay

#### Scenario: Blocked during level complete

- **WHEN** GameScene is in level-complete transition
- **THEN** character menu hotkeys MUST NOT open the overlay
