import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformJwtAuthGuard } from './guards/platform-jwt-auth.guard';
import { PlatformAdminPayload } from './interfaces/platform-admin-payload.interface';

type RequestWithUser = Request & { user: PlatformAdminPayload };

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  login(@Body() body: { email: string; password: string }) {
    return this.platformAuthService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(PlatformJwtAuthGuard)
  getMe(@Request() req: RequestWithUser) {
    return this.platformAuthService.getMe(req.user);
  }
}
