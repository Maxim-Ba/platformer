import type { RoomDefinition } from '@domain/entities/RoomDefinition';
import type { RoomTransitionPlan } from '@domain/entities/RoomTransitionPlan';
import { RoomTransitionError, RoomTransitionRules } from '@domain/services/RoomTransitionRules';

import type { ILevelRepository } from '../ports/ILevelRepository';

export interface TransitionThroughDoorInput {
  readonly currentRoom: RoomDefinition;
  readonly doorId: string;
}

export class TransitionThroughDoor {
  private readonly rules = new RoomTransitionRules();

  constructor(private readonly levelRepository: ILevelRepository) {}

  async execute(input: TransitionThroughDoorInput): Promise<RoomTransitionPlan> {
    const sourceDoor = input.currentRoom.doors.find((door) => door.id === input.doorId);

    if (!sourceDoor) {
      throw new RoomTransitionError(
        `Door "${input.doorId}" was not found in room "${input.currentRoom.id}".`,
      );
    }

    this.rules.validateDoor(sourceDoor);

    const targetRoom = await this.levelRepository.load(sourceDoor.targetRoom);
    const entry = this.rules.resolveEntryPosition(targetRoom, sourceDoor.targetDoor);

    return {
      targetRoomId: sourceDoor.targetRoom,
      entryPosition: entry.position,
      facing: entry.facing,
      fadeMs: sourceDoor.fadeMs,
    };
  }
}
