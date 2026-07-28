import { describe, expect, it } from 'vitest';

import { Vector2 } from '@domain/value-objects/Vector2';
import { TiledLevelRepository } from '@infrastructure/tiled/TiledLevelRepository';
import type { TiledMapJson } from '@infrastructure/tiled/TiledTypes';

const sampleMap: TiledMapJson = {
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
      name: 'objects',
      type: 'objectgroup',
      objects: [
        {
          id: 1,
          name: 'Player Spawn',
          type: 'player_spawn',
          x: 32,
          y: 96,
          width: 32,
          height: 32,
        },
        {
          id: 2,
          name: 'Exit',
          type: 'level_exit',
          x: 96,
          y: 64,
          width: 32,
          height: 32,
        },
        {
          id: 3,
          name: 'Spikes',
          type: 'hazard',
          x: 64,
          y: 80,
          width: 32,
          height: 16,
        },
        {
          id: 4,
          name: 'Checkpoint',
          type: 'checkpoint',
          x: 48,
          y: 96,
          width: 32,
          height: 32,
        },
      ],
    },
  ],
  tilesets: [
    {
      firstgid: 1,
      name: 'platformer',
      tilewidth: 32,
      tileheight: 32,
      tiles: [{ id: 0, properties: [{ name: 'solid', type: 'bool', value: true }] }],
    },
  ],
};

describe('TiledLevelRepository', () => {
  it('parses spawn, hazards, checkpoints, and exits from Tiled JSON', () => {
    const repository = new TiledLevelRepository();
    const level = repository.parseMap('level-test', sampleMap);

    expect(level.id).toBe('level-test');
    expect(level.bounds).toEqual({
      width: 128,
      height: 128,
      tileWidth: 32,
      tileHeight: 32,
    });
    expect(level.playerSpawn.position).toEqual(new Vector2(48, 128));
    expect(level.exits).toHaveLength(1);
    expect(level.hazards).toHaveLength(1);
    expect(level.checkpoints).toHaveLength(1);
    expect(level.checkpoints[0]?.id).toBe('checkpoint-4');
  });

  it('throws when player_spawn is missing', () => {
    const repository = new TiledLevelRepository();
    const invalidMap: TiledMapJson = {
      ...sampleMap,
      layers: [
        {
          name: 'objects',
          type: 'objectgroup',
          objects: [],
        },
      ],
    };

    expect(() => repository.parseMap('broken', invalidMap)).toThrow(
      'must contain exactly one "player_spawn"',
    );
  });
});
