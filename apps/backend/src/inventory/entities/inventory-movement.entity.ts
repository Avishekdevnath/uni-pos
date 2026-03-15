import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { BranchEntity } from '../../database/entities/branch.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { InventoryBatchEntity } from './inventory-batch.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'inventory_movements' })
@Index('inventory_movements_tenant_branch_product_created_index', [
  'tenantId',
  'branchId',
  'productId',
  'createdAt',
])
export class InventoryMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column({ name: 'movement_type', type: 'varchar', length: 32 })
  movementType!: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity!: number;

  @Column({
    name: 'unit_cost',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  unitCost!: number | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @ManyToOne(() => OrderEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity | null;

  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId!: string | null;

  @ManyToOne(() => InventoryBatchEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch!: InventoryBatchEntity | null;

  @Column({ name: 'client_event_id', type: 'uuid', nullable: true })
  clientEventId!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
