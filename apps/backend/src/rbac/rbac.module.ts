import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { RbacService } from './rbac.service';
import { PermissionGuard } from './guards/permission.guard';
import { RolesController } from './roles.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([
      PermissionEntity,
      RoleEntity,
      RolePermissionEntity,
      TenantEntity,
    ]),
  ],
  controllers: [RolesController],
  providers: [RbacService, PermissionGuard],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
