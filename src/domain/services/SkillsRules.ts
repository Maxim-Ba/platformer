import { findSkillNode } from '@domain/constants/skill-trees';
import type { SkillNodeDef } from '@domain/types/SkillTree';

export class SkillsRules {
  isNodeLearnable(node: SkillNodeDef, unlockedIds: ReadonlySet<string>): boolean {
    if (unlockedIds.has(node.id)) {
      return false;
    }

    if (!node.parentId) {
      return false;
    }

    return unlockedIds.has(node.parentId);
  }

  canLearnNode(
    nodeId: string,
    unlockedIds: ReadonlySet<string>,
    availablePoints: number,
    pointCost: number,
  ): boolean {
    if (availablePoints < pointCost) {
      return false;
    }

    const node = findSkillNode(nodeId);
    if (!node) {
      return false;
    }

    return this.isNodeLearnable(node, unlockedIds);
  }
}
