# quality-gate

## Purpose

Verification checklist для foundation MVP: build, lint, tests, manual playtest и архитектурный audit перед archive и sync specs.

## Requirements

### Requirement: Clean build and lint

The foundation MVP MUST pass production build and lint checks without errors.

#### Scenario: Build succeeds

- **WHEN** developer runs `npm run build`
- **THEN** the command MUST exit with code zero and emit distributable output

#### Scenario: Lint succeeds

- **WHEN** developer runs `npm run lint`
- **THEN** the command MUST exit with code zero on the foundation codebase

### Requirement: Domain and application tests pass

All unit tests for domain and application layers MUST pass.

#### Scenario: Test suite green

- **WHEN** developer runs the documented test command
- **THEN** all domain and application tests MUST pass

### Requirement: Manual playtest acceptance

The foundation MVP MUST pass a manual playtest covering movement, collision, scene transitions, respawn, and level exit.

#### Scenario: Playtest checklist

- **WHEN** quality gate is evaluated
- **THEN** movement feel, tile collision, scene flow, checkpoint respawn, and level exit MUST be verified manually

### Requirement: Architecture boundary audit

Domain and application layers MUST NOT import Phaser.

#### Scenario: No Phaser in inner layers

- **WHEN** layer import audit runs
- **THEN** no file under `src/domain/` or `src/application/` MUST import from `phaser`
