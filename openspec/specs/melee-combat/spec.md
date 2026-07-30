# melee-combat

## Purpose

Правила ближнего боя игрока: атака, hitbox, cooldown, урон врагам. Interface-first через `ICombatPort` и domain rules.

## Requirements

### Requirement: Combat port interface

The melee combat subsystem MUST expose an `ICombatPort` interface in `src/application/ports/` for attack state and cooldown management.

#### Scenario: Consumer depends on abstraction

- **WHEN** a use case or scene manages player melee attacks
- **THEN** it MUST depend on `ICombatPort`, not a concrete adapter class

#### Scenario: Implementation is swappable

- **WHEN** combat state storage changes (in-memory, networked)
- **THEN** only composition root MUST be updated

### Requirement: Domain-driven combat rules

Melee attack logic (cooldown, active window, hitbox geometry, damage) MUST be implemented as pure domain rules testable without Phaser.

#### Scenario: Attack on cooldown blocked

- **WHEN** player presses attack while cooldown is active
- **THEN** a new attack MUST NOT start

#### Scenario: Attack becomes active

- **WHEN** player presses attack and cooldown has elapsed
- **THEN** attack active window MUST open for configured duration

#### Scenario: Hitbox position from facing

- **WHEN** attack is active and player faces right
- **THEN** hitbox MUST be offset to the right of player position per domain constants

### Requirement: Melee attack execution use case

An `ExecuteMeleeAttack` use case MUST orchestrate combat rules, input, and enemy damage application.

#### Scenario: Successful hit on enemy

- **WHEN** attack is active and player hitbox overlaps an enemy AABB
- **THEN** use case MUST apply configured damage to that enemy via `IEnemyPort`

#### Scenario: No hit

- **WHEN** attack is active but no enemy is in hitbox
- **THEN** no enemy damage MUST be applied

### Requirement: Attack input binding

Player MUST be able to trigger melee attack via keyboard.

#### Scenario: Attack key pressed

- **WHEN** player presses a key bound to `attack` in current game settings
- **THEN** input port MUST report attack pressed for the current frame

### Requirement: Configurable combat constants

Attack cooldown, active window duration, hitbox size, and damage MUST be defined in domain constants.

#### Scenario: Balance tuning

- **WHEN** developer adjusts attack cooldown or damage
- **THEN** changes MUST be possible via constants without modifying scene code

### Requirement: Multi-HP enemy damage

Melee combat MUST support enemies with max HP greater than one without changing player attack damage rules.

#### Scenario: Second hit kills grunt

- **WHEN** player lands two successful melee hits on the same `grunt` enemy
- **THEN** the enemy MUST be removed after the second hit reduces HP to zero

#### Scenario: Single-hit kill on low-HP enemy

- **WHEN** player lands one successful melee hit on a `flyer` with 1 max HP
- **THEN** the enemy MUST be removed immediately

### Requirement: Archetype-sized melee hitbox overlap

Melee hit detection MUST use per-enemy archetype dimensions when testing overlap with player attack hitbox.

#### Scenario: Hit smaller flyer

- **WHEN** player attack hitbox overlaps a `flyer` AABB using flyer dimensions
- **THEN** damage MUST be applied to that flyer
