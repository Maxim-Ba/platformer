import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * Writes `public/assets/maps/room-*.json` from `tiled/room-*.tmx`.
 * Tileset metadata is copied from an already-exported map (git still tracks
 * `room-a.json` / `level-01.json` until task 7.4 `git rm --cached` is done).
 *
 * Jenkins Pull Assets runs this before `assets:push` so gitignored rooms
 * (currently `room-d.json`) land in MinIO and survive `assets:pull`.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tiledDir = path.join(root, 'tiled');
const mapsDir = path.join(root, 'public', 'assets', 'maps');
const exporter = path.join(root, 'scripts', 'export-tmx-to-json.mjs');

function tilesetsSource() {
  const candidates = [
    path.join(mapsDir, 'room-a.json'),
    path.join(mapsDir, 'level-01.json'),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
    if (Array.isArray(parsed.tilesets) && parsed.tilesets.length > 0) {
      return candidate;
    }
  }
  throw new Error(
    'Need a Tiled JSON with tilesets (public/assets/maps/room-a.json or level-01.json)',
  );
}

const tmxFiles = fs
  .readdirSync(tiledDir)
  .filter((name) => /^room-.+\.tmx$/.test(name))
  .sort();

if (tmxFiles.length === 0) {
  throw new Error(`No tiled/room-*.tmx files in ${tiledDir}`);
}

const tilesetsFrom = tilesetsSource();
fs.mkdirSync(mapsDir, { recursive: true });

for (const tmxName of tmxFiles) {
  const roomId = tmxName.replace(/\.tmx$/, '');
  const tmxPath = path.join(tiledDir, tmxName);
  const outPath = path.join(mapsDir, `${roomId}.json`);
  const result = spawnSync(
    process.execPath,
    [exporter, tmxPath, outPath, '--tilesets-from', tilesetsFrom],
    { cwd: root, stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
