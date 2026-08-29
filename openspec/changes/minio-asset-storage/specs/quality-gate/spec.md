## ADDED Requirements

### Requirement: Asset pull before map-dependent CI checks

CI MUST restore `public/assets/` from object storage before running map validation or tests that read Tiled JSON from disk.

#### Scenario: Jenkins pulls assets before validate maps

- **WHEN** the Jenkins Test stage runs on a checkout that does not contain runtime asset blobs
- **THEN** the pipeline MUST complete `assets:pull` (s3manager HTTPS on `minio-adminer.balashov-maxim.ru`) successfully before `npm run validate:maps` or tests that open `public/assets/maps/`

#### Scenario: Missing MinIO objects fail the gate

- **WHEN** `assets:pull` cannot retrieve a map file required by `WORLD_GRAPH`
- **THEN** the pipeline MUST fail and MUST NOT push a Docker image or update the k8s Deployment

## MODIFIED Requirements

### Requirement: Map validation in quality gate

The quality gate MUST include automated map validation when level assets change. In CI, map files MAY be absent from git and MUST be present on disk after the asset pull step.

#### Scenario: Validate maps command documented

- **WHEN** quality gate checklist is evaluated for a change touching `public/assets/maps/`
- **THEN** `npm run validate:maps` MUST be run and pass (exit code zero)

#### Scenario: Map validator unit tests pass

- **WHEN** developer runs `npm test` with map fixtures available on disk
- **THEN** unit tests for `MapValidationRules` / `MapValidator` MUST pass
