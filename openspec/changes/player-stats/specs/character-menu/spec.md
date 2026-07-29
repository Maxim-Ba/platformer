## MODIFIED Requirements

### Requirement: Mock tab content

Each tab MUST display placeholder content until real data integration is implemented, except the **Характеристики** tab which MUST show the interactive stats panel from the `player-stats` capability.

#### Scenario: Inventory placeholder

- **WHEN** **Инвентарь** tab is active
- **THEN** a mock inventory panel MUST be visible in the content area

#### Scenario: Skills placeholder

- **WHEN** **Скилы** tab is active
- **THEN** a mock skills panel MUST be visible in the content area

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
