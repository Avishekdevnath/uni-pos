import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { TaxModule } from './tax/tax.module';
import { DiscountsModule } from './discounts/discounts.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { CheckoutModule } from './checkout/checkout.module';
import { StatsModule } from './stats/stats.module';
import { RbacModule } from './rbac/rbac.module';
import { PlatformModule } from './platform/platform.module';
import { ReceiptsModule } from './receipts/receipts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    TaxModule,
    DiscountsModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    AuditModule,
    BranchesModule,
    CheckoutModule,
    StatsModule,
    RbacModule,
    PlatformModule,
    ReceiptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
