# quality-gate

## Purpose

Verification checklist для foundation MVP: build, lint, tests, manual playtest и архитектурный audit перед archive и sync specs. Те же автоматизированные проверки MUST прогоняться CI/CD-пайплайном до публикации Docker-образа.

## Requirements

### Requirement: Clean build and lint

The foundation MVP MUST pass production build and lint checks without errors. The CI/CD pipeline MUST run the same checks before publishing a deployment image.

#### Scenario: Build succeeds

- **WHEN** developer runs `npm run build`
- **THEN** the command MUST exit with code zero and emit distributable output

#### Scenario: Lint succeeds

- **WHEN** developer runs `npm run lint`
- **THEN** the command MUST exit with code zero on the foundation codebase

#### Scenario: Jenkins blocks deploy on lint failure

- **WHEN** `npm run lint` fails in the Jenkins Test stage
- **THEN** the pipeline MUST NOT push a Docker image or update the k8s Deployment

### Requirement: Domain and application tests pass

All unit tests for domain and application layers MUST pass. The CI/CD pipeline MUST run the test suite before publishing a deployment image.

#### Scenario: Test suite green

- **WHEN** developer runs the documented test command
- **THEN** all domain and application tests MUST pass

#### Scenario: Jenkins blocks deploy on test failure

- **WHEN** `npm run test` fails in the Jenkins Test stage
- **THEN** the pipeline MUST NOT push a Docker image or update the k8s Deployment

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

### Requirement: Map validation in quality gate

The quality gate MUST include automated map validation when level assets change. In CI, map files MAY be absent from git and MUST be present on disk after the asset pull step.

#### Scenario: Validate maps command documented

- **WHEN** quality gate checklist is evaluated for a change touching `public/assets/maps/`
- **THEN** `npm run validate:maps` MUST be run and pass (exit code zero)

#### Scenario: Map validator unit tests pass

- **WHEN** developer runs `npm test` with map fixtures available on disk
- **THEN** unit tests for `MapValidationRules` / `MapValidator` MUST pass

### Requirement: Asset pull before map-dependent CI checks

CI MUST restore `public/assets/` from object storage before running map validation or tests that read Tiled JSON from disk.

#### Scenario: Jenkins pulls assets before validate maps

- **WHEN** the Jenkins Test stage runs on a checkout that does not contain runtime asset blobs
- **THEN** the pipeline MUST complete `assets:pull` (s3manager HTTPS on `minio-adminer.balashov-maxim.ru`) successfully before `npm run validate:maps` or tests that open `public/assets/maps/`

#### Scenario: Missing MinIO objects fail the gate

- **WHEN** `assets:pull` cannot retrieve a map file required by `WORLD_GRAPH`
- **THEN** the pipeline MUST fail and MUST NOT push a Docker image or update the k8s Deployment
