import type { Product } from "./product";

export interface InventoryBalance {
  id: string;
  tenantId: string;
  branchId: string;
  productId: string;
  onHandQty: number;
  updatedAt: string;
  product?: Product;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  branchId: string;
  productId: string;
  movementType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface StockInItem {
  product_id: string;
  quantity: number;
  unit_cost?: number;
  client_event_id?: string;
}

export interface CreateStockInInput {
  branch_id: string;
  description?: string;
  items: StockInItem[];
}

export interface AdjustmentItem {
  product_id: string;
  quantity: number;
  note?: string;
  client_event_id?: string;
}

export interface CreateAdjustmentInput {
  branch_id: string;
  description?: string;
  items: AdjustmentItem[];
}
