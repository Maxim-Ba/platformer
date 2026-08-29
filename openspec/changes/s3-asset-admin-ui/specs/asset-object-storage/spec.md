## ADDED Requirements

### Requirement: Operator may publish assets via the web UI

Publishing runtime objects to bucket `platformer-assets` MUST be possible through the authenticated s3manager UI. The git pre-push hook MUST publish via the same admin HTTPS host (not laptop `mc` to MinIO `:9000`) and MUST NOT be the only supported upload path.

#### Scenario: Browser upload replaces laptop tunnel

- **WHEN** an operator cannot run `kubectl port-forward` on the laptop and uploads files through `https://minio-adminer.balashov-maxim.ru/` into prefix `assets/`
- **THEN** those objects MUST appear in bucket `platformer-assets` with the same relative paths as `public/assets/`

#### Scenario: CLI push uses s3manager HTTPS BasicAuth

- **WHEN** a developer runs `npm run assets:push` with `S3MANAGER_USER` / `S3MANAGER_PASSWORD` (env or TTY prompt) and `public/assets/` contains runtime files
- **THEN** the files MUST be POSTed to s3manager as object keys `assets/<relative-path>` in bucket `platformer-assets`

#### Scenario: Git push without credentials in a GUI

- **WHEN** Git has no TTY and `.env.local` has no s3manager password
- **THEN** documentation MUST describe filling `.env.local` or using `git push --no-verify`

## MODIFIED Requirements

### Requirement: Public HTTPS download on the game host

Runtime assets MUST be downloadable over HTTPS on the same host as the game without requiring S3 credentials from the browser. MinIO Console port 9001 MUST remain without a public Ingress route. An authenticated file UI on a **different** host is not the MinIO Console and is allowed.

#### Scenario: Map JSON is publicly readable

- **WHEN** a client requests `https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` after the object has been uploaded
- **THEN** the response MUST be HTTP 200 with the map JSON body

#### Scenario: Sprite file is publicly readable

- **WHEN** a client requests `/media/assets/images/player-sheet.png` on the game host after upload
- **THEN** the response MUST be HTTP 200 with the image bytes

#### Scenario: MinIO console is not public

- **WHEN** an unauthenticated client requests the MinIO console port via Ingress on the game host
- **THEN** the console MUST NOT be exposed as a public Ingress route
