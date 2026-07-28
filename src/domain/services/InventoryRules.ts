import { MAX_STACK_SIZE } from '../constants/inventory';
import type { InventoryItem } from '../entities/InventoryItem';
import { InventoryState } from '../value-objects/InventoryState';

export interface InventoryOperationResult {
  success: boolean;
  state: InventoryState;
}

export class InventoryRules {
  addItem(state: InventoryState, item: InventoryItem): InventoryOperationResult {
    if (item.quantity <= 0) {
      return { success: false, state };
    }

    const slots = [...state.slots];
    let remaining = item.quantity;

    const stackIndex = slots.findIndex(
      (slot) =>
        slot !== null &&
        slot.type === item.type &&
        slot.quantity < MAX_STACK_SIZE,
    );

    if (stackIndex >= 0) {
      const existing = slots[stackIndex] as InventoryItem;
      const space = MAX_STACK_SIZE - existing.quantity;
      const added = Math.min(space, remaining);
      slots[stackIndex] = {
        ...existing,
        quantity: existing.quantity + added,
      };
      remaining -= added;
    }

    if (remaining > 0) {
      const emptyIndex = slots.findIndex((slot) => slot === null);
      if (emptyIndex < 0) {
        return { success: false, state };
      }

      slots[emptyIndex] = {
        ...item,
        quantity: remaining,
      };
    }

    return { success: true, state: state.withSlots(slots) };
  }

  removeItem(state: InventoryState, itemId: string): InventoryOperationResult {
    const index = state.slots.findIndex((slot) => slot?.id === itemId);
    if (index < 0) {
      return { success: false, state };
    }

    const slots = [...state.slots];
    slots[index] = null;

    return { success: true, state: state.withSlots(slots) };
  }

  useItem(state: InventoryState, itemId: string): InventoryOperationResult {
    const index = state.slots.findIndex((slot) => slot?.id === itemId);
    if (index < 0) {
      return { success: false, state };
    }

    const item = state.slots[index] as InventoryItem;
    const slots = [...state.slots];

    if (item.quantity <= 1) {
      slots[index] = null;
    } else {
      slots[index] = {
        ...item,
        quantity: item.quantity - 1,
      };
    }

    return { success: true, state: state.withSlots(slots) };
  }
}
