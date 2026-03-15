import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { OrderItemTaxEntity } from './order-item-tax.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity!: number;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice!: number;

  @Column({
    name: 'line_subtotal',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineSubtotal!: number;

  @Column({
    name: 'line_discount_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineDiscountAmount!: number;

  @Column({
    name: 'order_discount_share',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  orderDiscountShare!: number;

  @Column({
    name: 'discounted_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  discountedAmount!: number;

  @Column({
    name: 'base_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  baseAmount!: number;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  taxAmount!: number;

  @Column({
    name: 'line_total',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineTotal!: number;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 255, nullable: true })
  productNameSnapshot!: string | null;

  @Column({ name: 'sku_snapshot', type: 'varchar', length: 100, nullable: true })
  skuSnapshot!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // updatedAt included to support PATCH /items endpoint
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => OrderItemTaxEntity, (tax) => tax.orderItem)
  taxes!: OrderItemTaxEntity[];
}
