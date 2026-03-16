import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { BranchEntity } from '../../database/entities/branch.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('branch_product_prices')
@Unique('branch_product_prices_branch_product_unique', ['branchId', 'productId'])
export class BranchProductPriceEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @ManyToOne(() => TenantEntity) @JoinColumn({ name: 'tenant_id' }) tenant!: TenantEntity;
  @Column({ name: 'branch_id', type: 'uuid' }) branchId!: string;
  @ManyToOne(() => BranchEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branch_id' }) branch!: BranchEntity;
  @Column({ name: 'product_id', type: 'uuid' }) productId!: string;
  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'product_id' }) product!: ProductEntity;
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer }) price!: number;
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: decimalTransformer }) cost!: number | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
