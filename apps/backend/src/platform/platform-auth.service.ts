import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PlatformAdminEntity } from './entities/platform-admin.entity';
import { PlatformAdminPayload } from './interfaces/platform-admin-payload.interface';

@Injectable()
export class PlatformAuthService {
  constructor(
    @InjectRepository(PlatformAdminEntity)
    private readonly adminRepo: Repository<PlatformAdminEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: PlatformAdminPayload = {
      sub: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      isPlatform: true,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.PLATFORM_JWT_SECRET ?? (() => { throw new Error('PLATFORM_JWT_SECRET environment variable is required'); })(),
      expiresIn: '1d',
    });

    return { accessToken };
  }

  async getMe(payload: PlatformAdminPayload) {
    const admin = await this.adminRepo.findOne({ where: { id: payload.sub } });
    if (!admin) {
      throw new UnauthorizedException('Platform admin not found');
    }
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      status: admin.status,
    };
  }
}
