import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tenant_settings' })
@Index('tenant_settings_tenant_id_unique', ['tenantId'], { unique: true })
export class TenantSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  // ─── Store Info ──────────────────────────────────────────────────────────────
  @Column({ name: 'store_name', type: 'varchar', length: 255, nullable: true })
  storeName!: string | null;

  @Column({ name: 'store_email', type: 'varchar', length: 255, nullable: true })
  storeEmail!: string | null;

  @Column({ name: 'store_phone', type: 'varchar', length: 64, nullable: true })
  storePhone!: string | null;

  @Column({ name: 'store_address', type: 'text', nullable: true })
  storeAddress!: string | null;

  @Column({ name: 'timezone', type: 'varchar', length: 64, default: 'Asia/Dhaka' })
  timezone!: string;

  // ─── Currency ─────────────────────────────────────────────────────────────
  @Column({ name: 'default_currency', type: 'varchar', length: 8, default: 'BDT' })
  defaultCurrency!: string;

  @Column({ name: 'currency_symbol_position', type: 'varchar', length: 8, default: 'before' })
  currencySymbolPosition!: 'before' | 'after';

  @Column({ name: 'currency_decimal_places', type: 'int', default: 2 })
  currencyDecimalPlaces!: number;

  @Column({ name: 'thousands_separator', type: 'varchar', length: 4, default: ',' })
  thousandsSeparator!: string;

  @Column({ name: 'decimal_separator', type: 'varchar', length: 4, default: '.' })
  decimalSeparator!: string;

  // Comma-separated list of enabled currency codes e.g. "BDT,USD,EUR"
  @Column({ name: 'supported_currencies', type: 'text', default: 'BDT' })
  supportedCurrencies!: string;

  // ─── Receipt ──────────────────────────────────────────────────────────────
  @Column({ name: 'receipt_header', type: 'text', nullable: true })
  receiptHeader!: string | null;

  @Column({ name: 'receipt_footer', type: 'text', default: 'Thank you for your purchase!' })
  receiptFooter!: string;

  @Column({ name: 'receipt_show_logo', type: 'boolean', default: false })
  receiptShowLogo!: boolean;

  @Column({ name: 'order_number_prefix', type: 'varchar', length: 16, default: 'ORD' })
  orderNumberPrefix!: string;

  // ─── Payment Methods ──────────────────────────────────────────────────────
  // JSON array stored as text e.g. '["cash","card","mobile_banking"]'
  @Column({ name: 'payment_methods', type: 'text', default: '["cash"]' })
  paymentMethods!: string;

  // ─── Inventory ────────────────────────────────────────────────────────────
  @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
  lowStockThreshold!: number;

  @Column({ name: 'track_inventory', type: 'boolean', default: true })
  trackInventory!: boolean;

  // ─── Timestamps ───────────────────────────────────────────────────────────
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
