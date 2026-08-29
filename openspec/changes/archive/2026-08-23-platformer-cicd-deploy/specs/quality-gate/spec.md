## MODIFIED Requirements

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
