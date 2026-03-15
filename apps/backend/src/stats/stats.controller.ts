import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { StatsService } from './stats.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiTags('stats')
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics for a branch' })
  @ApiOkResponse({ description: 'Dashboard stats returned successfully' })
  async dashboard(@Req() request: RequestWithUser, @Query() query: DashboardQueryDto) {
    const result = await this.statsService.getDashboard(
      request.user!.tenantId,
      query.branch_id,
      query.period,
    );
    return { status: 'success', data: result };
  }
}
