# MinIO runtime assets

Источник правды для png/svg/json/audio — бакет `platformer-assets`, префикс `assets/` (= дерево `public/assets/`). Файлы **не в git** (только `.gitkeep`). `tiled/` коммитится.

Публичное чтение игры: `https://platformer.balashov-maxim.ru/media/assets/...`. Консоль MinIO `:9001` без Ingress.

## Заливка с ноутбука

Не нужен `kubectl port-forward` и не нужен клиент `mc` на ПК.

1. Браузер: https://minio-adminer.balashov-maxim.ru/ (Traefik BasicAuth / HTTP login).
2. Бакет `platformer-assets`, префикс `assets/` с тем же относительным путём, что `public/assets/` (ключ `platformer-assets/assets/<relative-path>`).
3. CLI: `npm run assets:push` — тот же хост, POST `/Default/api/buckets/platformer-assets/objects` с BasicAuth.

HTTP login (Jenkins id `s3manager-http`) ≠ MinIO root, пока оператор сам не задаст тот же пароль.

```bash
# .env.local (не коммитить)
# S3MANAGER_URL=https://minio-adminer.balashov-maxim.ru
# S3MANAGER_USER=...
# S3MANAGER_PASSWORD=...
npm run assets:push
git config core.hooksPath scripts/git-hooks
git push
```

Если user/pass нет в env и stdin — TTY, CLI спросит логин и пароль. Git GUI без TTY: заполните `.env.local` или `git push --no-verify`.

## Скачивание (clone / Jenkins)

`npm run assets:pull` зеркалит бакет → `public/assets/` через `mc` и S3 API (`MINIO_ENDPOINT` / ключи). Jenkins credentials id `minio-assets` (`MINIO_USER` / `MINIO_PASS`).

```bash
git clone <repo>
npm install
npm run assets:pull
npm run dev
```

## Проверка

Unauthenticated `https://minio-adminer.balashov-maxim.ru/` → 401; authenticated → 200 s3manager UI (not frontend `index.html`); upload under `assets/` → S3 object `platformer-assets/assets/<relative-path>`.
