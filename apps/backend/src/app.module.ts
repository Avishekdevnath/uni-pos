import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { BranchGroupsModule } from './branch-groups/branch-groups.module';
import { PricingModule } from './pricing/pricing.module';
import { CustomersModule } from './customers/customers.module';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
    BranchGroupsModule,
    PricingModule,
    CustomersModule,
    ReportsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
