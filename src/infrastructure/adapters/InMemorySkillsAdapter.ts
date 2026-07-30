import type { ISkillsPort } from '@application/ports/ISkillsPort';
import {
  MOCK_DEFAULT_SELECTED_NODE_IDS,
  MOCK_DEFAULT_SKILL_POINTS,
  MOCK_DEFAULT_UNLOCKED_NODE_IDS,
  SKILL_TREES,
  findSkillNode,
} from '@domain/constants/skill-trees';
import { SkillsRules } from '@domain/services/SkillsRules';
import { MAX_SELECTED_SKILLS, SKILL_POINT_COST } from '@domain/types/SkillTree';

export class InMemorySkillsAdapter implements ISkillsPort {
  private unlockedIds = new Set<string>();
  private selectedIds: string[] = [];
  private availableSkillPoints = 0;
  private readonly rules = new SkillsRules();

  constructor() {
    this.reset();
  }

  getTrees() {
    return SKILL_TREES;
  }

  getUnlockedNodeIds(): readonly string[] {
    return [...this.unlockedIds];
  }

  getSelectedNodeIds(): readonly string[] {
    return [...this.selectedIds];
  }

  getMaxSelectedSlots(): number {
    return MAX_SELECTED_SKILLS;
  }

  getAvailableSkillPoints(): number {
    return this.availableSkillPoints;
  }

  isNodeLearnable(nodeId: string): boolean {
    const node = findSkillNode(nodeId);
    if (!node) {
      return false;
    }

    return this.rules.isNodeLearnable(node, this.unlockedIds);
  }

  learnNode(nodeId: string): boolean {
    if (!this.rules.canLearnNode(nodeId, this.unlockedIds, this.availableSkillPoints, SKILL_POINT_COST)) {
      return false;
    }

    this.unlockedIds.add(nodeId);
    this.availableSkillPoints -= SKILL_POINT_COST;
    return true;
  }

  selectNode(nodeId: string): boolean {
    if (!this.isNodeUnlocked(nodeId)) {
      return false;
    }

    if (this.selectedIds.includes(nodeId)) {
      return true;
    }

    if (this.selectedIds.length >= MAX_SELECTED_SKILLS) {
      return false;
    }

    this.selectedIds.push(nodeId);
    return true;
  }

  deselectNode(nodeId: string): boolean {
    const index = this.selectedIds.indexOf(nodeId);
    if (index === -1) {
      return false;
    }

    this.selectedIds.splice(index, 1);
    return true;
  }

  isNodeUnlocked(nodeId: string): boolean {
    return this.unlockedIds.has(nodeId);
  }

  reset(): void {
    this.unlockedIds = new Set(MOCK_DEFAULT_UNLOCKED_NODE_IDS);
    this.availableSkillPoints = MOCK_DEFAULT_SKILL_POINTS;
    this.selectedIds = MOCK_DEFAULT_SELECTED_NODE_IDS.filter((nodeId) => this.unlockedIds.has(nodeId));
  }
}
