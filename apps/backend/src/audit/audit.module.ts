import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditLogHandler } from './audit-log.handler';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), AuthModule, RbacModule],
  controllers: [AuditLogsController],
  providers: [AuditLogHandler],
})
export class AuditModule {}
