import { MAX_INVENTORY_SLOTS } from '../constants/inventory';
import type { InventoryItem } from '../entities/InventoryItem';

export class InventoryState {
  constructor(readonly slots: readonly (InventoryItem | null)[]) {}

  static empty(slotCount: number = MAX_INVENTORY_SLOTS): InventoryState {
    return new InventoryState(Array.from({ length: slotCount }, () => null));
  }

  withSlots(slots: readonly (InventoryItem | null)[]): InventoryState {
    return new InventoryState(slots);
  }
}
