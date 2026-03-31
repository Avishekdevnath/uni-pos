import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountPresetEntity } from './entities/discount-preset.entity';
import { DiscountPresetBranchEntity } from './entities/discount-preset-branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiscountPresetEntity, DiscountPresetBranchEntity]),
    AuthModule,
    RbacModule,
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
