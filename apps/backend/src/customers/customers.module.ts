import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerNoteEntity } from './entities/customer-note.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerStatsHandler } from './customer-stats.handler';
import { OrderEntity } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, CustomerNoteEntity, OrderEntity]),
    AuthModule,
    RbacModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerStatsHandler],
  exports: [CustomersService],
})
export class CustomersModule {}
