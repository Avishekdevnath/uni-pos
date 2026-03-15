import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { TaxGroupEntity } from '../../tax/entities/tax-group.entity';

@Entity({ name: 'products' })
@Unique('products_tenant_sku_unique', ['tenantId', 'sku'])
@Unique('products_tenant_barcode_unique', ['tenantId', 'barcode'])
@Index('products_tenant_id_index', ['tenantId'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: CategoryEntity | null;

  @Column({ name: 'tax_group_id', type: 'uuid', nullable: true })
  taxGroupId!: string | null;

  @ManyToOne(() => TaxGroupEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tax_group_id' })
  taxGroup!: TaxGroupEntity | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  barcode!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'pcs' })
  unit!: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  cost!: number;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
