## 1. MinIO in Kubernetes

- [x] 1.1 Add `k8s/minio/` manifests: StatefulSet `platformer-minio` (official `minio/minio` RELEASE tag), PVC 5Gi, ClusterIP Service ports 9000/9001
- [x] 1.2 Add Secret example `k8s/minio/secret.yaml.example` (root user/password placeholders); document that the live Secret is created from Jenkins credentials and is not committed
- [x] 1.3 Add liveness/readiness probes on the S3 API port and resource requests/limits suitable for a single-node k3s
- [x] 1.4 Add Job `platformer-minio-init` that waits for the API, creates bucket `platformer-assets`, and sets anonymous download-only `s3:GetObject` (idempotent)

## 2. Ingress same-origin media

- [x] 2.1 Extend `k8s/ingress/ingress.yaml` with Prefix path `/media` to the MinIO Service port 9000 on host `platformer.balashov-maxim.ru`
- [x] 2.2 Add Traefik middleware (strip `/media`, add `/platformer-assets`) so `/media/assets/...` maps to path-style S3 `/platformer-assets/assets/...`
- [x] 2.3 Confirm MinIO console `:9001` has no Ingress; document `kubectl port-forward` for admin
- [x] 2.4 Update `Jenkinsfile.bootstrap` to apply MinIO manifests, create the MinIO Secret from credentials, wait for Ready, then run/recreate the init Job

## 3. Local sync and git exclusion

- [x] 3.1 Add npm scripts `assets:push` and `assets:pull` syncing `public/assets/` ↔ `platformer-assets/assets` via s3manager HTTPS
- [x] 3.2 Gitignore runtime blobs under `public/assets/` (png, svg, json maps, audio); keep `.gitkeep` in maps/images/sprite/tilesets (and audio if present)
- [x] 3.3 Add `scripts/git-hooks/pre-push` that runs `assets:push`; document `git config core.hooksPath scripts/git-hooks`
- [x] 3.4 Document s3manager BasicAuth env vars in `.env.example` without real secrets

## 4. Phaser loads from configurable base URL

- [x] 4.1 Add `assetUrl()` helper using `import.meta.env.VITE_ASSET_BASE_URL` (empty in dev, `/media/` in production) plus optional `?v=` cache-bust
- [x] 4.2 Point PreloadScene foundation loads through `assetUrl()` / `setBaseURL`
- [x] 4.3 Point GameScene tileset/map loads through the same helper
- [x] 4.4 Point TiledLevelRepository JSON fetch at `{assetBaseUrl}assets/maps/{levelId}.json`
- [x] 4.5 Add `.env.production` with `VITE_ASSET_BASE_URL=/media/` and pass it into the Docker build

## 5. Production image without runtime blobs

- [x] 5.1 After `vite build` in the Dockerfile, delete copied runtime dirs from `dist/` (`maps`, `images`, `sprite`, `tilesets`, `audio`) while keeping hashed Vite JS/CSS
- [x] 5.2 Ensure nginx still serves `/` and hashed `/assets/index-*.js`; game maps are not required in the image

## 6. Jenkins pipeline

- [x] 6.1 Add Jenkins credentials id `s3manager-http` usage in `Jenkinsfile`: `assets:pull` into `public/assets/` before Test/Docker build
- [x] 6.2 Fail the pipeline if pull cannot restore a map required by `WORLD_GRAPH`
- [x] 6.3 Extend Verify to `curl -sfI` `SITE_URL/media/assets/maps/level-01.json` (HTTP 200) in addition to `SITE_URL/`
- [x] 6.4 Keep image push/deploy gated on lint, test, and build after a successful pull

## 7. Docs and migration

- [x] 7.1 Update `docs/DEPLOYMENT.md`: architecture diagram with MinIO, bootstrap Secret/Job, credentials, verify curls for `/` and `/media/...`
- [x] 7.2 Update README: clone → `assets:pull` → `npm run dev`; hook setup; that runtime files are not in git
- [x] 7.3 One-time seed: UI or `npm run assets:push` current `public/assets` into the bucket while files are still in git
- [x] 7.4 After prod playtest from `/media/`, `git rm --cached` runtime blobs, commit gitignore + `.gitkeep` (do not rewrite history)
- [x] 7.5 Verify locally: `assets:pull`, `npm run validate:maps`, `npm test`, `npm run build`
- [x] 7.6 Verify cluster: MinIO Ready, `curl -sfI` map JSON on `/media/`, game loads sprites/maps from MinIO in the browser
