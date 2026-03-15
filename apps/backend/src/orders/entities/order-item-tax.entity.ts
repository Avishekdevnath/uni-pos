import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItemEntity } from './order-item.entity';
import { TaxConfigEntity } from '../../tax/entities/tax-config.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'order_item_taxes' })
export class OrderItemTaxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId!: string;

  @ManyToOne(() => OrderItemEntity, (item) => item.taxes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem!: OrderItemEntity;

  @Column({ name: 'tax_config_id', type: 'uuid' })
  taxConfigId!: string;

  @ManyToOne(() => TaxConfigEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tax_config_id' })
  taxConfig!: TaxConfigEntity;

  @Column({ name: 'tax_name_snapshot', type: 'varchar', length: 100 })
  taxNameSnapshot!: string;

  @Column({
    name: 'tax_rate_snapshot',
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
  })
  taxRateSnapshot!: number;

  @Column({ name: 'is_inclusive', type: 'boolean' })
  isInclusive!: boolean;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  taxAmount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
