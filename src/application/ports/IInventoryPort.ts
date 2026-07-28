import type { InventoryItem } from '@domain/entities/InventoryItem';
import type { InventoryState } from '@domain/value-objects/InventoryState';

export interface IInventoryPort {
  getInventory(): InventoryState;
  addItem(item: InventoryItem): boolean;
  removeItem(itemId: string): boolean;
  useItem(itemId: string): boolean;
}
