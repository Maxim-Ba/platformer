## ADDED Requirements

### Requirement: Map validation in quality gate

The quality gate MUST include automated map validation when level assets change.

#### Scenario: Validate maps command documented

- **WHEN** quality gate checklist is evaluated for a change touching `public/assets/maps/`
- **THEN** `npm run validate:maps` MUST be run and pass (exit code zero)

#### Scenario: Map validator unit tests pass

- **WHEN** developer runs `npm test`
- **THEN** unit tests for `MapValidationRules` / `MapValidator` MUST pass
