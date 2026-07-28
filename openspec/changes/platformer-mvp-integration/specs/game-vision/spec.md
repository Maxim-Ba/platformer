## ADDED Requirements

### Requirement: MVP scope boundary

The foundation release MUST deliver a playable loop: enter level, move and jump, take damage from hazards, respawn at checkpoint, reach level exit.

#### Scenario: MVP playable loop

- **WHEN** all eight platformer changes are complete
- **THEN** a player MUST be able to complete at least one Tiled-authored level from start to exit using keyboard controls

#### Scenario: Combat deferred

- **WHEN** foundation MVP is evaluated
- **THEN** melee combat, bosses, and complex enemy AI MUST NOT be required for MVP acceptance

### Requirement: Success metrics for pet-project

The project SHALL define measurable learning outcomes: working dev pipeline, clean layer separation, at least one unit-tested domain rule, and one Tiled level loaded at runtime.

#### Scenario: Foundation success checklist

- **WHEN** all platformer changes are marked complete
- **THEN** all success metrics MUST be verifiable in the repository or running build
