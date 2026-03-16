import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantEntity } from '../../database/entities/tenant.entity';

@Entity('roles')
@Unique('roles_tenant_slug_unique', ['tenantId', 'slug'])
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @ManyToOne(() => TenantEntity) @JoinColumn({ name: 'tenant_id' }) tenant!: TenantEntity;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ type: 'varchar', length: 50 }) slug!: string;
  @Column({ name: 'is_system', type: 'boolean', default: true }) isSystem!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
