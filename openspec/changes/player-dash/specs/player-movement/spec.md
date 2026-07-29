## ADDED Requirements

### Requirement: Dash overrides normal movement

While dash is active, normal player movement (horizontal input, jump, gravity) MUST be suspended in favor of dash movement rules.

#### Scenario: Normal movement skipped during dash

- **WHEN** `IDashPort` reports dash is active
- **THEN** `UpdatePlayerMovement` MUST NOT be invoked for that frame

#### Scenario: Normal movement resumes after dash

- **WHEN** dash active window ends
- **THEN** `UpdatePlayerMovement` MUST resume on subsequent frames
