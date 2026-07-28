# game-vision

## Purpose

Видение pet-проекта: 2D platformer в духе тёмного фэнтези (референс *Blasphemous*), learning goals и documented non-goals.

## Requirements

### Requirement: Pet-project learning goals

The project SHALL prioritize learning game development workflow and technology boundaries over content volume or commercial polish.

#### Scenario: Technology exploration is documented

- **WHEN** a significant technology decision is made (physics, tilemap, scene management)
- **THEN** the decision rationale SHALL be recorded in design docs or ADR-style notes

#### Scenario: MVP remains achievable by solo developer

- **WHEN** scope is evaluated for a development phase
- **THEN** the phase MUST be completable without assets or features requiring a full production team

### Requirement: Blasphemous-inspired game identity

The game SHALL be a 2D platformer with dark fantasy atmosphere inspired by Blasphemous, emphasizing precise movement, exploration, and meaningful death/resume loops.

#### Scenario: Core fantasy is defined

- **WHEN** the game vision is referenced by contributors
- **THEN** it MUST describe a dark, interconnected platformer world with deliberate player control and risk-reward exploration

#### Scenario: Reference is not a clone mandate

- **WHEN** features are proposed
- **THEN** they MUST be evaluated as adaptations suitable for a pet project, not as requirements to replicate Blasphemous content one-to-one

### Requirement: Explicit non-goals

The project MUST maintain documented non-goals including: multiplayer, procedural generation, commercial parity with Blasphemous, and custom physics engine.

#### Scenario: Non-goals reject scope creep

- **WHEN** a feature proposal conflicts with documented non-goals
- **THEN** the proposal MUST be deferred to a post-foundation phase or rejected unless non-goals are formally updated

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

- **WHEN** all platformer changes through mvp-integration are marked complete
- **THEN** all success metrics MUST be verifiable in the repository or running build
