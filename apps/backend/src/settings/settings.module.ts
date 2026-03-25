import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSettingsEntity } from './entities/tenant-settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { RbacModule } from '../rbac/rbac.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantSettingsEntity]),
    RbacModule,
    AuthModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
