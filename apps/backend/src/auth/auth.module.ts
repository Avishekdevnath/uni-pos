import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { RbacModule } from '../rbac/rbac.module';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { RoleEntity } from '../rbac/entities/role.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { TenantEntity } from '../database/entities/tenant.entity';

@Module({
  imports: [
    ConfigModule,
    RbacModule,
    UsersModule,
    TypeOrmModule.forFeature([UserEntity, RoleEntity, BranchEntity, TenantEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'replace-me',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ?? '1d') as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TenantBootstrapService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard, TenantBootstrapService],
})
export class AuthModule {}
