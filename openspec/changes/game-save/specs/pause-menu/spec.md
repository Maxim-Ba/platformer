## MODIFIED Requirements

### Requirement: Pause menu items

The pause menu MUST provide four actions: Save, Settings, Restart from checkpoint, and Exit.

#### Scenario: Menu items visible

- **WHEN** pause menu is open
- **THEN** player MUST see menu items for Save, Settings, Restart from checkpoint, and Exit

#### Scenario: Keyboard navigation

- **WHEN** pause menu is open
- **THEN** player MUST navigate items with Arrow Up/Down and confirm with Enter or Space

## ADDED Requirements

### Requirement: Manual save from pause

Selecting Save from the pause menu MUST persist current progress without closing the pause menu or ending the level.

#### Scenario: Save from pause

- **WHEN** player selects Save from the pause menu
- **THEN** the game MUST call `SaveGame` for the default slot and MUST NOT transition to another scene

#### Scenario: Pause remains open after save

- **WHEN** manual save completes from the pause menu
- **THEN** the pause menu MUST remain visible and gameplay MUST stay frozen
