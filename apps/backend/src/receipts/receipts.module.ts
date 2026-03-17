import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { ReceiptTokenEntity } from './entities/receipt-token.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReceiptTokenEntity,
      OrderEntity,
      TenantEntity,
      PaymentEntity,
    ]),
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
