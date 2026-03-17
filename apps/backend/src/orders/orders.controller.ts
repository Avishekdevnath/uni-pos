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
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { ApplyOrderDiscountDto } from './dto/apply-order-discount.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrdersService } from './orders.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermission('orders:create')
  @ApiOperation({ summary: 'Create a draft order' })
  @ApiOkResponse({ description: 'Draft order created successfully' })
  async createDraft(
    @Req() request: RequestWithUser,
    @Body() dto: CreateOrderDto,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.createDraft(
        request.user!.tenantId,
        request.user!.sub,
        dto,
      ),
    };
  }

  @Get()
  @RequirePermission('orders:read')
  @ApiOperation({ summary: 'List orders for the authenticated tenant' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Order list returned successfully' })
  async listOrders(
    @Req() request: RequestWithUser,
    @Query() query: ListOrdersQueryDto,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.listOrders(request.user!.tenantId, query),
    };
  }

  @Get(':id')
  @RequirePermission('orders:read')
  @ApiOperation({ summary: 'Get order detail' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Order returned successfully' })
  async getOrder(@Req() request: RequestWithUser, @Param('id') id: string) {
    return {
      status: 'success',
      data: await this.ordersService.getOrder(request.user!.tenantId, id),
    };
  }

  @Get(':id/preview')
  @RequirePermission('orders:read')
  @ApiOperation({ summary: 'Get order receipt preview' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Order preview returned successfully' })
  async getOrderPreview(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.getOrderPreview(
        request.user!.tenantId,
        id,
      ),
    };
  }

  @Post(':id/items')
  @RequirePermission('orders:update')
  @ApiOperation({ summary: 'Add an item to an order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Item added successfully' })
  async addItem(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.addItem(request.user!.tenantId, id, dto),
    };
  }

  @Patch(':id/items/:itemId')
  @RequirePermission('orders:update')
  @ApiOperation({ summary: 'Update an order item' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Item updated successfully' })
  async updateItem(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.updateItem(
        request.user!.tenantId,
        id,
        itemId,
        dto,
      ),
    };
  }

  @Delete(':id/items/:itemId')
  @RequirePermission('orders:update')
  @ApiOperation({ summary: 'Remove an item from an order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Item removed successfully' })
  async removeItem(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.removeItem(
        request.user!.tenantId,
        id,
        itemId,
      ),
    };
  }

  @Post(':id/discounts')
  @RequirePermission('orders:update')
  @ApiOperation({ summary: 'Apply a discount to an order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Discount applied successfully' })
  async applyDiscount(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ApplyOrderDiscountDto,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.applyDiscount(
        request.user!.tenantId,
        id,
        dto,
      ),
    };
  }

  @Delete(':id/discounts/:discountId')
  @RequirePermission('orders:update')
  @ApiOperation({ summary: 'Remove a discount from an order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'discountId', format: 'uuid' })
  @ApiOkResponse({ description: 'Discount removed successfully' })
  async removeDiscount(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Param('discountId') discountId: string,
  ) {
    return {
      status: 'success',
      data: await this.ordersService.removeDiscount(
        request.user!.tenantId,
        id,
        discountId,
      ),
    };
  }
}
