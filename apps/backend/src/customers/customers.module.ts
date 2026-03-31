import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerNoteEntity } from './entities/customer-note.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerStatsHandler } from './customer-stats.handler';
import { OrderEntity } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, CustomerNoteEntity, OrderEntity]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerStatsHandler],
  exports: [CustomersService],
})
export class CustomersModule {}
