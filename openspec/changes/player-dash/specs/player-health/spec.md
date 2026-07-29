## ADDED Requirements

### Requirement: Dash grants invulnerability

Starting a dash MUST grant player invulnerability for the configured dash duration via the health port.

#### Scenario: Invulnerability on dash start

- **WHEN** dash successfully starts
- **THEN** `IHealthPort.grantInvulnerability` MUST be called with dash duration in milliseconds

#### Scenario: Hazard damage blocked during dash

- **WHEN** player overlaps a hazard while dash invulnerability is active
- **THEN** hazard damage MUST NOT be applied

#### Scenario: Existing invulnerability preserved

- **WHEN** dash starts while invulnerability timer is already active
- **THEN** invulnerability duration MUST be at least the maximum of existing remaining time and dash duration
