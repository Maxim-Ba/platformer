## MODIFIED Requirements

### Requirement: Patrol enemy behavior

Enemies MUST update position using the movement behavior configured by their archetype each tick.

#### Scenario: Patrol movement

- **WHEN** enemy update runs for a `ground-patrol` archetype and no obstacle blocks path
- **THEN** enemy position MUST move horizontally in current patrol direction at archetype speed

#### Scenario: Patrol direction reversal

- **WHEN** enemy reaches patrol boundary
- **THEN** patrol direction MUST reverse

#### Scenario: Flyer hover movement

- **WHEN** enemy update runs for a `fly-hover` archetype
- **THEN** enemy MUST move within configured patrol bounds with documented vertical hover motion

## ADDED Requirements

### Requirement: Behavior-driven enemy update

The `UpdateEnemies` use case MUST dispatch movement and attack behavior ticks per enemy based on resolved archetype.

#### Scenario: Mixed enemy types on level

- **WHEN** level contains `grunt`, `flyer`, and `caster` enemies
- **THEN** each enemy MUST update using its own archetype behaviors in the same frame loop

### Requirement: Projectile sync in enemy update

Enemy update MUST tick projectile movement and collision after behavior ticks.

#### Scenario: Projectiles move each frame

- **WHEN** active projectiles exist
- **THEN** `IEnemyPort` MUST advance projectile positions by velocity each update tick
