import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PlatformAdminPayload } from '../interfaces/platform-admin-payload.interface';

type RequestWithUser = Request & { user?: PlatformAdminPayload };

@Injectable()
export class PlatformJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: PlatformAdminPayload;
    try {
      payload = await this.jwtService.verifyAsync<PlatformAdminPayload>(token, {
        secret: process.env.PLATFORM_JWT_SECRET ?? 'platform-replace-me',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.isPlatform) {
      throw new UnauthorizedException('Not a platform admin token');
    }

    request.user = payload;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) return null;
    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) return null;
    return token;
  }
}
