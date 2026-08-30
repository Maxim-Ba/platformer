## ADDED Requirements

### Requirement: Visual gap catalog

The repository MUST maintain a documented catalog of gameplay visuals that distinguishes shipped SpriteCook art, remaining placeholders, and deferred items.

#### Scenario: Catalog lists current placeholders

- **WHEN** a contributor opens `docs/SPRITE-GAPS.md`
- **THEN** the catalog MUST list player attack/dash/hurt, enemy grunt/flyer/caster, caster projectile, melee slash VFX, and level props (hazard, checkpoint, door, exit) with status `have`, `generate`, or `deferred`

#### Scenario: Boundary exits stay debug

- **WHEN** the catalog is evaluated for this change
- **THEN** boundary-exit overlays MUST be marked `deferred` as debug rectangles, not SpriteCook generation targets

#### Scenario: UI and tilesets out of combat-sprites batch

- **WHEN** the catalog is evaluated for this change
- **THEN** HUD icons, skill-node icons, inventory icons, and tilesets MUST be `deferred`

### Requirement: SpriteCook MCP generation for P0 and P1

Missing P0 and P1 sprites listed in the gap catalog MUST be generated through SpriteCook MCP using the existing player base as style reference, not a new unrelated art direction.

#### Scenario: Credits checked before batch

- **WHEN** generation of the P0 batch starts
- **THEN** the agent MUST call SpriteCook credit balance first and MUST NOT start a batch that cannot finish P0

#### Scenario: Player base reused for player combat anims

- **WHEN** player `attack`, `dash`, or `hurt` animations are generated
- **THEN** they MUST be produced from the canonical `platformer-player-base` asset id in `spritecook-assets.json`

#### Scenario: Enemies generated as platformer characters

- **WHEN** grunt, flyer, or caster sprites are generated
- **THEN** each MUST use SpriteCook platformer character generation (or equivalent character workflow) and MUST NOT reuse the player character id as the enemy body

#### Scenario: Manifest records every generated asset

- **WHEN** a SpriteCook job for this change completes successfully
- **THEN** `spritecook-assets.json` MUST contain `asset_id`, `label`, `role`, and intended `local_path`

### Requirement: Local PNG paths without agent download

Generated sprites MUST land in documented `public/assets/sprite/` paths after the user saves PNG files; the agent MUST NOT download SpriteCook signed URLs from the terminal.

#### Scenario: Documented download table

- **WHEN** generation of an animation or still completes
- **THEN** the contributor MUST be told the exact repository path for that PNG (player combat strips, `enemy-{grunt|flyer|caster}-*.png`, `projectile-caster.png`, `vfx-melee-slash.png`, `prop-*.png`)

#### Scenario: Sheet rebuild after files exist

- **WHEN** the user confirms P0 strips are on disk
- **THEN** sheet-build scripts MUST produce combined spritesheets consumed by Phaser preload

### Requirement: Enemy and projectile textures in presentation

`EnemySprite` and `ProjectileSprite` MUST render loaded Phaser textures, not colored rectangles.

#### Scenario: Grunt uses grunt sheet

- **WHEN** a `grunt` enemy is spawned in GameScene
- **THEN** its presentation MUST be a sprite textured with the grunt spritesheet (archetype `spriteKey`), not a red rectangle

#### Scenario: Flyer and caster distinct textures

- **WHEN** `flyer` and `caster` enemies are on the same level
- **THEN** each MUST use its own loaded texture key, not a shared placeholder rectangle

#### Scenario: Caster projectile textured

- **WHEN** a caster projectile is active
- **THEN** `ProjectileSprite` MUST display the projectile texture, not an 8×8 purple rectangle

### Requirement: Level prop sprites replace object rectangles

Hazard, checkpoint, door, and room-exit objects MUST be presented as images/sprites sized to their Tiled AABB, not colored debug rectangles.

#### Scenario: Hazards are sprites

- **WHEN** GameScene renders level hazards
- **THEN** each hazard MUST use the hazard prop texture instead of a red rectangle

#### Scenario: Checkpoint door and exit are sprites

- **WHEN** GameScene renders checkpoints, doors, and exits
- **THEN** each MUST use its documented prop texture instead of yellow, cyan, or green rectangles

#### Scenario: Boundary exit remains rectangle

- **WHEN** GameScene renders boundary exits
- **THEN** they MUST remain translucent debug rectangles and MUST NOT require a SpriteCook texture

### Requirement: Melee slash VFX

Active melee hitbox feedback MUST use a slash VFX sprite instead of a white translucent rectangle.

#### Scenario: Slash visible during attack window

- **WHEN** player melee attack is active
- **THEN** presentation MUST show the melee slash texture at the computed hitbox

#### Scenario: Slash removed when attack ends

- **WHEN** the melee attack window closes
- **THEN** the slash VFX MUST be destroyed or hidden

### Requirement: Enemy animation resolver

Presentation MUST map enemy archetype and motion to animation keys via a Phaser-free resolver.

#### Scenario: Resolver is Phaser-free

- **WHEN** enemy animation resolver unit tests run
- **THEN** they MUST execute without initializing Phaser

#### Scenario: Ground patrol walks

- **WHEN** a grunt (ground-patrol with non-zero patrol distance) is updating
- **THEN** the resolver MUST return a walk (or equivalent move) animation key

#### Scenario: Stationary caster idles until cast

- **WHEN** a caster has zero patrol distance and is not in a ranged-cast action
- **THEN** the resolver MUST return idle

#### Scenario: Flyer uses fly loop

- **WHEN** a flyer enemy is updating
- **THEN** the resolver MUST return a fly (or walk-as-fly) animation key
