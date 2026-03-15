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
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'discount_presets' })
@Index('discount_presets_tenant_id_index', ['tenantId'])
export class DiscountPresetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 16 })
  type!: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  value!: number;

  @Column({ type: 'varchar', length: 16 })
  scope!: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'max_discount_amount',
    transformer: decimalTransformer,
  })
  maxDiscountAmount!: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'min_order_amount',
    transformer: decimalTransformer,
  })
  minOrderAmount!: number | null;

  @Column({ type: 'timestamp with time zone', name: 'valid_from', nullable: true })
  validFrom!: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'valid_until', nullable: true })
  validUntil!: Date | null;

  @Column({ type: 'boolean', name: 'is_combinable', default: true })
  isCombinable!: boolean;

  @Column({ type: 'varchar', length: 32, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
