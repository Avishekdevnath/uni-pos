import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';

@Entity('branch_groups')
@Unique('branch_groups_tenant_name_unique', ['tenantId', 'name'])
export class BranchGroupEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @ManyToOne(() => TenantEntity) @JoinColumn({ name: 'tenant_id' }) tenant!: TenantEntity;
  @Column({ type: 'varchar', length: 255 }) name!: string;
  @Index() @Column({ name: 'parent_id', type: 'uuid', nullable: true }) parentId!: string | null;
  @ManyToOne(() => BranchGroupEntity, { nullable: true }) @JoinColumn({ name: 'parent_id' }) parent!: BranchGroupEntity | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
