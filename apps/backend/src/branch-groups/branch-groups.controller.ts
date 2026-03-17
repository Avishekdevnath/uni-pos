import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { BranchGroupsService } from './branch-groups.service';
import { CreateBranchGroupDto } from './dto/create-branch-group.dto';
import { UpdateBranchGroupDto } from './dto/update-branch-group.dto';

type RequestWithUser = Request & { user: AuthUserPayload };

@Controller('branch-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BranchGroupsController {
  constructor(private readonly branchGroupsService: BranchGroupsService) {}

  @Get()
  @RequirePermission('branch_groups:read')
  list(@Req() req: RequestWithUser) {
    return this.branchGroupsService.list(req.user.tenantId);
  }

  @Get(':id')
  @RequirePermission('branch_groups:read')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.branchGroupsService.findOne(id, req.user.tenantId);
  }

  @Post()
  @RequirePermission('branch_groups:create')
  create(@Body() dto: CreateBranchGroupDto, @Req() req: RequestWithUser) {
    return this.branchGroupsService.create(req.user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('branch_groups:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchGroupDto,
    @Req() req: RequestWithUser,
  ) {
    return this.branchGroupsService.update(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  @RequirePermission('branch_groups:delete')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.branchGroupsService.remove(id, req.user.tenantId);
  }

  @Post(':id/members')
  @RequirePermission('branch_groups:create')
  addMember(
    @Param('id') groupId: string,
    @Body('branch_id') branchId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.branchGroupsService.addMember(groupId, branchId, req.user.tenantId);
  }

  @Delete(':id/members/:branchId')
  @RequirePermission('branch_groups:delete')
  removeMember(
    @Param('id') groupId: string,
    @Param('branchId') branchId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.branchGroupsService.removeMember(groupId, branchId, req.user.tenantId);
  }
}
