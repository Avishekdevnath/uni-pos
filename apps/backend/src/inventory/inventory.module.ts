import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { InventoryBatchEntity } from './entities/inventory-batch.entity';
import { InventoryMovementEntity } from './entities/inventory-movement.entity';
import { InventoryBalanceEntity } from './entities/inventory-balance.entity';
import { BranchProductConfigEntity } from './entities/branch-product-config.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryBatchEntity,
      InventoryMovementEntity,
      InventoryBalanceEntity,
      BranchProductConfigEntity,
      ProductEntity,
    ]),
    AuthModule,
    RbacModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
