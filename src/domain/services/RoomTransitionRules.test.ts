import { describe, expect, it } from 'vitest';

import type { DoorDefinition, RoomDefinition } from '@domain/entities/RoomDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';

import { RoomTransitionError, RoomTransitionRules } from './RoomTransitionRules';

function createRoom(overrides: Partial<RoomDefinition> = {}): RoomDefinition {
  return {
    id: 'room-b',
    bounds: {
      width: 768,
      height: 384,
      tileWidth: 32,
      tileHeight: 32,
    },
    playerSpawn: {
      kind: 'player_spawn',
      position: new Vector2(48, 352),
    },
    exits: [],
    hazards: [],
    checkpoints: [],
    enemySpawns: [],
    doors: [],
    boundaryExits: [],
    ...overrides,
  };
}

function createDoor(overrides: Partial<DoorDefinition> = {}): DoorDefinition {
  return {
    kind: 'door',
    id: 'from-a',
    bounds: { x: 0, y: 288, width: 32, height: 64 },
    targetRoom: 'room-a',
    targetDoor: 'to-b',
    facing: 'left',
    fadeMs: 150,
    ...overrides,
  };
}

describe('RoomTransitionRules', () => {
  const rules = new RoomTransitionRules();

  it('resolves entry position at target door with facing nudge', () => {
    const room = createRoom({
      doors: [createDoor()],
    });

    const result = rules.resolveEntryPosition(room, 'from-a');

    expect(result.position).toEqual(new Vector2(8, 352));
    expect(result.facing).toBe('left');
  });

  it('nudges right-facing doors toward the room interior', () => {
    const room = createRoom({
      doors: [
        createDoor({
          id: 'to-b',
          bounds: { x: 704, y: 288, width: 32, height: 64 },
          facing: 'right',
        }),
      ],
    });

    const result = rules.resolveEntryPosition(room, 'to-b');

    expect(result.position).toEqual(new Vector2(728, 352));
    expect(result.facing).toBe('right');
  });

  it('throws when target door is missing', () => {
    const room = createRoom({ doors: [createDoor()] });

    expect(() => rules.resolveEntryPosition(room, 'missing-door')).toThrow(RoomTransitionError);
    expect(() => rules.resolveEntryPosition(room, 'missing-door')).toThrow(
      'Target door "missing-door" was not found in room "room-b".',
    );
  });

  it('validates required door fields', () => {
    expect(() => rules.validateDoor(createDoor({ targetRoom: '' }))).toThrow(
      'missing targetRoom',
    );
    expect(() => rules.validateDoor(createDoor({ targetDoor: '' }))).toThrow(
      'missing targetDoor',
    );
  });

  it('resolves boundary entry position with interior nudge', () => {
    const room = createRoom({
      boundaryExits: [
        {
          kind: 'boundary_exit',
          id: 'from-a',
          bounds: { x: 0, y: 288, width: 32, height: 64 },
          edge: 'left',
          targetRoom: 'room-a',
          targetExitId: 'to-b',
          facing: 'right',
          fadeMs: 150,
        },
      ],
    });

    const result = rules.resolveBoundaryEntryPosition(room, 'from-a');

    expect(result.position).toEqual(new Vector2(56, 352));
    expect(result.facing).toBe('right');
  });

  it('throws when target boundary exit is missing', () => {
    const room = createRoom({ boundaryExits: [] });

    expect(() => rules.resolveBoundaryEntryPosition(room, 'missing-exit')).toThrow(
      RoomTransitionError,
    );
  });
});
