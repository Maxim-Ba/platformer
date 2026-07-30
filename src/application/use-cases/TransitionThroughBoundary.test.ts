import { describe, expect, it } from 'vitest';

import type { BoundaryExitDefinition, RoomDefinition } from '@domain/entities/RoomDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import { RoomTransitionError } from '@domain/services/RoomTransitionRules';
import type { ILevelRepository } from '@application/ports/ILevelRepository';

import { TransitionThroughBoundary } from './TransitionThroughBoundary';

function createRoom(
  id: string,
  boundaryExits: BoundaryExitDefinition[],
): RoomDefinition {
  return {
    id,
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
    boundaryExits,
  };
}

function createBoundaryExit(
  overrides: Partial<BoundaryExitDefinition> = {},
): BoundaryExitDefinition {
  return {
    kind: 'boundary_exit',
    id: 'to-b',
    bounds: { x: 736, y: 256, width: 32, height: 64 },
    edge: 'right',
    targetRoom: 'room-b',
    targetExitId: 'from-a',
    facing: 'left',
    fadeMs: 150,
    ...overrides,
  };
}

class InMemoryLevelRepository implements ILevelRepository {
  constructor(private readonly rooms: Record<string, RoomDefinition>) {}

  async load(levelId: string): Promise<RoomDefinition> {
    const room = this.rooms[levelId];

    if (!room) {
      throw new Error(`Room "${levelId}" not found.`);
    }

    return room;
  }
}

describe('TransitionThroughBoundary', () => {
  it('returns transition plan for room-a to-b boundary pair', async () => {
    const roomA = createRoom('room-a', [createBoundaryExit()]);
    const roomB = createRoom('room-b', [
      createBoundaryExit({
        id: 'from-a',
        bounds: { x: 0, y: 256, width: 32, height: 64 },
        edge: 'left',
        targetRoom: 'room-a',
        targetExitId: 'to-b',
        facing: 'right',
      }),
    ]);

    const useCase = new TransitionThroughBoundary(
      new InMemoryLevelRepository({ 'room-a': roomA, 'room-b': roomB }),
    );

    const plan = await useCase.execute({ currentRoom: roomA, exitId: 'to-b' });

    expect(plan).toEqual({
      targetRoomId: 'room-b',
      entryPosition: new Vector2(56, 320),
      facing: 'right',
      fadeMs: 150,
    });
  });

  it('throws when boundary exit id is invalid in current room', async () => {
    const roomA = createRoom('room-a', [createBoundaryExit()]);
    const useCase = new TransitionThroughBoundary(
      new InMemoryLevelRepository({ 'room-a': roomA }),
    );

    await expect(useCase.execute({ currentRoom: roomA, exitId: 'missing' })).rejects.toThrow(
      RoomTransitionError,
    );
  });
});
