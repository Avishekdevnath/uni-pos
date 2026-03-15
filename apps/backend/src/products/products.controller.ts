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
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiTags('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products for the authenticated tenant' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'barcode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiOkResponse({ description: 'Product list returned successfully' })
  async list(
    @Req() request: RequestWithUser,
    @Query() query: ListProductsQueryDto,
  ) {
    return {
      status: 'success',
      data: await this.productsService.list(request.user!.tenantId, query),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiOkResponse({ description: 'Product created successfully' })
  async create(@Req() request: RequestWithUser, @Body() dto: CreateProductDto) {
    return {
      status: 'success',
      data: await this.productsService.create(request.user!.tenantId, dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Product returned successfully' })
  async getById(@Req() request: RequestWithUser, @Param('id') id: string) {
    return {
      status: 'success',
      data: await this.productsService.getById(request.user!.tenantId, id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Product updated successfully' })
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return {
      status: 'success',
      data: await this.productsService.update(request.user!.tenantId, id, dto),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Product archived successfully' })
  async archive(@Req() request: RequestWithUser, @Param('id') id: string) {
    return {
      status: 'success',
      data: await this.productsService.archive(request.user!.tenantId, id),
    };
  }
}
