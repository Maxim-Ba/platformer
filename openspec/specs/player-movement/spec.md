# player-movement

## Purpose

Domain/application логика движения игрока: чистые правила и use cases без Phaser, с coyote time, jump buffer и настраиваемыми константами баланса.

## Requirements

### Requirement: Domain-driven movement rules

Player movement logic MUST be implemented in the domain/application layers as pure rules and use cases independent of Phaser APIs.

#### Scenario: Movement use case is testable without Phaser

- **WHEN** unit tests run for player movement
- **THEN** tests MUST execute against domain/application code without initializing Phaser

#### Scenario: Horizontal movement

- **WHEN** horizontal input is active and player is grounded or airborne per rules
- **THEN** UpdatePlayerMovement use case MUST produce updated velocity within configured max speed

#### Scenario: Jump input

- **WHEN** jump input is pressed and jump rules allow (grounded or coyote window)
- **THEN** UpdatePlayerMovement MUST apply configured jump velocity upward

### Requirement: Coyote time support

The movement system MUST support a coyote time window allowing jump shortly after leaving ground.

#### Scenario: Coyote jump succeeds

- **WHEN** player walks off a platform and jump is pressed within coyote time milliseconds
- **THEN** a jump MUST still be executed

#### Scenario: Coyote jump expires

- **WHEN** coyote time window elapses without jump input
- **THEN** airborne jump MUST NOT trigger until player lands again

### Requirement: Configurable movement constants

Movement parameters (gravity, speed, jump force, coyote time) MUST be defined in a dedicated constants or config module consumed by domain/application layers.

#### Scenario: Balance tuning without scene edits

- **WHEN** designer-developer adjusts jump height for game feel
- **THEN** changes MUST be possible by editing constants without modifying Phaser scene code

### Requirement: Dash overrides normal movement

While dash is active, normal player movement (horizontal input, jump, gravity) MUST be suspended in favor of dash movement rules.

#### Scenario: Normal movement skipped during dash

- **WHEN** `IDashPort` reports dash is active
- **THEN** `UpdatePlayerMovement` MUST NOT be invoked for that frame

#### Scenario: Normal movement resumes after dash

- **WHEN** dash active window ends
- **THEN** `UpdatePlayerMovement` MUST resume on subsequent frames
