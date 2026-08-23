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

---

## 1. Архитектура

```
Разработчик
    │ git push
    ▼
GitHub (platformer)
    │ webhook
    ▼
Jenkins (на сервере) ──► Docker Hub
    │   lint + test + build      (3224142123/platformer)
    │ kubectl set image               │
    ▼                                 │
k3s Cluster (тот же, что у CV)       │
┌─────────────────────────────────────┴────────────┐
│  Namespace: platformer                           │
│                                                  │
│  Traefik Ingress                                 │
│    platformer.balashov-maxim.ru ──► nginx:80     │
│                                                  │
│  Pod: platformer-frontend (nginx + static dist)  │
└──────────────────────────────────────────────────┘
```

| Компонент | Технология | Порт | Репозиторий образа |
|---|---|---|---|
| `platformer-frontend` | nginx + Vite static | 80 | `3224142123/platformer` |

Ресурсы: ~64–128 MB RAM, минимальный CPU.

---

## 2. Предварительные требования

### Уже должно быть настроено (из CV)

- k3s на сервере с Traefik и Let's Encrypt (`certresolver: le`)
- Jenkins в Docker с доступом к `/var/run/docker.sock` и kubeconfig
- Credentials в Jenkins: `dockerhub-credentials`, `kubeconfig`
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
6. **Build Now**

Pipeline создаст namespace, `dockerhub-secret`, Service, Deployment и Ingress.

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

Ожидаемый результат:

```
NAME                                   READY   STATUS    RESTARTS   AGE
platformer-frontend-<hash>             1/1     Running   0          1m
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
| Test | `npm ci`, `lint`, `test`, `build` в `node:20-alpine` |
| Build | `docker build` → `3224142123/platformer:$GIT_COMMIT` |
| Push | push в Docker Hub (`latest` + commit tag) |
| Deploy | `kubectl set image` + `rollout status` |
| Verify | `curl -sf https://platformer.balashov-maxim.ru/` |

### 6.4 Jenkins jobs в репозитории

| Файл | Назначение | Когда запускать |
|---|---|---|
| `Jenkinsfile` | Сборка, push, деплой | push в main (webhook) |
| `Jenkinsfile.bootstrap` | Первичный подъём k8s | один раз вручную |

---

## 7. Проверка работы

```bash
# Статус подов
kubectl get pods -n platformer

# Логи nginx
kubectl logs -n platformer deployment/platformer-frontend

# Ingress
kubectl get ingress -n platformer

# HTTP
curl -sf https://platformer.balashov-maxim.ru/ -o /dev/null && echo OK

# Ассеты (пример карты)
curl -sf https://platformer.balashov-maxim.ru/assets/maps/level-01.json | head
```

В браузере откройте https://platformer.balashov-maxim.ru — должна загрузиться игра.

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
│   └── ingress/
│       └── ingress.yaml
└── docs/
    └── DEPLOYMENT.md          ← этот файл
```

---

## Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| `ImagePullBackOff` | Нет secret или неверный токен Docker Hub | Пересоздать `dockerhub-secret`, проверить репозиторий |
| 502 / нет ответа | Pod не Ready | `kubectl describe pod`, `kubectl logs` |
| Сертификат не выдаётся | DNS не указывает на сервер или порт 80 закрыт | `dig`, проверить firewall |
| Игра без ассетов | `public/assets` не попали в образ | Проверить `docker build` и содержимое `/usr/share/nginx/html/assets` |
| Jenkins Test падает | lint/test/build | Запустить локально `npm run lint && npm run test && npm run build` |
