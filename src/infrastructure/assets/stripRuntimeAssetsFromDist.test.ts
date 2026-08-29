import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ASSET_GITKEEP_DIRECTORIES,
  CANONICAL_RUNTIME_MAP_URL,
  RUNTIME_ASSET_DIST_DIRECTORIES,
  stripRuntimeAssetsFromDist,
} from './index';

const HASHED_JS = 'index-a1b2c3d4.js';
const HASHED_CSS = 'index-a1b2c3d4.css';
const HASHED_JS_BODY = 'export default 1;\n';
const HASHED_CSS_BODY = 'body{margin:0}\n';
const RUNTIME_DIRS = ['maps', 'images', 'sprite', 'tilesets', 'audio'] as const;

function createViteDistLayout(): string {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'platformer-dist-'));
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>\n');

  const hashedDir = path.join(distDir, 'assets');
  fs.mkdirSync(hashedDir, { recursive: true });
  fs.writeFileSync(path.join(hashedDir, HASHED_JS), HASHED_JS_BODY);
  fs.writeFileSync(path.join(hashedDir, HASHED_CSS), HASHED_CSS_BODY);

  for (const name of RUNTIME_DIRS) {
    const topLevel = path.join(distDir, name);
    const underAssets = path.join(distDir, 'assets', name);
    fs.mkdirSync(topLevel, { recursive: true });
    fs.mkdirSync(underAssets, { recursive: true });
    fs.writeFileSync(path.join(topLevel, 'blob.bin'), `${name}-top`);
    fs.writeFileSync(path.join(underAssets, 'blob.bin'), `${name}-nested`);
  }

  return distDir;
}

describe('RUNTIME_ASSET_DIST_DIRECTORIES', () => {
  it('lists the runtime dirs copied from public/assets that must not ship in nginx', () => {
    expect([...RUNTIME_ASSET_DIST_DIRECTORIES]).toEqual([...RUNTIME_DIRS]);
  });
});

describe('CANONICAL_RUNTIME_MAP_URL', () => {
  it('is the Ingress /media map URL, not a path the frontend image must serve', () => {
    expect(CANONICAL_RUNTIME_MAP_URL).toBe('/media/assets/maps/level-01.json');
  });
});

describe('ASSET_GITKEEP_DIRECTORIES', () => {
  it('keeps .gitkeep placeholders for maps, images, sprite, tilesets, and audio', () => {
    expect([...ASSET_GITKEEP_DIRECTORIES]).toEqual([
      'public/assets/maps',
      'public/assets/images',
      'public/assets/sprite',
      'public/assets/tilesets',
      'public/assets/audio',
    ]);
  });
});

describe('stripRuntimeAssetsFromDist', () => {
  it('deletes copied runtime dirs while keeping hashed Vite JS/CSS (resolveRuntimeAssetDistPaths + deleteRuntimeAssetDirectories)', () => {
    const distDir = createViteDistLayout();

    stripRuntimeAssetsFromDist(distDir);

    for (const name of RUNTIME_DIRS) {
      expect(fs.existsSync(path.join(distDir, name)), `top-level ${name} must be removed`).toBe(
        false,
      );
      expect(
        fs.existsSync(path.join(distDir, 'assets', name)),
        `dist/assets/${name} copied from public/assets must be removed`,
      ).toBe(false);
    }

    expect(fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')).toContain('html');
    expect(fs.readFileSync(path.join(distDir, 'assets', HASHED_JS), 'utf8')).toBe(HASHED_JS_BODY);
    expect(fs.readFileSync(path.join(distDir, 'assets', HASHED_CSS), 'utf8')).toBe(HASHED_CSS_BODY);
  });
});
