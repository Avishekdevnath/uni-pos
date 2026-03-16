import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { BranchEntity, TenantEntity } from './entities';
import { CategoryEntity } from '../categories/entities/category.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { TaxGroupEntity } from '../tax/entities/tax-group.entity';
import { TaxConfigEntity } from '../tax/entities/tax-config.entity';
import { DiscountPresetEntity } from '../discounts/entities/discount-preset.entity';
import { DiscountPresetBranchEntity } from '../discounts/entities/discount-preset-branch.entity';
import { InventoryBatchEntity } from '../inventory/entities/inventory-batch.entity';
import { InventoryMovementEntity } from '../inventory/entities/inventory-movement.entity';
import { InventoryBalanceEntity } from '../inventory/entities/inventory-balance.entity';
import { BranchProductConfigEntity } from '../inventory/entities/branch-product-config.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { OrderItemEntity } from '../orders/entities/order-item.entity';
import { OrderItemTaxEntity } from '../orders/entities/order-item-tax.entity';
import { OrderDiscountEntity } from '../orders/entities/order-discount.entity';
import { OrderNumberSequenceEntity } from '../orders/entities/order-number-sequence.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { AuditLogEntity } from '../audit/entities/audit-log.entity';
import { PermissionEntity } from '../rbac/entities/permission.entity';
import { RoleEntity } from '../rbac/entities/role.entity';
import { RolePermissionEntity } from '../rbac/entities/role-permission.entity';
import { PlatformAdminEntity } from '../platform/entities/platform-admin.entity';
import { ReceiptTokenEntity } from '../receipts/entities/receipt-token.entity';
import { UserBranchEntity } from '../users/entities/user-branch.entity';
import { BranchGroupEntity } from '../branch-groups/entities/branch-group.entity';
import { BranchGroupMemberEntity } from '../branch-groups/entities/branch-group-member.entity';
import { BranchProductPriceEntity } from '../pricing/entities/branch-product-price.entity';
import { StockTransferEntity } from '../transfers/entities/stock-transfer.entity';
import { StockTransferItemEntity } from '../transfers/entities/stock-transfer-item.entity';

for (const fileName of ['.env.local', '.env']) {
  const filePath = resolve(process.cwd(), fileName);

  if (existsSync(filePath)) {
    process.loadEnvFile(filePath);
  }
}

const DATABASE_URL_DIRECT = process.env.DATABASE_URL_DIRECT;
const DATABASE_URL = process.env.DATABASE_URL;

function resolveDatabaseUrl(): string {
  const url = DATABASE_URL_DIRECT ?? DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL or DATABASE_URL_DIRECT must be set');
  }

  return url;
}

function shouldEnableSsl(url: string): boolean {
  return url.includes('sslmode=require') || url.includes('neon.tech');
}

export function createTypeOrmOptions(): DataSourceOptions {
  return createBaseTypeOrmOptions(false);
}

export function createTypeOrmCliOptions(): DataSourceOptions {
  return createBaseTypeOrmOptions(true);
}

function createBaseTypeOrmOptions(includeMigrations: boolean): DataSourceOptions {
  const url = resolveDatabaseUrl();

  return {
    type: 'postgres',
    url,
    ssl: shouldEnableSsl(url) ? { rejectUnauthorized: false } : false,
    synchronize: false,
    entities: [
      TenantEntity,
      BranchEntity,
      CategoryEntity,
      ProductEntity,
      UserEntity,
      TaxGroupEntity,
      TaxConfigEntity,
      DiscountPresetEntity,
      DiscountPresetBranchEntity,
      InventoryBatchEntity,
      InventoryMovementEntity,
      InventoryBalanceEntity,
      BranchProductConfigEntity,
      OrderEntity,
      OrderItemEntity,
      OrderItemTaxEntity,
      OrderDiscountEntity,
      OrderNumberSequenceEntity,
      PaymentEntity,
      AuditLogEntity,
      PermissionEntity,
      RoleEntity,
      RolePermissionEntity,
      PlatformAdminEntity,
      ReceiptTokenEntity,
      UserBranchEntity,
      BranchGroupEntity,
      BranchGroupMemberEntity,
      BranchProductPriceEntity,
      StockTransferEntity,
      StockTransferItemEntity,
    ],
    ...(includeMigrations
      ? {
          migrations: ['src/database/migrations/*.ts'],
        }
      : {}),
  };
}
