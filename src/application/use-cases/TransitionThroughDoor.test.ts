import { describe, expect, it } from 'vitest';

import type { DoorDefinition, RoomDefinition } from '@domain/entities/RoomDefinition';
import { Vector2 } from '@domain/value-objects/Vector2';
import { RoomTransitionError } from '@domain/services/RoomTransitionRules';
import type { ILevelRepository } from '@application/ports/ILevelRepository';

import { TransitionThroughDoor } from './TransitionThroughDoor';

function createRoom(id: string, doors: DoorDefinition[]): RoomDefinition {
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
    doors,
    boundaryExits: [],
  };
}

function createDoor(overrides: Partial<DoorDefinition> = {}): DoorDefinition {
  return {
    kind: 'door',
    id: 'to-b',
    bounds: { x: 704, y: 288, width: 32, height: 64 },
    targetRoom: 'room-b',
    targetDoor: 'from-a',
    facing: 'right',
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

describe('TransitionThroughDoor', () => {
  it('returns transition plan for room-a to-b door pair', async () => {
    const roomA = createRoom('room-a', [createDoor()]);
    const roomB = createRoom('room-b', [
      createDoor({
        id: 'from-a',
        bounds: { x: 0, y: 288, width: 32, height: 64 },
        targetRoom: 'room-a',
        targetDoor: 'to-b',
        facing: 'left',
      }),
    ]);

    const useCase = new TransitionThroughDoor(
      new InMemoryLevelRepository({ 'room-a': roomA, 'room-b': roomB }),
    );

    const plan = await useCase.execute({ currentRoom: roomA, doorId: 'to-b' });

    expect(plan).toEqual({
      targetRoomId: 'room-b',
      entryPosition: new Vector2(8, 352),
      facing: 'left',
      fadeMs: 150,
    });
  });

  it('throws when door id is invalid in current room', async () => {
    const roomA = createRoom('room-a', [createDoor()]);
    const useCase = new TransitionThroughDoor(new InMemoryLevelRepository({ 'room-a': roomA }));

    await expect(useCase.execute({ currentRoom: roomA, doorId: 'missing' })).rejects.toThrow(
      RoomTransitionError,
    );
  });
});
