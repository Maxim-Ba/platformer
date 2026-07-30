export type SkillCategory = 'physical' | 'energy' | 'magical';

export interface SkillNodeDef {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly level: 1 | 2 | 3 | 4;
  readonly parentId: string | null;
  readonly childIds: readonly string[];
}

export interface SkillTreeDefinition {
  readonly category: SkillCategory;
  readonly label: string;
  readonly nodes: readonly SkillNodeDef[];
}

export const MAX_SELECTED_SKILLS = 4;
export const SKILL_POINT_COST = 1;
