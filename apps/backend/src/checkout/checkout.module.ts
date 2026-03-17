import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { TaxModule } from '../tax/tax.module';
import { AuthModule } from '../auth/auth.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [OrdersModule, PaymentsModule, InventoryModule, TaxModule, AuthModule, ReceiptsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
