import {
  Body,
  Controller,
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { InventoryService } from './inventory.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListBalancesQueryDto } from './dto/list-balances-query.dto';
import { ListMovementsQueryDto } from './dto/list-movements-query.dto';
import { UpdateBranchProductConfigDto } from './dto/update-branch-product-config.dto';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiTags('inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('balances')
  @ApiOperation({ summary: 'List inventory balances for a branch' })
  @ApiQuery({ name: 'branch_id', required: true, type: String })
  @ApiQuery({ name: 'product_id', required: false, type: String })
  @ApiOkResponse({ description: 'Inventory balances returned successfully' })
  async listBalances(
    @Req() request: RequestWithUser,
    @Query() query: ListBalancesQueryDto,
  ) {
    const tenantId = request.user!.tenantId;
    return {
      status: 'success',
      data: await this.inventoryService.listBalances(tenantId, query),
    };
  }

  @Get('movements')
  @ApiOperation({ summary: 'List inventory movements for a branch' })
  @ApiQuery({ name: 'branch_id', required: true, type: String })
  @ApiQuery({ name: 'product_id', required: false, type: String })
  @ApiQuery({ name: 'movement_type', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiOkResponse({ description: 'Inventory movements returned successfully' })
  async listMovements(
    @Req() request: RequestWithUser,
    @Query() query: ListMovementsQueryDto,
  ) {
    const tenantId = request.user!.tenantId;
    return {
      status: 'success',
      data: await this.inventoryService.listMovements(tenantId, query),
    };
  }

  @Post('stock-in')
  @ApiOperation({ summary: 'Create a stock-in batch' })
  @ApiOkResponse({ description: 'Stock-in batch created successfully' })
  async createStockIn(
    @Req() request: RequestWithUser,
    @Body() dto: CreateStockInDto,
  ) {
    const tenantId = request.user!.tenantId;
    const userId = request.user!.sub;
    const { batch, eventPayload } = await this.inventoryService.createStockIn(
      tenantId,
      userId,
      dto,
    );
    // Emit post-commit (transaction already committed by service)
    this.eventEmitter.emit('inventory.stock_in', eventPayload);
    return { status: 'success', data: batch };
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Create an inventory adjustment batch' })
  @ApiOkResponse({ description: 'Adjustment batch created successfully' })
  async createAdjustment(
    @Req() request: RequestWithUser,
    @Body() dto: CreateAdjustmentDto,
  ) {
    const tenantId = request.user!.tenantId;
    const userId = request.user!.sub;
    const { batch, eventPayload } =
      await this.inventoryService.createAdjustment(tenantId, userId, dto);
    // Emit post-commit (transaction already committed by service)
    this.eventEmitter.emit('inventory.stock_in', eventPayload);
    return { status: 'success', data: batch };
  }

  @Patch('branch-product-configs/:productId')
  @ApiOperation({ summary: 'Upsert branch-product config (thresholds, availability)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiQuery({ name: 'branch_id', required: true, type: String })
  @ApiOkResponse({ description: 'Branch-product config upserted successfully' })
  async upsertBranchProductConfig(
    @Req() request: RequestWithUser,
    @Param('productId') productId: string,
    @Query('branch_id') branchId: string,
    @Body() dto: UpdateBranchProductConfigDto,
  ) {
    const tenantId = request.user!.tenantId;
    const result = await this.inventoryService.upsertConfig(
      tenantId,
      branchId,
      productId,
      dto,
    );
    return { status: 'success', data: result };
  }
}
