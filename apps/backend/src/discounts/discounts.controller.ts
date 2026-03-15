import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { IsArray, IsUUID } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { CreateDiscountPresetDto } from './dto/create-discount-preset.dto';
import { ListDiscountPresetsQueryDto } from './dto/list-discount-presets-query.dto';
import { UpdateDiscountPresetDto } from './dto/update-discount-preset.dto';
import { DiscountsService } from './discounts.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

class SetBranchesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  branch_ids: string[];
}

@Controller('discount-presets')
@UseGuards(JwtAuthGuard)
@ApiTags('discount-presets')
@ApiBearerAuth()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'List discount presets for the authenticated tenant' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'scope', required: false, type: String })
  @ApiOkResponse({ description: 'Discount preset list returned successfully' })
  async list(
    @Req() request: RequestWithUser,
    @Query() query: ListDiscountPresetsQueryDto,
  ) {
    return {
      status: 'success',
      data: await this.discountsService.list(request.user!.tenantId, query),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a discount preset' })
  @ApiOkResponse({ description: 'Discount preset created successfully' })
  async create(
    @Req() request: RequestWithUser,
    @Body() dto: CreateDiscountPresetDto,
  ) {
    return {
      status: 'success',
      data: await this.discountsService.create(request.user!.tenantId, dto),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a discount preset' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Discount preset updated successfully' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateDiscountPresetDto,
  ) {
    return {
      status: 'success',
      data: await this.discountsService.update(request.user!.tenantId, id, dto),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a discount preset' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Discount preset archived successfully' })
  async archive(@Req() request: RequestWithUser, @Param('id') id: string) {
    return {
      status: 'success',
      data: await this.discountsService.archive(request.user!.tenantId, id),
    };
  }

  @Put(':id/branches')
  @ApiOperation({ summary: 'Set branches for a discount preset' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Discount preset branches updated successfully' })
  async setBranches(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: SetBranchesDto,
  ) {
    return {
      status: 'success',
      data: await this.discountsService.setBranches(
        request.user!.tenantId,
        id,
        body.branch_ids,
      ),
    };
  }
}
