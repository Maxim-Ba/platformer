import {
  MOCK_DEFAULT_SELECTED_NODE_IDS,
  MOCK_DEFAULT_SKILL_POINTS,
  MOCK_DEFAULT_UNLOCKED_NODE_IDS,
} from '../constants/skill-trees';

export class SkillsState {
  constructor(
    readonly unlockedNodeIds: readonly string[],
    readonly selectedNodeIds: readonly string[],
    readonly availableSkillPoints: number,
  ) {}

  static initial(): SkillsState {
    const unlockedNodeIds = MOCK_DEFAULT_UNLOCKED_NODE_IDS;
    const selectedNodeIds = MOCK_DEFAULT_SELECTED_NODE_IDS.filter((nodeId) =>
      unlockedNodeIds.includes(nodeId),
    );

    return new SkillsState(unlockedNodeIds, selectedNodeIds, MOCK_DEFAULT_SKILL_POINTS);
  }
}
