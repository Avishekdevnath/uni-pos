import 'reflect-metadata';
import { hash } from 'bcryptjs';
import dataSource from '../data-source';
import { TenantEntity } from '../entities/tenant.entity';
import { BranchEntity } from '../entities/branch.entity';
import { UserEntity } from '../../users/entities/user.entity/user.entity';
import { PermissionEntity } from '../../rbac/entities/permission.entity';
import { RoleEntity } from '../../rbac/entities/role.entity';
import { RolePermissionEntity } from '../../rbac/entities/role-permission.entity';
import { PlatformAdminEntity } from '../../platform/entities/platform-admin.entity';

// ---------------------------------------------------------------------------
// All 42 permissions as "resource:action"
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to seed the database`);
  return value;
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function seedAdmin(): Promise<void> {
  await dataSource.initialize();

  await dataSource.transaction(async (manager) => {
    // ------------------------------------------------------------------
    // 1. Seed all 42 permissions (idempotent)
    // ------------------------------------------------------------------
    console.log('Seeding permissions...');
    for (const code of ALL_PERMISSIONS) {
      const [resource, action] = code.split(':');
      await manager
        .createQueryBuilder()
        .insert()
        .into(PermissionEntity)
        .values({ code, resource, action })
        .orIgnore()                       // INSERT ... ON CONFLICT DO NOTHING
        .execute();
    }
    console.log(`  ${ALL_PERMISSIONS.length} permissions ensured.`);

    // Load all permissions into a map for later FK lookups
    const allPerms = await manager.find(PermissionEntity);
    const permByCode = new Map(allPerms.map((p) => [p.code, p]));

    // ------------------------------------------------------------------
    // 2. Create platform admin (skip if exists)
    // ------------------------------------------------------------------
    const platformEmail = requireEnv('PLATFORM_ADMIN_EMAIL');
    const platformPassword = requireEnv('PLATFORM_ADMIN_PASSWORD');
    const platformName = process.env.PLATFORM_ADMIN_FULL_NAME ?? 'Platform Admin';

    const existingPlatformAdmin = await manager.findOne(PlatformAdminEntity, {
      where: { email: platformEmail },
    });

    if (existingPlatformAdmin) {
      console.log(`Platform admin already exists: ${platformEmail}`);
    } else {
      const platformHash = await hash(platformPassword, 12);
      await manager.save(PlatformAdminEntity, manager.create(PlatformAdminEntity, {
        email: platformEmail,
        passwordHash: platformHash,
        fullName: platformName,
        status: 'active',
      }));
      console.log(`Platform admin created: ${platformEmail}`);
    }

    // ------------------------------------------------------------------
    // 3. Create demo tenant + branch
    // ------------------------------------------------------------------
    const tenantName = process.env.ADMIN_TENANT_NAME ?? 'Demo Tenant';
    const tenantSlug = process.env.ADMIN_TENANT_SLUG ?? 'demo-tenant';
    const branchName = process.env.ADMIN_BRANCH_NAME ?? 'Main Branch';
    const branchCode = process.env.ADMIN_BRANCH_CODE ?? 'MAIN';

    let tenant = await manager.findOne(TenantEntity, { where: { slug: tenantSlug } });
    if (!tenant) {
      tenant = await manager.save(TenantEntity, manager.create(TenantEntity, {
        name: tenantName,
        slug: tenantSlug,
        industryType: 'retail',
        defaultCurrency: 'BDT',
        defaultTimezone: 'Asia/Dhaka',
        status: 'active',
      }));
      console.log(`Tenant created: ${tenantName}`);
    } else {
      console.log(`Tenant already exists: ${tenantSlug}`);
    }

    let branch = await manager.findOne(BranchEntity, {
      where: { tenantId: tenant.id, code: branchCode },
    });
    if (!branch) {
      branch = await manager.save(BranchEntity, manager.create(BranchEntity, {
        tenantId: tenant.id,
        name: branchName,
        code: branchCode,
        status: 'active',
      }));
      console.log(`Branch created: ${branchName}`);
    } else {
      console.log(`Branch already exists: ${branchCode}`);
    }

    // ------------------------------------------------------------------
    // 4. Create 6 default system roles for the demo tenant
    // ------------------------------------------------------------------
    const roleMap = new Map<string, RoleEntity>();

    for (const slug of Object.keys(ROLE_PERMISSIONS)) {
      let role = await manager.findOne(RoleEntity, {
        where: { tenantId: tenant.id, slug },
      });
      if (!role) {
        role = await manager.save(RoleEntity, manager.create(RoleEntity, {
          tenantId: tenant.id,
          name: ROLE_DISPLAY_NAMES[slug],
          slug,
          isSystem: true,
        }));
        console.log(`  Role created: ${slug}`);
      } else {
        console.log(`  Role already exists: ${slug}`);
      }
      roleMap.set(slug, role);
    }

    // ------------------------------------------------------------------
    // 5. Assign permissions to each role (idempotent)
    // ------------------------------------------------------------------
    console.log('Assigning role permissions...');
    for (const [slug, codes] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleMap.get(slug)!;
      for (const code of codes) {
        const perm = permByCode.get(code);
        if (!perm) throw new Error(`Permission not found: ${code}`);

        await manager
          .createQueryBuilder()
          .insert()
          .into(RolePermissionEntity)
          .values({ roleId: role.id, permissionId: perm.id })
          .orIgnore()
          .execute();
      }
    }
    console.log('  Role permissions assigned.');

    // ------------------------------------------------------------------
    // 6. Create demo owner user with owner role
    // ------------------------------------------------------------------
    const adminEmail = requireEnv('ADMIN_EMAIL');
    const adminPassword = requireEnv('ADMIN_PASSWORD');
    const adminFullName = process.env.ADMIN_FULL_NAME ?? 'Owner Admin';
    const ownerRole = roleMap.get('owner')!;

    const existingUser = await manager.findOne(UserEntity, {
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log(`Owner user already exists: ${adminEmail}`);
    } else {
      const passwordHash = await hash(adminPassword, 12);
      await manager.save(UserEntity, manager.create(UserEntity, {
        tenantId: tenant.id,
        defaultBranchId: branch.id,
        roleId: ownerRole.id,
        fullName: adminFullName,
        email: adminEmail,
        passwordHash,
        status: 'active',
      }));
      console.log(`Owner user created: ${adminEmail}`);
    }
  });

  await dataSource.destroy();
  console.log('Seed complete.');
}

void seedAdmin().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exitCode = 1;
});
