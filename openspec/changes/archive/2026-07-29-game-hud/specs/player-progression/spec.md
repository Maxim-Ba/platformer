## ADDED Requirements

### Requirement: Progression state readable for score HUD

`IProgressionPort` MUST provide sufficient state for HUD to display player score (level and experience).

#### Scenario: HUD reads progression

- **WHEN** score HUD widget calls `getProgression()`
- **THEN** returned `ProgressionState` MUST include `level` and `experience` for display formatting
