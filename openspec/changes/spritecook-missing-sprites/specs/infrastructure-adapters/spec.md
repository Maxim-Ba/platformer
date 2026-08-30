## ADDED Requirements

### Requirement: Enemy presentation sprite

Presentation layer MUST provide `EnemySprite` that reflects `EnemyState` using a loaded texture for the enemy archetype `spriteKey`.

#### Scenario: Sprite sync from enemy state

- **WHEN** enemy update produces a new `EnemyState`
- **THEN** `EnemySprite` MUST update position and facing from that state using a Phaser sprite, not a rectangle

#### Scenario: Texture from archetype key

- **WHEN** `EnemySprite` is created for archetype `flyer`
- **THEN** it MUST use the texture loaded under the flyer `spriteKey`

### Requirement: Projectile presentation sprite

Presentation layer MUST provide `ProjectileSprite` that reflects `ProjectileState` using a loaded projectile texture.

#### Scenario: Projectile sync from state

- **WHEN** a projectile position updates
- **THEN** `ProjectileSprite` MUST move the textured sprite to the rounded position

#### Scenario: No rectangle projectile

- **WHEN** a caster projectile is spawned
- **THEN** presentation MUST NOT add a colored rectangle as the projectile visual

### Requirement: Dash plays frame animation

`PlayerSprite` MUST play the dash frame animation while dash is active instead of replacing animation with tint and alpha only.

#### Scenario: Dash animation plays

- **WHEN** `PlayerSprite` is told dash is active and syncs from player state
- **THEN** it MUST play the dash spritesheet animation

#### Scenario: Tint is optional accent

- **WHEN** dash is active
- **THEN** optional tint or alpha MUST NOT prevent dash animation from playing

## MODIFIED Requirements

### Requirement: Player presentation sprite

Presentation layer MUST provide `PlayerSprite` that reflects domain/use-case player state without embedding movement rules.

#### Scenario: Sprite sync from state

- **WHEN** UpdatePlayerMovement produces updated PlayerState
- **THEN** PlayerSprite MUST update its visual position and facing from that state

#### Scenario: Animation playback from state

- **WHEN** PlayerSprite syncs from PlayerState
- **THEN** it MUST play the resolved frame animation (idle, run, jump, fall, attack, dash, hurt) instead of placeholder scale or tint effects as the sole motion cue
