import 'reflect-metadata';
import { hash } from 'bcryptjs';
import dataSource from '../data-source';
import { OrganizationEntity } from '../entities/organization.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { BranchEntity } from '../entities/branch.entity';
import { UserEntity, UserRole } from '../../users/entities/user.entity/user.entity';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to seed the initial admin user`);
  }

  return value;
}

async function seedAdmin(): Promise<void> {
  await dataSource.initialize();

  const organizationRepository = dataSource.getRepository(OrganizationEntity);
  const tenantRepository = dataSource.getRepository(TenantEntity);
  const branchRepository = dataSource.getRepository(BranchEntity);
  const userRepository = dataSource.getRepository(UserEntity);

  const adminEmail = requireEnv('ADMIN_EMAIL');
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const fullName = process.env.ADMIN_FULL_NAME ?? 'Owner Admin';
  const organizationName = process.env.ADMIN_ORGANIZATION_NAME ?? 'Demo Organization';
  const tenantName = process.env.ADMIN_TENANT_NAME ?? 'Demo Tenant';
  const tenantSlug = process.env.ADMIN_TENANT_SLUG ?? 'demo-tenant';
  const branchName = process.env.ADMIN_BRANCH_NAME ?? 'Main Branch';
  const branchCode = process.env.ADMIN_BRANCH_CODE ?? 'MAIN';

  let organization = await organizationRepository.findOne({
    where: { name: organizationName },
  });

  if (!organization) {
    organization = organizationRepository.create({
      name: organizationName,
      industryType: 'retail',
      status: 'active',
    });
    organization = await organizationRepository.save(organization);
  }

  let tenant = await tenantRepository.findOne({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    tenant = tenantRepository.create({
      organizationId: organization.id,
      name: tenantName,
      slug: tenantSlug,
      defaultCurrency: 'BDT',
      defaultTimezone: 'Asia/Dhaka',
      status: 'active',
    });
    tenant = await tenantRepository.save(tenant);
  }

  let branch = await branchRepository.findOne({
    where: {
      tenantId: tenant.id,
      code: branchCode,
    },
  });

  if (!branch) {
    branch = branchRepository.create({
      tenantId: tenant.id,
      name: branchName,
      code: branchCode,
      status: 'active',
    });
    branch = await branchRepository.save(branch);
  }

  const existingUser = await userRepository.findOne({
    where: {
      tenantId: tenant.id,
      email: adminEmail,
    },
  });

  if (existingUser) {
    console.log(`Admin user already exists: ${adminEmail}`);
    await dataSource.destroy();
    return;
  }

  const passwordHash = await hash(adminPassword, 12);
  const user = userRepository.create({
    tenantId: tenant.id,
    defaultBranchId: branch.id,
    fullName,
    email: adminEmail,
    passwordHash,
    role: UserRole.OWNER,
    status: 'active',
  });

  await userRepository.save(user);
  await dataSource.destroy();

  console.log(`Seeded admin user: ${adminEmail}`);
}

void seedAdmin().catch(async (error) => {
  console.error(error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exitCode = 1;
});
