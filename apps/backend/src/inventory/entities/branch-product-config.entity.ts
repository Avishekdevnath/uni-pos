import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { BranchEntity } from '../../database/entities/branch.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'branch_product_configs' })
@Unique('branch_product_configs_tenant_branch_product_unique', [
  'tenantId',
  'branchId',
  'productId',
])
export class BranchProductConfigEntity {
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

  @Column({
    name: 'low_stock_threshold',
    type: 'numeric',
    precision: 12,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  lowStockThreshold!: number | null;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
