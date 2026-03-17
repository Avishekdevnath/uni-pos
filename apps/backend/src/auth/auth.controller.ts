import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUserPayload } from './interfaces/auth-user-payload.interface';
import { JwtService } from '@nestjs/jwt';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Authenticate user and return JWT token' })
  @ApiOkResponse({ description: 'Authentication successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Register a new tenant and owner account' })
  @ApiCreatedResponse({ description: 'Tenant and owner created, JWT returned' })
  async register(@Body() dto: RegisterDto) {
    const { tenant, branch, user, roles } = await this.authService.register(dto);

    const ownerRole = roles.get('owner')!;

    const payload: AuthUserPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      tenantId: user.tenantId,
      defaultBranchId: user.defaultBranchId,
      isPlatform: false,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      status: 'success',
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          role_id: user.roleId,
          tenant_id: user.tenantId,
          default_branch_id: user.defaultBranchId,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          defaultCurrency: tenant.defaultCurrency,
        },
        branch: {
          id: branch.id,
          name: branch.name,
          code: branch.code,
        },
        role: {
          id: ownerRole.id,
          name: ownerRole.name,
          slug: ownerRole.slug,
        },
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user with permissions' })
  @ApiOkResponse({ description: 'Current user returned successfully' })
  getCurrentUser(@Req() request: RequestWithUser) {
    return this.authService.getCurrentUser(request.user);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @ApiOkResponse({ description: 'Password updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Current password is incorrect' })
  changePassword(
    @Req() request: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(request.user!, dto);
  }
}
