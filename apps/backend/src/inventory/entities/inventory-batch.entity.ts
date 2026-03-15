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
import { UserEntity } from '../../users/entities/user.entity/user.entity';

@Entity({ name: 'inventory_batches' })
@Index('inventory_batches_tenant_branch_index', ['tenantId', 'branchId'])
export class InventoryBatchEntity {
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

  @Column({ type: 'varchar', length: 32 })
  type!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  status!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
