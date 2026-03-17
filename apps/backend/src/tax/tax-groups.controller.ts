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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { CreateTaxGroupDto } from './dto/create-tax-group.dto';
import { UpdateTaxGroupDto } from './dto/update-tax-group.dto';
import { TaxService } from './tax.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('tax-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('tax-groups')
@ApiBearerAuth()
export class TaxGroupsController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  @RequirePermission('taxes:read')
  @ApiOperation({ summary: 'List tax groups for the authenticated tenant' })
  @ApiOkResponse({ description: 'Tax group list returned successfully' })
  async list(@Req() request: RequestWithUser) {
    return {
      status: 'success',
      data: await this.taxService.listGroups(request.user!.tenantId),
    };
  }

  @Post()
  @RequirePermission('taxes:create')
  @ApiOperation({ summary: 'Create a tax group' })
  @ApiOkResponse({ description: 'Tax group created successfully' })
  async create(
    @Req() request: RequestWithUser,
    @Body() dto: CreateTaxGroupDto,
  ) {
    return {
      status: 'success',
      data: await this.taxService.createGroup(request.user!.tenantId, dto),
    };
  }

  @Patch(':id')
  @RequirePermission('taxes:update')
  @ApiOperation({ summary: 'Update a tax group' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Tax group updated successfully' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaxGroupDto,
  ) {
    return {
      status: 'success',
      data: await this.taxService.updateGroup(request.user!.tenantId, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission('taxes:delete')
  @ApiOperation({ summary: 'Archive a tax group' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Tax group archived successfully' })
  async archive(@Req() request: RequestWithUser, @Param('id') id: string) {
    return {
      status: 'success',
      data: await this.taxService.archiveGroup(request.user!.tenantId, id),
    };
  }
}
