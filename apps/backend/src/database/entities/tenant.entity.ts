import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tenants' })
@Unique('tenants_slug_unique', ['slug'])
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 128 })
  slug!: string;

  @Column({ name: 'industry_type', type: 'varchar', length: 128, nullable: true })
  industryType!: string | null;

  @Column({ name: 'signup_source', type: 'varchar', length: 32, default: 'self_service' })
  signupSource!: string;

  @Column({ name: 'onboarded_by', type: 'uuid', nullable: true })
  onboardedBy!: string | null;

  @Column({ name: 'default_currency', type: 'varchar', length: 16, default: 'BDT' })
  defaultCurrency!: string;

  @Column({ name: 'default_timezone', type: 'varchar', length: 64, default: 'Asia/Dhaka' })
  defaultTimezone!: string;

  @Column({ name: 'receipt_footer', type: 'text', default: 'Thank you!' })
  receiptFooter!: string;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
