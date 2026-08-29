## ADDED Requirements

### Requirement: MinIO runtime object storage in cluster

The platformer namespace MUST run a durable MinIO instance that stores runtime game assets in bucket `platformer-assets`.

#### Scenario: MinIO pod is reachable inside the cluster

- **WHEN** an operator applies the MinIO Kubernetes manifests after the namespace and MinIO Secret exist
- **THEN** a StatefulSet named `platformer-minio` MUST become Ready in namespace `platformer` and expose S3 API port 9000 on a ClusterIP Service

#### Scenario: Bucket exists after init

- **WHEN** the MinIO init Job completes successfully
- **THEN** bucket `platformer-assets` MUST exist and allow anonymous `s3:GetObject` for keys under `assets/`

#### Scenario: Credentials are not stored in git

- **WHEN** a reader inspects files committed to the repository
- **THEN** MinIO root user and secret key MUST NOT appear in tracked YAML or scripts

### Requirement: Public HTTPS download on the game host

Runtime assets MUST be downloadable over HTTPS on the same host as the game without requiring S3 credentials from the browser.

#### Scenario: Map JSON is publicly readable

- **WHEN** a client requests `https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` after the object has been uploaded
- **THEN** the response MUST be HTTP 200 with the map JSON body

#### Scenario: Sprite file is publicly readable

- **WHEN** a client requests `/media/assets/images/player-sheet.png` on the game host after upload
- **THEN** the response MUST be HTTP 200 with the image bytes

#### Scenario: MinIO console is not public

- **WHEN** an unauthenticated client requests the MinIO console port via Ingress on the game host
- **THEN** the console MUST NOT be exposed as a public Ingress route

### Requirement: Local asset sync commands

The repository MUST provide documented commands that upload the working tree `public/assets/` to the bucket and download bucket objects back into `public/assets/`.

#### Scenario: Push mirrors local assets to MinIO

- **WHEN** a developer with s3manager BasicAuth runs `npm run assets:push` and `public/assets/` contains runtime files
- **THEN** those files MUST appear in bucket `platformer-assets` under the `assets/` prefix with the same relative paths

#### Scenario: Pull restores assets for local development

- **WHEN** a developer with s3manager BasicAuth runs `npm run assets:pull` on a clone that has an empty `public/assets/` tree
- **THEN** runtime files MUST be written under `public/assets/` so `npm run dev` and `npm run validate:maps` can use them

### Requirement: Git push publishes assets and excludes them from GitHub

Runtime files under `public/assets/` MUST be published to MinIO as part of pushing git history, and MUST NOT be stored as blobs on GitHub in new commits.

#### Scenario: Pre-push hook uploads before GitHub receives the commit

- **WHEN** a developer runs `git push` with `core.hooksPath` pointing at the repository git hooks
- **THEN** the pre-push hook MUST run `assets:push` before the push is sent to the remote

#### Scenario: Runtime binaries are gitignored

- **WHEN** a developer creates or replaces a file matching runtime asset patterns under `public/assets/` (png, svg, json maps, audio)
- **THEN** `git status` MUST NOT list that file as untracked content to commit (except documented `.gitkeep` placeholders)

#### Scenario: Tiled sources remain in git

- **WHEN** a developer edits files under `tiled/`
- **THEN** those files MUST still be committable to GitHub as map sources
