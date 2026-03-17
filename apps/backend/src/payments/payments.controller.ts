import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { PaymentsService } from './payments.service';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission('payments:read')
  @ApiOperation({ summary: 'List payments for the authenticated tenant' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  @ApiQuery({ name: 'order_id', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiOkResponse({ description: 'Payment list returned successfully' })
  async listPayments(
    @Req() request: RequestWithUser,
    @Query() query: ListPaymentsQueryDto,
  ) {
    return {
      status: 'success',
      data: await this.paymentsService.listPayments(
        request.user!.tenantId,
        query,
      ),
    };
  }
}
