import { describe, expect, it } from 'vitest';

import { MAX_ENERGY, MAX_MANA } from '@domain/constants/resources';
import { EnergyState } from '@domain/value-objects/EnergyState';
import { ManaState } from '@domain/value-objects/ManaState';
import { InMemoryEnergyAdapter } from '@infrastructure/adapters/InMemoryEnergyAdapter';
import { InMemoryManaAdapter } from '@infrastructure/adapters/InMemoryManaAdapter';

describe('ManaState', () => {
  it('initializes with current equal to max', () => {
    const state = ManaState.initial();

    expect(state.current).toBe(MAX_MANA);
    expect(state.max).toBe(MAX_MANA);
  });
});

describe('EnergyState', () => {
  it('initializes with current equal to max', () => {
    const state = EnergyState.initial();

    expect(state.current).toBe(MAX_ENERGY);
    expect(state.max).toBe(MAX_ENERGY);
  });
});

describe('InMemoryManaAdapter', () => {
  it('returns initial mana state', () => {
    const adapter = new InMemoryManaAdapter();

    expect(adapter.getMana()).toEqual(ManaState.initial());
  });

  it('resets to initial values', () => {
    const adapter = new InMemoryManaAdapter();

    adapter.reset();

    expect(adapter.getMana().current).toBe(MAX_MANA);
    expect(adapter.getMana().max).toBe(MAX_MANA);
  });
});

describe('InMemoryEnergyAdapter', () => {
  it('returns initial energy state', () => {
    const adapter = new InMemoryEnergyAdapter();

    expect(adapter.getEnergy()).toEqual(EnergyState.initial());
  });

  it('resets to initial values', () => {
    const adapter = new InMemoryEnergyAdapter();

    adapter.reset();

    expect(adapter.getEnergy().current).toBe(MAX_ENERGY);
    expect(adapter.getEnergy().max).toBe(MAX_ENERGY);
  });
});
