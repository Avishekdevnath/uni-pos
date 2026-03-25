import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';

type RequestWithUser = Request & { user?: AuthUserPayload };

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('settings')
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermission('settings:read')
  @ApiOperation({ summary: 'Get tenant settings' })
  @ApiOkResponse({ description: 'Settings returned successfully' })
  async get(@Req() req: RequestWithUser) {
    return {
      status: 'success',
      data: await this.settingsService.get(req.user!.tenantId),
    };
  }

  @Patch()
  @RequirePermission('settings:update')
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiOkResponse({ description: 'Settings updated successfully' })
  async update(@Req() req: RequestWithUser, @Body() dto: UpdateSettingsDto) {
    return {
      status: 'success',
      data: await this.settingsService.update(req.user!.tenantId, dto),
    };
  }
}
