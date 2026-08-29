## Why

Заливка runtime-ассетов в MinIO с ПК требует SSH-туннеля и `kubectl port-forward` на сервере. У разработчика нет рабочего kubeconfig на ноутбуке, поэтому прямой S3 с ПК ломается. Нужен браузерный UI на отдельном хосте, который из кластера ходит в ClusterIP MinIO — без туннеля и без публичной MinIO Console.

## What Changes

- Развернуть **s3manager** в namespace `platformer` (готовый образ, не форк исходников): Deployment + Service, endpoint `http://platformer-minio:9000`, бакет `platformer-assets`
- Открыть Ingress **только** на хосте `minio-adminer.balashov-maxim.ru` (TLS Let's Encrypt) с Traefik **BasicAuth**; не вешать UI на `platformer.balashov-maxim.ru` и не открывать MinIO Console `:9001`
- Bootstrap (`Jenkinsfile.bootstrap`) применяет манифесты s3manager **после** MinIO Ready; HTTP-пароль админки — отдельный Jenkins credential / k8s Secret (не в git)
- Документировать DNS A-запись, вход в UI, загрузку в префикс `assets/` (зеркало `public/assets/`). `npm run assets:push` / `assets:pull` / pre-push ходят в s3manager по HTTPS с BasicAuth (креды `.env.local` или TTY prompt).
- Манифесты живут **в этом репозитории** (`k8s/minio/` или `k8s/s3manager/`), отдельный git-проект не создаётся

## Capabilities

### New Capabilities

- `asset-admin-ui`: аутентифицированный веб-UI (s3manager) для просмотра и загрузки объектов бакета `platformer-assets` с хоста `minio-adminer.balashov-maxim.ru`

### Modified Capabilities

- `asset-object-storage`: оператор публикует runtime-объекты через веб-UI **или** `assets:push` (HTTP s3manager + BasicAuth); MinIO Console `:9001` по-прежнему без публичного Ingress
- `deployment-pipeline`: bootstrap применяет s3manager и Ingress отдельного хоста; документация деплоя описывает DNS и BasicAuth админки

## Impact

- Новые манифесты: Deployment/Service s3manager, Traefik Middleware BasicAuth, Ingress host `minio-adminer.balashov-maxim.ru`
- `Jenkinsfile.bootstrap`: Secret BasicAuth + apply s3manager после MinIO Ready
- `docs/DEPLOYMENT.md`, `docs/MINIO-ASSETS.md`, README: UI и `assets:push` / `assets:pull` (HTTP s3manager) как заливка и скачивание с ПК и Jenkins
- DNS: запись `minio-adminer.balashov-maxim.ru` на тот же кластер, что и игра
- Не входит: форк s3manager, публичная MinIO Console, публичный S3 API `:9000`, снятие anonymous GET с `/media`, удаление `assets:push`/hook, отдельный репозиторий, OIDC
