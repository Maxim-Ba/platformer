## Why

Игра уже проходит quality gate локально (`build`, `lint`, `test`), но не имеет воспроизводимого деплоя на публичный домен. Нужен CI/CD по той же схеме, что и CV (`cv.balashov-maxim.ru`): k3s + Jenkins + Docker Hub, чтобы публиковать билды на `platformer.balashov-maxim.ru` автоматически при push в main.

## What Changes

- Добавить production Dockerfile (multi-stage: Node build → nginx static)
- Добавить `nginx.conf` для раздачи Vite `dist/` и ассетов из `public/`
- Добавить Kubernetes-манифесты: namespace `platformer`, Deployment, Service, Ingress
- Добавить `Jenkinsfile` (test → build image → push → deploy → verify)
- Добавить `Jenkinsfile.bootstrap` для первичного подъёма namespace и манифестов
- Добавить `docs/DEPLOYMENT.md` с командами настройки DNS, k3s, Jenkins и первого деплоя

## Capabilities

### New Capabilities

- `deployment-pipeline`: автоматизированная сборка, публикация Docker-образа и деплой статического билда игры в k3s

### Modified Capabilities

- `quality-gate`: pipeline MUST запускать lint, test и build перед публикацией образа

## Impact

- Новые файлы в корне репозитория: `Dockerfile`, `nginx.conf`, `.dockerignore`, `Jenkinsfile`, `Jenkinsfile.bootstrap`
- Новая папка `k8s/` с манифестами
- Новый документ `docs/DEPLOYMENT.md`
- Внешние системы: DNS (`platformer.balashov-maxim.ru`), Docker Hub (`3224142123/platformer`), существующий k3s-кластер и Jenkins на сервере CV
