# player-dash

## Purpose

Механика рывка игрока: domain rules (`DashRules`, `DashState`), порт `IDashPort`, use cases `ExecuteDash` и `UpdatePlayerDash`, cooldown, неуязвимость на время рывка и gating через progression unlock `dash`.

## Requirements

### Requirement: Dash port interface

The player dash subsystem MUST expose an `IDashPort` interface in `src/application/ports/` for dash state, cooldown, and lifecycle management.

#### Scenario: Consumer depends on abstraction

- **WHEN** a use case or scene manages player dash
- **THEN** it MUST depend on `IDashPort`, not a concrete adapter class

#### Scenario: Implementation is swappable

- **WHEN** dash state storage changes (in-memory, networked)
- **THEN** only composition root MUST be updated

### Requirement: Domain-driven dash rules

Dash logic (activation, duration, cooldown, velocity, direction) MUST be implemented as pure domain rules testable without Phaser.

#### Scenario: Dash on cooldown blocked

- **WHEN** player presses dash while cooldown is active
- **THEN** a new dash MUST NOT start

#### Scenario: Dash becomes active

- **WHEN** player presses dash and cooldown has elapsed and dash is unlocked
- **THEN** dash active window MUST open for configured duration with configured horizontal velocity

#### Scenario: Dash direction from input

- **WHEN** dash starts and horizontal input is active
- **THEN** dash direction MUST match horizontal input axis

#### Scenario: Dash direction from facing

- **WHEN** dash starts with no horizontal input
- **THEN** dash direction MUST match player facing direction

### Requirement: Dash execution use case

An `ExecuteDash` use case MUST orchestrate dash rules, progression unlock check, input, and health invulnerability grant.

#### Scenario: Successful dash start

- **WHEN** dash input is pressed, dash is unlocked, and dash can start
- **THEN** use case MUST start dash via `IDashPort` and grant invulnerability for dash duration via `IHealthPort`

#### Scenario: Dash blocked when locked

- **WHEN** dash input is pressed but `dash` unlock is not active
- **THEN** dash MUST NOT start

#### Scenario: Dash blocked while already dashing

- **WHEN** dash input is pressed while dash is active
- **THEN** a new dash MUST NOT start

### Requirement: Dash movement use case

An `UpdatePlayerDash` use case MUST apply dash velocity and position updates while dash is active, independent of normal movement rules.

#### Scenario: Dash overrides gravity

- **WHEN** player is dashing
- **THEN** vertical velocity MUST remain zero and gravity MUST NOT be applied

#### Scenario: Dash movement each frame

- **WHEN** dash is active
- **THEN** player position MUST advance by dash velocity for the frame delta

### Requirement: Dash input binding

Player MUST be able to trigger dash via keyboard.

#### Scenario: Dash key pressed

- **WHEN** player presses a key bound to `dash` in current game settings
- **THEN** input port MUST report dash pressed for the current frame

### Requirement: Configurable dash constants

Dash speed, duration, and cooldown MUST be defined in domain constants.

#### Scenario: Balance tuning

- **WHEN** developer adjusts dash speed or cooldown
- **THEN** changes MUST be possible via constants without modifying scene code
