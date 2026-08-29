# Stage 1: quality gate + Vite production bundle
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Task 4.5: `.env.production` (`VITE_ASSET_BASE_URL=/media/`) must be in the build context
# (see `.dockerignore` exception) so Vite inlines the MinIO media prefix.
COPY .env.production .env.production
RUN npm run lint && npm run test && npm run build && rm -rf dist/maps dist/images dist/sprite dist/tilesets dist/audio dist/assets/maps dist/assets/images dist/assets/sprite dist/assets/tilesets dist/assets/audio
# Task 5.1: after vite build, strip runtime dirs copied from public/assets/.
# Keep hashed Vite JS/CSS (dist/assets/index-*.js).

# Stage 2: serve static files with nginx
# Task 5.2: image serves `/` (index.html) and hashed `/assets/index-*.js`.
# Game maps are not required in this image; canonical URL is /media/assets/maps/level-01.json.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
