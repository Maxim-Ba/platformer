## ADDED Requirements

### Requirement: Main menu item list

MainMenuScene MUST display an interactive menu with three items: «Новая игра», «Загрузка», and «Настройки».

#### Scenario: Menu items visible

- **WHEN** MainMenuScene is shown after preload completes
- **THEN** the player MUST see a title and three selectable menu items in Russian

#### Scenario: Item highlight

- **WHEN** player navigates with arrow keys
- **THEN** the currently selected item MUST be visually distinguished from other items

### Requirement: Keyboard menu navigation

MainMenuScene MUST support keyboard navigation for menu selection and confirmation.

#### Scenario: Navigate items

- **WHEN** player presses UP or DOWN arrow keys
- **THEN** the selected menu item MUST change accordingly with wrap-around at list boundaries

#### Scenario: Confirm selection

- **WHEN** player presses ENTER or SPACE on a selected item
- **THEN** the action associated with that item MUST execute

### Requirement: New game action

Selecting «Новая игра» MUST start a fresh game session from the default first level.

#### Scenario: Start new game

- **WHEN** player selects «Новая игра»
- **THEN** `StartNewGame` use case MUST reset runtime progression and inventory state
- **AND** GameScene MUST start with `DEFAULT_LEVEL_ID`

### Requirement: Load game navigation

Selecting «Загрузка» MUST navigate to LoadGameScene.

#### Scenario: Open load screen

- **WHEN** player selects «Загрузка»
- **THEN** the game MUST transition to LoadGameScene

### Requirement: Settings navigation

Selecting «Настройки» MUST navigate to SettingsScene.

#### Scenario: Open settings

- **WHEN** player selects «Настройки»
- **THEN** the game MUST transition to SettingsScene

### Requirement: Menu scenes use application dependencies

MainMenuScene MUST access application use cases via `AppDependencies` from scene registry, not by instantiating adapters directly.

#### Scenario: Dependency injection in menu

- **WHEN** MainMenuScene needs to start a new game
- **THEN** it MUST call `startNewGame` from registry-provided `AppDependencies`
