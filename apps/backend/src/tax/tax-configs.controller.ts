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
import { CreateTaxConfigDto } from './dto/create-tax-config.dto';
import { UpdateTaxConfigDto } from './dto/update-tax-config.dto';
import { TaxService } from './tax.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('tax-configs')
@UseGuards(JwtAuthGuard)
@ApiTags('tax-configs')
@ApiBearerAuth()
export class TaxConfigsController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  @ApiOperation({ summary: 'List tax configs for the authenticated tenant' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiOkResponse({ description: 'Tax config list returned successfully' })
  async list(
    @Req() request: RequestWithUser,
    @Query('branch_id') branchId: string,
  ) {
    return {
      status: 'success',
      data: await this.taxService.listConfigs(
        request.user!.tenantId,
        branchId,
      ),
    };
  }

  @Post()
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
