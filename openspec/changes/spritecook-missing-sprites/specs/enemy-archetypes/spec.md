## ADDED Requirements

### Requirement: Archetype sprite key binds to loaded texture

Each shipped enemy archetype `spriteKey` MUST match a Phaser texture loaded before GameScene creates enemy sprites.

#### Scenario: Grunt key is loadable

- **WHEN** Preload or GameScene preload completes
- **THEN** texture key `enemy-grunt` (grunt `spriteKey`) MUST exist in the texture cache

#### Scenario: Flyer and caster keys are loadable

- **WHEN** Preload or GameScene preload completes
- **THEN** texture keys for flyer and caster `spriteKey` values MUST exist in the texture cache

#### Scenario: Display size follows hitbox

- **WHEN** an enemy sprite is created
- **THEN** its display size MUST equal the archetype width and height used for contact and melee AABB
