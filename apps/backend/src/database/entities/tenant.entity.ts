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
import { OrganizationEntity } from './organization.entity';

@Entity({ name: 'tenants' })
@Unique('tenants_slug_unique', ['slug'])
@Index('tenants_organization_id_index', ['organizationId'])
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization!: OrganizationEntity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 128 })
  slug!: string;

  @Column({ name: 'default_currency', type: 'varchar', length: 16, default: 'BDT' })
  defaultCurrency!: string;

  @Column({ name: 'default_timezone', type: 'varchar', length: 64, default: 'Asia/Dhaka' })
  defaultTimezone!: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
