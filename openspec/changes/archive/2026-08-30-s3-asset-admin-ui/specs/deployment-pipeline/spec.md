## ADDED Requirements

### Requirement: Bootstrap deploys s3manager after MinIO is Ready

The bootstrap Jenkins pipeline MUST apply s3manager manifests only after MinIO is Ready so the UI pod can reach `platformer-minio:9000`.

#### Scenario: Bootstrap applies s3manager after init

- **WHEN** `Jenkinsfile.bootstrap` runs successfully after MinIO Secret, StatefulSet, and init Job have completed
- **THEN** the pipeline MUST apply s3manager Deployment, Service, BasicAuth middleware, and the `minio-adminer.balashov-maxim.ru` Ingress in namespace `platformer`

#### Scenario: HTTP auth secret is created like other secrets

- **WHEN** bootstrap creates the s3manager BasicAuth Secret
- **THEN** it MUST come from Jenkins credentials via `kubectl create secret ... --dry-run=client | kubectl apply` and MUST NOT apply a tracked file that contains the live htpasswd

### Requirement: Kubernetes manifests for the admin host

The repository MUST include Kubernetes manifests for s3manager and Ingress host `minio-adminer.balashov-maxim.ru` in namespace `platformer`.

#### Scenario: Admin Ingress is a separate object

- **WHEN** an operator applies the ingress manifests
- **THEN** an Ingress MUST exist whose host is `minio-adminer.balashov-maxim.ru` and whose backend is the s3manager Service, distinct from Ingress objects for `platformer.balashov-maxim.ru`

#### Scenario: CD image pipeline does not rebuild s3manager

- **WHEN** the game `Jenkinsfile` builds and deploys `platformer-frontend`
- **THEN** that pipeline MUST NOT be required to build or push an s3manager image (upstream image only)

## MODIFIED Requirements

### Requirement: Deployment documentation

The repository MUST include `docs/DEPLOYMENT.md` with step-by-step commands for DNS, Docker Hub, k3s bootstrap, Jenkins job setup, MinIO asset storage, the s3manager admin host, and verification.

#### Scenario: Operator can bootstrap from docs alone

- **WHEN** an operator with access to the existing CV k3s cluster follows `docs/DEPLOYMENT.md`
- **THEN** they MUST be able to deploy the game to `https://platformer.balashov-maxim.ru` and the asset admin UI to `https://minio-adminer.balashov-maxim.ru` without reading source code

#### Scenario: Admin DNS and login are documented

- **WHEN** an operator follows the MinIO / deployment docs
- **THEN** the docs MUST state the DNS record for `minio-adminer.balashov-maxim.ru`, that HTTP BasicAuth is required, and that uploads go under bucket prefix `assets/`
