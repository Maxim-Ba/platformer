## ADDED Requirements

### Requirement: Ingress routes media prefix to MinIO

The game host Ingress MUST route `/media` to MinIO so browsers can download runtime assets from the same origin as the SPA.

#### Scenario: Media path reaches object storage

- **WHEN** Traefik Ingress is configured for `platformer.balashov-maxim.ru` with a `/media` path
- **THEN** HTTPS requests to `/media/assets/*` MUST be served by the MinIO Service on port 9000, not by `platformer-frontend`

### Requirement: Jenkins pulls assets before quality gate

The Jenkins pipeline MUST populate `public/assets/` from MinIO before running checks that read map or image files from disk.

#### Scenario: Test stage has maps on disk

- **WHEN** the Jenkins pipeline starts after a git checkout that does not contain runtime asset blobs
- **THEN** the pipeline MUST pull bucket `platformer-assets` into `public/assets/` before `npm run test` / Docker Test target runs

#### Scenario: Verify checks MinIO public object

- **WHEN** the Verify stage runs after a successful Deploy
- **THEN** the pipeline MUST request `SITE_URL/media/assets/maps/level-01.json`, treat a non-200 response as failure, and MUST fail if the body is SPA HTML (`<!doctype html`) rather than Tiled JSON containing `"tilesets"` and `"layers"`

#### Scenario: Deploy reapplies media routing

- **WHEN** the Deploy stage updates `platformer-frontend`
- **THEN** the pipeline MUST apply `k8s/minio/middleware.yaml` and `k8s/ingress/ingress.yaml` before `kubectl set image`, so `/media` keeps the MinIO rewrite chain

### Requirement: Production image omits runtime asset blobs

The nginx image MUST serve the Vite SPA bundle without embedding Tiled maps, sprites, tilesets, or audio copied from `public/assets/`.

#### Scenario: Map is not served from the frontend container

- **WHEN** a client requests `/assets/maps/level-01.json` from the running `platformer-frontend` container
- **THEN** the container MUST NOT be required to return the map; the canonical runtime URL MUST be `/media/assets/maps/level-01.json`

## MODIFIED Requirements

### Requirement: Production container image

The project MUST ship a multi-stage Dockerfile that builds the Vite production bundle and serves it with nginx on port 80. The production image MUST include hashed Vite JS/CSS and `index.html`, and MUST NOT rely on packaging `public/assets/` runtime files as the in-game asset origin.

#### Scenario: Image builds successfully

- **WHEN** `docker build` is run from the repository root after runtime assets are present in the build context for tests
- **THEN** the resulting image MUST expose port 80 and serve `index.html` from the Vite `dist/` output

#### Scenario: Static assets are reachable

- **WHEN** a client requests `/assets/maps/<level>.json` from the running container
- **THEN** the container is not the canonical origin; the file MUST be reachable at `/media/assets/maps/<level>.json` from MinIO after upload

### Requirement: Kubernetes deployment manifests

The repository MUST include k8s manifests for namespace `platformer`, frontend Deployment, ClusterIP Services, MinIO storage, and Ingress for host `platformer.balashov-maxim.ru`.

#### Scenario: Bootstrap applies cleanly

- **WHEN** an operator runs `kubectl apply` on the k8s manifests after creating the namespace, docker-registry secret, and MinIO Secret
- **THEN** a Deployment named `platformer-frontend` and a MinIO StatefulSet named `platformer-minio` MUST be created in namespace `platformer`

#### Scenario: Ingress routes HTTPS traffic

- **WHEN** Traefik Ingress is configured with `certresolver: le` and DNS points to the cluster
- **THEN** HTTPS requests to `platformer.balashov-maxim.ru/` MUST reach the `platformer-frontend` Service on port 80

### Requirement: Jenkins CD pipeline

The repository MUST include a `Jenkinsfile` that pulls runtime assets from MinIO, runs quality checks, builds and pushes a Docker image tagged with `GIT_COMMIT`, and updates the k8s Deployment image.

#### Scenario: Pipeline runs quality gate before push

- **WHEN** the Jenkins pipeline executes on a commit
- **THEN** asset pull MUST succeed and `npm run lint`, `npm run test`, and `npm run build` MUST succeed before the image is pushed to Docker Hub

#### Scenario: Successful deploy updates running pods

- **WHEN** the Deploy stage completes successfully
- **THEN** `kubectl rollout status deployment/platformer-frontend -n platformer` MUST succeed and the site MUST respond to HTTP GET at the configured `SITE_URL`

### Requirement: Deployment documentation

The repository MUST include `docs/DEPLOYMENT.md` with step-by-step commands for DNS, Docker Hub, k3s bootstrap (including MinIO), Jenkins job setup, asset sync credentials, and verification.

#### Scenario: Operator can bootstrap from docs alone

- **WHEN** an operator with access to the existing CV k3s cluster follows `docs/DEPLOYMENT.md`
- **THEN** they MUST be able to deploy the game and MinIO-backed assets to `https://platformer.balashov-maxim.ru` without reading source code
