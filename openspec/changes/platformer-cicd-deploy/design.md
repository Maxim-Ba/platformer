## Context

Платформер — статический SPA (Vite + Phaser 3), без бэкенда и БД. CV уже развёрнут на том же сервере через k3s, Traefik Ingress с Let's Encrypt (`certresolver: le`), Jenkins и Docker Hub (`3224142123/*`). Angular SSR в CV требует Node runtime; для платформера достаточно nginx.

## Goals / Non-Goals

**Goals:**

- Публичный доступ по `https://platformer.balashov-maxim.ru`
- Автодеплой при push в main через Jenkins webhook
- Quality gate в pipeline: `lint` + `test` + `build` до публикации образа
- Документированный bootstrap для k3s и Jenkins

**Non-Goals:**

- GitHub Actions для CD (только Jenkins, как у CV)
- Staging-окружение и preview-деплои
- CDN, мониторинг, observability (можно добавить позже по аналогии с cv-observability)
- Изменение `vite.config.ts` base path (игра на корне поддомена)

## Decisions

### 1. nginx вместо Node SSR

**Решение:** multi-stage Dockerfile — `node:20-alpine` для сборки, `nginx:1.27-alpine` для раздачи `dist/`.

**Альтернатива:** `vite preview` в контейнере — хуже для production (нет зрелых cache/security defaults).

### 2. Отдельный namespace `platformer`

**Решение:** изолировать от `cv-portfolio` отдельным namespace.

**Альтернатива:** один namespace — смешивает lifecycle приложений.

### 3. Jenkins pipeline по образцу CV

**Решение:** `Jenkinsfile` с stages Test → Build → Push → Deploy → Verify; credentials `dockerhub-credentials` и `kubeconfig` переиспользуются.

**Альтернатива:** GitHub Actions deploy — не соответствует существующей инфраструктуре.

### 4. Ingress с теми же Traefik-аннотациями, что у CV

**Решение:** `traefik.ingress.kubernetes.io/router.entrypoints: web,websecure` и `certresolver: le` для автоматического TLS.

### 5. Тесты в Docker-контейнере на этапе Test

**Решение:** `docker run node:20-alpine` с `npm ci && npm run lint && npm run test && npm run build` — не требует Node на Jenkins agent.

## Risks / Trade-offs

- **[DNS не настроен]** → Ingress и Let's Encrypt не выпустят сертификат. Митигация: проверка `dig` в DEPLOYMENT.md до bootstrap.
- **[Большие ассеты в образе]** → медленный push. Митигация: `.dockerignore`, кэш слоёв npm в Dockerfile.
- **[Jenkins webhook недоступен с GitHub]** → нет автодеплоя. Митигация: ручной Build Now или polling SCM.

## Migration Plan

1. DNS A-запись `platformer.balashov-maxim.ru`
2. Docker Hub репозиторий `3224142123/platformer`
3. `Jenkinsfile.bootstrap` — namespace, secret, манифесты
4. Первый push образа (вручную или через Jenkins)
5. Jenkins Multibranch Pipeline + GitHub webhook
6. Rollback: `kubectl rollout undo deployment/platformer-frontend -n platformer`

## Open Questions

- Нет — домен, Docker Hub user и k3s уже известны из CV.
