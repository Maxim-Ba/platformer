import { describe, expect, it } from 'vitest';

import type { DoorDefinition, RoomDefinition } from '@domain/entities/RoomDefinition';
import {
  validateBidirectionalPair,
  validateDoorTarget,
  validateLayersAndTilesets,
  validateUniqueDoorIds,
  validateWorldGraph,
} from '@domain/services/MapValidationRules';
import type { MapStructureSnapshot } from '@domain/services/MapValidationRules';

function door(
  id: string,
  targetRoom: string,
  targetDoor: string,
): DoorDefinition {
  return {
    kind: 'door',
    id,
    bounds: { x: 0, y: 0, width: 32, height: 64 },
    targetRoom,
    targetDoor,
    facing: 'right',
    fadeMs: 150,
  };
}

function room(id: string, doors: DoorDefinition[] = []): RoomDefinition {
  return {
    id,
    bounds: { width: 768, height: 384, tileWidth: 32, tileHeight: 32 },
    playerSpawn: { kind: 'player_spawn', position: { x: 48, y: 128 } as never },
    exits: [],
    hazards: [],
    checkpoints: [],
    enemySpawns: [],
    doors,
    boundaryExits: [],
  };
}

const validMapJson: MapStructureSnapshot = {
  layers: [
    { name: 'ground', type: 'tilelayer' },
    { name: 'decor', type: 'tilelayer' },
    { name: 'objects', type: 'objectgroup' },
  ],
  tilesets: [{ name: 'platformer' }, { name: 'beast_soldier' }],
};

describe('MapValidationRules', () => {
  it('reports duplicate doorId in a room', () => {
    const issues = validateUniqueDoorIds(
      room('room-a', [door('to-b', 'room-b', 'from-a'), door('to-b', 'room-b', 'from-a')]),
    );

    expect(issues).toEqual([
      {
        level: 'error',
        roomId: 'room-a',
        message: 'duplicate doorId "to-b" in room-a',
      },
    ]);
  });

  it('reports missing target room file', () => {
    const maps = new Map([['room-a', room('room-a', [door('to-b', 'room-missing', 'from-a')])]]);

    const issues = validateDoorTarget(maps, door('to-b', 'room-missing', 'from-a'), 'room-a');

    expect(issues[0]?.message).toContain('missing target room "room-missing"');
    expect(issues[0]?.level).toBe('error');
  });

  it('reports missing target door on target room', () => {
    const maps = new Map([
      ['room-a', room('room-a', [door('to-b', 'room-b', 'missing-door')])],
      ['room-b', room('room-b')],
    ]);

    const issues = validateDoorTarget(maps, door('to-b', 'room-b', 'missing-door'), 'room-a');

    expect(issues[0]?.message).toContain('target door not found');
    expect(issues[0]?.level).toBe('error');
  });

  it('warns on one-way door pair', () => {
    const maps = new Map([
      ['room-a', room('room-a', [door('to-b', 'room-b', 'from-a')])],
      ['room-b', room('room-b')],
    ]);

    const issues = validateBidirectionalPair(maps);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.level).toBe('warning');
    expect(issues[0]?.message).toContain('has no reverse pair');
  });

  it('reports missing decor layer', () => {
    const mapWithoutDecor: MapStructureSnapshot = {
      ...validMapJson,
      layers: validMapJson.layers.filter((layer) => layer.name !== 'decor'),
    };

    const issues = validateLayersAndTilesets('room-a', mapWithoutDecor);

    expect(issues.some((issue) => issue.message.includes('decor'))).toBe(true);
    expect(issues.every((issue) => issue.level === 'error')).toBe(true);
  });

  it('reports graph room without map file', () => {
    const issues = validateWorldGraph(['room-a', 'room-x'], 'room-a', new Set(['room-a']));

    expect(issues.some((issue) => issue.roomId === 'room-x' && issue.level === 'error')).toBe(
      true,
    );
  });
});
