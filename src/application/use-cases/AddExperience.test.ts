import { describe, expect, it } from 'vitest';

import { InMemoryProgressionAdapter } from '@infrastructure/adapters/InMemoryProgressionAdapter';

import { AddExperience } from './AddExperience';

describe('AddExperience', () => {
  it('awards experience through the progression port', () => {
    const progressionPort = new InMemoryProgressionAdapter();
    const useCase = new AddExperience(progressionPort);

    const result = useCase.execute(40);

    expect(result.leveledUp).toBe(false);
    expect(result.progression.experience).toBe(40);
  });

  it('reports level-up and unlocks from domain rules', () => {
    const progressionPort = new InMemoryProgressionAdapter();
    const useCase = new AddExperience(progressionPort);

    const result = useCase.execute(100);

    expect(result.leveledUp).toBe(true);
    expect(result.newUnlocks).toEqual(['dash']);
    expect(progressionPort.isUnlocked('dash')).toBe(true);
  });
});
