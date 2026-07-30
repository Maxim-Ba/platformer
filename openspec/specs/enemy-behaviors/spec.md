# enemy-behaviors

## Purpose

Pluggable movement и attack behaviors для врагов, projectile domain rules и behavior registry — чистая domain-логика без Phaser.

## Requirements

### Requirement: Pluggable movement behaviors

Enemy movement MUST be implemented as pure domain movement behaviors selected by archetype `movementBehaviorId`.

#### Scenario: Ground patrol behavior

- **WHEN** an enemy archetype uses `ground-patrol`
- **THEN** update MUST move the enemy horizontally at archetype speed and reverse at patrol bounds

#### Scenario: Fly hover behavior

- **WHEN** an enemy archetype uses `fly-hover`
- **THEN** update MUST move horizontally within patrol bounds and apply vertical hover offset without gravity simulation

### Requirement: Pluggable attack behaviors

Enemy attacks MUST be implemented as pure domain attack behaviors selected by archetype `attackBehaviorId`.

#### Scenario: Contact attack behavior

- **WHEN** an enemy archetype uses `contact`
- **THEN** attack behavior tick MUST NOT spawn projectiles and contact damage MUST be evaluated via AABB overlap in the enemy update use case

#### Scenario: Ranged cast behavior

- **WHEN** a `caster` enemy has player within configured aggro range and cast cooldown elapsed
- **THEN** attack behavior MUST spawn a projectile toward the player position

### Requirement: Projectile domain model

Ranged attacks MUST use a domain `ProjectileState` model with position, velocity, damage, owner enemy id, and remaining lifetime.

#### Scenario: Projectile expires

- **WHEN** projectile remaining lifetime reaches zero
- **THEN** projectile MUST be removed from enemy port registry

#### Scenario: Projectile hits player

- **WHEN** projectile AABB overlaps player and player is not invulnerable
- **THEN** game MUST apply projectile damage via `IHealthPort` and remove the projectile

### Requirement: Behavior registry

Movement and attack behaviors MUST be registered in a domain behavior registry mapping behavior id to pure functions.

#### Scenario: Add behavior without consumer changes

- **WHEN** a new movement behavior id is registered in the domain registry
- **THEN** `UpdateEnemies` MUST dispatch through the registry without modifying `GameScene`

#### Scenario: New archetype reuses existing behaviors

- **WHEN** a new enemy archetype references already-registered movement and attack behavior ids
- **THEN** no new behavior implementation MUST be required beyond the archetype catalog entry

#### Scenario: Unit test without Phaser

- **WHEN** behavior unit tests run
- **THEN** they MUST execute movement and attack behaviors using domain state only

### Requirement: Projectile limits per caster

Ranged cast behavior MUST enforce a per-enemy active projectile cap to prevent spam.

#### Scenario: Cast blocked at cap

- **WHEN** a caster already has maximum active projectiles
- **THEN** a new projectile MUST NOT spawn until an existing projectile expires or hits
