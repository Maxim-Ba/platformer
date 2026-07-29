# enemy-ai

## Purpose

Враги с patrol AI, contact damage и смертью от урона. Interface-first через `IEnemyPort` и domain rules.

## Requirements

### Requirement: Enemy port interface

The enemy subsystem MUST expose an `IEnemyPort` interface in `src/application/ports/` for spawning, updating, and damaging enemies.

#### Scenario: Consumer depends on abstraction

- **WHEN** gameplay spawns or updates enemies
- **THEN** it MUST depend on `IEnemyPort`, not a concrete adapter

#### Scenario: Implementation is swappable

- **WHEN** enemy registry backend changes
- **THEN** only composition root MUST be updated

### Requirement: Patrol enemy behavior

Enemies MUST patrol horizontally between configured bounds at constant speed.

#### Scenario: Patrol movement

- **WHEN** enemy update runs and no obstacle blocks path
- **THEN** enemy position MUST move horizontally in current patrol direction

#### Scenario: Patrol direction reversal

- **WHEN** enemy reaches patrol boundary
- **THEN** patrol direction MUST reverse

### Requirement: Enemy contact damage

Enemies MUST damage the player on AABB overlap.

#### Scenario: Contact damages player

- **WHEN** player overlaps enemy AABB and player is not invulnerable
- **THEN** game MUST apply configured contact damage via `IHealthPort`

#### Scenario: Invulnerable player ignored

- **WHEN** player overlaps enemy but invulnerability is active
- **THEN** no damage MUST be applied

### Requirement: Enemy death on damage

Enemies MUST be removed when HP reaches zero from player attacks.

#### Scenario: Lethal hit removes enemy

- **WHEN** enemy receives damage reducing HP to zero
- **THEN** enemy MUST be removed from registry and presentation

#### Scenario: Experience reward on kill

- **WHEN** enemy is killed by player attack
- **THEN** game MUST award configured experience via `IProgressionPort` if available

### Requirement: Domain-driven enemy rules

Patrol bounds, movement, contact overlap, and HP MUST be pure domain logic testable without Phaser.

#### Scenario: Unit test without runtime

- **WHEN** enemy AI unit tests run
- **THEN** they MUST execute against domain/application code only
