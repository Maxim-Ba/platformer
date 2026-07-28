## ADDED Requirements

### Requirement: Player spritesheet asset

The game MUST ship a player spritesheet with frame-based animations replacing the static SVG placeholder.

#### Scenario: Spritesheet loaded at startup

- **WHEN** PreloadScene completes asset loading
- **THEN** player spritesheet texture MUST be available under documented asset key

#### Scenario: Documented frame layout

- **WHEN** a contributor reads project documentation
- **THEN** they MUST find spritesheet path, frame size, and animation frame ranges

### Requirement: Core movement animations

The player MUST have Phaser animations for idle, run, jump, and fall states.

#### Scenario: Idle on standing still

- **WHEN** player is grounded and horizontal velocity is below run threshold
- **THEN** idle animation MUST play

#### Scenario: Run while moving

- **WHEN** player is grounded and horizontal velocity exceeds run threshold
- **THEN** run animation MUST play

#### Scenario: Jump ascending

- **WHEN** player is airborne with upward velocity
- **THEN** jump animation MUST play

#### Scenario: Fall descending

- **WHEN** player is airborne with zero or downward velocity
- **THEN** fall animation MUST play

### Requirement: Animation state resolver

Presentation layer MUST map `PlayerState` to animation key via a pure, testable resolver function.

#### Scenario: Resolver is Phaser-free

- **WHEN** animation resolver unit tests run
- **THEN** they MUST execute without initializing Phaser

#### Scenario: State priority

- **WHEN** player is airborne
- **THEN** jump or fall animation MUST take priority over run or idle

### Requirement: Animation sync from player state

`PlayerSprite` MUST update played animation when resolved animation key changes.

#### Scenario: Animation switches on landing

- **WHEN** player transitions from fall to grounded idle
- **THEN** sprite MUST switch from fall to idle animation

#### Scenario: Facing direction preserved

- **WHEN** animation changes
- **THEN** horizontal flip based on velocity direction MUST still apply

### Requirement: Attack animation hook

Animation resolver MUST support an optional attack context flag for integration with melee combat.

#### Scenario: Attack overrides movement animation

- **WHEN** resolver receives attack-active context
- **THEN** attack animation key MUST be returned regardless of movement state

### Requirement: Skin selection hook

Animation system MUST support resolving player texture from settings cosmetics skin id when settings port is available.

#### Scenario: Default skin

- **WHEN** no settings port is provided or skin id is default
- **THEN** default player spritesheet MUST be used

#### Scenario: Custom skin id

- **WHEN** settings port reports non-default `playerSkinId` and matching texture is loaded
- **THEN** player sprite MUST use texture for that skin id
