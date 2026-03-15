import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiTags('categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories for the authenticated tenant' })
  @ApiOkResponse({ description: 'Category list returned successfully' })
  async list(@Req() request: RequestWithUser) {
    return {
      status: 'success',
      data: await this.categoriesService.list(request.user!.tenantId),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiOkResponse({ description: 'Category created successfully' })
  async create(@Req() request: RequestWithUser, @Body() dto: CreateCategoryDto) {
    return {
      status: 'success',
      data: await this.categoriesService.create(request.user!.tenantId, dto),
    };
  }

  @Patch(':id')
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
}
