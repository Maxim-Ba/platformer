## ADDED Requirements

### Requirement: Dash ability unlock gate

Dash action MUST be available only when progression unlock id `dash` is active.

#### Scenario: Dash available when unlocked

- **WHEN** `IProgressionPort.isUnlocked('dash')` returns true
- **THEN** dash input MUST be eligible to start a dash per dash rules

#### Scenario: Dash blocked when locked

- **WHEN** `IProgressionPort.isUnlocked('dash')` returns false
- **THEN** dash input MUST NOT start a dash
