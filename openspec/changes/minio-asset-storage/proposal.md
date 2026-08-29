## Why

Игровые бинарники (`public/assets/`: спрайты, тайлсеты, JSON карт, будущие ogg) сейчас едут в GitHub и в каждый Docker-слой. Это раздует историю репозитория и `docker push`, как только появится музыка. Нужен object storage в том же k3s: push кода в git заливает ассеты в MinIO, GitHub их не хранит, а Phaser в проде качает файлы с публичного URL бакета.

## What Changes

- Развернуть MinIO в namespace `platformer`: StatefulSet + PVC, Service, Secret с ключами (ключи не в git)
- Открыть бакет `platformer-assets` на чтение через Ingress того же хоста (`/media/`), чтобы игра грузила ассеты без CORS
- **BREAKING:** runtime-файлы под `public/assets/` больше не коммитятся в GitHub (gitignore). В git остаются исходники Tiled (`tiled/`), код, манифест путей и `.gitkeep`
- Добавить `assets:push` / `assets:pull` и git `pre-push` hook: при `git push` объекты уходят в MinIO с машины разработчика (Jenkins после clone их не видит)
- Jenkins: перед quality gate — `assets:pull`; после деплоя — проверка HTTP 200 на объект в MinIO; игровой образ больше не обязан содержать спрайты/карты
- Phaser (PreloadScene, GameScene, TiledLevelRepository) грузит ассеты с `VITE_ASSET_BASE_URL` (локально пусто / Vite `public/`, в проде `/media/`)
- Обновить `docs/DEPLOYMENT.md` и README: bootstrap MinIO, креды Jenkins, как клонировать и играть без бинарников в git
- Одноразовая миграция: залить текущие файлы в бакет, затем `git rm --cached` для `public/assets/**`

## Capabilities

### New Capabilities

- `asset-object-storage`: MinIO в k8s, бакет runtime-ассетов, публичная раздача, синхронизация с рабочей копии и команды pull/push

### Modified Capabilities

- `deployment-pipeline`: Jenkins тянет ассеты из MinIO для quality gate; Verify проверяет объект в бакете; контейнер nginx не является источником игровых ассетов; Ingress маршрутизирует `/media/`
- `project-scaffold`: layout `public/assets/` сохраняется локально, но файлы не в VCS; загрузка Phaser идёт через настраиваемый asset base URL
- `quality-gate`: CI MUST иметь локальную копию карт (pull из MinIO) до `validate:maps` / тестов, которым нужен диск
- `level-pipeline`: runtime-загрузка Tiled JSON и тайлсетов идёт с asset base URL, а не обязательно с origin nginx-образа

## Impact

- Новые манифесты: `k8s/minio/` (StatefulSet, Service, PVC, Ingress path или отдельный Ingress), Secret-шаблон
- `Jenkinsfile` / `Jenkinsfile.bootstrap`: стадии pull и apply MinIO; новые Jenkins credentials (`minio-assets`)
- `.gitignore`, опционально Husky/`scripts/pre-push` для `assets:push`
- `src/presentation/` и `src/infrastructure/tiled/`: `ASSET_BASE_URL`, правки PreloadScene / GameScene / `TiledLevelRepository`
- `vite.config.ts` / `.env.production`: `VITE_ASSET_BASE_URL=/media/`
- `package.json`: `assets:push`, `assets:pull`; Dockerfile / `.dockerignore`: не паковать gitignored ассеты как источник истины
- Документация: `docs/DEPLOYMENT.md`, README
- Внешние системы: существующий k3s + Traefik, Jenkins; PVC на ноде кластера
- Не входит: rewrite git history, GitHub LFS, AWS/CloudFront, публичная MinIO Console, отдельный CDN, смена `vite` `base` с `/`
