import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditLogHandler } from './audit-log.handler';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditLogHandler],
})
export class AuditModule {}
