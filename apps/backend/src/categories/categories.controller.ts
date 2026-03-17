import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermission('categories:read')
  @ApiOperation({ summary: 'List categories for the authenticated tenant' })
  @ApiOkResponse({ description: 'Category list returned successfully' })
  async list(@Req() request: RequestWithUser) {
    return {
      status: 'success',
      data: await this.categoriesService.list(request.user!.tenantId),
    };
  }

  @Post()
  @RequirePermission('categories:create')
  @ApiOperation({ summary: 'Create a category' })
  @ApiOkResponse({ description: 'Category created successfully' })
  async create(@Req() request: RequestWithUser, @Body() dto: CreateCategoryDto) {
    return {
      status: 'success',
      data: await this.categoriesService.create(request.user!.tenantId, dto),
    };
  }

  @Patch(':id')
  @RequirePermission('categories:update')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Category updated successfully' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return {
      status: 'success',
      data: await this.categoriesService.update(request.user!.tenantId, id, dto),
    };
  }

  @Delete(':id')
  @RequirePermission('categories:delete')
  @ApiOperation({ summary: 'Archive a category (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Category archived successfully' })
  async archive(
    @Req() request: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return {
      status: 'success',
      data: await this.categoriesService.archive(request.user!.tenantId, id),
    };
  }
}
