# deployment-pipeline

## Purpose

CI/CD и production-деплой платформера: Docker-образ со статикой Vite, k8s-манифесты на k3s и Jenkins-пайплайн, который прогоняет quality gate и выкатывает игру на `platformer.balashov-maxim.ru`.

## Requirements

### Requirement: Production container image

The project MUST ship a multi-stage Dockerfile that builds the Vite production bundle and serves it with nginx on port 80.

#### Scenario: Image builds successfully

- **WHEN** `docker build` is run from the repository root
- **THEN** the resulting image MUST expose port 80 and serve `index.html` from the Vite `dist/` output

#### Scenario: Static assets are reachable

- **WHEN** a client requests `/assets/maps/<level>.json` from the running container
- **THEN** the file MUST be returned with HTTP 200 if it exists in `public/assets/maps/`

### Requirement: Kubernetes deployment manifests

The repository MUST include k8s manifests for namespace `platformer`, Deployment, ClusterIP Service, and Ingress for host `platformer.balashov-maxim.ru`.

#### Scenario: Bootstrap applies cleanly

- **WHEN** an operator runs `kubectl apply` on the k8s manifests after creating the namespace and docker-registry secret
- **THEN** a Deployment named `platformer-frontend` MUST be created in namespace `platformer`

#### Scenario: Ingress routes HTTPS traffic

- **WHEN** Traefik Ingress is configured with `certresolver: le` and DNS points to the cluster
- **THEN** HTTPS requests to `platformer.balashov-maxim.ru` MUST reach the `platformer-frontend` Service on port 80

### Requirement: Jenkins CD pipeline

The repository MUST include a `Jenkinsfile` that runs quality checks, builds and pushes a Docker image tagged with `GIT_COMMIT`, and updates the k8s Deployment image.

#### Scenario: Pipeline runs quality gate before push

- **WHEN** the Jenkins pipeline executes on a commit
- **THEN** `npm run lint`, `npm run test`, and `npm run build` MUST succeed before the image is pushed to Docker Hub

#### Scenario: Successful deploy updates running pods

- **WHEN** the Deploy stage completes successfully
- **THEN** `kubectl rollout status deployment/platformer-frontend -n platformer` MUST succeed and the site MUST respond to HTTP GET at the configured `SITE_URL`

### Requirement: Deployment documentation

The repository MUST include `docs/DEPLOYMENT.md` with step-by-step commands for DNS, Docker Hub, k3s bootstrap, Jenkins job setup, and verification.

#### Scenario: Operator can bootstrap from docs alone

- **WHEN** an operator with access to the existing CV k3s cluster follows `docs/DEPLOYMENT.md`
- **THEN** they MUST be able to deploy the game to `https://platformer.balashov-maxim.ru` without reading source code
