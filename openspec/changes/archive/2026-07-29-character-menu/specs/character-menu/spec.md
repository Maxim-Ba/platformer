## ADDED Requirements

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

Each tab MUST display placeholder content until real data integration is implemented.

#### Scenario: Inventory placeholder

- **WHEN** **Инвентарь** tab is active
- **THEN** a mock inventory panel MUST be visible in the content area

#### Scenario: Skills placeholder

- **WHEN** **Скилы** tab is active
- **THEN** a mock skills panel MUST be visible in the content area

#### Scenario: Stats placeholder

- **WHEN** **Характеристики** tab is active
- **THEN** a mock stats panel MUST be visible in the content area

#### Scenario: Abilities placeholder

- **WHEN** **Активные умения** tab is active
- **THEN** a mock abilities panel MUST be visible in the content area

#### Scenario: Map placeholder

- **WHEN** **Карта** tab is active
- **THEN** a mock map panel MUST be visible in the content area

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
