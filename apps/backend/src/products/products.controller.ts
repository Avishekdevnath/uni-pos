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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
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
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @RequirePermission('products:read')
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
  @RequirePermission('products:create')
  @ApiOperation({ summary: 'Create a product' })
  @ApiOkResponse({ description: 'Product created successfully' })
  async create(@Req() request: RequestWithUser, @Body() dto: CreateProductDto) {
    return {
      status: 'success',
      data: await this.productsService.create(request.user!.tenantId, dto),
    };
  }

  @Get(':id')
  @RequirePermission('products:read')
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
  @RequirePermission('products:update')
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

  @Post(':id/image')
  @RequirePermission('products:update')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload product image to Cloudinary' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async uploadImage(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = await this.cloudinaryService.uploadProductImage(file, id);
    const updated = await this.productsService.update(request.user!.tenantId, id, { image_url: imageUrl });
    return { status: 'success', data: updated };
  }

  @Patch(':id/emoji')
  @RequirePermission('products:update')
  @ApiOperation({ summary: 'Set product emoji icon' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async setEmoji(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body('emoji') emoji: string,
  ) {
    const updated = await this.productsService.update(request.user!.tenantId, id, { emoji });
    return { status: 'success', data: updated };
  }

  @Delete(':id')
  @RequirePermission('products:delete')
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
