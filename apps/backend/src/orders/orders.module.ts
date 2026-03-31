import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { TaxModule } from '../tax/tax.module';
import { ProductEntity } from '../products/entities/product.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { OrderDiscountEntity } from './entities/order-discount.entity';
import { OrderItemTaxEntity } from './entities/order-item-tax.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderNumberSequenceEntity } from './entities/order-number-sequence.entity';
import { OrderEntity } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      OrderItemTaxEntity,
      OrderDiscountEntity,
      OrderNumberSequenceEntity,
      ProductEntity,
      TenantEntity,
    ]),
    AuthModule,
    RbacModule,
    DiscountsModule,
    TaxModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
