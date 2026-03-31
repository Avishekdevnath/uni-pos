import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { TaxGroupEntity } from './entities/tax-group.entity';
import { TaxConfigEntity } from './entities/tax-config.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { TaxGroupsController } from './tax-groups.controller';
import { TaxConfigsController } from './tax-configs.controller';
import { TaxService } from './tax.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxGroupEntity, TaxConfigEntity, BranchEntity]),
    AuthModule,
    RbacModule,
  ],
  controllers: [TaxGroupsController, TaxConfigsController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}
