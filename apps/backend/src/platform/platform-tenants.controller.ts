import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlatformTenantsService } from './platform-tenants.service';
import { PlatformJwtAuthGuard } from './guards/platform-jwt-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ImpersonateDto } from './dto/impersonate.dto';
import { PlatformAdminPayload } from './interfaces/platform-admin-payload.interface';

type RequestWithUser = Request & { user: PlatformAdminPayload };

@Controller('platform/tenants')
@UseGuards(PlatformJwtAuthGuard)
export class PlatformTenantsController {
  constructor(private readonly platformTenantsService: PlatformTenantsService) {}

  @Get()
  listTenants(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.platformTenantsService.listTenants({
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  getTenant(@Param('id') id: string) {
    return this.platformTenantsService.getTenant(id);
  }

  @Post()
  createTenant(@Body() dto: CreateTenantDto, @Request() req: RequestWithUser) {
    return this.platformTenantsService.createTenant(dto, req.user.sub);
  }

  @Patch(':id')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.platformTenantsService.updateTenant(id, dto);
  }

  @Post(':id/impersonate')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  impersonate(
    @Param('id') id: string,
    @Body() dto: ImpersonateDto,
    @Request() req: RequestWithUser,
  ) {
    return this.platformTenantsService.impersonate(id, dto.password, req.user.sub);
  }
}
