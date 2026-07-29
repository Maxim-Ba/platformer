## MODIFIED Requirements

### Requirement: Mock tab content

Each tab MUST display placeholder content until real data integration is implemented.

#### Scenario: Inventory placeholder

- **WHEN** **Инвентарь** tab is active
- **THEN** a mock inventory panel MUST be visible in the content area

#### Scenario: Skills tab with skill trees

- **WHEN** **Скилы** tab is active
- **THEN** the skills tab panel MUST display three category skill trees with interactive node selection per `player-skills` spec
- **AND** a plain text placeholder MUST NOT be the only content

#### Scenario: Stats placeholder

- **WHEN** **Характеристики** tab is active
- **THEN** a mock stats panel MUST be visible in the content area

#### Scenario: Abilities placeholder

- **WHEN** **Активные умения** tab is active
- **THEN** a mock abilities panel MUST be visible in the content area

#### Scenario: Map placeholder

- **WHEN** **Карта** tab is active
- **THEN** a mock map panel MUST be visible in the content area

## ADDED Requirements

### Requirement: Skills tab arrow navigation

While the **Скилы** tab is active, horizontal arrow keys MUST navigate skill tree nodes instead of character menu tabs.

#### Scenario: Arrows control tree on skills tab

- **WHEN** character menu is open on **Скилы** tab and player presses arrow keys
- **THEN** focus MUST move between skill tree nodes
- **AND** character menu tabs MUST NOT change

#### Scenario: Tab hotkeys still switch menu tabs

- **WHEN** character menu is open on **Скилы** tab and player presses a hotkey for another character menu tab
- **THEN** character menu MUST switch to that tab per existing tab hotkey rules
