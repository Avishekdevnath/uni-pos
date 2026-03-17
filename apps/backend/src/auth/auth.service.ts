import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { LoginDto } from './dto/login.dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { TenantBootstrapService, TenantBootstrapResult } from './tenant-bootstrap.service';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { RoleEntity } from '../rbac/entities/role.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { RbacService } from '../rbac/rbac.service';
import { AuthUserPayload } from './interfaces/auth-user-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
    private readonly tenantBootstrapService: TenantBootstrapService,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
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

  async register(dto: RegisterDto): Promise<TenantBootstrapResult> {
    const passwordHash = await hash(dto.password, 12);
    return this.tenantBootstrapService.createTenant({
      businessName: dto.business_name,
      ownerName: dto.owner_name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      signupSource: 'self_service',
    });
  }

  async getCurrentUser(authUser: AuthUserPayload | undefined) {
    if (!authUser) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const user = await this.usersService.findById(authUser.sub);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    const [role, branch, tenant, permissions] = await Promise.all([
      this.roleRepo.findOne({ where: { id: user.roleId } }),
      this.branchRepo.findOne({ where: { id: user.defaultBranchId } }),
      this.tenantRepo.findOne({ where: { id: user.tenantId } }),
      this.rbacService.resolvePermissionsForUser(user.roleId),
    ]);

    return {
      status: 'success',
      data: {
        user: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          status: user.status,
        },
        role: role
          ? { id: role.id, name: role.name, slug: role.slug }
          : null,
        permissions,
        branch: branch
          ? { id: branch.id, name: branch.name, code: branch.code }
          : null,
        tenant: tenant
          ? { name: tenant.name, defaultCurrency: tenant.defaultCurrency }
          : null,
      },
    };
  }

  async changePassword(
    authUser: AuthUserPayload,
    dto: ChangePasswordDto,
  ): Promise<{ status: string }> {
    const user = await this.usersService.findById(authUser.sub);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    const currentMatches = await compare(dto.current_password, user.passwordHash);
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await hash(dto.new_password, 12);
    await this.userRepo.update({ id: user.id }, { passwordHash: newHash });

    return { status: 'success' };
  }

  private createPayload(user: UserEntity): AuthUserPayload {
    return {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      tenantId: user.tenantId,
      defaultBranchId: user.defaultBranchId,
      isPlatform: false as const,
    };
  }

  private serializeUser(user: UserEntity) {
    return {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      role_id: user.roleId,
      tenant_id: user.tenantId,
      default_branch_id: user.defaultBranchId,
    };
  }
}
