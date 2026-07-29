## ADDED Requirements

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
