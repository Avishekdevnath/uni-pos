import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { BranchEntity } from '../../database/entities/branch.entity';
import { TaxGroupEntity } from './tax-group.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'tax_configs' })
@Index('tax_configs_tenant_branch_index', ['tenantId', 'branchId'])
@Index('tax_configs_tenant_branch_group_index', ['tenantId', 'branchId', 'taxGroupId'])
export class TaxConfigEntity {
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

  @Column({ name: 'tax_group_id', type: 'uuid' })
  taxGroupId!: string;

  @ManyToOne(() => TaxGroupEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tax_group_id' })
  taxGroup!: TaxGroupEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: decimalTransformer })
  rate!: number;

  @Column({ type: 'boolean', name: 'is_inclusive', default: false })
  isInclusive!: boolean;

  @Column({ type: 'integer', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
