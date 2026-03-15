import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { DiscountPresetEntity } from '../../discounts/entities/discount-preset.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'order_discounts' })
export class OrderDiscountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => OrderEntity, (order) => order.discounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'discount_preset_id', type: 'uuid' })
  discountPresetId!: string;

  @ManyToOne(() => DiscountPresetEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'discount_preset_id' })
  preset!: DiscountPresetEntity;

  @Column({
    name: 'computed_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  computedAmount!: number;

  @Column({ name: 'preset_name_snapshot', type: 'varchar', length: 100 })
  presetNameSnapshot!: string;

  @Column({ name: 'type_snapshot', type: 'varchar', length: 16 })
  typeSnapshot!: string;

  @Column({
    name: 'value_snapshot',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  valueSnapshot!: number;

  @Column({ name: 'scope_snapshot', type: 'varchar', length: 16 })
  scopeSnapshot!: string;

  @Column({ name: 'order_item_id_snapshot', type: 'uuid', nullable: true })
  orderItemIdSnapshot!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
