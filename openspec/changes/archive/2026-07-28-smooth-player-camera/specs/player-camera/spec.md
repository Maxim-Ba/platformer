## ADDED Requirements

### Requirement: Camera port abstraction

The game MUST expose camera follow behavior through an `ICameraPort` interface in `src/application/ports/`. Presentation and scene code MUST depend on this interface, not on Phaser camera APIs directly.

#### Scenario: Scene uses port only

- **WHEN** `GameScene` configures or updates camera follow
- **THEN** it MUST call methods on `ICameraPort` injected via `SceneDependencies`, not `scene.cameras.main.startFollow` or equivalent Phaser APIs

#### Scenario: Binding in composition root

- **WHEN** a concrete camera adapter is introduced or replaced
- **THEN** it MUST be bound to `ICameraPort` only in `src/game/composition-root.ts`

### Requirement: Smooth centered player follow

The camera MUST keep the player at the center of the viewport while smoothly interpolating scroll position toward the target each frame.

#### Scenario: Player centered when stationary

- **WHEN** the player is stationary and camera follow is active
- **THEN** the player visual MUST appear at the center of the game viewport (within rounding tolerance for pixel art)

#### Scenario: Smooth scroll interpolation

- **WHEN** the player moves continuously in one direction
- **THEN** camera scroll MUST interpolate toward the centered target position using configurable smoothing (not instant snap each frame)

### Requirement: Direction-change follow slack

The camera MUST apply additional follow slack (reduced responsiveness) when the player sharply reverses horizontal movement direction, so the view lags briefly before re-centering.

#### Scenario: Slack on horizontal direction reversal

- **WHEN** the player was moving right and then moves left (or vice versa) within a single movement session
- **THEN** camera horizontal follow MUST use dampened interpolation for a configurable period or until re-centered, producing visible follow lag relative to steady-direction movement

#### Scenario: No extra slack on continued direction

- **WHEN** the player continues moving in the same horizontal direction without reversal
- **THEN** camera follow MUST use base smoothing only (no direction-change dampening)

### Requirement: World bounds clamp

Camera scroll MUST remain within level world bounds so no empty area outside the level is shown beyond documented margins.

#### Scenario: Clamp at level edges

- **WHEN** the player approaches the left, right, top, or bottom edge of the level
- **THEN** camera scroll MUST be clamped so the viewport does not show area outside `level.bounds`

### Requirement: Camera lifecycle hooks

`ICameraPort` MUST support attach, update, reset, and bounds configuration for respawn and level reload flows.

#### Scenario: Reattach after respawn

- **WHEN** the player respawns and camera follow is re-established
- **THEN** the port MUST reset follow state and resume smooth tracking without scroll jumps beyond one frame tolerance

#### Scenario: Per-frame update

- **WHEN** `GameScene` runs its update loop
- **THEN** it MUST invoke `ICameraPort.update(deltaMs)` (or equivalent) so smoothing is applied every frame

### Requirement: Testable follow logic

Camera target scroll calculation with direction-change dampening MUST be implemented in a pure application/domain use case covered by unit tests without Phaser.

#### Scenario: Unit-tested direction reversal

- **WHEN** `UpdateCameraFollow` (or equivalent) is executed with simulated position and direction-change input
- **THEN** unit tests MUST verify dampened horizontal response on direction reversal and correct bounds clamping
