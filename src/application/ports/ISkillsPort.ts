import type { SkillTreeDefinition } from '@domain/types/SkillTree';

export interface ISkillsPort {
  getTrees(): readonly SkillTreeDefinition[];
  getUnlockedNodeIds(): readonly string[];
  getSelectedNodeIds(): readonly string[];
  getMaxSelectedSlots(): number;
  getAvailableSkillPoints(): number;
  isNodeLearnable(nodeId: string): boolean;
  learnNode(nodeId: string): boolean;
  selectNode(nodeId: string): boolean;
  deselectNode(nodeId: string): boolean;
  isNodeUnlocked(nodeId: string): boolean;
  reset(): void;
}
