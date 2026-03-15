import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchEntity, OrganizationEntity, TenantEntity } from './entities';
import { CategoryEntity } from '../categories/entities/category.entity';
import { createTypeOrmOptions } from './typeorm.config';
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

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (configService.get<string>('NODE_ENV') === 'test') {
          return {
            type: 'sqljs' as const,
            entities: [
              OrganizationEntity,
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
            ],
            synchronize: true,
          };
        }

        return createTypeOrmOptions();
      },
    }),
  ],
})
export class DatabaseModule {}
