## ADDED Requirements

### Requirement: Selected skills HUD display

The game MUST display the player's currently selected skills in the bottom-right screen area during gameplay.

#### Scenario: Selected skills visible

- **WHEN** GameScene is running
- **THEN** HUD MUST show selected skill labels from `ISkillsPort.getSelectedNodeIds()` in the bottom-right per layout config

#### Scenario: Empty slots

- **WHEN** fewer than maximum loadout slots are filled
- **THEN** HUD MUST indicate empty slots without breaking layout

#### Scenario: Loadout updates reflected

- **WHEN** player changes selected skills in the character menu skills tab
- **THEN** bottom-right HUD MUST reflect the new selection on the next update cycle

### Requirement: Selected skills HUD layout

Selected skills widget position MUST be defined in the HUD layout config module with `bottom-right` anchor.

#### Scenario: Bottom-right placement

- **WHEN** `GameHud` is created
- **THEN** selected skills widget MUST be positioned in the bottom-right screen area per `HUD_LAYOUT.selectedSkills`

#### Scenario: Camera independence

- **WHEN** player moves and camera follows
- **THEN** selected skills HUD MUST remain fixed on screen

## MODIFIED Requirements

### Requirement: GameHud orchestrator

GameScene MUST integrate HUD through a `GameHud` factory that composes individual widgets and exposes `update()` and `destroy()`.

#### Scenario: Single integration point

- **WHEN** developer adds a new HUD widget
- **THEN** only `GameHud` composition and layout config MUST change; GameScene MUST only call `createGameHud`, `update`, and `destroy`

#### Scenario: Skills port wired to HUD

- **WHEN** `createGameHud` is called
- **THEN** it MUST accept `ISkillsPort` (or equivalent deps bag) for the selected skills widget
