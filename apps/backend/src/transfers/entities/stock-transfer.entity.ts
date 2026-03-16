import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { BranchEntity } from '../../database/entities/branch.entity';
import { UserEntity } from '../../users/entities/user.entity/user.entity';

@Entity('stock_transfers')
export class StockTransferEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @ManyToOne(() => TenantEntity) @JoinColumn({ name: 'tenant_id' }) tenant!: TenantEntity;
  @Column({ name: 'transfer_number', type: 'varchar', length: 50, unique: true }) transferNumber!: string;
  @Column({ name: 'from_branch_id', type: 'uuid' }) fromBranchId!: string;
  @ManyToOne(() => BranchEntity) @JoinColumn({ name: 'from_branch_id' }) fromBranch!: BranchEntity;
  @Column({ name: 'to_branch_id', type: 'uuid' }) toBranchId!: string;
  @ManyToOne(() => BranchEntity) @JoinColumn({ name: 'to_branch_id' }) toBranch!: BranchEntity;
  @Column({ type: 'varchar', length: 32, default: 'draft' }) status!: string;
  @Column({ name: 'initiated_by', type: 'uuid' }) initiatedBy!: string;
  @ManyToOne(() => UserEntity) @JoinColumn({ name: 'initiated_by' }) initiator!: UserEntity;
  @Column({ name: 'received_by', type: 'uuid', nullable: true }) receivedBy!: string | null;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true }) completedAt!: Date | null;
}
