export interface AuditLog {
  id: string;
  eventType: string;
  entityId: string;
  entityType: string;
  actorId: string | null;
  tenantId: string;
  branchId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}
