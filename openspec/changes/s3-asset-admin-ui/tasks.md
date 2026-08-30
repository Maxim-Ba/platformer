## 1. s3manager workload

- [x] 1.1 Pin a released `cloudlena/s3manager` image tag and add Deployment `platformer-s3manager` in namespace `platformer` (requests/limits, port matching the image, typically 8080)
- [x] 1.2 Wire S3 env from Secret `platformer-minio` to in-cluster endpoint `platformer-minio:9000` with TLS off / path-style as required by the image README
- [x] 1.3 Add ClusterIP Service `platformer-s3manager` targeting the UI port
- [x] 1.4 Add `k8s/minio/s3manager-auth-secret.yaml.example` (htpasswd `users` placeholder only); document that the live Secret is created from Jenkins and is not committed

## 2. Ingress and BasicAuth

- [x] 2.1 Add Traefik Middleware `platformer-s3manager-auth` (`basicAuth` → Secret `platformer-s3manager-auth`) in namespace `platformer`
- [x] 2.2 Add Ingress `platformer-s3manager` for host `minio-adminer.balashov-maxim.ru`, path `/`, TLS `certresolver: le`, middleware BasicAuth, backend s3manager Service
- [x] 2.3 Confirm no new Ingress path on `platformer.balashov-maxim.ru` for s3manager and that MinIO console `:9001` still has no public route

## 3. Bootstrap

- [x] 3.1 Create Jenkins credential for s3manager HTTP BasicAuth (id documented, e.g. `s3manager-http`); do not commit the password
- [x] 3.2 Update `Jenkinsfile.bootstrap` after MinIO Init: create Secret `platformer-s3manager-auth` from credentials (`--dry-run=client | kubectl apply`), apply s3manager Deployment/Service/middleware/Ingress, wait Ready
- [x] 3.3 Do not fold s3manager into the game `Jenkinsfile` image build/push

## 4. Docs and operator path

- [x] 4.1 Document DNS A/CNAME `minio-adminer.balashov-maxim.ru` in `docs/DEPLOYMENT.md`
- [x] 4.2 Update `docs/MINIO-ASSETS.md` and README: browser UI and `assets:push` / `assets:pull` (s3manager HTTPS + BasicAuth from `.env.local` or TTY) as the laptop path; prefix `assets/` = `public/assets/`; `git push --no-verify` only when there is no TTY and no env
- [x] 4.3 Document BasicAuth vs MinIO root keys (HTTP login ≠ S3 user unless the operator chooses the same password)
- [x] 4.4 Change `assets:push` / `assets:pull` / pre-push to talk to s3manager HTTPS with Traefik BasicAuth (not laptop MinIO `:9000`)

## 5. Verify

- [x] 5.1 Unauthenticated `curl -sI https://minio-adminer.balashov-maxim.ru/` returns 401
- [x] 5.2 Authenticated request returns 200 and the s3manager UI (not frontend `index.html`)
- [x] 5.3 Upload a test object under `assets/` and confirm it exists on the S3 API (in-cluster curl or existing `/media` once that route returns non-HTML)
