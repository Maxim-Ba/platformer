## ADDED Requirements

### Requirement: Health state readable for HUD

`IHealthPort` MUST provide sufficient state for HUD to display current and max HP without accessing adapter internals.

#### Scenario: HUD reads health

- **WHEN** health HUD widget calls `getHealth()`
- **THEN** returned `HealthState` MUST include `currentHp` and `maxHp` for display formatting
