import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StockTransferEntity } from './stock-transfer.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('stock_transfer_items')
export class StockTransferItemEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'transfer_id', type: 'uuid' }) transferId!: string;
  @ManyToOne(() => StockTransferEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'transfer_id' }) transfer!: StockTransferEntity;
  @Column({ name: 'product_id', type: 'uuid' }) productId!: string;
  @ManyToOne(() => ProductEntity) @JoinColumn({ name: 'product_id' }) product!: ProductEntity;
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer }) quantity!: number;
  @Column({ name: 'received_quantity', type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: decimalTransformer }) receivedQuantity!: number | null;
}
