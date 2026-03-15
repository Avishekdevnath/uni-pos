import { DomainEvent } from './domain-event.interface';

export class PaymentRecordedEvent implements DomainEvent {
  tenantId!: string;
  branchId!: string;
  occurredAt!: Date;
  actorId!: string;
  paymentId!: string;
  orderId!: string;
  method!: string;
  amount!: number;

  constructor(partial: Partial<PaymentRecordedEvent>) { Object.assign(this, partial); }
}
