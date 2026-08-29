/**
 * Composes the configured asset base URL with a relative path under `assets/`.
 *
 * Paths stay under the `assets/` prefix (keys from `@game/asset-keys`), for example
 * `assets/images/player-sheet.png`. Reads `import.meta.env.VITE_ASSET_BASE_URL`.
 *
 * @param relativePath - Origin-relative asset path under `assets/` (no `/media/` prefix in the path itself).
 * @param cacheBustVersion - Optional cache-bust token. When implemented, appended as `?v=`.
 * @returns The request URL: empty/unset base → `assets/...` (local Vite `public/`);
 *   production base `/media/` → `/media/assets/...` (e.g. `/media/assets/images/player-sheet.png`).
 */
export function assetUrl(relativePath: string, cacheBustVersion?: string): string {
  const baseUrl = readViteAssetBaseUrl();
  const composedUrl = `${baseUrl}${relativePath}`;
  return appendCacheBustQuery(composedUrl, cacheBustVersion);
}

/** Reads `VITE_ASSET_BASE_URL` (`''` / unset in dev, `/media/` in production). @returns The configured base string. */
function readViteAssetBaseUrl(): string {
  const envName = 'VITE_ASSET_BASE_URL';
  // Dynamic key access: Vite inlines `import.meta.env.VITE_*` at transform time, which
  // would ignore `vi.stubEnv` / `Reflect.deleteProperty(import.meta.env, ...)`.
  const viteEnv = import.meta.env as unknown as Record<string, string | undefined>;
  const fromVite = viteEnv[envName];
  if (typeof fromVite === 'string') {
    return fromVite;
  }

  const nodeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;
  const fromProcess = nodeProcess?.env?.[envName];
  if (typeof fromProcess === 'string') {
    return fromProcess;
  }

  return '';
}

/**
 * Appends an optional cache-bust query.
 * @param url - URL produced from base + relative path.
 * @param cacheBustVersion - Optional token for `?v=`.
 * @returns The same URL, with `?v=` when a version is provided.
 */
function appendCacheBustQuery(url: string, cacheBustVersion?: string): string {
  if (cacheBustVersion === undefined) {
    return url;
  }
  return `${url}?v=${cacheBustVersion}`;
}
