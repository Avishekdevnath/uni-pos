export interface DomainEvent {
  tenantId: string;
  branchId: string;
  occurredAt: Date;
  actorId: string;
}
