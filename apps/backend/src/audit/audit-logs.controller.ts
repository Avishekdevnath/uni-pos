import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { AuditLogEntity } from './entities/audit-log.entity';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('audit-logs')
@ApiBearerAuth()
export class AuditLogsController {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,
  ) {}

  @Get()
  @RequirePermission('audit_logs:read')
  @ApiOperation({ summary: 'List audit logs with filtering and pagination' })
  @ApiOkResponse({ description: 'Audit logs returned successfully' })
  async list(@Req() request: RequestWithUser, @Query() query: ListAuditLogsQueryDto) {
    const tenantId = request.user!.tenantId;

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .where('log.tenant_id = :tenantId', { tenantId })
      .orderBy('log.occurred_at', 'DESC');

    if (query.event_type) {
      qb.andWhere('log.event_type = :eventType', { eventType: query.event_type });
    }
    if (query.from) {
      qb.andWhere('log.occurred_at >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('log.occurred_at <= :to', { to: new Date(query.to) });
    }

    qb.skip((query.page - 1) * query.page_size).take(query.page_size);

    const results = await qb.getMany();

    return { status: 'success', data: results };
  }
}
