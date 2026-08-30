## Context

Change `minio-asset-storage` уже кладёт MinIO в namespace `platformer` (StatefulSet `platformer-minio`, бакет `platformer-assets`, S3 `:9000` ClusterIP). Публичное чтение — `https://platformer.balashov-maxim.ru/media/...`. Запись с ноутбука через port-forward не работает: нет kubeconfig. MinIO Console `:9001` намеренно без Ingress.

Нужен браузерный upload, который **проксирует S3 из пода**, а не с ноутбука. Хост: `minio-adminer.balashov-maxim.ru`. Манифесты остаются в репозитории игры.

## Goals / Non-Goals

**Goals:**

- s3manager в том же namespace, ходит на `http://platformer-minio:9000`
- HTTPS UI на отдельном DNS-имени с Traefik BasicAuth
- Console `:9001` и анонимный Put на `/media` не открывать
- Bootstrap применяет UI после MinIO Ready
- Документация: DNS, логин, префикс `assets/` как зеркало `public/assets/`
- `assets:push` / `assets:pull` / pre-push ходят через HTTPS s3manager + BasicAuth

**Non-Goals:**

- Форк/сборка своего образа s3manager
- Отдельный git-репозиторий
- Публичный S3 API или MinIO Console
- OIDC / SSO
- Снятие git hook (CLI должен ходить в тот же админ-хост, что и браузер)
- Починка Traefik `/media` → frontend HTML (это scope `minio-asset-storage`)

## Decisions

### 1. Готовый образ s3manager в этом репозитории

**Решение:** Deployment `platformer-s3manager`, образ `cloudlena/s3manager` с закреплённым тегом (не `latest`). Service ClusterIP на порт приложения (обычно 8080). Файлы: `k8s/minio/s3manager-deploy.yaml` + `s3manager-svc.yaml` (или один файл). Env по README образа: endpoint MinIO **без TLS внутри кластера**, path-style, ключи из Secret `platformer-minio` (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` → `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` или как требует образ).

**Альтернативы:** Filestash — тяжелее; MinIO Console на `:9001` — браузер часто ходит в публичный S3 API, которого нет; свой UI на presigned URL — дубль s3manager.

### 2. Отдельный Ingress host, не path на игровом домене

**Решение:** Ingress `platformer-s3manager`, host `minio-adminer.balashov-maxim.ru`, path `/`, backend s3manager. TLS `certresolver: le`, отдельный Secret сертификата. Игровой Ingress (`/` и `/media`) не трогать.

**Альтернативы:** `/admin` на `platformer.balashov-maxim.ru` — риск пересечения со SPA `try_files`; подмешать Console на `:9001` — Non-Goal.

### 3. Два слоя секретов: HTTP Basic + S3

**Решение:** Traefik Middleware `basicAuth` (CRD `traefik.io/v1alpha1`, как `platformer-minio-media`). Secret `platformer-s3manager-auth` с htpasswd в ключе `users` — **не в git**. Jenkins credential (например `s3manager-http`) → bootstrap `kubectl create secret generic ... --dry-run=client | kubectl apply`. Это пароль **страницы**, не обязательно тот же, что MinIO root.

S3-ключи пода — существующий `platformer-minio`. Для pet-проекта достаточно; выделенный MinIO-user только на бакет — желательно, не блокер этого change.

**Альтернативы:** только BasicAuth без S3 creds — UI не заговорит с MinIO; вынести root в браузер без HTTP auth — слишком широко.

### 4. Bootstrap после MinIO Ready

**Решение:** в `Jenkinsfile.bootstrap` после стадии MinIO Init: создать HTTP Secret, `kubectl apply` Deployment/Service/Middleware/Ingress s3manager, `kubectl rollout status`. Не включать s3manager в игровой `Jenkinsfile` CD (образ игры не меняется).

### 5. CLI и hook

**Решение:** `npm run assets:push`, `npm run assets:pull` и `scripts/git-hooks/pre-push` ходят на `{S3MANAGER_URL}` (`https://minio-adminer.balashov-maxim.ru`). Push POSTs multipart `file`+`path` на `/Default/api/buckets/platformer-assets/objects`; pull листит bucket HTML и GET `/Default/api/buckets/{bucket}/objects/{key}`. Traefik BasicAuth (`S3MANAGER_USER` / `S3MANAGER_PASSWORD` из `.env.local`, иначе prompt на TTY). Браузерный UI — тот же хост. Jenkins CD запускает `assets:pull` в `node:20-alpine` с credential `s3manager-http`. `git push --no-verify` — только если нет TTY и нет `.env.local` (Git GUI).

## Risks / Trade-offs

- **[UI в интернете с root MinIO]** → полный доступ к бакету при утечке BasicAuth. Митигация: сильный HTTP-пароль, не коммитить Secret, позже — отдельный MinIO-user.
- **[BasicAuth без TLS пока нет сертификата]** → пароль по HTTP. Митигация: тот же `certresolver: le`, не открывать UI до DNS.
- **[s3manager ходит path-style иначе, чем in-cluster S3]** → пустые бакеты / 404. Митигация: явный endpoint `platformer-minio:9000` и проверка upload → `curl` `/media/assets/...` после починки media-роута.
- **[Образ без пина]** → сюрприз на bootstrap. Митигация: тег RELEASE/semver в манифесте.
- **[DNS забыли]** → LE не выпустит cert. Митигация: шаг в DEPLOYMENT.md до Build Now.
- **[Hook без TTY и без .env.local]** → Git GUI блокирует push. Митигация: `.env.local` или `git push --no-verify`; не считать регрессией UI.

## Migration Plan

1. DNS A (или CNAME) `minio-adminer.balashov-maxim.ru` на IP кластера (как у игры).
2. Jenkins credential для HTTP BasicAuth; манифесты + bootstrap.
3. Build Now bootstrap; под Ready, Ingress host в списке.
4. Браузер: BasicAuth → s3manager → загрузка в `platformer-assets` / `assets/...`.
5. Проверка объекта: `curl -sfI https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` и тело — Tiled JSON, не HTML.
6. Rollback: `kubectl delete` Ingress/Deployment s3manager; MinIO и `/media` не трогать.

## Open Questions

- Выделенный MinIO IAM-user vs root в env пода — можно отдельным follow-up. Тег образа зафиксирован: `cloudlena/s3manager:v0.8.0`.
