import { describe, expect, it } from 'vitest';

import { MAX_INVENTORY_SLOTS } from '@domain/constants/inventory';
import { InMemoryInventoryAdapter } from '@infrastructure/adapters/InMemoryInventoryAdapter';

import { AddItem } from './AddItem';
import { RemoveItem } from './RemoveItem';
import { UseItem } from './UseItem';

describe('inventory use cases', () => {
  it('adds items through the inventory port', () => {
    const inventoryPort = new InMemoryInventoryAdapter();
    const addItem = new AddItem(inventoryPort);

    const success = addItem.execute({ id: 'coin-1', type: 'coin', quantity: 2 });

    expect(success).toBe(true);
    expect(inventoryPort.getInventory().slots[0]).toEqual({
      id: 'coin-1',
      type: 'coin',
      quantity: 2,
    });
  });

  it('removes items by id', () => {
    const inventoryPort = new InMemoryInventoryAdapter();
    const addItem = new AddItem(inventoryPort);
    const removeItem = new RemoveItem(inventoryPort);

    addItem.execute({ id: 'coin-1', type: 'coin', quantity: 1 });
    const success = removeItem.execute('coin-1');

    expect(success).toBe(true);
    expect(inventoryPort.getInventory().slots[0]).toBeNull();
  });

  it('uses an item and decrements quantity', () => {
    const inventoryPort = new InMemoryInventoryAdapter();
    const addItem = new AddItem(inventoryPort);
    const useItem = new UseItem(inventoryPort);

    addItem.execute({ id: 'potion-1', type: 'potion', quantity: 2 });
    const success = useItem.execute('potion-1');

    expect(success).toBe(true);
    expect(inventoryPort.getInventory().slots[0]?.quantity).toBe(1);
  });

  it('fails to add when all slots are occupied', () => {
    const inventoryPort = new InMemoryInventoryAdapter();
    const addItem = new AddItem(inventoryPort);

    for (let i = 0; i < MAX_INVENTORY_SLOTS; i += 1) {
      addItem.execute({ id: `item-${i}`, type: `type-${i}`, quantity: 1 });
    }

    const success = addItem.execute({ id: 'overflow', type: 'overflow', quantity: 1 });

    expect(success).toBe(false);
  });
});
