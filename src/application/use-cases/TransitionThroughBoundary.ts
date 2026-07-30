import type { RoomDefinition } from '@domain/entities/RoomDefinition';
import type { RoomTransitionPlan } from '@domain/entities/RoomTransitionPlan';
import { RoomTransitionError, RoomTransitionRules } from '@domain/services/RoomTransitionRules';

import type { ILevelRepository } from '../ports/ILevelRepository';

export interface TransitionThroughBoundaryInput {
  readonly currentRoom: RoomDefinition;
  readonly exitId: string;
}

export class TransitionThroughBoundary {
  private readonly rules = new RoomTransitionRules();

  constructor(private readonly levelRepository: ILevelRepository) {}

  async execute(input: TransitionThroughBoundaryInput): Promise<RoomTransitionPlan> {
    const sourceExit = input.currentRoom.boundaryExits.find((exit) => exit.id === input.exitId);

    if (!sourceExit) {
      throw new RoomTransitionError(
        `Boundary exit "${input.exitId}" was not found in room "${input.currentRoom.id}".`,
      );
    }

    this.rules.validateBoundaryExit(sourceExit);

    const targetRoom = await this.levelRepository.load(sourceExit.targetRoom);
    const entry = this.rules.resolveBoundaryEntryPosition(targetRoom, sourceExit.targetExitId);

    return {
      targetRoomId: sourceExit.targetRoom,
      entryPosition: entry.position,
      facing: entry.facing,
      fadeMs: sourceExit.fadeMs,
    };
  }
}
