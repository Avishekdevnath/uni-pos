import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { BranchesService } from './branches.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('branches')
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermission('branches:read')
  @ApiOperation({ summary: 'List branches for the authenticated tenant' })
  @ApiOkResponse({ description: 'Branch list returned successfully' })
  async list(@Req() request: RequestWithUser) {
    return {
      status: 'success',
      data: await this.branchesService.list(request.user!.tenantId),
    };
  }
}
