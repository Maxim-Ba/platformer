## ADDED Requirements

### Requirement: Dash animation key

The player animation resolver MUST support a dash animation that overrides movement animations while dash is active.

#### Scenario: Dash overrides run and idle

- **WHEN** resolver context reports dash active
- **THEN** the dash animation key MUST be returned even if the player is grounded and moving

#### Scenario: Dash below airborne priority only after hurt and attack

- **WHEN** resolver context reports dash active and attack is not active and hurt is not active
- **THEN** dash MUST take priority over jump, fall, run, and idle

### Requirement: Hurt animation key

The player animation resolver MUST support a hurt animation while damage invulnerability (not dash invulnerability) is active.

#### Scenario: Hurt overrides movement

- **WHEN** resolver context reports hurt active
- **THEN** the hurt animation key MUST be returned regardless of grounded or airborne movement state

### Requirement: Full melee attack cycle

The player attack animation MUST be a multi-frame melee cycle generated from the canonical player base, not a two-frame placeholder slice.

#### Scenario: Attack has a full cycle

- **WHEN** the player spritesheet is built after this change
- **THEN** the attack range MUST contain at least 6 frames

#### Scenario: Attack still overrides movement

- **WHEN** resolver receives attack-active context
- **THEN** attack animation key MUST still be returned regardless of movement state
