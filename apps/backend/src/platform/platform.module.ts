import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PlatformAdminEntity } from './entities/platform-admin.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { RoleEntity } from '../rbac/entities/role.entity';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformTenantsService } from './platform-tenants.service';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformJwtAuthGuard } from './guards/platform-jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformAdminEntity,
      TenantEntity,
      UserEntity,
      BranchEntity,
      RoleEntity,
    ]),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [PlatformAuthController, PlatformTenantsController],
  providers: [PlatformAuthService, PlatformTenantsService, PlatformJwtAuthGuard],
})
export class PlatformModule {}
