# asset-object-storage

## Purpose

Runtime-ассеты игры (карты, спрайты, tilesets, audio) хранятся в MinIO в кластере и раздаются браузеру по HTTPS на том же хосте, что и SPA. Операторы публикуют объекты через CLI (`assets:push` / `assets:pull`) и через защищённый s3manager UI; git не является источником бинарных runtime-файлов.

## Requirements

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

Runtime assets MUST be downloadable over HTTPS on the same host as the game without requiring S3 credentials from the browser. MinIO Console port 9001 MUST remain without a public Ingress route. An authenticated file UI on a **different** host is not the MinIO Console and is allowed.

#### Scenario: Map JSON is publicly readable

- **WHEN** a client requests `https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` after the object has been uploaded
- **THEN** the response MUST be HTTP 200 with the map JSON body (Tiled `tilesets` and `layers`), not frontend `index.html`

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

#### Scenario: Push rejects stub map JSON

- **WHEN** a developer runs `npm run assets:push` and a file under `maps/*.json` is not a Tiled map (missing `tilesets` or `layers`)
- **THEN** the command MUST fail and MUST NOT upload that body (a stub object would make Jenkins Verify pass on HTTP 200 HTML-or-JSON while Phaser cannot start the room)

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

### Requirement: Operator may publish assets via the web UI

Publishing runtime objects to bucket `platformer-assets` MUST be possible through the authenticated s3manager UI. The git pre-push hook MUST publish via the same admin HTTPS host (not laptop MinIO `:9000`) and MUST NOT be the only supported upload path.

#### Scenario: Browser upload replaces laptop tunnel

- **WHEN** an operator cannot run `kubectl port-forward` on the laptop and uploads files through `https://minio-adminer.balashov-maxim.ru/` into prefix `assets/`
- **THEN** those objects MUST appear in bucket `platformer-assets` with the same relative paths as `public/assets/`

#### Scenario: CLI push uses s3manager HTTPS BasicAuth

- **WHEN** a developer runs `npm run assets:push` with `S3MANAGER_USER` / `S3MANAGER_PASSWORD` (env or TTY prompt) and `public/assets/` contains runtime files
- **THEN** the files MUST be POSTed to s3manager as object keys `assets/<relative-path>` in bucket `platformer-assets`

#### Scenario: CLI pull uses s3manager HTTPS BasicAuth

- **WHEN** a developer or Jenkins runs `npm run assets:pull` with `S3MANAGER_USER` / `S3MANAGER_PASSWORD` against `https://minio-adminer.balashov-maxim.ru`
- **THEN** objects under prefix `assets/` MUST be written under `public/assets/` with the same relative paths

#### Scenario: Git push without credentials in a GUI

- **WHEN** Git has no TTY and `.env.local` has no s3manager password
- **THEN** documentation MUST describe filling `.env.local` or using `git push --no-verify`
