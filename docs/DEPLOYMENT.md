# Развёртывание Platformer в Kubernetes

Игра публикуется на **https://platformer.balashov-maxim.ru** через тот же k3s-кластер и Jenkins, что и [CV](https://cv.balashov-maxim.ru). Платформер — статический SPA (Vite + Phaser 3), без бэкенда: nginx раздаёт `dist/`.

## Содержание

1. [Архитектура](#1-архитектура)
2. [Предварительные требования](#2-предварительные-требования)
3. [DNS](#3-dns)
4. [Docker Hub](#4-docker-hub)
5. [Первый деплой (bootstrap)](#5-первый-деплой-bootstrap)
6. [Jenkins CI/CD](#6-jenkins-cicd)
7. [Проверка работы](#7-проверка-работы)
8. [Полезные команды](#8-полезные-команды)
9. [MinIO](#9-minio)
10. [s3manager admin UI](#10-s3manager-admin-ui)

---

## 1. Архитектура

```
Разработчик
    │ git push (+ pre-push: assets:push → s3manager HTTPS)
    ▼
GitHub (platformer)
    │ webhook
    ▼
Jenkins (на сервере) ──► Docker Hub
    │   assets:pull + lint + test + build   (3224142123/platformer)
    │ kubectl apply middleware + Ingress    │
    │ kubectl set image                     │
    ▼                                       │
k3s Cluster (тот же, что у CV)             │
┌───────────────────────────────────────────┴────────────────┐
│  Namespace: platformer                                     │
│                                                            │
│  Ingress platformer-ingress                                │
│    /      → platformer-frontend nginx:80                   │
│  Ingress platformer-minio (priority 100)                   │
│    /media → MinIO :9000, bucket platformer-assets          │
│             Traefik chain: strip /media, then add          │
│             /platformer-assets (path-style S3)             │
│  Ingress platformer-s3manager                              │
│    minio-adminer.balashov-maxim.ru/                        │
│             → s3manager :8080 + Traefik BasicAuth          │
│                                                            │
│  Pod: platformer-frontend (nginx + hashed dist)            │
│  StatefulSet: platformer-minio                             │
│  Deployment: platformer-s3manager                          │
│  Secret: platformer-minio (Jenkins id minio-assets)        │
│  Secret: platformer-s3manager-auth (id s3manager-http)     │
│  Job: platformer-minio-init (bucket + policy)              │
└────────────────────────────────────────────────────────────┘
```

Bootstrap: Jenkins credentials id `minio-assets` создаёт Secret `platformer-minio` (ключи не в git). Job `platformer-minio-init` ждёт MinIO Ready, создаёт bucket `platformer-assets` и anonymous `s3:GetObject` на `assets/*`. Проверка: `curl -sfI` `/` и `/media/assets/maps/level-01.json`; тело карты — Tiled JSON (`tilesets` / `layers`), не SPA `index.html`.


| Компонент | Технология | Порт | Репозиторий образа |
|---|---|---|---|
| `platformer-frontend` | nginx + Vite static | 80 | `3224142123/platformer` |
| `platformer-minio` | MinIO object storage | 9000/9001 | `minio/minio` (пин `RELEASE.*`) |
| `platformer-s3manager` | cloudlena/s3manager UI | 8080 | `cloudlena/s3manager:v0.8.0` |

Ресурсы frontend ~64–128 MB RAM; MinIO requests 256Mi / limits 512Mi; s3manager 64–128Mi.

---

## 2. Предварительные требования

### Уже должно быть настроено (из CV)

- k3s на сервере с Traefik и Let's Encrypt (`certresolver: le`)
- Jenkins в Docker с доступом к `/var/run/docker.sock` и kubeconfig
- Credentials в Jenkins: `dockerhub-credentials`, `kubeconfig`, `minio-assets`, `s3manager-http`
- Порты 80, 443, 8080 открыты

Подробнее: `U:\projects\cv\docs\DEPLOYMENT.md`

### На рабочей машине

- `kubectl`, настроенный на кластер (kubeconfig с IP сервера вместо `127.0.0.1`)
- `docker` (для ручной первой сборки, опционально)
- Git, репозиторий platformer на GitHub

---

## 3. DNS

У регистратора домена `balashov-maxim.ru` добавьте A-запись:

```
platformer.balashov-maxim.ru  →  <IP сервера>  (тот же, что у cv.balashov-maxim.ru)
```

Проверка (подождите распространения DNS, обычно до 15 минут):

```bash
dig platformer.balashov-maxim.ru +short
# или
nslookup platformer.balashov-maxim.ru
```

Admin host: A or CNAME `minio-adminer.balashov-maxim.ru` → тот же IP кластера, что и игровой хост (см. [§10](#10-s3manager-admin-ui)).

```bash
dig minio-adminer.balashov-maxim.ru +short
# или
nslookup minio-adminer.balashov-maxim.ru
```

---

## 4. Docker Hub

1. Войдите на [hub.docker.com](https://hub.docker.com)
2. Создайте **приватный** репозиторий: `3224142123/platformer`
3. Access Token для Jenkins уже должен быть в credential `dockerhub-credentials` (тот же, что для CV)

---

## 5. Первый деплой (bootstrap)

### Вариант A: через Jenkins (рекомендуется)

1. Запушьте репозиторий platformer на GitHub
2. Jenkins → **New Item** → **Pipeline** → имя: `platformer-bootstrap`
3. Pipeline → Definition: **Pipeline script from SCM**
4. SCM: Git, URL репозитория platformer, ветка `main`
5. Script Path: `Jenkinsfile.bootstrap`
6. Credentials → Add → **Username with password**:
   - id `minio-assets` (MinIO root → Secret `platformer-minio`)
   - id `s3manager-http` (HTTP login админки, не MinIO root). Нужны до **Build Now**; пароли не в git. На агенте для htpasswd — `apache2-utils`, иначе bootstrap возьмёт `openssl passwd -apr1`.
7. **Build Now**

Pipeline создаст namespace, `dockerhub-secret`, Secret MinIO, StatefulSet MinIO, init Job, s3manager (Secret BasicAuth + Deployment + Ingress `minio-adminer`), frontend Service/Deployment и Ingress `/` + `/media`.

### Вариант B: вручную через kubectl

На машине с доступом к кластеру:

```bash
# 1. Namespace
kubectl apply -f k8s/namespace.yaml

# 2. Docker Hub secret (замените USER и TOKEN)
kubectl create secret docker-registry dockerhub-secret \
  --namespace=platformer \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=3224142123 \
  --docker-password=<DOCKER_HUB_ACCESS_TOKEN>

# 3. Собрать и запушить образ (первый раз)
docker login -u 3224142123
docker build -t 3224142123/platformer:latest .
docker push 3224142123/platformer:latest

# 4. Манифесты
kubectl apply -f k8s/services/
kubectl apply -f k8s/deployments/platformer-frontend-deploy.yaml
kubectl apply -f k8s/ingress/ingress.yaml

# 5. Проверка
kubectl get pods -n platformer -w
kubectl get ingress -n platformer
```

Вариант B поднимает только frontend. MinIO, `/media` и админка `minio-adminer` живут в `k8s/minio/` и применяются **bootstrap** (рекомендуется). Ручной apply без Secret из Jenkins (`minio-assets`, `s3manager-http`) не создаст живые ключи: не делайте `kubectl apply -f k8s/minio/` (туда входят `*.yaml.example`).

Ожидаемый результат после полного bootstrap (не только frontend):

```
NAME                                   READY   STATUS    RESTARTS   AGE
platformer-frontend-<hash>             1/1     Running   0          1m
platformer-minio-0                     1/1     Running   0          1m
platformer-s3manager-<hash>            1/1     Running   0          1m
```

### Первый HTTPS

Traefik автоматически запросит сертификат Let's Encrypt после того, как:

- DNS указывает на сервер
- Ingress применён
- Pod в статусе Running

Проверка через 1–2 минуты:

```bash
curl -I https://platformer.balashov-maxim.ru
```

---

## 6. Jenkins CI/CD

### 6.1 Создание CD pipeline

1. Jenkins → **New Item** → **Multibranch Pipeline** → имя: `platformer`
2. Branch Sources → GitHub → URL репозитория platformer
3. Build Configuration → by Jenkinsfile, путь: `Jenkinsfile`
4. Сохранить → **Scan Repository Now**

### 6.2 Webhook GitHub → Jenkins

В репозитории platformer на GitHub:

- Settings → Webhooks → Add webhook
- **Payload URL:** `http://<IP-сервера>:8080/github-webhook/`
- **Content type:** `application/json`
- **Events:** Just the push event

### 6.3 Что делает Jenkinsfile

| Stage | Действие |
|---|---|
| Pull Assets | `maps:export` из `tiled/room-*.tmx`, затем `assets:push` + `assets:pull` в `node:20-alpine` против `https://minio-adminer.balashov-maxim.ru` (credential `s3manager-http`; агент без Node) |
| Assert World Graph Maps | `test -f` карт `room-a/b/c/d` после pull |
| Test | `docker build --target build` → `npm ci`, `lint`, `test`, `build` внутри образа (без bind-mount workspace) |
| Build | `docker build` → `3224142123/platformer:$GIT_COMMIT` (nginx + `dist/`, слои Test переиспользуются из кэша) |
| Push | push в Docker Hub (`latest` + commit tag) |
| Deploy | `kubectl apply` `k8s/minio/middleware.yaml` и `k8s/ingress/ingress.yaml`, затем `kubectl set image` + `rollout status` |
| Verify | `curl -sf` `/`; `curl -sfI` `/media/assets/maps/level-01.json`; тело — Tiled JSON (`"tilesets"` / `"layers"`), не `<!doctype html` |

### 6.4 Jenkins jobs в репозитории

| Файл | Назначение | Когда запускать |
|---|---|---|
| `Jenkinsfile` | Сборка, push, деплой | push в main (webhook) |
| `Jenkinsfile.bootstrap` | Первичный подъём k8s (MinIO + s3manager UI) | один раз вручную |

---

## 7. Проверка работы

```bash
# Статус подов
kubectl get pods -n platformer

# Логи nginx
kubectl logs -n platformer deployment/platformer-frontend

# Ingress
kubectl get ingress -n platformer

# HTTP (SPA `/`)
curl -sfI https://platformer.balashov-maxim.ru/ 

# MinIO media (canonical map; not the nginx image)
curl -sfI https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json

# Body must be Tiled JSON, not SPA index.html (HTTP 200 HTML is a Traefik/SPA miss)
curl -sf https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json | head
# expect "tilesets" and "layers"; fail if you see <!doctype html>
```

В браузере игра должна грузить спрайты и карты с `/media/` (MinIO), не из nginx-образа. Если DevTools показывает `Content-Type: text/html` на карте — Phaser стартует пустую GameScene.

---

## 8. Полезные команды

### Деплой и откат

```bash
# Принудительный перезапуск (без смены образа)
kubectl rollout restart deployment/platformer-frontend -n platformer

# Откат к предыдущей версии
kubectl rollout undo deployment/platformer-frontend -n platformer

# История деплоев
kubectl rollout history deployment/platformer-frontend -n platformer
```

### Отладка

```bash
# События namespace
kubectl get events -n platformer --sort-by='.lastTimestamp'

# Войти в контейнер
kubectl exec -it -n platformer deployment/platformer-frontend -- /bin/sh

# Список файлов в образе
kubectl exec -n platformer deployment/platformer-frontend -- ls -la /usr/share/nginx/html/assets

# Port-forward для локального теста
kubectl port-forward -n platformer deployment/platformer-frontend 8080:80
# → http://localhost:8080
```

### Локальная проверка образа

```bash
npm run lint && npm run test && npm run build
docker build -t platformer:local .
docker run --rm -p 8080:80 platformer:local
# → http://localhost:8080
```

### Обновление secret Docker Hub

```bash
kubectl delete secret dockerhub-secret -n platformer
kubectl create secret docker-registry dockerhub-secret \
  --namespace=platformer \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=3224142123 \
  --docker-password=<NEW_TOKEN>
kubectl rollout restart deployment/platformer-frontend -n platformer
```

---

## Структура файлов деплоя

```
platformer/
├── Dockerfile
├── nginx.conf
├── .dockerignore
├── Jenkinsfile
├── Jenkinsfile.bootstrap
├── k8s/
│   ├── namespace.yaml
│   ├── deployments/
│   │   └── platformer-frontend-deploy.yaml
│   ├── services/
│   │   └── platformer-frontend-svc.yaml
│   ├── ingress/
│   │   └── ingress.yaml          # два объекта: / и /media
│   └── minio/
│       ├── statefulset.yaml
│       ├── service.yaml
│       ├── job.yaml
│       ├── middleware.yaml       # chain: strip, затем add (три CRD)
│       ├── secret.yaml.example
│       ├── s3manager-deploy.yaml
│       ├── s3manager-svc.yaml
│       ├── s3manager-middleware.yaml
│       ├── s3manager-ingress.yaml
│       └── s3manager-auth-secret.yaml.example
└── docs/
    ├── DEPLOYMENT.md          ← этот файл
    └── MINIO-ASSETS.md
```

---

## Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| `ImagePullBackOff` | Нет secret или неверный токен Docker Hub | Пересоздать `dockerhub-secret`, проверить репозиторий |
| 502 / нет ответа | Pod не Ready | `kubectl describe pod`, `kubectl logs` |
| Сертификат не выдаётся | DNS не указывает на сервер или порт 80 закрыт | `dig`, проверить firewall |
| Игра без ассетов | нет объектов в MinIO / нет `/media/` | UI или `npm run assets:push` на `minio-adminer`, затем `curl -sfI` `/media/assets/maps/level-01.json` |
| `/media/...json` отдаёт HTML (игра чёрный экран) | Prefix `/` перехватывает `/media`, или strip+add в одном Traefik Middleware | Два Ingress (`platformer-minio` priority 100 и `platformer-ingress`); три Middleware (strip, add, chain). CD заново применяет `middleware.yaml` + `ingress.yaml`. Тело `curl -sf` должно содержать `"tilesets"`, не `<!doctype html` |
| Jenkins Pull Assets падает с `npm: not found` (exit 127) | агент Jenkins — контейнер без Node | Не вызывать `npm` на агенте: `docker create` + `npm run assets:pull` в `node:20-alpine` к minio-adminer |
| Jenkins Test падает с `npm ci` EUSAGE / нет `package-lock.json` | `docker run -v $PWD` при Jenkins-in-Docker монтирует пустой путь хоста | Quality gate должен идти через `docker build --target build`, не через bind-mount |
| Jenkins Test падает на lint/test/build | Ошибка в коде или зависимостях | Запустить локально `npm run lint && npm run test && npm run build` |

---

## 9. MinIO

Архитектура: отдельный Ingress `platformer-ingress` (`/` → frontend nginx, SPA + hashed `/assets/index-*.js`) и отдельный Ingress `platformer-minio` (`/media` → MinIO :9000, `router.priority: "100"`). Rewrite — **три** Traefik Middleware: `platformer-minio-media-strip` (`stripPrefix: /media`), `platformer-minio-media-add` (`addPrefix: /platformer-assets`), цепочка `platformer-minio-media`. Traefik допускает **один** тип на объект Middleware: strip+add в одном spec оставляют `/media` без rewrite, и Prefix `/` отдаёт SPA `index.html` (HTTP 200, `text/html`) — Phaser считает карту загруженной и рисует пустой экран. Path-style S3 после chain: `/platformer-assets/assets/...`. Канонический URL карты: `/media/assets/maps/level-01.json`. Консоль MinIO `:9001` без Ingress — только `kubectl port-forward`. Frontend nginx на всякий случай отвечает `404` на `location ^~ /media/`, если запрос всё же попал в под игры. CD на каждом деплое заново применяет `k8s/minio/middleware.yaml` и `k8s/ingress/ingress.yaml`.

### Bootstrap Secret / Job

1. В Jenkins заведите credentials id `minio-assets` (`MINIO_USER` / `MINIO_PASS`). Не коммитьте живые ключи.
2. Bootstrap (`Jenkinsfile.bootstrap`) создаёт Secret `platformer-minio` из этих credentials (пример без секретов: `k8s/minio/secret.yaml.example`).
3. Применяет StatefulSet/Service MinIO, Middleware и Ingress `/media`.
4. Ждёт MinIO Ready, затем запускает Job `platformer-minio-init`: bucket `platformer-assets` и anonymous download-only `s3:GetObject` на `assets/*`.

### Credentials

- Кластер: Jenkins `credentialsId: minio-assets` → Secret `platformer-minio` (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`).
- Локальный и Jenkins **push/pull**: `S3MANAGER_URL` / `S3MANAGER_USER` / `S3MANAGER_PASSWORD` (id Jenkins `s3manager-http`). Не MinIO S3 API и не клиент `mc`.

### Verify curls

```bash
curl -sfI https://platformer.balashov-maxim.ru/
curl -sfI https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json
```

### One-time seed

С ноутбука заливка идёт в UI или `npm run assets:push` (HTTP на s3manager), не через `mc` на `:9000`:

```bash
# .env.local: S3MANAGER_USER / S3MANAGER_PASSWORD (id Jenkins s3manager-http)
npm run assets:push
```

Браузер: https://minio-adminer.balashov-maxim.ru/ → бакет `platformer-assets` → префикс `assets/` (= `public/assets/`).

`npm run assets:pull` качает префикс `assets/` → `public/assets` через HTTPS s3manager (`minio-adminer.balashov-maxim.ru`). Jenkins делает то же в контейнере Node (агент без npm).

### Untrack blobs after `/media/` playtest

Когда прод-плейтест с `/media/` подтверждён (карта и спрайты грузятся из MinIO):

```bash
git rm --cached -- public/assets/**/*.png public/assets/**/*.svg public/assets/**/*.json
# commit gitignore + .gitkeep; do not rewrite history
```

Каталоги `public/assets/maps|images|sprite|tilesets|audio` остаются с `.gitkeep`. History не переписывайте (`git filter-branch` / force-push не нужны).

### Local verify

```bash
npm run assets:pull
npm run validate:maps
npm test
npm run build
```

### Cluster verify

1. MinIO Ready: `kubectl get pods -n platformer` — `platformer-minio-0` в статусе Ready.
2. `curl -sfI https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` → HTTP 200. Тело `curl -sf` той же URL содержит `"tilesets"` и `"layers"`, не `<!doctype html`.
3. В браузере откройте https://platformer.balashov-maxim.ru/ — спрайты и карты должны грузиться с MinIO (`/media/`), не из nginx-образа.

---

## 10. s3manager admin UI

Browser file manager for bucket `platformer-assets` on a dedicated host. Create DNS and Jenkins credential `s3manager-http` before bootstrap `Build Now`.

### DNS

Add an A or CNAME record `minio-adminer.balashov-maxim.ru` pointing at the same cluster address as `platformer.balashov-maxim.ru`. Let's Encrypt (`certresolver: le`) will not issue a cert until DNS answers. This host is **not** a path on the game Ingress.

```bash
dig minio-adminer.balashov-maxim.ru +short
# or
nslookup minio-adminer.balashov-maxim.ru
```

### Jenkins credential (HTTP BasicAuth)

Jenkins → Credentials → Add → Username with password, **id** `s3manager-http`. Password is not committed. Bootstrap stage `s3manager` creates live Secret `platformer-s3manager-auth` from that credential (`kubectl create secret ... --dry-run=client | kubectl apply`). Example file `k8s/minio/s3manager-auth-secret.yaml.example` is placeholders only (`changeme` / `REPLACE_ME`) and must not be applied.

### BasicAuth vs MinIO root keys (task 4.3)

HTTP login on `minio-adminer.balashov-maxim.ru` is Traefik BasicAuth. It is **not** the MinIO root user (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` in Secret `platformer-minio`) unless the operator deliberately reuses the same password. S3 keys stay in-cluster on the s3manager pod; they are not typed into the browser.

### CLI / pre-push (`assets:push`)

`npm run assets:push` POSTs files from `public/assets/` to `https://minio-adminer.balashov-maxim.ru/Default/api/buckets/platformer-assets/objects` with BasicAuth (same login as the UI). Object key is `assets/<relative-path>`. Env: `S3MANAGER_URL`, `S3MANAGER_USER`, `S3MANAGER_PASSWORD` in `.env.local`. If user/pass are missing and stdin is a TTY, the CLI prompts. Git GUI / Cursor without TTY: put creds in `.env.local` or `git push --no-verify`.

`npm run assets:pull` uses the same s3manager HTTPS host as `assets:push` (`minio-adminer.balashov-maxim.ru`, Traefik BasicAuth). Jenkins CD runs that command in `node:20-alpine` because the agent has no Node.

### Verify (after DNS + bootstrap)

```bash
# Unauthenticated → HTTP 401 (not the s3manager file browser)
curl -sI https://minio-adminer.balashov-maxim.ru/

# Authenticated → HTTP 200 s3manager UI (not frontend index.html)
curl -sI -u '<basic-user>:<basic-pass>' https://minio-adminer.balashov-maxim.ru/

# Upload under prefix assets/ → S3 key platformer-assets/assets/<relative-path>
# (same relative tree as public/assets/)
```

MinIO console `:9001` still has no public route. Game host `platformer.balashov-maxim.ru` `/` and `/media` are unchanged.

