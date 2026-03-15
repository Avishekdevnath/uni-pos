import { DomainEvent } from './domain-event.interface';

export class OrderCompletedEvent implements DomainEvent {
  tenantId!: string;
  branchId!: string;
  occurredAt!: Date;
  actorId!: string;
  orderId!: string;
  orderNumber!: string;
  totalAmount!: number;
  paidAmount!: number;
  itemCount!: number;

  constructor(partial: Partial<OrderCompletedEvent>) { Object.assign(this, partial); }
}

export class OrderCancelledEvent implements DomainEvent {
  tenantId!: string;
  branchId!: string;
  occurredAt!: Date;
  actorId!: string;
  orderId!: string;
  orderNumber!: string | null;
  cancellationReason!: string | null;

  constructor(partial: Partial<OrderCancelledEvent>) { Object.assign(this, partial); }
}
