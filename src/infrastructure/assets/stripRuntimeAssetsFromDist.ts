import fs from 'node:fs';
import path from 'node:path';

/**
 * Directory names copied from `public/assets/` into Vite `dist/` that must not ship in the nginx image.
 * Hashed bundles stay under `dist/assets/index-*.js` (not in this list).
 */
export const RUNTIME_ASSET_DIST_DIRECTORIES = [
  'maps',
  'images',
  'sprite',
  'tilesets',
  'audio',
] as const;

/**
 * Canonical runtime map URL after Ingress `/media` → MinIO.
 * The frontend image is not required to serve this path.
 */
export const CANONICAL_RUNTIME_MAP_URL = '/media/assets/maps/level-01.json';

/**
 * Working-tree directories that keep a `.gitkeep` while runtime blobs are gitignored.
 */
export const ASSET_GITKEEP_DIRECTORIES = [
  'public/assets/maps',
  'public/assets/images',
  'public/assets/sprite',
  'public/assets/tilesets',
  'public/assets/audio',
] as const;

/**
 * Resolves copied runtime directories under a Vite `dist/` folder.
 * @param distDir - Absolute or repo-relative path to `dist/` after `vite build`.
 * @returns Paths of `maps`, `images`, `sprite`, `tilesets`, and `audio` to delete.
 */
function resolveRuntimeAssetDistPaths(distDir: string): string[] {
  return RUNTIME_ASSET_DIST_DIRECTORIES.flatMap((name) => [
    path.join(distDir, name),
    path.join(distDir, 'assets', name),
  ]);
}

/**
 * Deletes copied runtime asset directories while leaving hashed Vite JS/CSS.
 * @param absoluteDirPaths - Directories returned by {@link resolveRuntimeAssetDistPaths}.
 * @returns Nothing; directories are removed from disk when implemented.
 */
function deleteRuntimeAssetDirectories(absoluteDirPaths: readonly string[]): void {
  for (const dirPath of absoluteDirPaths) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * After `vite build`, removes copied runtime dirs from `dist/` (`maps`, `images`, `sprite`,
 * `tilesets`, `audio`) while keeping hashed Vite JS/CSS (`dist/assets/index-*.js`).
 * @param distDir - Path to the Vite `dist/` output directory.
 * @returns Nothing; the nginx image must not embed those runtime blobs.
 */
export function stripRuntimeAssetsFromDist(distDir: string): void {
  deleteRuntimeAssetDirectories(resolveRuntimeAssetDistPaths(distDir));
}
