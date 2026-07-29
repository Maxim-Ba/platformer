import type { IInventoryPort } from '@application/ports/IInventoryPort';
import type { InventoryItem } from '@domain/entities/InventoryItem';
import { InventoryRules } from '@domain/services/InventoryRules';
import { InventoryState } from '@domain/value-objects/InventoryState';

export class InMemoryInventoryAdapter implements IInventoryPort {
  private state = InventoryState.empty();
  private readonly rules = new InventoryRules();

  getInventory(): InventoryState {
    return this.state;
  }

  addItem(item: InventoryItem): boolean {
    const result = this.rules.addItem(this.state, item);
    if (!result.success) {
      return false;
    }

    this.state = result.state;
    return true;
  }

  removeItem(itemId: string): boolean {
    const result = this.rules.removeItem(this.state, itemId);
    if (!result.success) {
      return false;
    }

    this.state = result.state;
    return true;
  }

  useItem(itemId: string): boolean {
    const result = this.rules.useItem(this.state, itemId);
    if (!result.success) {
      return false;
    }

    this.state = result.state;
    return true;
  }

  restoreInventory(state: InventoryState): void {
    this.state = state;
  }
}
