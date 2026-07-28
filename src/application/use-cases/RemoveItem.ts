import type { IInventoryPort } from '../ports/IInventoryPort';

export class RemoveItem {
  constructor(private readonly inventoryPort: IInventoryPort) {}

  execute(itemId: string): boolean {
    return this.inventoryPort.removeItem(itemId);
  }
}
