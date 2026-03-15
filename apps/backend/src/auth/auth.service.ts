import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { LoginDto } from './dto/login.dto/login.dto';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { AuthUserPayload } from './interfaces/auth-user-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('User account is inactive');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = this.createPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      status: 'success',
      data: {
        access_token: accessToken,
        user: this.serializeUser(user),
      },
    };
  }

  async getCurrentUser(user: AuthUserPayload | undefined) {
    if (!user) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const existingUser = await this.usersService.findById(user.sub);

    if (!existingUser || existingUser.status !== 'active') {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    return {
      status: 'success',
      data: this.serializeUser(existingUser),
    };
  }

  private createPayload(user: UserEntity): AuthUserPayload {
    return {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      defaultBranchId: user.defaultBranchId,
    };
  }

  private serializeUser(user: UserEntity) {
    return {
      id: user.id,
      full_name: user.fullName,
      role: user.role,
      tenant_id: user.tenantId,
      default_branch_id: user.defaultBranchId,
    };
  }
}
