import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { OrderEntity } from '../../orders/entities/order.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';

@Entity('receipt_tokens')
export class ReceiptTokenEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'order_id', type: 'uuid', unique: true }) orderId!: string;
  @ManyToOne(() => OrderEntity) @JoinColumn({ name: 'order_id' }) order!: OrderEntity;
  @Index() @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @ManyToOne(() => TenantEntity) @JoinColumn({ name: 'tenant_id' }) tenant!: TenantEntity;
  @Column({ type: 'varchar', length: 16, unique: true }) token!: string;
  @Column({ name: 'expires_at', type: 'timestamp' }) expiresAt!: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
