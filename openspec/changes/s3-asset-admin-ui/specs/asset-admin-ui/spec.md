## ADDED Requirements

### Requirement: Authenticated s3manager in the platformer namespace

The platformer namespace MUST run an s3manager Deployment that talks to MinIO over the in-cluster S3 API so an operator can list and upload objects in bucket `platformer-assets` from a browser without kubectl on the laptop.

#### Scenario: s3manager pod becomes Ready

- **WHEN** an operator applies the s3manager manifests after MinIO is Ready and S3 credentials exist in Secret `platformer-minio`
- **THEN** a Deployment named `platformer-s3manager` MUST become Ready in namespace `platformer` and expose the UI on a ClusterIP Service

#### Scenario: UI uses in-cluster MinIO endpoint

- **WHEN** s3manager starts
- **THEN** it MUST use the ClusterIP Service `platformer-minio` port 9000 as the S3 endpoint (not a public hostname and not MinIO console port 9001)

#### Scenario: Uploaded object lands in the assets prefix

- **WHEN** an authenticated operator uploads a file through s3manager into bucket `platformer-assets` under prefix `assets/` with the same relative path as `public/assets/`
- **THEN** that object MUST be readable via the S3 API at `platformer-assets/assets/<relative-path>`

### Requirement: Public admin host is HTTPS and password-protected

The s3manager UI MUST be reachable only on host `minio-adminer.balashov-maxim.ru` over HTTPS and MUST require HTTP Basic Authentication before the UI is usable.

#### Scenario: HTTPS admin host serves s3manager

- **WHEN** DNS for `minio-adminer.balashov-maxim.ru` points at the cluster and TLS is issued
- **THEN** HTTPS requests to that host MUST reach the `platformer-s3manager` Service, not `platformer-frontend` and not MinIO `:9001`

#### Scenario: Unauthenticated request is rejected

- **WHEN** a client requests `https://minio-adminer.balashov-maxim.ru/` without valid BasicAuth credentials
- **THEN** the response MUST be HTTP 401 and MUST NOT return the s3manager file browser

#### Scenario: Authenticated operator can open the UI

- **WHEN** a client supplies the configured BasicAuth username and password
- **THEN** the response MUST be HTTP 200 with the s3manager UI

#### Scenario: Game host does not expose s3manager

- **WHEN** a client requests `https://platformer.balashov-maxim.ru/` or `/media`
- **THEN** those paths MUST still route to the frontend or MinIO media rewrite and MUST NOT serve s3manager

### Requirement: Admin secrets stay out of git

HTTP BasicAuth material and live S3 keys for s3manager MUST NOT be committed to the repository.

#### Scenario: Tracked files have no live admin passwords

- **WHEN** a reader inspects files committed to the repository
- **THEN** the s3manager BasicAuth htpasswd and MinIO secret keys MUST NOT appear in tracked YAML or scripts (example placeholders only)
