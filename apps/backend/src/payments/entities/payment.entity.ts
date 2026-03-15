import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from '../../orders/entities/order.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { BranchEntity } from '../../database/entities/branch.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => OrderEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: BranchEntity;

  @Column({ name: 'method', type: 'varchar', length: 32, default: 'cash' })
  method!: string;

  @Column({
    name: 'amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({
    name: 'cash_tendered',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  cashTendered!: number | null;

  @Column({ name: 'status', type: 'varchar', length: 32, default: 'completed' })
  status!: string;

  @Column({ name: 'client_event_id', type: 'uuid', nullable: true })
  clientEventId!: string | null;

  @Column({ name: 'received_at', type: 'timestamp with time zone' })
  receivedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
