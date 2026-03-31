import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { TenantEntity } from '../database/entities/tenant.entity';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { RoleEntity } from '../rbac/entities/role.entity';
import { PlatformAdminEntity } from './entities/platform-admin.entity';
import { TenantBootstrapService } from '../auth/tenant-bootstrap.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class PlatformTenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PlatformAdminEntity)
    private readonly adminRepo: Repository<PlatformAdminEntity>,
    private readonly tenantBootstrapService: TenantBootstrapService,
    private readonly jwtService: JwtService,
  ) {}

  async listTenants(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.tenantRepo.createQueryBuilder('t');

    if (query.search) {
      qb.where('t.name ILIKE :search OR t.slug ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const [tenants, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const data = await Promise.all(
      tenants.map(async (tenant) => {
        const ownerRole = await this.roleRepo.findOne({
          where: { tenantId: tenant.id, slug: 'owner' },
        });

        let owner: { fullName: string; email: string } | null = null;
        if (ownerRole) {
          const ownerUser = await this.userRepo.findOne({
            where: { tenantId: tenant.id, roleId: ownerRole.id },
          });
          if (ownerUser) {
            owner = { fullName: ownerUser.fullName, email: ownerUser.email };
          }
        }

        const userCount = await this.userRepo.count({ where: { tenantId: tenant.id } });
        const branchCount = await this.branchRepo.count({ where: { tenantId: tenant.id } });

        return { ...tenant, owner, userCount, branchCount };
      }),
    );

    return { data, total, page, limit };
  }

  async getTenant(id: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const branches = await this.branchRepo.find({ where: { tenantId: id } });
    const userCount = await this.userRepo.count({ where: { tenantId: id } });

    const ownerRole = await this.roleRepo.findOne({ where: { tenantId: id, slug: 'owner' } });
    let owner: { fullName: string; email: string; phone: string | null } | null = null;
    if (ownerRole) {
      const ownerUser = await this.userRepo.findOne({
        where: { tenantId: id, roleId: ownerRole.id },
      });
      if (ownerUser) {
        owner = { fullName: ownerUser.fullName, email: ownerUser.email, phone: ownerUser.phone };
      }
    }

    return { ...tenant, branches, userCount, owner };
  }

  async createTenant(dto: CreateTenantDto, platformAdminId: string) {
    const tempPassword = 'temp_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await this.tenantBootstrapService.createTenant({
      businessName: dto.business_name,
      ownerName: dto.owner_name,
      email: dto.owner_email,
      passwordHash,
      phone: dto.owner_phone,
      signupSource: 'platform_admin',
      onboardedBy: platformAdminId,
    });

    return { tenant: result.tenant, tempPassword };
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.status !== undefined) {
      tenant.status = dto.status;
    }

    return this.tenantRepo.save(tenant);
  }

  async impersonate(
    tenantId: string,
    platformAdminPassword: string,
    platformAdminId: string,
  ) {
    const admin = await this.adminRepo.findOne({ where: { id: platformAdminId } });
    if (!admin) throw new UnauthorizedException('Platform admin not found');

    const valid = await bcrypt.compare(platformAdminPassword, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid password');

    const ownerRole = await this.roleRepo.findOne({
      where: { tenantId, slug: 'owner' },
    });
    if (!ownerRole) throw new NotFoundException('Owner role not found for tenant');

    const ownerUser = await this.userRepo.findOne({
      where: { tenantId, roleId: ownerRole.id },
    });
    if (!ownerUser) throw new NotFoundException('Owner user not found for tenant');

    const tokenPayload = {
      sub: ownerUser.id,
      email: ownerUser.email,
      fullName: ownerUser.fullName,
      roleId: ownerUser.roleId,
      tenantId: ownerUser.tenantId,
      defaultBranchId: ownerUser.defaultBranchId,
      isPlatform: false,
      impersonatedBy: platformAdminId,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
      expiresIn: '1h',
    });

    return { accessToken };
  }
}
