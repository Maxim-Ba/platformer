import { describe, expect, it } from 'vitest';

import { MOCK_DEFAULT_UNLOCKED_NODE_IDS } from '@domain/constants/skill-trees';
import { SkillsRules } from '@domain/services/SkillsRules';

describe('SkillsRules', () => {
  const rules = new SkillsRules();

  it('marks child as learnable when parent is unlocked', () => {
    const unlockedIds = new Set(MOCK_DEFAULT_UNLOCKED_NODE_IDS);

    expect(rules.isNodeLearnable(
      {
        id: 'physical-l2-0',
        label: 'Сила',
        description: 'Усиливает урон от физических ударов.',
        level: 2,
        parentId: 'physical-l1-0',
        childIds: [],
      },
      unlockedIds,
    )).toBe(true);
  });

  it('rejects learning without skill points', () => {
    const unlockedIds = new Set(MOCK_DEFAULT_UNLOCKED_NODE_IDS);

    expect(rules.canLearnNode('physical-l2-0', unlockedIds, 0, 1)).toBe(false);
    expect(rules.canLearnNode('physical-l2-0', unlockedIds, 1, 1)).toBe(true);
  });
});
