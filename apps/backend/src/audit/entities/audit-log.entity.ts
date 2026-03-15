import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index('audit_logs_tenant_event_time_index', ['tenantId', 'eventType', 'occurredAt'])
@Index('audit_logs_entity_index', ['entityType', 'entityId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId!: string | null;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ name: 'occurred_at', type: 'timestamp with time zone' })
  occurredAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
