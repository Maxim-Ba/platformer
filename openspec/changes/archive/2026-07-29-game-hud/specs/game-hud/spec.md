## ADDED Requirements

### Requirement: Modular HUD widget contract

Each in-game HUD block MUST implement a `HudWidget` interface with `id`, `update()`, `setPosition(x, y)`, and `destroy()` methods.

#### Scenario: Widget lifecycle

- **WHEN** GameScene shuts down
- **THEN** all HUD widgets MUST be destroyed without leaking Phaser game objects

#### Scenario: Position change without scene rewrite

- **WHEN** developer calls `setPosition` on a widget or updates layout config
- **THEN** only that widget's screen position MUST change; GameScene MUST NOT require modification

### Requirement: HUD layout configuration

HUD screen positions MUST be defined in a dedicated layout config module, separate from widget rendering logic.

#### Scenario: Resource block placement

- **WHEN** GameHud is created
- **THEN** HP, Mana, and Energy widgets MUST be positioned in the bottom-left screen area per layout config

#### Scenario: Score block placement

- **WHEN** GameHud is created
- **THEN** the score widget MUST be positioned in the top-right screen area per layout config

### Requirement: Resource HUD display

The game MUST display player HP, Mana, and Energy as numeric current/max values during gameplay.

#### Scenario: Health visible

- **WHEN** GameScene is running
- **THEN** HUD MUST show current and max HP from `IHealthPort`

#### Scenario: Mana and energy visible

- **WHEN** GameScene is running
- **THEN** HUD MUST show current and max Mana from `IManaPort` and Energy from `IEnergyPort`

#### Scenario: Health updates on damage

- **WHEN** player takes hazard damage
- **THEN** HP display MUST reflect reduced HP on the next update cycle

### Requirement: Score HUD display

The game MUST display player score information in the top-right corner during gameplay.

#### Scenario: Score from progression

- **WHEN** GameScene is running
- **THEN** score widget MUST display player level and experience from `IProgressionPort`

#### Scenario: Score updates on XP gain

- **WHEN** player gains experience (e.g. checkpoint activation)
- **THEN** score display MUST reflect updated XP on the next update cycle

### Requirement: HUD camera independence

All HUD elements MUST remain fixed on screen and MUST NOT scroll with the level camera.

#### Scenario: Fixed overlay

- **WHEN** player moves and camera follows
- **THEN** HUD widgets MUST remain at their screen positions

### Requirement: GameHud orchestrator

GameScene MUST integrate HUD through a `GameHud` factory that composes individual widgets and exposes `update()` and `destroy()`.

#### Scenario: Single integration point

- **WHEN** developer adds a new HUD widget
- **THEN** only `GameHud` composition and layout config MUST change; GameScene MUST only call `createGameHud`, `update`, and `destroy`

### Requirement: Controls hint preserved

The game MUST continue showing movement/control hints during gameplay as a separate HUD widget or equivalent module.

#### Scenario: Controls visible

- **WHEN** GameScene is running
- **THEN** control hints MUST remain visible on screen
