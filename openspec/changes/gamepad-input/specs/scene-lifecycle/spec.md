## ADDED Requirements

### Requirement: Gamepad navigation in menu scenes

Menu and overlay scenes MUST accept gamepad input for navigation and confirmation on par with keyboard input.

#### Scenario: Main menu gamepad

- **WHEN** MainMenuScene is active and a gamepad is connected
- **THEN** player MUST navigate menu items with D-pad and confirm with A

#### Scenario: Settings gamepad

- **WHEN** SettingsScene is active
- **THEN** player MUST adjust settings navigation with D-pad Up/Down and confirm with A; B or Back MUST return to the previous screen

#### Scenario: Load game gamepad

- **WHEN** LoadGameScene is active
- **THEN** player MUST select save slots with D-pad and confirm load with A
