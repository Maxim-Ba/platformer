import { describe, expect, it } from 'vitest';

import { MapValidator } from '@infrastructure/tiled/MapValidator';
import type { TiledMapJson, TiledObject } from '@infrastructure/tiled/TiledTypes';

function baseMapJson(objects: readonly TiledObject[] = []): TiledMapJson {
  return {
    width: 4,
    height: 4,
    tilewidth: 32,
    tileheight: 32,
    layers: [
      {
        name: 'ground',
        type: 'tilelayer',
        width: 4,
        height: 4,
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
      },
      {
        name: 'decor',
        type: 'tilelayer',
        width: 4,
        height: 4,
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        name: 'objects',
        type: 'objectgroup',
        objects,
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: 'platformer',
        tilewidth: 32,
        tileheight: 32,
      },
      {
        firstgid: 100,
        name: 'beast_soldier',
        tilewidth: 32,
        tileheight: 32,
      },
    ],
  };
}

const spawnObject = {
  id: 1,
  name: 'Player Spawn',
  type: 'player_spawn',
  x: 32,
  y: 96,
  width: 32,
  height: 32,
};

const validatorOptions = {
  mapsDirectory: 'public/assets/maps',
  graphRoomIds: ['room-a', 'room-b'],
  entryRoomId: 'room-a',
};

describe('MapValidator', () => {
  it('passes a valid fixture set', () => {
    const validator = new MapValidator(validatorOptions);

    const roomAMap = baseMapJson([
      spawnObject,
      {
        id: 2,
        name: 'Door to B',
        type: 'door',
        x: 64,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'to-b' },
          { name: 'targetRoom', type: 'string', value: 'room-b' },
          { name: 'targetDoor', type: 'string', value: 'from-a' },
          { name: 'facing', type: 'string', value: 'right' },
        ],
      },
    ]);

    const roomBMap = baseMapJson([
      spawnObject,
      {
        id: 3,
        name: 'Door from A',
        type: 'door',
        x: 0,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'from-a' },
          { name: 'targetRoom', type: 'string', value: 'room-a' },
          { name: 'targetDoor', type: 'string', value: 'to-b' },
          { name: 'facing', type: 'string', value: 'left' },
        ],
      },
    ]);

    const files = [
      validator.parseMapFile('room-a.json', 'room-a', roomAMap),
      validator.parseMapFile('room-b.json', 'room-b', roomBMap),
    ];

    const result = validator.validateFiles(files);

    expect(result.errorCount).toBe(0);
    expect(result.files.every((file) => file.passed)).toBe(true);
  });

  it('returns errors for broken fixture', () => {
    const validator = new MapValidator(validatorOptions);

    const brokenMap = baseMapJson([
      spawnObject,
      {
        id: 4,
        name: 'Broken door',
        type: 'door',
        x: 64,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'to-b' },
          { name: 'targetRoom', type: 'string', value: 'room-missing' },
          { name: 'targetDoor', type: 'string', value: 'from-a' },
          { name: 'facing', type: 'string', value: 'right' },
        ],
      },
      {
        id: 5,
        name: 'Duplicate door',
        type: 'door',
        x: 96,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'to-b' },
          { name: 'targetRoom', type: 'string', value: 'room-b' },
          { name: 'targetDoor', type: 'string', value: 'from-a' },
          { name: 'facing', type: 'string', value: 'right' },
        ],
      },
    ]);

    const files = [validator.parseMapFile('room-a.json', 'room-a', brokenMap)];
    const result = validator.validateFiles(files);

    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.files[0]?.passed).toBe(false);
  });

  it('emits warning for intentionally one-way door without failing validation', () => {
    const validator = new MapValidator(validatorOptions);

    const roomA = baseMapJson([
      spawnObject,
      {
        id: 6,
        name: 'One-way door',
        type: 'door',
        x: 64,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'to-b' },
          { name: 'targetRoom', type: 'string', value: 'room-b' },
          { name: 'targetDoor', type: 'string', value: 'from-a' },
          { name: 'facing', type: 'string', value: 'right' },
        ],
      },
      {
        id: 8,
        name: 'Decoy return target',
        type: 'door',
        x: 96,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'decoy' },
          { name: 'targetRoom', type: 'string', value: 'room-b' },
          { name: 'targetDoor', type: 'string', value: 'from-a' },
          { name: 'facing', type: 'string', value: 'right' },
        ],
      },
    ]);

    const roomB = baseMapJson([
      spawnObject,
      {
        id: 7,
        name: 'Door from A (no return)',
        type: 'door',
        x: 0,
        y: 96,
        width: 32,
        height: 64,
        properties: [
          { name: 'doorId', type: 'string', value: 'from-a' },
          { name: 'targetRoom', type: 'string', value: 'room-a' },
          { name: 'targetDoor', type: 'string', value: 'decoy' },
          { name: 'facing', type: 'string', value: 'left' },
        ],
      },
    ]);

    const result = validator.validateFiles([
      validator.parseMapFile('room-a.json', 'room-a', roomA),
      validator.parseMapFile('room-b.json', 'room-b', roomB),
    ]);

    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.message.includes('has no reverse pair'))).toBe(
      true,
    );
  });
});

describe('validateMapsCli', () => {
  it('formats report with errors and warnings', async () => {
    const { formatValidationReport } = await import('@infrastructure/tiled/validateMapsCli');

    const report = formatValidationReport({
      files: [
        {
          fileName: 'room-a.json',
          roomId: 'room-a',
          passed: true,
          issues: [],
        },
        {
          fileName: 'room-b.json',
          roomId: 'room-b',
          passed: false,
          issues: [
            {
              level: 'error',
              roomId: 'room-b',
              message: 'duplicate doorId "to-b" in room-b',
            },
            {
              level: 'warning',
              roomId: 'room-b',
              message: 'door "room-b/from-a" → "room-a/to-b" has no reverse pair',
            },
          ],
        },
      ],
      issues: [
        {
          level: 'error',
          roomId: 'room-b',
          message: 'duplicate doorId "to-b" in room-b',
        },
        {
          level: 'warning',
          roomId: 'room-b',
          message: 'door "room-b/from-a" → "room-a/to-b" has no reverse pair',
        },
      ],
      errorCount: 1,
      warningCount: 1,
    });

    expect(report).toContain('✓ room-a.json');
    expect(report).toContain('✗ room-b.json');
    expect(report).toContain('ERROR: duplicate doorId');
    expect(report).toContain('WARNING:');
    expect(report).toContain('Validated 2 maps');
  });
});
