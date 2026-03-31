import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { OrderEntity } from '../orders/entities/order.entity';

@Module({
  imports: [AuthModule, RbacModule, TypeOrmModule.forFeature([OrderEntity])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
