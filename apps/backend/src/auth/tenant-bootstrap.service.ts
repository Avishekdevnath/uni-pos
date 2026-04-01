import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TenantEntity } from '../database/entities/tenant.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { UserEntity } from '../users/entities/user.entity/user.entity';
import { RoleEntity } from '../rbac/entities/role.entity';
import { RolePermissionEntity } from '../rbac/entities/role-permission.entity';
import { PermissionEntity } from '../rbac/entities/permission.entity';

// ---------------------------------------------------------------------------
// All 42 permissions
// ---------------------------------------------------------------------------
const ALL_PERMISSIONS = [
  'products:create', 'products:read', 'products:update', 'products:delete',
  'categories:create', 'categories:read', 'categories:update', 'categories:delete',
  'tax:create', 'tax:read', 'tax:update', 'tax:delete',
  'discounts:create', 'discounts:read', 'discounts:update', 'discounts:delete', 'discounts:apply',
  'inventory:read', 'inventory:receive', 'inventory:adjust',
  'orders:create', 'orders:read', 'orders:cancel',
  'pos:sell', 'pos:void', 'pos:open_drawer',
  'staff:create', 'staff:read', 'staff:update', 'staff:delete', 'staff:assign_role',
  'settings:read', 'settings:update',
  'branches:create', 'branches:read', 'branches:update',
  'audit:read', 'reports:read',
  'branch_groups:create', 'branch_groups:read', 'branch_groups:update', 'branch_groups:delete',
  'pricing:read', 'pricing:update',
  'transfers:create', 'transfers:read', 'transfers:receive',
  'roles:manage',
] as const;

// ---------------------------------------------------------------------------
// Role → permission matrix
// ---------------------------------------------------------------------------
const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  owner: ALL_PERMISSIONS,

  senior_manager: [
    'products:create', 'products:read', 'products:update', 'products:delete',
    'categories:create', 'categories:read', 'categories:update', 'categories:delete',
    'tax:create', 'tax:read', 'tax:update', 'tax:delete',
    'discounts:create', 'discounts:read', 'discounts:update', 'discounts:delete', 'discounts:apply',
    'inventory:read', 'inventory:receive', 'inventory:adjust',
    'orders:create', 'orders:read', 'orders:cancel',
    'pos:sell', 'pos:void', 'pos:open_drawer',
    'staff:read',
    'branches:read',
    'audit:read', 'reports:read',
    'branch_groups:read',
    'pricing:read', 'pricing:update',
    'transfers:create', 'transfers:read', 'transfers:receive',
    'roles:manage',
  ],

  manager: [
    'products:read', 'categories:read', 'discounts:read', 'discounts:apply',
    'inventory:read', 'inventory:receive', 'inventory:adjust',
    'orders:create', 'orders:read', 'orders:cancel',
    'pos:sell', 'pos:void', 'pos:open_drawer',
    'branches:read', 'audit:read', 'reports:read',
    'pricing:read',
    'transfers:create', 'transfers:read',
  ],

  cashier: [
    'products:read', 'categories:read', 'inventory:read',
    'orders:create', 'pos:sell', 'pos:void', 'pos:open_drawer',
  ],

  senior_staff: [
    'inventory:receive', 'orders:create', 'pos:sell', 'pos:void',
  ],

  staff: [
    'orders:create', 'pos:sell',
  ],
};

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: 'Owner',
  senior_manager: 'Senior Manager',
  manager: 'Manager',
  cashier: 'Cashier',
  senior_staff: 'Senior Staff',
  staff: 'Staff',
};

export interface TenantBootstrapInput {
  businessName: string;
  ownerName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  signupSource?: string;
  onboardedBy?: string;
}

export interface TenantBootstrapResult {
  tenant: TenantEntity;
  branch: BranchEntity;
  user: UserEntity;
  roles: Map<string, RoleEntity>;
}

@Injectable()
export class TenantBootstrapService {
  constructor(private readonly dataSource: DataSource) {}

  async createTenant(input: TenantBootstrapInput): Promise<TenantBootstrapResult> {
    const { businessName, ownerName, email, passwordHash, phone, signupSource, onboardedBy } = input;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      // ------------------------------------------------------------------
      // 0. Check email uniqueness inside the transaction to avoid races
      // ------------------------------------------------------------------
      const existingUser = await manager.findOne(UserEntity, { where: { email } });
      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }

      // ------------------------------------------------------------------
      // 1. Create tenant
      // ------------------------------------------------------------------
      const slug = this.generateSlug(businessName);
      const tenant = await manager.save(
        TenantEntity,
        manager.create(TenantEntity, {
          name: businessName,
          slug,
          industryType: 'retail',
          defaultCurrency: 'BDT',
          defaultTimezone: 'Asia/Dhaka',
          signupSource: signupSource ?? 'self_service',
          onboardedBy: onboardedBy ?? null,
          status: 'active',
        }),
      );

      // ------------------------------------------------------------------
      // 2. Create main branch
      // ------------------------------------------------------------------
      const branch = await manager.save(
        BranchEntity,
        manager.create(BranchEntity, {
          tenantId: tenant.id,
          name: 'Main Branch',
          code: 'MAIN',
          status: 'active',
        }),
      );

      // ------------------------------------------------------------------
      // 3. Resolve permissions from DB (must already be seeded)
      // ------------------------------------------------------------------
      const allPerms = await manager.find(PermissionEntity);
      const permByCode = new Map(allPerms.map((p) => [p.code, p]));
      const missingPermissionCodes = ALL_PERMISSIONS.filter((code) => !permByCode.has(code));
      if (missingPermissionCodes.length > 0) {
        throw new InternalServerErrorException(
          `RBAC permissions are not seeded. Missing codes: ${missingPermissionCodes.join(', ')}`,
        );
      }

      // ------------------------------------------------------------------
      // 4. Create 6 system roles for this tenant
      // ------------------------------------------------------------------
      const roleMap = new Map<string, RoleEntity>();

      for (const slug of Object.keys(ROLE_PERMISSIONS)) {
        const role = await manager.save(
          RoleEntity,
          manager.create(RoleEntity, {
            tenantId: tenant.id,
            name: ROLE_DISPLAY_NAMES[slug],
            slug,
            isSystem: true,
          }),
        );
        roleMap.set(slug, role);
      }

      // ------------------------------------------------------------------
      // 5. Assign permissions to each role
      // ------------------------------------------------------------------
      for (const [roleSlug, codes] of Object.entries(ROLE_PERMISSIONS)) {
        const role = roleMap.get(roleSlug)!;
        for (const code of codes) {
          const perm = permByCode.get(code);
          if (!perm) {
            throw new InternalServerErrorException(
              `Permission not found while bootstrapping tenant role '${roleSlug}': ${code}`,
            );
          }
          await manager
            .createQueryBuilder()
            .insert()
            .into(RolePermissionEntity)
            .values({ roleId: role.id, permissionId: perm.id })
            .orIgnore()
            .execute();
        }
      }

      // ------------------------------------------------------------------
      // 6. Create owner user
      // ------------------------------------------------------------------
      const ownerRole = roleMap.get('owner')!;
      const user = await manager.save(
        UserEntity,
        manager.create(UserEntity, {
          tenantId: tenant.id,
          defaultBranchId: branch.id,
          roleId: ownerRole.id,
          fullName: ownerName,
          email,
          phone: phone ?? null,
          passwordHash,
          status: 'active',
        }),
      );

      return { tenant, branch, user, roles: roleMap };
    });
  }

  private generateSlug(businessName: string): string {
    const base = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }
}
