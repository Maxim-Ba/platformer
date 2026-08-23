## 1. Container image

- [x] 1.1 Add multi-stage `Dockerfile` (Node 20 build → nginx serve)
- [x] 1.2 Add `nginx.conf` with gzip, asset caching, and SPA fallback
- [x] 1.3 Add `.dockerignore` excluding `node_modules`, `dist`, `.git`

## 2. Kubernetes manifests

- [x] 2.1 Add `k8s/namespace.yaml` for namespace `platformer`
- [x] 2.2 Add `k8s/deployments/platformer-frontend-deploy.yaml`
- [x] 2.3 Add `k8s/services/platformer-frontend-svc.yaml`
- [x] 2.4 Add `k8s/ingress/ingress.yaml` for `platformer.balashov-maxim.ru`

## 3. Jenkins pipelines

- [x] 3.1 Add `Jenkinsfile` (Test → Build → Push → Deploy → Verify)
- [x] 3.2 Add `Jenkinsfile.bootstrap` for first-time namespace and manifest apply

## 4. Documentation

- [x] 4.1 Add `docs/DEPLOYMENT.md` with DNS, Docker Hub, k3s, Jenkins, and verification commands

## 5. Verification

- [x] 5.1 Run `npm run lint && npm run test && npm run build` locally
- [x] 5.2 Validate `docker build` succeeds from repository root
