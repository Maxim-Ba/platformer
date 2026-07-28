import type { IInventoryPort } from '../ports/IInventoryPort';

export class UseItem {
  constructor(private readonly inventoryPort: IInventoryPort) {}

  execute(itemId: string): boolean {
    return this.inventoryPort.useItem(itemId);
  }
}
