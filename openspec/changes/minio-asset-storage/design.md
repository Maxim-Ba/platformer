## Context

Платформер — статический SPA (Vite + Phaser 3) в namespace `platformer` на том же k3s, что и CV. Сейчас runtime-файлы лежат в `public/assets/`, коммитятся в GitHub, копируются Vite в `dist/` и уезжают в nginx-образ. Phaser грузит относительные пути (`assets/maps/...`, `assets/images/player-sheet.png`) с origin сайта.

Change `platformer-cicd-deploy` уже закрыл деплой игры. CDN/object storage там были Non-Goal. Этот change выносит **runtime-ассеты** в MinIO, чтобы бинарники (и будущая музыка) не жили в GitHub и не раздували каждый `docker push`.

Ограничение, которое нельзя обойти: **Jenkins клонирует GitHub.** Если файлов нет в git, job не может их «скопировать в MinIO из checkout». Поэтому запись в бакет делается **в момент `git push` на машине разработчика** (hook + `assets:push`); Jenkins после webhook **скачивает** объекты для тестов и **проверяет** публичный URL.

## Goals / Non-Goals

**Goals:**

- MinIO в k8s (namespace `platformer`) с персистентным бакетом `platformer-assets`
- Публичное чтение ассетов с того же хоста: `https://platformer.balashov-maxim.ru/media/...` (без CORS)
- `git push` заливает `public/assets/` в бакет и **не** отправляет эти файлы на GitHub
- В проде Phaser/TiledLevelRepository качают спрайты, тайлсеты и JSON карт из MinIO
- Локальный `npm run dev` по-прежнему отдаёт те же пути из `public/` после `assets:pull`
- CI quality gate имеет карты на диске (pull) до `validate:maps` / тестов
- Документированный bootstrap MinIO в `docs/DEPLOYMENT.md`

**Non-Goals:**

- AWS S3, CloudFront, GitHub LFS, отдельный LFS-сервер
- Публичный Ingress на MinIO Console (`:9001`)
- Rewrite истории git (старые PNG останутся в прошлых коммитах)
- Content-hash имена файлов (пути Phaser остаются как сейчас)
- Вынос исходников Tiled (`tiled/*.tmx`, `*.tsx`) из git — это авторские данные, не runtime
- Смена Vite `base` с `/`, staging, мониторинг MinIO сверх liveness probe
- Отдельный домен `assets.balashov-maxim.ru`

## Decisions

### 1. MinIO в том же namespace `platformer`, официальный образ

**Решение:** StatefulSet `platformer-minio` (1 реплика), PVC 5Gi, Service ClusterIP порты 9000 (S3 API) и 9001 (console). Образ `minio/minio` с закреплённым `RELEASE.*` тегом. Root-ключи — k8s Secret, создаваемый bootstrap из Jenkins credentials (как `dockerhub-secret`), не из yaml в git.

**Альтернативы:** отдельный namespace `minio` — лишняя изоляция для одного бакета; Bitnami chart — лишняя зависимость Helm на k3s, где остальное — голые манифесты; PVC + `kubectl cp` — нет публичного HTTPS для синка.

### 2. Один origin: Ingress path `/media/` → бакет

**Решение:** существующий хост `platformer.balashov-maxim.ru` получает **второй Ingress** `platformer-minio` с Prefix `/media` на Service MinIO:9000 и `router.priority: "100"`. Frontend остаётся отдельным Ingress `platformer-ingress` на `/`. Traefik допускает один тип на объект Middleware, поэтому rewrite — цепочка из трёх CRD: `platformer-minio-media-strip` (`stripPrefix: /media`) → `platformer-minio-media-add` (`addPrefix: /platformer-assets`) → head `platformer-minio-media` (`chain`). Браузер запрашивает `/media/assets/maps/level-01.json`, MinIO видит path-style `/platformer-assets/assets/maps/level-01.json`.

Если strip и add живут в одном Middleware, `/media` не rewrite'ится: Prefix `/` отдаёт SPA `index.html` (HTTP 200 HTML), Phaser стартует пустую GameScene. Jenkins Verify проверяет не только статус, но и тело (есть `"tilesets"` / `"layers"`, нет `<!doctype html`). Frontend nginx отвечает 404 на `location ^~ /media/`, если запрос всё же попал в под игры. CD каждый деплой заново применяет `k8s/minio/middleware.yaml` и `k8s/ingress/ingress.yaml`.

Бакет с anonymous `s3:GetObject` (download-only, без ListBucket публично). Console только через `kubectl port-forward`.

**Альтернативы:** поддомен + CORS — лишняя DNS-запись и заголовки; раздача через nginx sidecar — снова толстый образ.

### 3. Запись в бакет на `git push` разработчика, не из Jenkins clone

**Решение:**

```
developer working tree (public/assets/* на диске, gitignore)
        │
        ├─ git pre-push hook → npm run assets:push  (s3manager HTTPS → MinIO)
        └─ git push → GitHub (только код, tiled/, манифест путей)
                │
                ▼
        Jenkins: assets:pull → lint/test/build → image (без runtime-ассетов) → deploy
                │
                ▼
        Verify: GET SITE_URL/ и GET SITE_URL/media/assets/maps/level-01.json
                (HTTP 200 + Tiled JSON, не SPA HTML)
```

Команды: `npm run assets:push` / `assets:pull` (HTTPS s3manager на `minio-adminer.balashov-maxim.ru`, Traefik BasicAuth). Hook в `scripts/git-hooks/pre-push`, установка: `git config core.hooksPath scripts/git-hooks`. Креды локально в `.env.local` (уже в `.gitignore`); в Jenkins — credentials id `s3manager-http`. Secret MinIO root остаётся `minio-assets` только для bootstrap.

**Альтернативы:** держать бинарники в git и пушить из Jenkins — противоречит «не на GitHub»; Git LFS + rudolfs — второй сервис ради той же S3-семантики.

### 4. Phaser: `ASSET_BASE_URL`, пути не менять

**Решение:** один хелпер (например `assetUrl('assets/maps/room-a.json')`) для PreloadScene, GameScene и `TiledLevelRepository`.

| Среда | `VITE_ASSET_BASE_URL` | Итоговый URL |
|---|---|---|
| `npm run dev` | `''` | `/assets/...` (Vite `public/`) |
| production build | `/media/` | `/media/assets/...` |

В prod Jenkins передаёт build-arg / env в Docker `vite build`. Query `?v=${GIT_COMMIT}` на запросы ассетов — cache-bust без смены имён файлов (nginx/MinIO не кэшируют «навсегда» без hash).

**Альтернатива:** разные path-строки в `FOUNDATION_ASSETS` — дубли и ошибки при новых ассетах.

### 5. Что в git, что в бакете

| Путь | Куда |
|---|---|
| `public/assets/**` (png, svg, json карт, будущее audio) | MinIO, gitignore, в git только `.gitkeep` |
| `tiled/` | git |
| `spritecook-assets.json` (id, не PNG) | git |
| Vite hashed JS/CSS | Docker/nginx, как сейчас |

`validate:maps` и тесты по-прежнему читают **диск** `public/assets/maps/`. Разница только в том, как каталог появляется: `assets:pull` или рабочая копия автора.

### 6. Production-образ без runtime-ассетов

**Решение:** после `vite build` удалить из `dist/` скопированные `maps/`, `images/`, `sprite/`, `tilesets/`, `audio/` перед слоем nginx. Hashed бандлы Vite (`dist/assets/index-*.js`) остаются. Игра не зависит от nginx для спрайтов/карт.

Dockerfile target `build` по-прежнему видит `public/assets` в context — Jenkins делает pull **до** `docker build`, чтобы тесты и `validate:maps` (если добавлен в Test) видели карты.

### 7. Init Job для бакета

**Решение:** Job `platformer-minio-init` (mc image): wait-for API, `mc mb`, anonymous download policy. Bootstrap применяет Secret → MinIO → wait ready → Job. Повторный apply Job должен быть идемпотентным (пересоздать Job или `mc mb` без ошибки).

## Risks / Trade-offs

- **[Push без hook / без `assets:push`]** → GitHub обновлён, бакет старый, игроки видят прежние спрайты. Митигация: hook обязателен в README; Jenkins Verify падает, если манифестный объект 404; опционально сравнить локальный checksum с HEAD.
- **[Первый clone без MinIO-доступа]** → нет файлов, `validate:maps` и playtest не работают. Митигация: README `assets:pull`; для офлайна достаточно один раз скачанной папки (gitignore).
- **[Anonymous GetObject]** → любой, кто знает URL, скачает ассеты. Для клиентской игры это норма (они и так в браузере). Не класть в бакет секреты и WAV-исходники.
- **[PVC на одной ноде k3s]** → потеря диска = потеря бакета. Митигация: периодический `assets:pull` на рабочую машину; 5Gi достаточно для pet-проекта.
- **[Traefik rewrite ошибочен]** → 403/404 на `/media` **или HTTP 200 HTML**. Митигация: отдельные Ingress `/` и `/media`; chain из трёх Middleware (один тип на CRD); в DEPLOYMENT.md `curl -sfI` **и** проверка тела на `"tilesets"`; init Job документирует ожидаемый key.
- **[История git уже содержит PNG]** → GitHub всё ещё хранит старые блобы. Митигация: Non-Goal rewrite; новые коммиты файлы не добавляют.
- **[Vite копирует `public/` в `dist/`]** → без очистки слой nginx снова greет бинарники. Митигация: явный `rm` в Dockerfile после build.

## Migration Plan

1. Залить манифесты MinIO + Secret из Jenkins credentials; дождаться Running; прогнать init Job.
2. Пока файлы ещё в git: с рабочей машины `npm run assets:push` (или UI `minio-adminer`) в префикс `assets/`.
3. Проверить `curl -sfI https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` и что тело — Tiled JSON, не HTML.
4. Включить `VITE_ASSET_BASE_URL=/media/` в production build; выкатить образ; playtest что спрайты/карты идут с `/media/`.
5. Добавить gitignore, hook, `git rm --cached` для runtime-файлов; оставить `.gitkeep`.
6. Переключить Jenkins: **pull → Test/Build → Deploy → Verify /media**. Убрать временный publish-from-checkout.
7. Rollback игры: `kubectl rollout undo` frontend (хелпер URL в бандле). Rollback ассетов: повторный `assets:push` предыдущей локальной копии; MinIO versioning не обязателен в этом change.

## Open Questions

- Нет: хост, namespace, путь `/media/`, модель hook+Jenkins pull и состав gitignore зафиксированы под существующий k3s/Jenkins.
