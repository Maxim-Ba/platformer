import type { InventoryItem } from '@domain/entities/InventoryItem';

import type { IInventoryPort } from '../ports/IInventoryPort';

export class AddItem {
  constructor(private readonly inventoryPort: IInventoryPort) {}

  execute(item: InventoryItem): boolean {
    return this.inventoryPort.addItem(item);
  }
}
