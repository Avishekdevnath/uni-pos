import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { ReportsService } from './reports.service';

type RequestWithUser = Request & { user?: AuthUserPayload };

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermission('reports:read')
  getSummary(@Req() req: RequestWithUser, @Query('date') date?: string) {
    const today = date ?? new Date().toISOString().split('T')[0];
    return this.reportsService.getSummary(req.user!.tenantId, req.user!.defaultBranchId, today);
  }

  @Get('revenue')
  @RequirePermission('reports:read')
  getRevenue(
    @Req() req: RequestWithUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getRevenue(req.user!.tenantId, req.user!.defaultBranchId, from, to);
  }

  @Get('payment-methods')
  @RequirePermission('reports:read')
  getPaymentMethods(
    @Req() req: RequestWithUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getPaymentMethods(req.user!.tenantId, req.user!.defaultBranchId, from, to);
  }

  @Get('top-products')
  @RequirePermission('reports:read')
  getTopProducts(
    @Req() req: RequestWithUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('limit') limit = '10',
  ) {
    return this.reportsService.getTopProducts(
      req.user!.tenantId,
      req.user!.defaultBranchId,
      from,
      to,
      Number(limit),
    );
  }

  @Get('hourly')
  @RequirePermission('reports:read')
  getHourlyHeatmap(@Req() req: RequestWithUser) {
    return this.reportsService.getHourlyHeatmap(req.user!.tenantId, req.user!.defaultBranchId);
  }
}
