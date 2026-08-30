# MinIO runtime assets

Источник правды для png/svg/json/audio — бакет `platformer-assets`, префикс `assets/` (= дерево `public/assets/`). Файлы **не в git** (только `.gitkeep`). `tiled/` коммитится.

Публичное чтение игры: `https://platformer.balashov-maxim.ru/media/assets/...`. Консоль MinIO `:9001` без Ingress.

## Заливка с ноутбука

Не нужен `kubectl port-forward` и не нужен клиент MinIO (`mc`) на ПК.

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

`npm run assets:pull` качает префикс `assets/` → `public/assets/` через HTTPS s3manager (`https://minio-adminer.balashov-maxim.ru`, те же `S3MANAGER_USER` / `S3MANAGER_PASSWORD`, что и UI). Jenkins credentials id `s3manager-http`; агент без Node, поэтому CD запускает тот же `npm run assets:pull` внутри `node:20-alpine`.

```bash
git clone <repo>
npm install
npm run assets:pull
npm run dev
```

## Проверка

Unauthenticated `https://minio-adminer.balashov-maxim.ru/` → 401; authenticated → 200 s3manager UI (not frontend `index.html`); upload under `assets/` → S3 object `platformer-assets/assets/<relative-path>`.

Публичная карта игры: `curl -sfI https://platformer.balashov-maxim.ru/media/assets/maps/level-01.json` → 200. Тело `curl -sf` той же URL — Tiled JSON (`"tilesets"`, `"layers"`), не SPA HTML. HTTP 200 с `Content-Type: text/html` значит, что `/media` попал на frontend, а не в MinIO.

`npm run assets:push` отказывается заливать `maps/*.json` без массивов `tilesets` и `layers` (заглушка `{"width":2,"height":2}` ломает Phaser и Jenkins Verify). CI после `maps:export` + pull требует `public/assets/maps/room-a.json`, `room-b.json`, `room-c.json`, `room-d.json`.
