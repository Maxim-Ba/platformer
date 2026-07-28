export interface InventoryItem {
  id: string;
  type: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}
