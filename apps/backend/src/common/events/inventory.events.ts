import { DomainEvent } from './domain-event.interface';

export class InventoryDeductedEvent implements DomainEvent {
  tenantId!: string;
  branchId!: string;
  occurredAt!: Date;
  actorId!: string;
  orderId!: string;
  movements!: Array<{ productId: string; quantity: number; remainingStock: number }>;

  constructor(partial: Partial<InventoryDeductedEvent>) { Object.assign(this, partial); }
}

export class LowStockEvent implements DomainEvent {
  tenantId!: string;
  branchId!: string;
  occurredAt!: Date;
  actorId!: string;
  productId!: string;
  productName!: string;
  currentStock!: number;
  threshold!: number;

  constructor(partial: Partial<LowStockEvent>) { Object.assign(this, partial); }
}

export class StockInEvent implements DomainEvent {
  tenantId!: string;
  branchId!: string;
  occurredAt!: Date;
  actorId!: string;
  batchId!: string;
  items!: Array<{ productId: string; quantity: number }>;

  constructor(partial: Partial<StockInEvent>) { Object.assign(this, partial); }
}
