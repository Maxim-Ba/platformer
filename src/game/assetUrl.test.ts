import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ENEMY_ARCHETYPES } from '@domain/constants/enemies';

import { TiledLevelRepository } from '@infrastructure/tiled/TiledLevelRepository';
import type { TiledMapJson } from '@infrastructure/tiled/TiledTypes';

import {
  BEAST_SOLDIER_TILESET_PATH,
  FOUNDATION_ASSETS,
  GAME_COMBAT_ASSETS,
  LEVEL_TILESET_PATH,
  AssetKeys,
} from './asset-keys';
import { assetUrl } from './assetUrl';
import { DEFAULT_LEVEL_ID } from './constants';

const PLAYER_SHEET_PATH = 'assets/images/player-sheet.png';
const CACHE_BUST_VERSION = 'c0ffee';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readSrc(relativeFromSrc: string): string {
  return fs.readFileSync(path.join(srcRoot, relativeFromSrc), 'utf8');
}

function mapAssetPath(levelId: string): string {
  return `assets/maps/${levelId}.json`;
}

function minimalFetchableMap(): TiledMapJson {
  return {
    width: 2,
    height: 2,
    tilewidth: 32,
    tileheight: 32,
    layers: [
      {
        name: 'objects',
        type: 'objectgroup',
        objects: [
          {
            id: 1,
            name: 'Player Spawn',
            type: 'player_spawn',
            x: 0,
            y: 32,
            width: 32,
            height: 32,
          },
        ],
      },
    ],
    tilesets: [],
  };
}

function stubJsonFetch(body: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('assetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('readViteAssetBaseUrl via VITE_ASSET_BASE_URL', () => {
    it('returns the relative path when VITE_ASSET_BASE_URL is empty', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');

      expect(assetUrl(PLAYER_SHEET_PATH)).toBe(PLAYER_SHEET_PATH);
      expect(assetUrl(PLAYER_SHEET_PATH)).not.toContain('/media/');
    });

    it('returns the relative path when VITE_ASSET_BASE_URL is unset', () => {
      vi.unstubAllEnvs();
      Reflect.deleteProperty(import.meta.env, 'VITE_ASSET_BASE_URL');

      expect(assetUrl(PLAYER_SHEET_PATH)).toBe(PLAYER_SHEET_PATH);
      expect(assetUrl(PLAYER_SHEET_PATH)).not.toContain('/media/');
    });

    it('prefixes /media/ when VITE_ASSET_BASE_URL is /media/', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '/media/');

      expect(assetUrl(PLAYER_SHEET_PATH)).toBe(`/media/${PLAYER_SHEET_PATH}`);
    });
  });

  describe('appendCacheBustQuery via optional ?v=', () => {
    it('appends ?v= when a cache-bust token is provided and the base URL is empty', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');

      expect(assetUrl(PLAYER_SHEET_PATH, CACHE_BUST_VERSION)).toBe(
        `${PLAYER_SHEET_PATH}?v=${CACHE_BUST_VERSION}`,
      );
    });

    it('appends ?v= after the /media/ prefix when a cache-bust token is provided', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '/media/');

      expect(assetUrl(PLAYER_SHEET_PATH, CACHE_BUST_VERSION)).toBe(
        `/media/${PLAYER_SHEET_PATH}?v=${CACHE_BUST_VERSION}`,
      );
    });

    it('does not append ?v= when the cache-bust argument is omitted', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');

      expect(assetUrl(PLAYER_SHEET_PATH)).toBe(PLAYER_SHEET_PATH);
      expect(assetUrl(PLAYER_SHEET_PATH)).not.toContain('?v=');
    });
  });

  describe('PreloadScene FOUNDATION_ASSETS composition', () => {
    it('composes each foundation path without /media/ when the base URL is empty', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');

      expect(FOUNDATION_ASSETS.length).toBeGreaterThan(0);
      for (const asset of FOUNDATION_ASSETS) {
        expect(assetUrl(asset.path)).toBe(asset.path);
        expect(assetUrl(asset.path)).not.toMatch(/^\/media\//);
      }
    });

    it('prefixes each foundation path with /media/ in production', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '/media/');

      for (const asset of FOUNDATION_ASSETS) {
        expect(assetUrl(asset.path)).toBe(`/media/${asset.path}`);
      }
    });
  });

  describe('GameScene combat asset composition', () => {
    it('composes combat paths without /media/ when the base URL is empty', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');

      expect(GAME_COMBAT_ASSETS.length).toBeGreaterThan(0);
      for (const asset of GAME_COMBAT_ASSETS) {
        expect(assetUrl(asset.path)).toBe(asset.path);
        expect(assetUrl(asset.path)).not.toMatch(/^\/media\//);
      }
    });

    it('prefixes combat paths with /media/ in production', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '/media/');

      for (const asset of GAME_COMBAT_ASSETS) {
        expect(assetUrl(asset.path)).toBe(`/media/${asset.path}`);
      }
    });
  });

  describe('enemy sprite keys', () => {
    it('matches archetype spriteKey values to loaded combat texture keys', () => {
      expect(ENEMY_ARCHETYPES.grunt.spriteKey).toBe(AssetKeys.EnemyGrunt);
      expect(ENEMY_ARCHETYPES.flyer.spriteKey).toBe(AssetKeys.EnemyFlyer);
      expect(ENEMY_ARCHETYPES.caster.spriteKey).toBe(AssetKeys.EnemyCaster);
    });
  });

  describe('GameScene tileset and map composition', () => {
    it('composes map JSON and tileset paths without /media/ when the base URL is empty', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');

      expect(assetUrl(mapAssetPath(DEFAULT_LEVEL_ID))).toBe(mapAssetPath(DEFAULT_LEVEL_ID));
      expect(assetUrl(mapAssetPath('room-a'))).toBe('assets/maps/room-a.json');
      expect(assetUrl(LEVEL_TILESET_PATH)).toBe(LEVEL_TILESET_PATH);
      expect(assetUrl(BEAST_SOLDIER_TILESET_PATH)).toBe(BEAST_SOLDIER_TILESET_PATH);
    });

    it('prefixes map JSON and tileset paths with /media/ in production', () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '/media/');

      expect(assetUrl(mapAssetPath(DEFAULT_LEVEL_ID))).toBe(
        `/media/${mapAssetPath(DEFAULT_LEVEL_ID)}`,
      );
      expect(assetUrl(mapAssetPath('room-a'))).toBe('/media/assets/maps/room-a.json');
      expect(assetUrl(LEVEL_TILESET_PATH)).toBe(`/media/${LEVEL_TILESET_PATH}`);
      expect(assetUrl(BEAST_SOLDIER_TILESET_PATH)).toBe(`/media/${BEAST_SOLDIER_TILESET_PATH}`);
    });
  });

  describe('TiledLevelRepository.load fetch URL', () => {
    it('fetches {assetBaseUrl}assets/maps/{levelId}.json when the base URL is empty', async () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '');
      const fetchMock = stubJsonFetch(minimalFetchableMap());
      const repository = new TiledLevelRepository();

      await repository.load(DEFAULT_LEVEL_ID);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(mapAssetPath(DEFAULT_LEVEL_ID));
    });

    it('fetches /media/assets/maps/{levelId}.json when VITE_ASSET_BASE_URL is /media/', async () => {
      vi.stubEnv('VITE_ASSET_BASE_URL', '/media/');
      const fetchMock = stubJsonFetch(minimalFetchableMap());
      const repository = new TiledLevelRepository();

      await repository.load(DEFAULT_LEVEL_ID);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(`/media/${mapAssetPath(DEFAULT_LEVEL_ID)}`);
    });
  });

  describe('loader call-site wiring', () => {
    it('PreloadScene foundation loads go through assetUrl(asset.path)', () => {
      const source = readSrc('presentation/scenes/PreloadScene.ts');

      expect(source).toContain("import { assetUrl } from '@game/assetUrl'");
      expect(source).toContain('for (const asset of FOUNDATION_ASSETS)');
      expect(source).toContain('assetUrl(asset.path)');
      expect(source).not.toMatch(
        /this\.load\.(svg|image|spritesheet)\(\s*asset\.key,\s*asset\.path/,
      );
    });

    it('GameScene preload and ensureRoomMapLoaded load maps and tilesets through assetUrl', () => {
      const source = readSrc('presentation/scenes/GameScene.ts');

      expect(source).toContain("import { assetUrl } from '@game/assetUrl'");
      expect(source).toContain('assetUrl(`assets/maps/${this.currentRoomId}.json`)');
      expect(source).toContain('assetUrl(`assets/maps/${roomId}.json`)');
      expect(source).toContain('assetUrl(LEVEL_TILESET_PATH)');
      expect(source).toContain('assetUrl(BEAST_SOLDIER_TILESET_PATH)');
      expect(source).toContain('for (const asset of GAME_COMBAT_ASSETS)');
      expect(source).toContain('assetUrl(asset.path)');
    });

    it('TiledLevelRepository.load fetches through assetUrl', () => {
      const source = readSrc('infrastructure/tiled/TiledLevelRepository.ts');

      expect(source).toContain("import { assetUrl } from '@game/assetUrl'");
      expect(source).toContain('fetch(assetUrl(`${this.basePath}/${levelId}.json`))');
    });
  });
});
