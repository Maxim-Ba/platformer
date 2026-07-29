# player-health

## Purpose

Подсистема здоровья игрока: порт `IHealthPort`, domain rules (HP, неуязвимость, смерть), use case `ApplyDamage` и интеграция с hazard flow в GameScene.

## Requirements

### Requirement: Health port interface

The player health subsystem MUST expose an `IHealthPort` interface in `src/application/ports/` that consumers depend on instead of concrete implementations.

#### Scenario: Consumer depends on abstraction

- **WHEN** a scene or use case needs player health state
- **THEN** it MUST depend on `IHealthPort`, not a concrete adapter class

#### Scenario: Implementation is swappable

- **WHEN** a new health adapter is introduced (e.g. networked, persisted)
- **THEN** only the composition root MUST change; consumers MUST compile without modification

### Requirement: Domain-driven health rules

Health logic (HP clamping, death detection, invulnerability) MUST be implemented as pure domain rules testable without Phaser.

#### Scenario: Damage reduces HP

- **WHEN** `applyDamage` is called with positive amount and player is not invulnerable
- **THEN** current HP MUST decrease by that amount, clamped to zero

#### Scenario: Invulnerability blocks damage

- **WHEN** `applyDamage` is called while invulnerability timer is active
- **THEN** HP MUST NOT change

#### Scenario: Death at zero HP

- **WHEN** HP reaches zero after damage
- **THEN** `isAlive()` MUST return false

### Requirement: Hazard damage integration

Hazard overlap MUST route through the health port instead of triggering respawn directly.

#### Scenario: Hazard damages player

- **WHEN** player overlaps a hazard and is not invulnerable
- **THEN** the game MUST call health port `applyDamage` with configured hazard damage

#### Scenario: Respawn on survivable damage

- **WHEN** hazard damage is applied and player remains alive
- **THEN** player MUST respawn at last checkpoint with invulnerability frames

#### Scenario: Game over on lethal damage

- **WHEN** hazard damage reduces HP to zero
- **THEN** the game MUST transition to GameOverScene

### Requirement: Configurable health constants

Default max HP, hazard damage, and invulnerability duration MUST be defined in domain constants.

#### Scenario: Balance tuning

- **WHEN** developer adjusts max HP or hazard damage
- **THEN** changes MUST be possible via constants without modifying scene code

### Requirement: Health state readable for HUD

`IHealthPort` MUST provide sufficient state for HUD to display current and max HP without accessing adapter internals.

#### Scenario: HUD reads health

- **WHEN** health HUD widget calls `getHealth()`
- **THEN** returned `HealthState` MUST include `currentHp` and `maxHp` for display formatting

### Requirement: Dash grants invulnerability

Starting a dash MUST grant player invulnerability for the configured dash duration via the health port.

#### Scenario: Invulnerability on dash start

- **WHEN** dash successfully starts
- **THEN** `IHealthPort.grantInvulnerability` MUST be called with dash duration in milliseconds

#### Scenario: Hazard damage blocked during dash

- **WHEN** player overlaps a hazard while dash invulnerability is active
- **THEN** hazard damage MUST NOT be applied

#### Scenario: Existing invulnerability preserved

- **WHEN** dash starts while invulnerability timer is already active
- **THEN** invulnerability duration MUST be at least the maximum of existing remaining time and dash duration
