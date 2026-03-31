import {
  Body,
  Controller,
  Param,
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
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { CompleteOrderDto } from '../orders/dto/complete-order.dto';
import { CancelOrderDto } from '../orders/dto/cancel-order.dto';
import { CheckoutService } from './checkout.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('checkout')
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':id/complete')
  @RequirePermission('pos:sell')
  @ApiOperation({ summary: 'Complete an order (calculate totals, record payments, deduct stock)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ description: 'Completed order' })
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const tenantId = req.user!.tenantId;
    const actorId = req.user!.sub;
    return {
      data: await this.checkoutService.complete(id, tenantId, actorId, dto),
    };
  }

  @Post(':id/cancel')
  @RequirePermission('orders:cancel')
  @ApiOperation({ summary: 'Cancel a draft or completed order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ description: 'Cancelled order' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const tenantId = req.user!.tenantId;
    const actorId = req.user!.sub;
    return {
      data: await this.checkoutService.cancel(id, tenantId, actorId, dto),
    };
  }
}
