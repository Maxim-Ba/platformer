import { describe, expect, it } from 'vitest';

import { MAX_INVENTORY_SLOTS, MAX_STACK_SIZE } from '../constants/inventory';
import type { InventoryItem } from '../entities/InventoryItem';
import { InventoryState } from '../value-objects/InventoryState';
import { InventoryRules } from './InventoryRules';

describe('InventoryRules', () => {
  const rules = new InventoryRules();

  const coin = (id: string, quantity: number): InventoryItem => ({
    id,
    type: 'coin',
    quantity,
  });

  const potion = (id: string, quantity: number, type?: string): InventoryItem => ({
    id,
    type: type ?? id,
    quantity,
  });

  it('adds item to the first free slot', () => {
    const state = InventoryState.empty();

    const result = rules.addItem(state, coin('coin-1', 5));

    expect(result.success).toBe(true);
    expect(result.state.slots[0]).toEqual(coin('coin-1', 5));
  });

  it('stacks items of the same type', () => {
    const state = InventoryState.empty();
    const withCoin = rules.addItem(state, coin('coin-1', 3)).state;

    const result = rules.addItem(withCoin, coin('coin-2', 4));

    expect(result.success).toBe(true);
    expect(result.state.slots[0]?.quantity).toBe(7);
    expect(result.state.slots[1]).toBeNull();
  });

  it('fails when inventory is full and no stack space remains', () => {
    let state = InventoryState.empty();

    for (let i = 0; i < MAX_INVENTORY_SLOTS; i += 1) {
      state = rules.addItem(state, potion(`potion-${i}`, MAX_STACK_SIZE)).state;
    }

    const result = rules.addItem(state, potion('overflow', 1));

    expect(result.success).toBe(false);
    expect(result.state).toEqual(state);
  });

  it('removes item by id and frees the slot', () => {
    const state = rules.addItem(InventoryState.empty(), coin('coin-1', 2)).state;

    const result = rules.removeItem(state, 'coin-1');

    expect(result.success).toBe(true);
    expect(result.state.slots[0]).toBeNull();
  });

  it('consumes one quantity when using a stackable item', () => {
    const state = rules.addItem(InventoryState.empty(), coin('coin-1', 3)).state;

    const result = rules.useItem(state, 'coin-1');

    expect(result.success).toBe(true);
    expect(result.state.slots[0]?.quantity).toBe(2);
  });

  it('removes item when use consumes the last quantity', () => {
    const state = rules.addItem(InventoryState.empty(), coin('coin-1', 1)).state;

    const result = rules.useItem(state, 'coin-1');

    expect(result.success).toBe(true);
    expect(result.state.slots[0]).toBeNull();
  });

  it('respects max stack size when stacking', () => {
    const state = rules.addItem(InventoryState.empty(), coin('coin-1', MAX_STACK_SIZE)).state;

    const result = rules.addItem(state, coin('coin-2', 1));

    expect(result.success).toBe(true);
    expect(result.state.slots[0]?.quantity).toBe(MAX_STACK_SIZE);
    expect(result.state.slots[1]?.quantity).toBe(1);
  });
});
