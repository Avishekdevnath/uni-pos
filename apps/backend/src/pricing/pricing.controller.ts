import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { PricingService } from './pricing.service';
import { SetBranchPricesDto } from './dto/set-branch-prices.dto';

type RequestWithUser = Request & { user: AuthUserPayload };

@Controller('branches/:id/pricing')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @RequirePermission('pricing:read')
  listPrices(@Param('id') branchId: string, @Req() req: RequestWithUser) {
    return this.pricingService.listPrices(branchId, req.user.tenantId);
  }

  @Put()
  @RequirePermission('pricing:update')
  setPrices(
    @Param('id') branchId: string,
    @Body() dto: SetBranchPricesDto,
    @Req() req: RequestWithUser,
  ) {
    return this.pricingService.setPrices(branchId, req.user.tenantId, dto.items);
  }

  @Delete(':productId')
  @RequirePermission('pricing:update')
  deletePrice(
    @Param('id') branchId: string,
    @Param('productId') productId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.pricingService.deletePrice(branchId, productId, req.user.tenantId);
  }
}
