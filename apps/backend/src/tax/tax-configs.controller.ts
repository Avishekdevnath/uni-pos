import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { CreateTaxConfigDto } from './dto/create-tax-config.dto';
import { UpdateTaxConfigDto } from './dto/update-tax-config.dto';
import { TaxService } from './tax.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('tax-configs')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('tax-configs')
@ApiBearerAuth()
export class TaxConfigsController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  @RequirePermission('taxes:read')
  @ApiOperation({ summary: 'List tax configs for the authenticated tenant' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'tax_group_id', required: false, type: String })
  @ApiOkResponse({ description: 'Tax config list returned successfully' })
  async list(
    @Req() request: RequestWithUser,
    @Query('branch_id') branchId: string,
    @Query('tax_group_id') taxGroupId?: string,
  ) {
    return {
      status: 'success',
      data: await this.taxService.listConfigs(
        request.user!.tenantId,
        branchId,
        taxGroupId,
      ),
    };
  }

  @Post()
  @RequirePermission('taxes:create')
  @ApiOperation({ summary: 'Create a tax config' })
  @ApiOkResponse({ description: 'Tax config created successfully' })
  async create(
    @Req() request: RequestWithUser,
    @Body() dto: CreateTaxConfigDto,
  ) {
    return {
      status: 'success',
      data: await this.taxService.createConfig(request.user!.tenantId, dto),
    };
  }

  @Patch(':id')
  @RequirePermission('taxes:update')
  @ApiOperation({ summary: 'Update a tax config' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Tax config updated successfully' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaxConfigDto,
  ) {
    return {
      status: 'success',
      data: await this.taxService.updateConfig(
        request.user!.tenantId,
        id,
        dto,
      ),
    };
  }

  @Delete(':id')
  @RequirePermission('taxes:delete')
  @ApiOperation({ summary: 'Archive a tax config' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Tax config archived successfully' })
  async archive(@Req() request: RequestWithUser, @Param('id') id: string) {
    return {
      status: 'success',
      data: await this.taxService.archiveConfig(request.user!.tenantId, id),
    };
  }
}
