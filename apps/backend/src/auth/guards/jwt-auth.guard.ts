import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RbacService } from '../../rbac/rbac.service';
import { AuthUserPayload } from '../interfaces/auth-user-payload.interface';

type RequestWithUser = Request & {
  user?: AuthUserPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthUserPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'replace-me',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = request.user!;
    if (!user.isPlatform) {
      const active = await this.rbacService.isTenantActive(user.tenantId);
      if (!active) {
        throw new ForbiddenException(
          'Your business account has been suspended. Contact support.',
        );
      }
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
